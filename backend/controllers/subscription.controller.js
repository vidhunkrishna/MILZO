const Subscription = require('../models/Subscription');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getSubscriptions = async (req, res) => {
  const { search, status, planType, customerId, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (planType) filter.plan_type = planType;
  if (customerId) filter.customer = customerId;
  if (search) filter.$or = [{ subscription_id: { $regex: search } }];
  const result = await paginate('subscriptions', filter, {
    page,
    limit,
    sortBy,
    sortOrder,
    select: '*, customer:customers(name), product:products(name)'
  });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getSubscription = async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');
  return ApiResponse.success(res, sub);
};

const createSubscription = async (req, res) => {
  const sub = await Subscription.create(req.body);
  return ApiResponse.created(res, sub, 'Subscription created');
};

const updateSubscription = async (req, res) => {
  const sub = await Subscription.update(req.params.id, req.body);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');
  return ApiResponse.success(res, sub, 'Subscription updated');
};

const pauseSubscription = async (req, res) => {
  const { reason } = req.body;
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');
  if (sub.status !== 'active') return ApiResponse.error(res, 'Only active subscriptions can be paused', 400);

  await Subscription.update(sub.id, { status: 'paused' });
  await Subscription.addPauseEntry(sub.id, { pausedAt: new Date().toISOString(), reason, pausedBy: req.user._id });

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, 'Subscription paused');
};

const resumeSubscription = async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');
  if (sub.status !== 'paused') return ApiResponse.error(res, 'Subscription is not paused', 400);

  await Subscription.update(sub.id, { status: 'active' });
  await Subscription.updateLastPauseResume(sub.id);

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, 'Subscription resumed');
};

const cancelSubscription = async (req, res) => {
  const { reason } = req.body;
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');

  await Subscription.update(sub.id, {
    status: 'cancelled',
    cancelReason: reason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: req.user._id,
  });

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, 'Subscription cancelled');
};

const deleteSubscription = async (req, res) => {
  const sub = await Subscription.softDelete(req.params.id);
  if (!sub) return ApiResponse.notFound(res, 'Subscription not found');
  return ApiResponse.success(res, null, 'Subscription deleted');
};

module.exports = { getSubscriptions, getSubscription, createSubscription, updateSubscription, pauseSubscription, resumeSubscription, cancelSubscription, deleteSubscription };
