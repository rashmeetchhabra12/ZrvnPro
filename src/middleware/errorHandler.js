/**
 * Global Error Handling Middleware
 *
 * Catches all errors and returns consistent error responses
 */

/**
 * Error handler middleware
 * Must be defined last, after all other middleware and routes
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by error handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Database errors
  if (err.code === '23505') {
    // Unique constraint violation
    const field = err.detail?.match(/Key \((\w+)\)/)?.[1] || 'field';
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist',
    });
  }

  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({
      error: 'Validation error',
      message: 'Data does not meet database constraints',
    });
  }

  // Validation errors (from Joi)
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details?.map((d) => d.message) || [],
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Application error',
      message: err.message,
    });
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
};

/**
 * 404 Not Found handler
 * Use this before the error handler middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async route handler wrapper
 * Automatically catches errors in async route handlers and passes them to error middleware
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  asyncHandler,
};
