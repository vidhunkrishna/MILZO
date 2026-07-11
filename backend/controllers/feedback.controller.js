const Feedback = require('../models/Feedback');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const logger = require('../utils/logger');

// @desc    Get all feedback tickets
// @route   GET /api/feedback
const getFeedbacks = async (req, res) => {
  const { type, category, status, priority, assignedTo, search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (type) filter.type = type;
  if (category) filter.category = category;
  
  if (status) {
    filter.status = status.toLowerCase().replace(' ', '_');
  }
  if (priority) {
    filter.priority = priority.toLowerCase();
  }
  if (assignedTo) filter.assigned_to = assignedTo;

  // Enforce customer isolation
  if (req.user.role === 'customer') {
    filter.customer = req.user.id || req.user._id;
  }

  if (search) filter.$or = [{ ticket_id: { $regex: search } }, { title: { $regex: search } }];
  
  const select = '*, customer_details:customers(name)';
  const result = await paginate('feedback', filter, { page, limit, sortBy, sortOrder, select });

  // Map result data to include admin compatibility fields
  const formattedData = result.data.map(row => {
    let customerName = 'Guest';
    if (row.customer_details && row.customer_details.name) {
      customerName = row.customer_details.name;
    }

    let severity = 'Low';
    if (row.priority) {
      const p = row.priority.toLowerCase();
      if (p === 'critical' || p === 'high') severity = 'High';
      else if (p === 'medium') severity = 'Medium';
      else severity = 'Low';
    }

    let displayStatus = 'Open';
    if (row.status) {
      const s = row.status.toLowerCase();
      if (s === 'open') displayStatus = 'Open';
      else if (s === 'in_progress' || s === 'in-progress') displayStatus = 'In Progress';
      else if (s === 'resolved') displayStatus = 'Resolved';
      else if (s === 'escalated') displayStatus = 'Escalated';
      else displayStatus = 'Open';
    }

    return {
      ...row,
      customerName,
      comment: row.description || '',
      date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      severity,
      status: displayStatus,
    };
  });

  return ApiResponse.paginated(res, formattedData, result.pagination);
};

// @desc    Get single feedback ticket
// @route   GET /api/feedback/:id
const getFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && feedback.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to view this ticket');
  }

  return ApiResponse.success(res, feedback);
};

// @desc    Create support ticket
// @route   POST /api/feedback
const createFeedback = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const isCustomer = req.user.role === 'customer';

  // Override customer ID for safety if customer role
  const ticketCustomer = isCustomer ? userId : req.body.customer;
  req.body.customer = ticketCustomer;

  if (isCustomer) {
    req.body.status = 'open'; // Force initial status
  }

  try {
    const feedback = await Feedback.create(req.body);
    return ApiResponse.created(res, feedback, 'Support ticket created successfully');
  } catch (err) {
    logger.error(`Error creating support ticket: ${err.message}`);
    return ApiResponse.error(res, `Failed to create ticket: ${err.message}`, 500);
  }
};

// @desc    Update support ticket
// @route   PUT /api/feedback/:id
const updateFeedback = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && feedback.customer !== userId) {
    return ApiResponse.forbidden(res, 'You are not authorized to update this ticket');
  }

  const updated = await Feedback.update(req.params.id, req.body);
  return ApiResponse.success(res, updated, 'Ticket updated successfully');
};

// @desc    Resolve support ticket
// @route   PATCH /api/feedback/:id/resolve
const resolveFeedback = async (req, res) => {
  const { notes, comment, severity, status: inputStatus, satisfactionRating } = req.body;
  const userId = req.user.id || req.user._id;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && feedback.customer !== userId) {
    return ApiResponse.forbidden(res, 'You are not authorized to resolve this ticket');
  }

  const updates = {};
  updates.status = inputStatus ? inputStatus.toLowerCase().replace(' ', '_') : 'resolved';
  
  if (severity) {
    updates.priority = severity === 'High' ? 'high' : severity === 'Medium' ? 'medium' : 'low';
  }

  const finalNotes = notes || comment || 'Resolved';
  updates.resolution = { 
    notes: finalNotes, 
    resolvedAt: new Date().toISOString(), 
    resolvedBy: userId, 
    satisfactionRating 
  };

  await Feedback.update(feedback.id, updates);

  // Add internal/external comment with the resolution notes if comment/notes is present
  if (notes || comment) {
    try {
      await Feedback.addComment(feedback.id, { 
        author: userId, 
        text: finalNotes, 
        isInternal: false 
      });
    } catch (e) {
      logger.error(`Error adding resolution comment: ${e.message}`);
    }
  }

  const updated = await Feedback.findById(feedback.id);
  return ApiResponse.success(res, updated, 'Ticket resolved');
};

// @desc    Escalate support ticket (Admin-only)
// @route   PATCH /api/feedback/:id/escalate
const escalateFeedback = async (req, res) => {
  const { escalatedTo, reason } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Customers cannot escalate tickets
  if (req.user.role === 'customer') {
    return ApiResponse.forbidden(res, 'You are not authorized to escalate this ticket');
  }

  await Feedback.update(feedback.id, {
    status: 'escalated',
    priority: 'high',
    escalation: { escalatedAt: new Date().toISOString(), escalatedTo, reason },
  });

  const updated = await Feedback.findById(feedback.id);
  return ApiResponse.success(res, updated, 'Ticket escalated');
};

// @desc    Add comment to ticket
// @route   POST /api/feedback/:id/comments
const addComment = async (req, res) => {
  const { text, isInternal } = req.body;
  const userId = req.user.id || req.user._id;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Enforce customer isolation
  if (req.user.role === 'customer') {
    if (feedback.customer !== userId) {
      return ApiResponse.forbidden(res, 'You are not authorized to comment on this ticket');
    }
  }

  // Force isInternal = false for customers
  const internalFlag = req.user.role === 'customer' ? false : (isInternal || false);

  try {
    await Feedback.addComment(feedback.id, { author: userId, text, isInternal: internalFlag });
    const updated = await Feedback.findById(feedback.id);
    return ApiResponse.success(res, updated, 'Comment added successfully');
  } catch (err) {
    logger.error(`Error adding comment: ${err.message}`);
    return ApiResponse.error(res, `Failed to add comment: ${err.message}`, 500);
  }
};

// @desc    Delete support ticket (soft delete)
// @route   DELETE /api/feedback/:id
const deleteFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return ApiResponse.notFound(res, 'Ticket not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && feedback.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to delete this ticket');
  }

  await Feedback.softDelete(req.params.id);
  return ApiResponse.success(res, null, 'Ticket deleted successfully');
};

module.exports = { 
  getFeedbacks, 
  getFeedback, 
  createFeedback, 
  updateFeedback, 
  resolveFeedback, 
  escalateFeedback, 
  addComment, 
  deleteFeedback 
};
