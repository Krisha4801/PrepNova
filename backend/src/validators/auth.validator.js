/**
 * Evaluates password strength against PrepNova security rules:
 * 1. At least 6 characters long
 * 2. At least one uppercase letter (A–Z)
 * 3. At least one lowercase letter (a–z)
 * 4. At least one digit (0–9)
 * 5. At least one special character (!@#$%^&* etc.)
 *
 * @param {string} password - Raw password to check
 * @param {string} label - Field display name (e.g. "Password", "New password")
 * @returns {Object} { isValid: boolean, errors: string[], criteria: Object }
 */
function validatePasswordStrength(password, label = "Password") {
  const errors = [];

  if (!password || typeof password !== "string") {
    errors.push(`${label} is required and must be at least 6 characters long.`);
    return {
      isValid: false,
      errors,
      criteria: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false
      }
    };
  }

  const minLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_~`\-+=[\]\\/]/.test(password);

  if (!minLength) {
    errors.push("Password must be at least 6 characters long.");
  }
  if (!hasUpper) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!hasLower) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!hasNumber) {
    errors.push("Password must contain at least one number.");
  }
  if (!hasSpecial) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    criteria: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial
    }
  };
}

/**
 * Validates registration input data.
 * @param {Object} data - Input body { name, email, password }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateRegisterInput(data = {}) {
  const errors = [];
  const { name, email, password } = data;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters long.");
  }

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  const passwordResult = validatePasswordStrength(password, "Password");
  if (!passwordResult.isValid) {
    errors.push(...passwordResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates login input data.
 * @param {Object} data - Input body { email, password }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateLoginInput(data = {}) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push("Password is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates forgot password input data.
 * @param {Object} data - Input body { email }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateForgotPasswordInput(data = {}) {
  const errors = [];
  const { email } = data;

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates OTP verification input data.
 * @param {Object} data - Input body { email, otp }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateVerifyOtpInput(data = {}) {
  const errors = [];
  const { email, otp } = data;

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
    errors.push("A 6-digit numeric verification code is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates reset password input data.
 * @param {Object} data - Input body { resetToken, newPassword, confirmPassword }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateResetPasswordInput(data = {}) {
  const errors = [];
  const { resetToken, newPassword, confirmPassword } = data;

  if (!resetToken || typeof resetToken !== "string" || !resetToken.trim()) {
    errors.push("Password reset authorization token is required.");
  }

  const passwordResult = validatePasswordStrength(newPassword, "New password");
  if (!passwordResult.isValid) {
    errors.push(...passwordResult.errors);
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push("Password confirmation does not match the new password.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates change password input data.
 * @param {Object} data - Input body { currentPassword, newPassword, confirmPassword }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateChangePasswordInput(data = {}) {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
    errors.push("Current password is required.");
  }

  const passwordResult = validatePasswordStrength(newPassword, "New password");
  if (!passwordResult.isValid) {
    errors.push(...passwordResult.errors);
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push("Password confirmation does not match the new password.");
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push("New password cannot be the same as your current password.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePasswordStrength,
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateVerifyOtpInput,
  validateResetPasswordInput,
  validateChangePasswordInput
};

