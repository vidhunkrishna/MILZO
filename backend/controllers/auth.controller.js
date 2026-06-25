const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateTokens } = require('../middleware/auth');
const ApiResponse = require('../utils/apiResponse');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const logger = require('../utils/logger');

// @desc    Login admin user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return ApiResponse.error(res, 'Email and password are required', 400);
  }

  const user = await User.findByEmail(email);

  if (!user || !(await User.matchPassword(password, user.password))) {
    return ApiResponse.unauthorized(res, 'Invalid email or password');
  }

  if (!user.is_active) {
    return ApiResponse.unauthorized(res, 'Account is deactivated. Contact super admin.');
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  await User.updateById(user.id, { lastLogin: new Date().toISOString(), refreshToken });

  await AuditLog.create({
    user: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'LOGIN',
    module: 'Auth',
    description: `Admin ${user.name} logged in`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    user: {
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.last_login,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  await User.updateById(req.user._id, { refreshToken: null });
  res.cookie('token', '', { maxAge: 0 });
  return ApiResponse.success(res, null, 'Logged out successfully');
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return ApiResponse.success(res, req.user);
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);

  if (!user) {
    return ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await User.updateById(user.id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpire: expire,
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const template = emailTemplates.passwordReset(user.name, resetUrl);

  try {
    await sendEmail({ to: user.email, ...template });
    return ApiResponse.success(res, null, 'Password reset email sent');
  } catch (err) {
    await User.updateById(user.id, {
      resetPasswordToken: null,
      resetPasswordExpire: null,
    });
    logger.error(`Forgot password email error: ${err.message}`);
    return ApiResponse.error(res, 'Email could not be sent. Try again later.', 500);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  // Find user with valid token
  const supabase = require('../config/supabase');
  const { data: users } = await supabase.from('users')
    .select('*')
    .eq('reset_password_token', hashedToken)
    .gt('reset_password_expire', new Date().toISOString())
    .limit(1);

  if (!users || users.length === 0) {
    return ApiResponse.error(res, 'Invalid or expired reset token', 400);
  }

  const user = users[0];
  await User.updateById(user.id, {
    password: req.body.password,
    resetPasswordToken: null,
    resetPasswordExpire: null,
  });

  return ApiResponse.success(res, null, 'Password reset successful');
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByEmail(req.user.email);

  if (!(await User.matchPassword(currentPassword, user.password))) {
    return ApiResponse.error(res, 'Current password is incorrect', 400);
  }

  await User.updateById(req.user._id, { password: newPassword });

  await AuditLog.create({
    user: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CHANGE_PASSWORD',
    module: 'Auth',
    ipAddress: req.ip,
  });

  return ApiResponse.success(res, null, 'Password changed successfully');
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return ApiResponse.unauthorized(res, 'No refresh token provided');

  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refresh_token !== token) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    await User.updateById(user.id, { refreshToken: newRefreshToken });
    return ApiResponse.success(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch {
    return ApiResponse.unauthorized(res, 'Invalid or expired refresh token');
  }
};

module.exports = { login, logout, getMe, forgotPassword, resetPassword, changePassword, refreshToken };
