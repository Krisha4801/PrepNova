process.env.NODE_ENV = "test";
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const emailService = require("../../src/services/email.service");

describe("Email Service & Template Rendering Unit Tests", () => {
  beforeEach(() => {
    emailService.clearSentEmails();
  });

  it("should render and dispatch a password reset email with 6-digit OTP and plain text fallback", async () => {
    const res = await emailService.sendPasswordResetEmail({
      to: "candidate@example.com",
      name: "Jaimin Trivedi",
      otp: "582910",
      expiresInMinutes: 10
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.messageId, "Should return a messageId");

    const sent = emailService.sentEmails[0];
    assert.ok(sent, "Email should be recorded in sentEmails");
    assert.strictEqual(sent.to, "candidate@example.com");
    assert.strictEqual(sent.subject, "Reset your PrepNova password");

    // HTML validation
    assert.ok(sent.html.includes("582910"), "HTML must contain the OTP");
    assert.ok(sent.html.includes("Jaimin Trivedi"), "HTML must contain recipient name");
    assert.ok(sent.html.includes("10 minutes"), "HTML must contain expiration notice");
    assert.ok(sent.html.includes("PrepNova"), "HTML must contain PrepNova branding");

    // Plain text validation
    assert.ok(sent.text.includes("582910"), "Plain text must contain OTP");
    assert.ok(sent.text.includes("Jaimin Trivedi"), "Plain text must contain recipient name");
    assert.ok(sent.text.includes("10 minutes"), "Plain text must contain expiration");
  });

  it("should render and dispatch a password changed security confirmation email", async () => {
    const res = await emailService.sendPasswordChangedEmail({
      to: "candidate@example.com",
      name: "Jaimin Trivedi",
      email: "candidate@example.com"
    });

    assert.strictEqual(res.success, true);
    const sent = emailService.sentEmails[0];
    assert.ok(sent);
    assert.strictEqual(sent.subject, "Your PrepNova password was changed");
    assert.ok(sent.html.includes("successfully changed"));
    assert.ok(sent.html.includes("support@prepnova.com"));
    assert.ok(sent.text.includes("successfully changed"));
  });

  it("should render and dispatch Google OAuth account guidance notice", async () => {
    const res = await emailService.sendGoogleAccountNoticeEmail({
      to: "google_user@example.com",
      name: "Google Candidate"
    });

    assert.strictEqual(res.success, true);
    const sent = emailService.sentEmails[0];
    assert.ok(sent);
    assert.ok(sent.subject.includes("Google Sign-In Account Notice"));
    assert.ok(sent.html.includes("Continue with Google"));
    assert.ok(sent.text.includes("Continue with Google"));
  });
});
