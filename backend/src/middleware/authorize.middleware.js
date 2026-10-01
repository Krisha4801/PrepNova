/**
 * Authorization Middleware:
 * Checks if the authenticated user possesses one of the allowed roles.
 * Must be mounted AFTER authenticateToken middleware.
 * 
 * @param  {...string} allowedRoles - Allowed roles (e.g. 'admin', 'user')
 * @returns {Function} Express middleware
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required before checking permissions."
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Role '${req.user.role}' has insufficient permissions to access this resource.`
      });
    }

    return next();
  };
}

module.exports = {
  authorizeRoles
};
