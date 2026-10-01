const authService = require("../services/auth.service");

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
 * Controller: Log out user
 * POST /api/auth/logout
 */
exports.logoutUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Remove token on client-side."
  });
};
