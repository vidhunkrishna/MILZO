const logger = require('../utils/logger');

/**
 * Global async error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`${err.message} | ${req.method} ${req.originalUrl} | IP: ${req.ip}`);

  // PostgreSQL unique constraint violation (Supabase returns code 23505)
  if (err.code === '23505' || (err.message && err.message.includes('duplicate key'))) {
    const match = err.message.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'unknown';
    error.message = `Duplicate value for field: ${field}`;
    return res.status(400).json({ success: false, message: error.message });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    error.message = 'Referenced resource does not exist';
    return res.status(400).json({ success: false, message: error.message });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    error.message = 'Value violates validation constraint';
    return res.status(422).json({ success: false, message: error.message });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    const match = err.message.match(/column "(\w+)"/);
    const field = match ? match[1] : 'unknown';
    error.message = `Required field missing: ${field}`;
    return res.status(422).json({ success: false, message: error.message });
  }

  // Supabase PGRST errors (no rows found)
  if (err.code === 'PGRST116') {
    error.message = 'Resource not found';
    return res.status(404).json({ success: false, message: error.message });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 5MB allowed.' });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
