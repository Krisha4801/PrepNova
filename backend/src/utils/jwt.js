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

/**
 * Generates a short-lived, cryptographically signed password reset authorization token.
 * Valid for 15 minutes by default.
 * @param {Object} payload - User reset identity payload (id, email, tokenVersion)
 * @param {string} [expiresIn] - Optional custom expiry duration (default: "15m")
 * @returns {string} Signed password reset token
 */
function generatePasswordResetToken(payload, expiresIn = "15m") {
  const secret = process.env.PASSWORD_RESET_SECRET || getJwtSecret();
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      tokenVersion: payload.tokenVersion ?? 0,
      purpose: "password_reset"
    },
    secret,
    { expiresIn }
  );
}

/**
 * Verifies and decodes a password reset authorization token.
 * @param {string} token - Raw JWT string
 * @returns {Object} Decoded payload
 * @throws {Error} Throws if invalid, expired, or wrong purpose
 */
function verifyPasswordResetToken(token) {
  if (!token || typeof token !== "string") {
    const err = new Error("Password reset authorization token is missing or invalid.");
    err.statusCode = 400;
    throw err;
  }
  const secret = process.env.PASSWORD_RESET_SECRET || getJwtSecret();
  const decoded = jwt.verify(token, secret);
  if (decoded.purpose !== "password_reset") {
    const err = new Error("Invalid token purpose. This token cannot be used for password reset.");
    err.statusCode = 400;
    throw err;
  }
  return decoded;
}

/**
 * In-memory token revocation store with TTL expiration cleanup.
 */
const revokedTokens = new Map();

// Periodic cleanup of expired revoked tokens
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of revokedTokens.entries()) {
    if (now > expiresAt) {
      revokedTokens.delete(token);
    }
  }
}, 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Revokes an active JWT token (e.g., during explicit logout).
 * @param {string} token - Raw JWT string
 */
function revokeToken(token) {
  if (!token || typeof token !== "string") return;
  try {
    const decoded = jwt.decode(token);
    const expiresAt = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
    revokedTokens.set(token, expiresAt);
  } catch {
    revokedTokens.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Checks if a JWT token has been explicitly revoked.
 * @param {string} token - Raw JWT string
 * @returns {boolean} True if revoked
 */
function isTokenRevoked(token) {
  if (!token || typeof token !== "string") return false;
  if (!revokedTokens.has(token)) return false;
  const expiresAt = revokedTokens.get(token);
  if (Date.now() > expiresAt) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
}

function clearRevokedTokens() {
  revokedTokens.clear();
}

module.exports = {
  generateToken,
  verifyToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  revokeToken,
  isTokenRevoked,
  clearRevokedTokens,
  getJwtSecret,
  getJwtExpiresIn
};
