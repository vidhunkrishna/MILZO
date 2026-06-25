const Order = require('../models/Order');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  const { status, deliverySlot, date, customerId, vendorId, zone, search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (deliverySlot) filter.delivery_slot = deliverySlot;
  if (zone) filter.zone = zone;
  if (customerId) filter.customer = customerId;
  if (vendorId) filter.vendor = vendorId;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.delivery_date = { $gte: d.toISOString().split('T')[0], $lt: next.toISOString().split('T')[0] };
  }
  if (search) filter.$or = [{ order_id: { $regex: search } }];

  const result = await paginate('orders', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  return ApiResponse.success(res, order);
};

// @desc    Create order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  const order = await Order.create({
    ...req.body,
    timeline: [{ status: 'placed', timestamp: new Date().toISOString(), updatedBy: req.user._id }],
  });

  // Increment customer stats
  await Customer.incrementOrders(req.body.customer, req.body.pricing?.total || 0);

  return ApiResponse.created(res, order, 'Order created successfully');
};

// @desc    Update order
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
  const order = await Order.update(req.params.id, req.body);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  return ApiResponse.success(res, order, 'Order updated');
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['placed', 'confirmed', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

  if (!validStatuses.includes(status)) return ApiResponse.error(res, 'Invalid status', 400);

  const order = await Order.update(req.params.id, { status });
  if (!order) return ApiResponse.notFound(res, 'Order not found');

  // Add timeline entry
  await Order.addTimelineEntry(order.id, { status, timestamp: new Date().toISOString(), note, updatedBy: req.user._id });

  await AuditLog.create({
    user: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'STATUS_CHANGE', module: 'Order', entityType: 'Order', entityId: order.id,
    description: `Order ${order.order_id} status changed to ${status}`, ipAddress: req.ip,
  });

  return ApiResponse.success(res, order, `Order status updated to ${status}`);
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (['delivered', 'cancelled'].includes(order.status)) {
    return ApiResponse.error(res, 'Cannot cancel this order', 400);
  }

  await Order.update(order.id, { status: 'cancelled', cancelReason: reason });
  await Order.addTimelineEntry(order.id, { status: 'cancelled', timestamp: new Date().toISOString(), note: reason, updatedBy: req.user._id });

  return ApiResponse.success(res, { ...order, status: 'cancelled' }, 'Order cancelled');
};

// @desc    Delete order (soft)
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  const order = await Order.softDelete(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  return ApiResponse.success(res, null, 'Order deleted');
};

// @desc    Get order timeline
// @route   GET /api/orders/:id/timeline
const getOrderTimeline = async (req, res) => {
  const order = await Order.getTimeline(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  return ApiResponse.success(res, order);
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, updateOrderStatus, cancelOrder, deleteOrder, getOrderTimeline };
