const Subscription = require("../models/Subscription");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const { paginate } = require("../utils/pagination");
const logger = require("../utils/logger");
const supabase = require("../config/supabase");

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
const getSubscriptions = async (req, res) => {
  const {
    search,
    status,
    planType,
    customerId,
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortOrder = "desc",
  } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (planType) filter.plan_type = planType;

  // Enforce customer isolation
  if (req.user.role === "customer") {
    filter.customer = req.user.id || req.user._id;
  } else if (customerId) {
    filter.customer = customerId;
  }

  if (search) filter.$or = [{ subscription_id: { $regex: search } }];

  const result = await paginate("subscriptions", filter, {
    page,
    limit,
    sortBy,
    sortOrder,
    select: `
  *,
  customer:customers!subscriptions_customer_fkey(
    id,
    name
  ),
  product:products!subscriptions_product_fkey(
    id,
    name
  )
`,
  });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
const getSubscription = async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (
    req.user.role === "customer" &&
    sub.customer !== (req.user.id || req.user._id)
  ) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to view this subscription",
    );
  }

  return ApiResponse.success(res, sub);
};

// @desc    Create subscription
// @route   POST /api/subscriptions
const createSubscription = async (req, res) => {
  console.log("========================================");
  console.log("CREATE SUBSCRIPTION REQUEST");
  console.log("========================================");
  console.log("req.user", req.user);
  console.log("req.body", req.body);
  console.log("req.user.role", req.user?.role);
  console.log("req.user.id", req.user?.id);
  console.log("req.user._id", req.user?._id);

  const userId = req.user.id || req.user._id;
  const isCustomer = req.user.role === "customer";

  // Override customer ID for safety if customer role
  const subCustomer = isCustomer ? userId : req.body.customer;
  req.body.customer = subCustomer;

  console.log("Computed customer:", req.body.customer);

  const {
    product: productId,
    quantity,
    planType,
    deliverySlot,
    startDate,
  } = req.body;

  // Validations
  if (!productId || !quantity || !planType || !deliverySlot || !startDate) {
    return ApiResponse.error(
      res,
      "Missing required fields for subscription",
      400,
    );
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return ApiResponse.error(res, "Invalid quantity", 400);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (startDate < todayStr) {
    return ApiResponse.error(res, "Start date cannot be in the past", 400);
  }

  try {
    // Verify product exists and get price
    const product = await Product.findById(productId);
    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }
    if (!product.is_active) {
      return ApiResponse.error(res, "Product is currently inactive", 400);
    }

    // Set prices and fields
    req.body.pricePerUnit = product.price;
    req.body.vendor = product.vendor;

    // Set next delivery date to start date initially
    req.body.nextDeliveryDate = startDate;

    console.log("Final request body:", req.body);

    const sub = await Subscription.create(req.body);
    return ApiResponse.created(res, sub, "Subscription created");
  } catch (err) {
    logger.error(`Error creating subscription: ${err.message}`);
    return ApiResponse.error(
      res,
      `Failed to create subscription: ${err.message}`,
      500,
    );
  }
};

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
const updateSubscription = async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (
    req.user.role === "customer" &&
    sub.customer !== (req.user.id || req.user._id)
  ) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to update this subscription",
    );
  }

  const updated = await Subscription.update(req.params.id, req.body);
  return ApiResponse.success(res, updated, "Subscription updated");
};

// @desc    Pause subscription
// @route   PATCH /api/subscriptions/:id/pause
const pauseSubscription = async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.id || req.user._id;
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (req.user.role === "customer" && sub.customer !== userId) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to pause this subscription",
    );
  }

  if (sub.status !== "active")
    return ApiResponse.error(
      res,
      "Only active subscriptions can be paused",
      400,
    );

  await Subscription.update(sub.id, { status: "paused" });
  await Subscription.addPauseEntry(sub.id, {
    pausedAt: new Date().toISOString(),
    reason,
    pausedBy: userId,
  });

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, "Subscription paused");
};

// @desc    Resume subscription
// @route   PATCH /api/subscriptions/:id/resume
const resumeSubscription = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (req.user.role === "customer" && sub.customer !== userId) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to resume this subscription",
    );
  }

  if (sub.status !== "paused")
    return ApiResponse.error(res, "Subscription is not paused", 400);

  await Subscription.update(sub.id, { status: "active" });
  await Subscription.updateLastPauseResume(sub.id);

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, "Subscription resumed");
};

// @desc    Cancel subscription
// @route   PATCH /api/subscriptions/:id/cancel
const cancelSubscription = async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.id || req.user._id;
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (req.user.role === "customer" && sub.customer !== userId) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to cancel this subscription",
    );
  }

  if (["cancelled", "expired"].includes(sub.status)) {
    return ApiResponse.error(
      res,
      "Subscription is already cancelled or expired",
      400,
    );
  }

  await Subscription.update(sub.id, {
    status: "cancelled",
    cancelReason: reason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: userId,
  });

  const updated = await Subscription.findById(sub.id);
  return ApiResponse.success(res, updated, "Subscription cancelled");
};

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
const deleteSubscription = async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) return ApiResponse.notFound(res, "Subscription not found");

  // Enforce customer isolation
  if (
    req.user.role === "customer" &&
    sub.customer !== (req.user.id || req.user._id)
  ) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to delete this subscription",
    );
  }

  await Subscription.softDelete(req.params.id);
  return ApiResponse.success(res, null, "Subscription deleted");
};

module.exports = {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  deleteSubscription,
};
