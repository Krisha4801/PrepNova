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

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
