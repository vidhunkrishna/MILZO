const Feedback = require('../models/Feedback');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getFeedbacks = async (req, res) => {
  const { type, category, status, priority, assignedTo, search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assigned_to = assignedTo;
  if (search) filter.$or = [{ ticket_id: { $regex: search } }, { title: { $regex: search } }];
  const result = await paginate('feedback', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');
  return ApiResponse.success(res, feedback);
};

const createFeedback = async (req, res) => {
  const feedback = await Feedback.create(req.body);
  return ApiResponse.created(res, feedback, 'Feedback ticket created');
};

const updateFeedback = async (req, res) => {
  const feedback = await Feedback.update(req.params.id, req.body);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');
  return ApiResponse.success(res, feedback, 'Feedback updated');
};

const resolveFeedback = async (req, res) => {
  const { notes, satisfactionRating } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');

  await Feedback.update(feedback.id, {
    status: 'resolved',
    resolution: { notes, resolvedAt: new Date().toISOString(), resolvedBy: req.user._id, satisfactionRating },
  });

  const updated = await Feedback.findById(feedback.id);
  return ApiResponse.success(res, updated, 'Feedback resolved');
};

const escalateFeedback = async (req, res) => {
  const { escalatedTo, reason } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');

  await Feedback.update(feedback.id, {
    status: 'escalated',
    priority: 'high',
    escalation: { escalatedAt: new Date().toISOString(), escalatedTo, reason },
  });

  const updated = await Feedback.findById(feedback.id);
  return ApiResponse.success(res, updated, 'Feedback escalated');
};

const addComment = async (req, res) => {
  const { text, isInternal } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');

  await Feedback.addComment(feedback.id, { author: req.user._id, text, isInternal });
  const updated = await Feedback.findById(feedback.id);
  return ApiResponse.success(res, updated, 'Comment added');
};

const deleteFeedback = async (req, res) => {
  const feedback = await Feedback.softDelete(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Feedback not found');
  return ApiResponse.success(res, null, 'Feedback deleted');
};

module.exports = { getFeedbacks, getFeedback, createFeedback, updateFeedback, resolveFeedback, escalateFeedback, addComment, deleteFeedback };
