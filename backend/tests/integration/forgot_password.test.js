process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.PASSWORD_RESET_SECRET = "test_password_reset_pepper_1234567890";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prepnova_forgot_test";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const emailService = require("../../src/services/email.service");
const { hashOTP } = require("../../src/utils/otp");

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data
  };
}

describe("Production Forgot Password & OTP Password Reset Integration Tests", () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.deleteMany({});

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (User.deleteMany) {
      await User.deleteMany({});
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(async () => {
    emailService.clearSentEmails();
  });

  // ==========================================
  // TEST GROUP 1 — FORGOT PASSWORD REQUEST
  // ==========================================
  describe("Test Group 1: Forgot Password Request & User Enumeration Protection", () => {
    it("1.1 should initiate reset for valid registered email, hash OTP in DB, and send branded email", async () => {
      // 1. Create candidate user
      await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Jaimin Reset",
          email: "jaimin_reset@example.com",
          password: "InitialPassword123!"
        }
      });

      // 2. Submit forgot password request
      const res = await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(
        res.data.message,
        "If an account exists for this email, a password reset code has been sent."
      );
      assert.strictEqual(res.data.otp, undefined, "Must NEVER return raw OTP in API response");

      // 3. Inspect MongoDB record
      const dbUser = await User.findOne({ email: "jaimin_reset@example.com" });
      assert.ok(dbUser.passwordResetOTPHash, "Must store OTP hash in MongoDB");
      assert.strictEqual(dbUser.passwordResetOTPHash.length, 64, "Must be SHA-256 hex string");
      assert.ok(dbUser.passwordResetOTPExpiresAt > new Date(), "Must have future expiry date");
      assert.strictEqual(dbUser.passwordResetOTPAttempts, 0);

      // 4. Verify email was dispatched with 6-digit OTP
      const sent = emailService.sentEmails[0];
      assert.ok(sent, "Email must be dispatched via emailService");
      assert.strictEqual(sent.to, "jaimin_reset@example.com");
      assert.strictEqual(sent.subject, "Reset your PrepNova password");
      assert.match(sent.text, /\b\d{6}\b/, "Email must contain 6-digit OTP");

      // Extract raw OTP from email to verify hashing
      const match = sent.text.match(/code is: (\d{6})/);
      assert.ok(match, "Should find OTP in text email");
      const rawOtp = match[1];
      assert.strictEqual(hashOTP(rawOtp), dbUser.passwordResetOTPHash, "Hash in DB must match hash of emailed OTP");
    });

    it("1.2 should return identical generic message for nonexistent email (Prevent Enumeration)", async () => {
      const res = await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "nonexistent_candidate_xyz@example.com" }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(
        res.data.message,
        "If an account exists for this email, a password reset code has been sent."
      );
      assert.strictEqual(emailService.sentEmails.length, 0, "No email sent for nonexistent user");
    });

    it("1.3 should reject invalid email format with 400 Bad Request", async () => {
      const res = await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "not-an-email" }
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes("valid email"));
    });

    it("1.4 should invalidate previous OTP when a new reset request is made (Latest OTP Only)", async () => {
      // First request
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });
      const firstOtp = emailService.sentEmails[0].text.match(/code is: (\d{6})/)[1];

      // Second request
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });
      const secondOtp = emailService.sentEmails[1].text.match(/code is: (\d{6})/)[1];

      // First OTP should now fail
      const oldVerify = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp: firstOtp }
      });
      assert.strictEqual(oldVerify.status, 400, "Old OTP must be rejected");

      // Second OTP should succeed
      const newVerify = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp: secondOtp }
      });
      assert.strictEqual(newVerify.status, 200, "Latest OTP must be accepted");
    });
  });

  // ==========================================
  // TEST GROUP 2 — OTP VERIFICATION
  // ==========================================
  describe("Test Group 2: OTP Verification & Attempt Limits", () => {
    it("2.1 should reject incorrect OTP and enforce maximum attempt limits (e.g. 5 attempts)", async () => {
      // Request fresh OTP
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });

      // Submit 4 incorrect attempts
      for (let attempt = 1; attempt <= 4; attempt++) {
        const failRes = await request("/api/auth/verify-reset-otp", {
          method: "POST",
          body: { email: "jaimin_reset@example.com", otp: "000000" }
        });
        assert.strictEqual(failRes.status, 400);
        assert.ok(failRes.data.error.includes("Invalid verification code"));
      }

      // 5th attempt reaches max attempts
      const maxRes = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp: "000000" }
      });
      assert.strictEqual(maxRes.status, 400);
      assert.ok(maxRes.data.error.includes("Maximum verification attempts exceeded"));

      // Verify OTP is completely wiped from MongoDB after max attempts
      const dbUser = await User.findOne({ email: "jaimin_reset@example.com" });
      assert.strictEqual(dbUser.passwordResetOTPHash, null);
    });

    it("2.2 should reject expired OTP", async () => {
      // Request fresh OTP
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });
      const otp = emailService.sentEmails[0].text.match(/code is: (\d{6})/)[1];

      // Manually set expiry to past in MongoDB
      await User.updateOne(
        { email: "jaimin_reset@example.com" },
        { passwordResetOTPExpiresAt: new Date(Date.now() - 10000) }
      );

      const res = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes("expired"));
    });

    it("2.3 should immediately invalidate OTP upon successful verification to prevent replay", async () => {
      // Request fresh OTP
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "jaimin_reset@example.com" }
      });
      const otp = emailService.sentEmails[0].text.match(/code is: (\d{6})/)[1];

      // First verification succeeds and returns signed resetToken
      const firstRes = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp }
      });
      assert.strictEqual(firstRes.status, 200);
      assert.ok(firstRes.data.resetToken, "Must return signed resetToken");

      // Second verification with same OTP must be rejected
      const secondRes = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "jaimin_reset@example.com", otp }
      });
      assert.strictEqual(secondRes.status, 400, "Replay of verified OTP must be blocked");
    });
  });

  // ==========================================
  // TEST GROUP 3 — PASSWORD RESET & SESSION REVOCATION
  // ==========================================
  describe("Test Group 3: Password Reset & Session Invalidation", () => {
    let testEmail = "test_user3@example.com";
    let initialLoginToken;
    let validResetToken;

    before(async () => {
      // 1. Register candidate user
      await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Group Three User",
          email: testEmail,
          password: "InitialPassword123!"
        }
      });

      // 2. Log in to get active session JWT
      const loginRes = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testEmail,
          password: "InitialPassword123!"
        }
      });
      initialLoginToken = loginRes.data.token;

      // 3. Request and verify OTP to get validResetToken
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: testEmail }
      });
      const lastEmail = emailService.sentEmails[emailService.sentEmails.length - 1];
      const otp = lastEmail.text.match(/code is: (\d{6})/)[1];
      const verifyRes = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: testEmail, otp }
      });
      validResetToken = verifyRes.data.resetToken;
    });

    it("3.1 should reject password reset with weak password or mismatched confirmation", async () => {
      // Short password
      const shortRes = await request("/api/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: validResetToken,
          newPassword: "123",
          confirmPassword: "123"
        }
      });
      assert.strictEqual(shortRes.status, 400);
      assert.ok(shortRes.data.error.includes("at least 6 characters"));

      // Mismatched confirmation
      const mismatchRes = await request("/api/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: validResetToken,
          newPassword: "NewStrongPassword456!",
          confirmPassword: "WrongConfirmation456!"
        }
      });
      assert.strictEqual(mismatchRes.status, 400);
      assert.ok(mismatchRes.data.error.includes("confirmation does not match"));
    });

    it("3.2 should successfully update password, invalidate old sessions via tokenVersion, and send confirmation email", async () => {
      // Verify initial session works before password reset
      const preCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${initialLoginToken}` }
      });
      assert.strictEqual(preCheck.status, 200);

      // Perform password reset
      const resetRes = await request("/api/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: validResetToken,
          newPassword: "BrandNewSecurePassword789!",
          confirmPassword: "BrandNewSecurePassword789!"
        }
      });

      assert.strictEqual(resetRes.status, 200);
      assert.strictEqual(resetRes.data.success, true);
      assert.ok(resetRes.data.message.includes("successfully updated"));

      // 1. Verify old password no longer works
      const oldLogin = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testEmail,
          password: "InitialPassword123!"
        }
      });
      assert.strictEqual(oldLogin.status, 401, "Old password must be rejected");

      // 2. Verify new password logs in successfully
      const newLogin = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testEmail,
          password: "BrandNewSecurePassword789!"
        }
      });
      assert.strictEqual(newLogin.status, 200, "New password must authenticate successfully");
      assert.ok(newLogin.data.token);

      // 3. Verify previous active session token is immediately invalidated with 401
      const postCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${initialLoginToken}` }
      });
      assert.strictEqual(postCheck.status, 401, "Old JWT must be rejected after password reset");
      assert.ok(postCheck.data.error.includes("Session has expired due to a recent password change"));

      // 4. Verify password-changed security email was sent
      const confirmationEmail = emailService.sentEmails.find(
        (e) => e.subject === "Your PrepNova password was changed"
      );
      assert.ok(confirmationEmail, "Must send security confirmation email");
      assert.strictEqual(confirmationEmail.to, testEmail);
    });

    it("3.3 should reject reuse of already-consumed resetToken", async () => {
      const reuseRes = await request("/api/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: validResetToken,
          newPassword: "AnotherPassword999!",
          confirmPassword: "AnotherPassword999!"
        }
      });

      assert.strictEqual(reuseRes.status, 400);
      assert.ok(reuseRes.data.error.includes("already been used or superseded"));
    });
  });

  // ==========================================
  // TEST GROUP 4 — GOOGLE OAUTH ACCOUNTS
  // ==========================================
  describe("Test Group 4: Google OAuth Accounts Handling", () => {
    it("4.1 should send informational notice and prevent unauthorized local password creation for Google-only account", async () => {
      // Create pure Google OAuth user
      const googleUser = await User.create({
        name: "Google Only User",
        email: "google_only@example.com",
        role: "user",
        authProviders: [
          {
            provider: "google",
            providerUserId: "google-109283746",
            email: "google_only@example.com"
          }
        ]
      });

      // Submit forgot password request
      const res = await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "google_only@example.com" }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(
        res.data.message,
        "If an account exists for this email, a password reset code has been sent."
      );

      // Verify no OTP was set in MongoDB for Google-only user
      const updatedUser = await User.findById(googleUser._id);
      assert.strictEqual(updatedUser.passwordResetOTPHash, null);
      assert.strictEqual(updatedUser.password, undefined);

      // Verify Google account notice email was dispatched
      const sent = emailService.sentEmails.find((e) => e.to === "google_only@example.com");
      assert.ok(sent);
      assert.ok(sent.subject.includes("Google Sign-In Account Notice"));
      assert.ok(sent.text.includes("Continue with Google"));
    });
  });

  // ==========================================
  // TEST GROUP 5 — SECURITY & PRIVACY
  // ==========================================
  describe("Test Group 5: Security & Privacy Guarantees", () => {
    it("5.1 should never expose passwordReset fields in GET /api/auth/me", async () => {
      // Register dedicated security test user
      const reg = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Security User",
          email: "security_test_user@example.com",
          password: "SecurePassword123!"
        }
      });
      const token = reg.data.token;

      // Request OTP so fields are populated in DB
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "security_test_user@example.com" }
      });

      const meRes = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      assert.strictEqual(meRes.status, 200);
      const user = meRes.data.user;
      assert.strictEqual(user.password, undefined);
      assert.strictEqual(user.passwordResetOTPHash, undefined);
      assert.strictEqual(user.passwordResetOTPExpiresAt, undefined);
      assert.strictEqual(user.passwordResetOTPAttempts, undefined);
      assert.strictEqual(user.passwordResetOTPVerifiedAt, undefined);
    });

    it("5.2 should reject reset if user account is deleted during the reset flow", async () => {
      // 1. Create candidate user
      const regRes = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Ephemeral User",
          email: "ephemeral@example.com",
          password: "Password123!"
        }
      });
      const userId = regRes.data.user.id;

      // 2. Request and verify OTP
      await request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "ephemeral@example.com" }
      });
      const otp = emailService.sentEmails[0].text.match(/code is: (\d{6})/)[1];
      const verifyRes = await request("/api/auth/verify-reset-otp", {
        method: "POST",
        body: { email: "ephemeral@example.com", otp }
      });
      const token = verifyRes.data.resetToken;

      // 3. Delete user before resetting password
      await User.findByIdAndDelete(userId);

      // 4. Reset password attempt must fail safely with 401
      const resetRes = await request("/api/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: token,
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!"
        }
      });

      assert.strictEqual(resetRes.status, 401);
      assert.ok(resetRes.data.error.includes("no longer exists"));
    });
  });
});
