const Shift = require('../models/Shift');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getShifts = async (req, res) => {
  const { type, status, date, page = 1, limit = 10 } = req.query;
  const filter = { deleted_at: null };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d.toISOString().split('T')[0], $lt: next.toISOString().split('T')[0] };
  }
  const result = await paginate('shifts', filter, { page, limit, sortBy: 'date', sortOrder: 'desc' });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getShift = async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return ApiResponse.notFound(res, 'Shift not found');
  return ApiResponse.success(res, shift);
};

const createShift = async (req, res) => {
  const shift = await Shift.create(req.body);
  return ApiResponse.created(res, shift, 'Shift created');
};

const updateShift = async (req, res) => {
  const shift = await Shift.update(req.params.id, req.body);
  if (!shift) return ApiResponse.notFound(res, 'Shift not found');
  return ApiResponse.success(res, shift, 'Shift updated');
};

const deleteShift = async (req, res) => {
  const shift = await Shift.softDelete(req.params.id);
  if (!shift) return ApiResponse.notFound(res, 'Shift not found');
  return ApiResponse.success(res, null, 'Shift deleted');
};

const markAttendance = async (req, res) => {
  const { agentId, present, checkIn, checkOut, notes } = req.body;
  const shift = await Shift.findById(req.params.id);
  if (!shift) return ApiResponse.notFound(res, 'Shift not found');

  await Shift.markAttendance(shift.id, { agentId, present, checkIn, checkOut, notes });
  const updated = await Shift.findById(shift.id);
  return ApiResponse.success(res, updated, 'Attendance marked');
};

const handleLeaveRequest = async (req, res) => {
  const { agentId, status: leaveStatus } = req.body;
  const shift = await Shift.findById(req.params.id);
  if (!shift) return ApiResponse.notFound(res, 'Shift not found');

  const result = await Shift.handleLeaveRequest(shift.id, agentId, leaveStatus, req.user._id);
  if (!result) return ApiResponse.notFound(res, 'Leave request not found');

  const updated = await Shift.findById(shift.id);
  return ApiResponse.success(res, updated, 'Leave request updated');
};

module.exports = { getShifts, getShift, createShift, updateShift, deleteShift, markAttendance, handleLeaveRequest };
