const { verifyToken } = require("../utils/jwt");

/**
 * Authentication Middleware:
 * Verifies the incoming Bearer JWT token from the Authorization header.
 * Attaches the authenticated user payload to req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      success: false,
      error: "Authentication required. No authorization header provided."
    });
  }

  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      success: false,
      error: "Authentication failed. Authorization format must be 'Bearer <token>'."
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed. Invalid token payload."
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user"
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Authentication failed. Token has expired."
      });
    }

    return res.status(401).json({
      success: false,
      error: "Authentication failed. Invalid token."
    });
  }
}

module.exports = {
  authenticateToken
};
