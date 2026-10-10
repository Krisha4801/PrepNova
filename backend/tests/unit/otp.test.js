const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  getOtpExpiresInMinutes,
  getMaxOtpAttempts
} = require("../../src/utils/otp");

describe("OTP Generation & Hashing Unit Tests", () => {
  it("should generate a 6-digit numeric string with leading zeros preserved", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOTP();
      assert.strictEqual(typeof otp, "string", "OTP must be a string");
      assert.strictEqual(otp.length, 6, "OTP must have exactly 6 characters");
      assert.match(otp, /^\d{6}$/, "OTP must consist strictly of 6 digits [0-9]");
    }
  });

  it("should generate unique, random OTPs over repeated calls", () => {
    const set = new Set();
    for (let i = 0; i < 100; i++) {
      set.add(generateOTP());
    }
    // High entropy check
    assert.ok(set.size > 85, "Generated OTPs should exhibit high entropy and variety");
  });

  it("should compute a deterministic SHA-256 hash for a given OTP", () => {
    const otp = "483921";
    const hash1 = hashOTP(otp);
    const hash2 = hashOTP(otp);

    assert.strictEqual(typeof hash1, "string");
    assert.strictEqual(hash1.length, 64, "SHA-256 hash must be 64 hex characters");
    assert.strictEqual(hash1, hash2, "Hashing same OTP should yield identical hash");
    assert.notStrictEqual(hash1, otp, "Hash must never equal raw OTP");
  });

  it("should correctly verify a valid OTP against its stored hash", () => {
    const rawOtp = "123456";
    const storedHash = hashOTP(rawOtp);

    const isMatch = verifyOTPHash(rawOtp, storedHash);
    assert.strictEqual(isMatch, true, "Valid OTP must match stored hash");
  });

  it("should reject an invalid OTP against a stored hash", () => {
    const rawOtp = "123456";
    const storedHash = hashOTP(rawOtp);

    assert.strictEqual(verifyOTPHash("123457", storedHash), false);
    assert.strictEqual(verifyOTPHash("000000", storedHash), false);
    assert.strictEqual(verifyOTPHash("", storedHash), false);
    assert.strictEqual(verifyOTPHash(null, storedHash), false);
  });

  it("should return default configured expiration and max attempt limits", () => {
    const expiry = getOtpExpiresInMinutes();
    const maxAttempts = getMaxOtpAttempts();

    assert.strictEqual(typeof expiry, "number");
    assert.ok(expiry >= 5 && expiry <= 60, "Expiry minutes must be within safe threshold");
    assert.strictEqual(typeof maxAttempts, "number");
    assert.ok(maxAttempts >= 3 && maxAttempts <= 10, "Max attempts must be within safe threshold");
  });
});
