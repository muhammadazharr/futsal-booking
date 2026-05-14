const { validationResult, body, param, query } = require('express-validator');
const { BadRequestError } = require('../utils/errors');

/**
 * Validation middleware wrapper
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: extractedErrors
    });
  };
};

// Common validators
const validators = {
  // UUID validator
  uuid: (field, location = 'param') => {
    const validator = location === 'param' ? param(field) : 
                      location === 'body' ? body(field) : query(field);
    return validator
      .isUUID(4)
      .withMessage(`${field} must be a valid UUID`);
  },

  // Required string
  requiredString: (field, minLength = 1, maxLength = 255) => {
    return body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`);
  },

  // Optional string
  optionalString: (field, maxLength = 255) => {
    return body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field} must not exceed ${maxLength} characters`);
  },

  // Email
  email: (field = 'email', required = true) => {
    const validator = body(field).trim();
    if (required) {
      return validator
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail();
    }
    return validator
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail();
  },

  /**
   * Phone number validator
   * Supports Indonesian and international formats
   */
  phone: (field = 'phone', required = true) => {
    const validator = body(field).trim();
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
    
    if (required) {
      return validator
        .notEmpty()
        .withMessage('Phone is required')
        .matches(phoneRegex)
        .withMessage('Invalid phone format (e.g., 081234567890)');
    }
    return validator
      .optional()
      .matches(phoneRegex)
      .withMessage('Invalid phone format (e.g., 081234567890)');
  },

  // Password
  password: (field = 'password') => {
    return body(field)
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number');
  },

  // Date
  date: (field, required = true) => {
    const validator = body(field);
    if (required) {
      return validator
        .notEmpty()
        .withMessage(`${field} is required`)
        .isISO8601()
        .withMessage(`${field} must be a valid date`);
    }
    return validator
      .optional()
      .isISO8601()
      .withMessage(`${field} must be a valid date`);
  },

  // Future date
  futureDate: (field) => {
    return body(field)
      .notEmpty()
      .withMessage(`${field} is required`)
      .isISO8601()
      .withMessage(`${field} must be a valid date`)
      .custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          throw new Error(`${field} must be today or in the future`);
        }
        return true;
      });
  },

  // Numeric
  numeric: (field, required = true, min = 0) => {
    const validator = body(field);
    if (required) {
      return validator
        .notEmpty()
        .withMessage(`${field} is required`)
        .isNumeric()
        .withMessage(`${field} must be a number`)
        .custom((value) => {
          if (parseFloat(value) < min) {
            throw new Error(`${field} must be at least ${min}`);
          }
          return true;
        });
    }
    return validator
      .optional()
      .isNumeric()
      .withMessage(`${field} must be a number`);
  },

  // Boolean
  boolean: (field, required = true) => {
    const validator = body(field);
    if (required) {
      return validator
        .notEmpty()
        .withMessage(`${field} is required`)
        .isBoolean()
        .withMessage(`${field} must be a boolean`);
    }
    return validator
      .optional()
      .isBoolean()
      .withMessage(`${field} must be a boolean`);
  },

  // Pagination
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Enum
  enum: (field, values, required = true) => {
    const validator = body(field);
    if (required) {
      return validator
        .notEmpty()
        .withMessage(`${field} is required`)
        .isIn(values)
        .withMessage(`${field} must be one of: ${values.join(', ')}`);
    }
    return validator
      .optional()
      .isIn(values)
      .withMessage(`${field} must be one of: ${values.join(', ')}`);
  }
};

module.exports = {
  validate,
  validators,
  body,
  param,
  query
};
