const authService = require("../services/auth.service");
const { revokeToken } = require("../utils/jwt");

/**
 * Controller: Register a new user
 * POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: result.token,
      user: result.user
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to register user.",
      errors: err.errors
    });
  }
};

/**
 * Controller: Log in existing user
 * POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.token,
      user: result.user
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to authenticate.",
      errors: err.errors
    });
  }
};

/**
 * Controller: Get current authenticated user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to retrieve user profile."
    });
  }
};

/**
 * Controller: Log out user (Idempotent & Graceful)
 * POST /api/auth/logout
 */
exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === "string") {
      const parts = authHeader.trim().split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        revokeToken(parts[1]);
      }
    }
    if (req.token) {
      revokeToken(req.token);
    }
  } catch (err) {
    // Graceful error suppression during logout
  }

  return res.status(200).json({
    success: true,
    message: "Logout successful. Session has been revoked."
  });
};

/**
 * Controller: Forgot Password - Request 6-digit OTP
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to process password reset request.",
      errors: err.errors
    });
  }
};

/**
 * Controller: Verify Password Reset 6-digit OTP
 * POST /api/auth/verify-reset-otp
 */
exports.verifyResetOTP = async (req, res) => {
  try {
    const result = await authService.verifyResetOTP(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to verify code.",
      errors: err.errors
    });
  }
};

/**
 * Controller: Reset Password with Verified Reset Token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to reset password.",
      errors: err.errors
    });
  }
};


