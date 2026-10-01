const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  return process.env.JWT_SECRET || "prepnova_jwt_default_secret_key_development_only";
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || "7d";
};

/**
 * Generate a signed JWT access token for an authenticated user.
 * @param {Object} payload - User identity payload (id, email, role)
 * @param {string} [expiresIn] - Optional custom expiry
 * @returns {string} Signed JWT token
 */
function generateToken(payload, expiresIn = null) {
  const secret = getJwtSecret();
  const options = {
    expiresIn: expiresIn || getJwtExpiresIn()
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode a JWT token.
 * @param {string} token - Raw JWT string
 * @returns {Object} Decoded payload
 * @throws {Error} Throws if token is invalid, expired, or malformed
 */
function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  verifyToken,
  getJwtSecret,
  getJwtExpiresIn
};
