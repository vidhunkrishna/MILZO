const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const ErrorLog = require('../models/ErrorLog');
const Settings = require('../models/Settings');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

// ===== NOTIFICATIONS =====
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await Notification.findForUser(req.user._id, { page, limit });
  const totalPages = Math.ceil((result.count || 0) / parseInt(limit));
  return ApiResponse.paginated(res, result.data, {
    page: parseInt(page), limit: parseInt(limit), total: result.count || 0, totalPages,
    hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1,
  });
};

const createNotification = async (req, res) => {
  const notification = await Notification.create(req.body);
  return ApiResponse.created(res, notification, 'Notification created');
};

const markNotificationRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return ApiResponse.notFound(res, 'Notification not found');
  await Notification.markRead(req.params.id, req.user._id);
  return ApiResponse.success(res, null, 'Notification marked as read');
};

const markAllRead = async (req, res) => {
  await Notification.markAllReadForUser(req.user._id);
  return ApiResponse.success(res, null, 'All notifications marked as read');
};

// ===== AUDIT LOGS =====
const getAuditLogs = async (req, res) => {
  const { module, action, userId, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = {};
  if (module) filter.module = module;
  if (action) filter.action = action;
  if (userId) filter.user = userId;
  const result = await AuditLog.findAll(filter, { page, limit, sortBy, sortOrder });
  const totalPages = Math.ceil((result.count || 0) / parseInt(limit));
  return ApiResponse.paginated(res, result.data, {
    page: parseInt(page), limit: parseInt(limit), total: result.count || 0, totalPages,
    hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1,
  });
};

// ===== ERROR LOGS =====
const getErrorLogs = async (req, res) => {
  const { level, resolved, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (level) filter.level = level;
  if (resolved !== undefined) filter.resolved = resolved === 'true';
  const result = await ErrorLog.findAll(filter, { page, limit });
  const totalPages = Math.ceil((result.count || 0) / parseInt(limit));
  return ApiResponse.paginated(res, result.data, {
    page: parseInt(page), limit: parseInt(limit), total: result.count || 0, totalPages,
    hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1,
  });
};

const resolveErrorLog = async (req, res) => {
  const log = await ErrorLog.resolve(req.params.id, req.user._id);
  if (!log) return ApiResponse.notFound(res, 'Error log not found');
  return ApiResponse.success(res, log, 'Error log resolved');
};

// ===== SETTINGS =====
const getSettings = async (req, res) => {
  const { category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  const settings = await Settings.findAll(filter);
  const formatted = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  return ApiResponse.success(res, { settings, formatted });
};

const updateSettings = async (req, res) => {
  const { settings } = req.body;
  const updates = await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      Settings.upsert(key, value, req.user._id)
    )
  );
  return ApiResponse.success(res, updates, 'Settings updated');
};

// ===== USERS (Admin Staff) =====
const getUsers = async (req, res) => {
  const { role, isActive, page = 1, limit = 10 } = req.query;
  const filter = { deleted_at: null };
  if (role) filter.role = role;
  if (isActive !== undefined) filter.is_active = isActive === 'true';
  const result = await paginate('users', filter, { page, limit, sortBy: 'created_at', sortOrder: 'desc' });
  // Remove sensitive fields
  const sanitized = result.data.map(u => {
    const { password, refresh_token, reset_password_token, ...safe } = u;
    return safe;
  });
  return ApiResponse.paginated(res, sanitized, result.pagination);
};

const createUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const user = await User.create({ name, email, password, role, phone, createdBy: req.user._id });
  return ApiResponse.created(res, { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role }, 'Admin user created');
};

const updateUser = async (req, res) => {
  const { name, phone, role, isActive } = req.body;
  const user = await User.updateById(req.params.id, { name, phone, role, isActive });
  if (!user) return ApiResponse.notFound(res, 'User not found');
  const { password, refresh_token, reset_password_token, ...safe } = user;
  return ApiResponse.success(res, safe, 'User updated');
};

const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id) return ApiResponse.error(res, 'Cannot delete your own account', 400);
  const user = await User.updateById(req.params.id, { deletedAt: new Date().toISOString(), isActive: false });
  if (!user) return ApiResponse.notFound(res, 'User not found');
  return ApiResponse.success(res, null, 'User deleted');
};

module.exports = {
  getNotifications, createNotification, markNotificationRead, markAllRead,
  getAuditLogs, getErrorLogs, resolveErrorLog,
  getSettings, updateSettings,
  getUsers, createUser, updateUser, deleteUser,
};
