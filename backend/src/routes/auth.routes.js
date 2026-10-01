const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser
} = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Public routes (rate limited)
router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);

// Protected routes
router.get("/me", authenticateToken, getMe);
router.post("/logout", authenticateToken, logoutUser);

module.exports = router;
