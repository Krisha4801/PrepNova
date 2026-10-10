const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require("../controllers/auth.controller");
const {
  getProviders,
  initiateOAuth,
  handleCallback,
  exchangeOAuthTicket
} = require("../controllers/oauth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Public Authentication Endpoints (Rate Limited)
router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);

// Password Reset Endpoints (Rate Limited)
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/verify-reset-otp", authRateLimiter, verifyResetOTP);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/resend-reset-otp", authRateLimiter, forgotPassword);

// OAuth Endpoints
router.get("/oauth/providers", getProviders);
router.post("/oauth/exchange", authRateLimiter, exchangeOAuthTicket);
router.get("/oauth/callback", handleCallback);
router.get("/oauth/:provider", authRateLimiter, initiateOAuth);
router.get("/oauth/:provider/callback", handleCallback);

// Protected routes
router.get("/me", authenticateToken, getMe);
router.post("/logout", logoutUser);

module.exports = router;

