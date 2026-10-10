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

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password is required and must be at least 6 characters long.");
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

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    errors.push("New password is required and must be at least 6 characters long.");
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push("Password confirmation does not match the new password.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateVerifyOtpInput,
  validateResetPasswordInput
};

