/**
 * Shared Strong Password Validator for PrepNova Frontend
 *
 * Rules:
 * 1. At least 6 characters long
 * 2. At least one uppercase letter (A–Z)
 * 3. At least one lowercase letter (a–z)
 * 4. At least one digit (0–9)
 * 5. At least one special character (!@#$%^&* etc.)
 */

export const PASSWORD_REQUIREMENTS = [
  {
    id: 'minLength',
    label: 'At least 6 characters',
    message: 'Password must be at least 6 characters long.',
    test: (pwd) => typeof pwd === 'string' && pwd.length >= 6
  },
  {
    id: 'hasUpper',
    label: 'One uppercase letter (A–Z)',
    message: 'Password must contain at least one uppercase letter.',
    test: (pwd) => typeof pwd === 'string' && /[A-Z]/.test(pwd)
  },
  {
    id: 'hasLower',
    label: 'One lowercase letter (a–z)',
    message: 'Password must contain at least one lowercase letter.',
    test: (pwd) => typeof pwd === 'string' && /[a-z]/.test(pwd)
  },
  {
    id: 'hasNumber',
    label: 'One number (0–9)',
    message: 'Password must contain at least one number.',
    test: (pwd) => typeof pwd === 'string' && /[0-9]/.test(pwd)
  },
  {
    id: 'hasSpecial',
    label: 'One special character (!@#$%^&*)',
    message: 'Password must contain at least one special character.',
    test: (pwd) => typeof pwd === 'string' && /[!@#$%^&*(),.?":{}|<>_~`\-+=[\]\\/]/.test(pwd)
  }
];

/**
 * Validates a password string against all 5 rules.
 *
 * @param {string} password - Raw password input
 * @param {string} label - Optional label for empty password message
 * @returns {{ isValid: boolean, errors: string[], criteria: { minLength: boolean, hasUpper: boolean, hasLower: boolean, hasNumber: boolean, hasSpecial: boolean } }}
 */
export function validatePasswordStrength(password, label = 'Password') {
  const criteria = {
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  };

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: [
        'Password must be at least 6 characters long.',
        'Password must contain at least one uppercase letter.',
        'Password must contain at least one lowercase letter.',
        'Password must contain at least one number.',
        'Password must contain at least one special character.'
      ],
      criteria
    };
  }

  const errors = [];

  PASSWORD_REQUIREMENTS.forEach((req) => {
    const passed = req.test(password);
    criteria[req.id] = passed;
    if (!passed) {
      errors.push(req.message);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    criteria
  };
}
