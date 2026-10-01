const { describe, it } = require("node:test");
const assert = require("node:assert");
const { validateRegisterInput, validateLoginInput } = require("../../src/validators/auth.validator");

describe("Auth Validator Unit Tests", () => {
  describe("Registration Validation", () => {
    it("should pass with valid name, email, and password", () => {
      const result = validateRegisterInput({
        name: "Jaimin Trivedi",
        email: "jaimin@example.com",
        password: "StrongPassword123!"
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should fail when name is missing or too short", () => {
      const result = validateRegisterInput({
        name: "J",
        email: "jaimin@example.com",
        password: "StrongPassword123!"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Name")));
    });

    it("should fail with invalid email format", () => {
      const result = validateRegisterInput({
        name: "Jaimin Trivedi",
        email: "invalid-email",
        password: "StrongPassword123!"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("email")));
    });

    it("should fail with short/weak password", () => {
      const result = validateRegisterInput({
        name: "Jaimin Trivedi",
        email: "jaimin@example.com",
        password: "123"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Password")));
    });

    it("should fail with completely empty payload", () => {
      const result = validateRegisterInput({});
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 3);
    });
  });

  describe("Login Validation", () => {
    it("should pass with valid email and password", () => {
      const result = validateLoginInput({
        email: "jaimin@example.com",
        password: "StrongPassword123!"
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should fail with missing email", () => {
      const result = validateLoginInput({
        password: "password123"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("email")));
    });

    it("should fail with missing password", () => {
      const result = validateLoginInput({
        email: "jaimin@example.com"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Password")));
    });
  });
});
