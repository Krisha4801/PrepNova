const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const { generateToken, generatePasswordResetToken, verifyPasswordResetToken } = require("../utils/jwt");
const {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateVerifyOtpInput,
  validateResetPasswordInput
} = require("../validators/auth.validator");
const {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  getOtpExpiresInMinutes,
  getMaxOtpAttempts
} = require("../utils/otp");
const emailService = require("./email.service");

function checkDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error("Database service is currently unavailable. Please ensure MongoDB is running.");
    err.statusCode = 503;
    throw err;
  }
}

class AuthService {
  /**
   * Registers a new user account.
   */
  async register(data = {}) {
    checkDatabaseReady();
    const validation = validateRegisterInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const {
      name,
      password,
      role,
      userType,
      targetRole,
      organization,
      experienceLevel,
      university,
      course,
      phone,
      location,
      bio,
      avatar
    } = data;
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const err = new Error("An account with this email address already exists.");
      err.statusCode = 409;
      throw err;
    }

    // Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user document (flexible for any candidate: professional, student, job seeker)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: role === "admin" ? "admin" : "user",
      userType: userType || "",
      targetRole: targetRole || "Software Engineer",
      organization: organization ? organization.trim() : (university ? university.trim() : ""),
      experienceLevel: experienceLevel || "",
      university: university ? university.trim() : "",
      course: course ? course.trim() : "",
      phone: phone ? phone.trim() : "",
      location: location ? location.trim() : "",
      bio: bio ? bio.trim() : "",
      avatar: avatar || "",
      tokenVersion: 0
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Authenticates user credentials and generates a JWT.
   */
  async login(data = {}) {
    checkDatabaseReady();
    const validation = validateLoginInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const { password } = data;
    const normalizedEmail = data.email.trim().toLowerCase();

    // Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // Verify user account is active
    if (user.isActive === false) {
      const err = new Error("Account is deactivated or suspended. Please contact support.");
      err.statusCode = 401;
      throw err;
    }

    // Check if account has a password set (handle pure OAuth accounts)
    if (!user.password) {
      const err = new Error("This account was created via Google Sign-In. Please sign in with 'Continue with Google'.");
      err.statusCode = 401;
      throw err;
    }

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Retrieves profile of current authenticated user.
   */
  async getMe(userId) {
    checkDatabaseReady();
    if (!userId) {
      const err = new Error("User identifier is required.");
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user || user.isActive === false) {
      const err = new Error("Authentication required. User account no longer exists or is inactive.");
      err.statusCode = 401;
      throw err;
    }

    return user.toJSON();
  }

  /**
   * Initiates Password Reset flow with cryptographically secure 6-digit OTP.
   * Enumeration-safe: Always returns generic success response.
   */
  async forgotPassword(data = {}) {
    checkDatabaseReady();
    const validation = validateForgotPasswordInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const genericResponse = {
      success: true,
      message: "If an account exists for this email, a password reset code has been sent."
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isActive === false) {
      // Enumeration protection: return identical generic response
      return genericResponse;
    }

    // Handle Google OAuth accounts without local password
    if (!user.password && user.authProviders && user.authProviders.length > 0) {
      try {
        await emailService.sendGoogleAccountNoticeEmail({
          to: user.email,
          name: user.name
        });
      } catch (emailErr) {
        console.warn(`[AuthService] Google notice email delivery failed for ${user.email}:`, emailErr.message);
      }
      return genericResponse;
    }

    const expiresInMinutes = getOtpExpiresInMinutes();
    const rawOtp = generateOTP();
    const otpHash = hashOTP(rawOtp);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Update user record with hashed OTP state
    user.passwordResetOTPHash = otpHash;
    user.passwordResetOTPExpiresAt = expiresAt;
    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPVerifiedAt = null;
    user.passwordResetRequestedAt = new Date();
    await user.save();

    // Send professional transactional email with raw OTP
    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        otp: rawOtp,
        expiresInMinutes
      });
    } catch (emailErr) {
      // Rollback active OTP state on delivery failure so user isn't stuck with undelivered code
      user.passwordResetOTPHash = null;
      user.passwordResetOTPExpiresAt = null;
      await user.save().catch(() => {});
      console.error(`[AuthService] Password reset email delivery failed:`, emailErr.message);
      const deliveryErr = new Error("Failed to deliver verification email. Please check your email configuration and try again.");
      deliveryErr.statusCode = 502;
      throw deliveryErr;
    }

    return genericResponse;
  }

  /**
   * Verifies submitted 6-digit OTP and generates a short-lived reset authorization token.
   */
  async verifyResetOTP(data = {}) {
    checkDatabaseReady();
    const validation = validateVerifyOtpInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const submittedOtp = data.otp.trim();
    const maxAttempts = getMaxOtpAttempts();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isActive === false) {
      const err = new Error("Invalid or expired verification code.");
      err.statusCode = 400;
      throw err;
    }

    // Check if an OTP was actively requested
    if (!user.passwordResetOTPHash || !user.passwordResetOTPExpiresAt) {
      const err = new Error("Invalid or expired verification code.");
      err.statusCode = 400;
      throw err;
    }

    // Check OTP expiration
    if (new Date() > user.passwordResetOTPExpiresAt) {
      user.passwordResetOTPHash = null;
      user.passwordResetOTPExpiresAt = null;
      await user.save();
      const err = new Error("Verification code has expired. Please request a new code.");
      err.statusCode = 400;
      throw err;
    }

    // Check attempt limit
    if (user.passwordResetOTPAttempts >= maxAttempts) {
      user.passwordResetOTPHash = null;
      user.passwordResetOTPExpiresAt = null;
      await user.save();
      const err = new Error("Maximum verification attempts exceeded. Please request a new code.");
      err.statusCode = 400;
      throw err;
    }

    // Compare hash with timing-safe comparison
    const isMatch = verifyOTPHash(submittedOtp, user.passwordResetOTPHash);
    if (!isMatch) {
      user.passwordResetOTPAttempts = (user.passwordResetOTPAttempts || 0) + 1;
      if (user.passwordResetOTPAttempts >= maxAttempts) {
        user.passwordResetOTPHash = null;
        user.passwordResetOTPExpiresAt = null;
      }
      await user.save();

      const remainingAttempts = Math.max(0, maxAttempts - user.passwordResetOTPAttempts);
      const err = new Error(
        remainingAttempts > 0
          ? `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
          : "Maximum verification attempts exceeded. Please request a new code."
      );
      err.statusCode = 400;
      throw err;
    }

    // OTP verified successfully: invalidate immediately to prevent replay
    user.passwordResetOTPHash = null;
    user.passwordResetOTPExpiresAt = null;
    user.passwordResetOTPVerifiedAt = new Date();
    await user.save();

    // Generate short-lived signed reset authorization token (15 mins)
    const resetToken = generatePasswordResetToken(
      {
        id: user._id.toString(),
        email: user.email,
        tokenVersion: user.tokenVersion || 0
      },
      "15m"
    );

    return {
      success: true,
      message: "Verification code confirmed.",
      resetToken
    };
  }

  /**
   * Resets user password using verified reset authorization token.
   * Invalidates all existing active authentication tokens via tokenVersion.
   */
  async resetPassword(data = {}) {
    checkDatabaseReady();
    const validation = validateResetPasswordInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const { resetToken, newPassword } = data;

    // Verify reset authorization token cryptographically
    let decoded;
    try {
      decoded = verifyPasswordResetToken(resetToken);
    } catch (err) {
      const authErr = new Error(err.message || "Invalid or expired password reset authorization.");
      authErr.statusCode = 400;
      throw authErr;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isActive === false) {
      const err = new Error("User account no longer exists or is inactive.");
      err.statusCode = 401;
      throw err;
    }

    // Verify tokenVersion matches (ensures reset authorization wasn't already consumed)
    if (
      typeof decoded.tokenVersion === "number" &&
      typeof user.tokenVersion === "number" &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      const err = new Error("This password reset authorization has already been used or superseded. Please start a new request.");
      err.statusCode = 400;
      throw err;
    }

    // Hash new password securely with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password, increment tokenVersion to revoke all prior sessions, and clear reset state
    user.password = passwordHash;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetOTPHash = null;
    user.passwordResetOTPExpiresAt = null;
    user.passwordResetOTPAttempts = 0;
    user.passwordResetOTPVerifiedAt = null;
    user.passwordResetRequestedAt = null;
    await user.save();

    // Send second transactional security notice
    try {
      await emailService.sendPasswordChangedEmail({
        to: user.email,
        name: user.name,
        email: user.email
      });
    } catch (emailErr) {
      console.error(`[AuthService] Password changed security email delivery failed:`, emailErr.message);
    }

    return {
      success: true,
      message: "Password has been successfully updated. Please sign in with your new password."
    };
  }
}

module.exports = new AuthService();

