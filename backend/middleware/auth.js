const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Protect routes – verifies JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'Not authorized. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdSafe(decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found. Token invalid.');
    }

    if (!user.is_active) {
      return ApiResponse.unauthorized(res, 'Account is deactivated. Contact super admin.');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth middleware error: ${error.message}`);
    return ApiResponse.unauthorized(res, 'Invalid or expired token.');
  }
};

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });

  return { accessToken, refreshToken };
};

module.exports = { protect, generateTokens };
