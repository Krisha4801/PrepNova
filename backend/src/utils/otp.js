const crypto = require("crypto");

/**
 * Returns the secret / pepper used for password reset hashing.
 */
function getResetSecret() {
  return process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || "prepnova_password_reset_default_secret_pepper";
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP string.
 * Ranges from '000000' to '999999' (with leading zeros preserved).
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  const number = crypto.randomInt(0, 1000000);
  return String(number).padStart(6, "0");
}

/**
 * Computes a secure SHA-256 HMAC/hash for storing the OTP.
 * Never store the raw OTP in the database.
 * @param {string} otp - 6-digit raw OTP
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashOTP(otp) {
  if (!otp || typeof otp !== "string") {
    throw new Error("Invalid OTP provided for hashing.");
  }
  return crypto
    .createHash("sha256")
    .update(String(otp).trim() + ":" + getResetSecret())
    .digest("hex");
}

/**
 * Verifies a submitted raw OTP against a stored hash using timing-safe comparison.
 * @param {string} submittedOtp - Raw OTP entered by user
 * @param {string} storedHash - Stored hex SHA-256 hash from database
 * @returns {boolean} True if matched
 */
function verifyOTPHash(submittedOtp, storedHash) {
  if (!submittedOtp || !storedHash || typeof submittedOtp !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const computedHash = hashOTP(submittedOtp);
  const computedBuffer = Buffer.from(computedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, storedBuffer);
}

/**
 * Retrieves configured OTP expiry window in minutes.
 * @returns {number} Minutes (default: 10)
 */
function getOtpExpiresInMinutes() {
  return Number(process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES) || 10;
}

/**
 * Retrieves configured maximum verification attempts.
 * @returns {number} Max attempts before OTP invalidation (default: 5)
 */
function getMaxOtpAttempts() {
  return Number(process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS) || 5;
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  getOtpExpiresInMinutes,
  getMaxOtpAttempts
};
