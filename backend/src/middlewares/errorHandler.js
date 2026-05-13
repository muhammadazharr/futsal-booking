const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Operational errors (expected errors)
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code);
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return errorResponse(res, 'Resource already exists', 409, 'DUPLICATE_ENTRY');
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return errorResponse(res, 'Related resource not found', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return errorResponse(res, 'Validation constraint failed', 400, 'CHECK_VIOLATION');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  // Unknown errors
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  return errorResponse(res, message, 500, 'INTERNAL_ERROR');
};

module.exports = { errorHandler };
