const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  validatePasswordStrength,
  validateRegisterInput,
  validateLoginInput,
  validateResetPasswordInput,
  validateChangePasswordInput
} = require("../../src/validators/auth.validator");

describe("Auth Validator Unit Tests", () => {
  describe("Password Strength Validation Specification", () => {
    it("should reject 'abcdef' (missing uppercase, number, and special character)", () => {
      const result = validatePasswordStrength("abcdef");
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("uppercase")));
      assert.ok(result.errors.some((e) => e.includes("number")));
      assert.ok(result.errors.some((e) => e.includes("special character")));
      assert.strictEqual(result.criteria.hasUpper, false);
      assert.strictEqual(result.criteria.hasNumber, false);
      assert.strictEqual(result.criteria.hasSpecial, false);
      assert.strictEqual(result.criteria.minLength, true);
      assert.strictEqual(result.criteria.hasLower, true);
    });

    it("should reject 'ABCDEF' (missing lowercase, number, and special character)", () => {
      const result = validatePasswordStrength("ABCDEF");
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("lowercase")));
      assert.ok(result.errors.some((e) => e.includes("number")));
      assert.ok(result.errors.some((e) => e.includes("special character")));
      assert.strictEqual(result.criteria.hasLower, false);
      assert.strictEqual(result.criteria.hasNumber, false);
      assert.strictEqual(result.criteria.hasSpecial, false);
      assert.strictEqual(result.criteria.minLength, true);
      assert.strictEqual(result.criteria.hasUpper, true);
    });

    it("should reject 'Abcde1' (missing special character)", () => {
      const result = validatePasswordStrength("Abcde1");
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("special character"));
      assert.strictEqual(result.criteria.hasSpecial, false);
      assert.strictEqual(result.criteria.minLength, true);
      assert.strictEqual(result.criteria.hasUpper, true);
      assert.strictEqual(result.criteria.hasLower, true);
      assert.strictEqual(result.criteria.hasNumber, true);
    });

    it("should reject 'Abc@1' (fewer than 6 characters)", () => {
      const result = validatePasswordStrength("Abc@1");
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("at least 6 characters"));
      assert.strictEqual(result.criteria.minLength, false);
      assert.strictEqual(result.criteria.hasUpper, true);
      assert.strictEqual(result.criteria.hasLower, true);
      assert.strictEqual(result.criteria.hasNumber, true);
      assert.strictEqual(result.criteria.hasSpecial, true);
    });

    it("should reject 'Abcde@' (missing number)", () => {
      const result = validatePasswordStrength("Abcde@");
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("number"));
      assert.strictEqual(result.criteria.hasNumber, false);
      assert.strictEqual(result.criteria.minLength, true);
      assert.strictEqual(result.criteria.hasUpper, true);
      assert.strictEqual(result.criteria.hasLower, true);
      assert.strictEqual(result.criteria.hasSpecial, true);
    });

    it("should accept 'Abcde1@' (satisfies all 5 requirements)", () => {
      const result = validatePasswordStrength("Abcde1@");
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.criteria.minLength, true);
      assert.strictEqual(result.criteria.hasUpper, true);
      assert.strictEqual(result.criteria.hasLower, true);
      assert.strictEqual(result.criteria.hasNumber, true);
      assert.strictEqual(result.criteria.hasSpecial, true);
    });

    it("should reject empty or missing password", () => {
      const emptyResult = validatePasswordStrength("");
      assert.strictEqual(emptyResult.isValid, false);
      assert.ok(emptyResult.errors.length > 0);

      const nullResult = validatePasswordStrength(null);
      assert.strictEqual(nullResult.isValid, false);

      const undefResult = validatePasswordStrength(undefined);
      assert.strictEqual(undefResult.isValid, false);
    });
  });

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

  describe("Reset Password Validation", () => {
    it("should pass with valid resetToken and strong newPassword", () => {
      const result = validateResetPasswordInput({
        resetToken: "valid_reset_jwt_token",
        newPassword: "NewStrongPassword123!",
        confirmPassword: "NewStrongPassword123!"
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should reject weak newPassword during reset", () => {
      const result = validateResetPasswordInput({
        resetToken: "valid_reset_jwt_token",
        newPassword: "weakpassword",
        confirmPassword: "weakpassword"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("uppercase")));
    });

    it("should reject mismatched confirmPassword during reset", () => {
      const result = validateResetPasswordInput({
        resetToken: "valid_reset_jwt_token",
        newPassword: "NewStrongPassword123!",
        confirmPassword: "DifferentPassword123!"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("confirmation does not match")));
    });
  });

  describe("Change Password Validation", () => {
    it("should pass with valid currentPassword and strong newPassword", () => {
      const result = validateChangePasswordInput({
        currentPassword: "OldPassword123!",
        newPassword: "NewStrongPassword123!",
        confirmPassword: "NewStrongPassword123!"
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should reject missing currentPassword", () => {
      const result = validateChangePasswordInput({
        currentPassword: "",
        newPassword: "NewStrongPassword123!",
        confirmPassword: "NewStrongPassword123!"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Current password is required")));
    });

    it("should reject weak newPassword", () => {
      const result = validateChangePasswordInput({
        currentPassword: "OldPassword123!",
        newPassword: "abcdef",
        confirmPassword: "abcdef"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("uppercase")));
    });

    it("should reject if newPassword is the same as currentPassword", () => {
      const result = validateChangePasswordInput({
        currentPassword: "SamePassword123!",
        newPassword: "SamePassword123!",
        confirmPassword: "SamePassword123!"
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("cannot be the same")));
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
