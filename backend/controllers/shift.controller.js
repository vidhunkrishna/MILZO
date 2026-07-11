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
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d.toISOString().split('T')[0], $lt: next.toISOString().split('T')[0] };
    }
  }
  const result = await paginate('shifts', filter, { page, limit, sortBy: 'date', sortOrder: 'desc' });
  
  // Resolve activeAgentsCount for each shift
  const supabase = require('../config/supabase');
  const formattedShifts = await Promise.all(result.data.map(async (shift) => {
    const { count } = await supabase
      .from('shift_agents')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', shift.id);
    return {
      ...shift,
      activeAgentsCount: count || 0
    };
  }));

  return ApiResponse.paginated(res, formattedShifts, result.pagination);
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

const markMockAttendance = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('shift_attendance')
      .update({ present: status === 'Present' })
      .eq('id', id)
      .select();
    if (error) {
      return ApiResponse.error(res, error.message, 500);
    }
    return ApiResponse.success(res, data[0], 'Attendance marked');
  } else {
    return ApiResponse.success(res, { id, status }, 'Attendance marked (Mock)');
  }
};

module.exports = { getShifts, getShift, createShift, updateShift, deleteShift, markAttendance, handleLeaveRequest, markMockAttendance };
