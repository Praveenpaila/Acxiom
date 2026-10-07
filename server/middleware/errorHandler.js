const AppError = require('../utils/appError');

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler - strips stack traces and internal DB details
const errorHandler = (err, req, res, next) => {
  // Operational errors created deliberately via AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const fieldName = duplicateFields[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `A record with this ${fieldName} already exists.`,
    });
  }

  // Mongoose CastError (e.g., malformed ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}.`,
    });
  }

  // Mongoose Schema Validation error
  if (err.name === 'ValidationError') {
    const firstMessage = Object.values(err.errors)[0]?.message || 'Validation error.';
    return res.status(400).json({
      success: false,
      message: firstMessage,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired.',
    });
  }

  // Fallback for unhandled exceptions - never leak DB schema or stack trace to client
  console.error('[UNHANDLED_ERROR]', err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
