const { describe, it } = require("node:test");
const assert = require("node:assert");
const { generateToken, verifyToken } = require("../../src/utils/jwt");

describe("JWT Utility Tests", () => {
  it("should generate a valid JWT token with payload", () => {
    const payload = { id: "user_123", email: "test@example.com", role: "user" };
    const token = generateToken(payload);

    assert.ok(token, "Token should be generated");
    assert.strictEqual(typeof token, "string");

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, "user_123");
    assert.strictEqual(decoded.email, "test@example.com");
    assert.strictEqual(decoded.role, "user");
  });

  it("should reject a malformed or forged token", () => {
    assert.throws(
      () => {
        verifyToken("invalid.token.string");
      },
      (err) => {
        return err.name === "JsonWebTokenError";
      }
    );
  });

  it("should reject an expired token", async () => {
    // Generate token with 1ms expiry
    const payload = { id: "user_expired", email: "exp@example.com" };
    const token = generateToken(payload, "1ms");

    // Wait 50ms for token to expire
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.throws(
      () => {
        verifyToken(token);
      },
      (err) => {
        return err.name === "TokenExpiredError";
      }
    );
  });
});
