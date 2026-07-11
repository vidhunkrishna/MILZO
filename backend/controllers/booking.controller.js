const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

// @desc    Get all bookings
// @route   GET /api/bookings
const getBookings = async (req, res) => {
  const { status, customer, date, deliverySlot, page = 1, limit = 10 } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (deliverySlot) filter.delivery_slot = deliverySlot;

  // Enforce customer isolation
  if (req.user.role === 'customer') {
    filter.customer = req.user.id || req.user._id;
  } else if (customer) {
    filter.customer = customer;
  }

  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.delivery_date = { $gte: d.toISOString().split('T')[0], $lt: next.toISOString().split('T')[0] };
  }
  const result = await paginate('bookings', filter, {
    page,
    limit,
    sortBy: 'delivery_date',
    sortOrder: 'desc',
    select: '*, customer:customers(name), product:products(name)'
  });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
const getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && booking.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to view this booking');
  }

  return ApiResponse.success(res, booking);
};

// @desc    Create booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const isCustomer = req.user.role === 'customer';

  // Override customer ID for safety if customer role
  const bookingCustomer = isCustomer ? userId : req.body.customer;
  req.body.customer = bookingCustomer;

  const { product: productId, quantity, deliverySlot, deliveryDate } = req.body;

  // Validations
  if (!productId || !quantity || !deliverySlot || !deliveryDate) {
    return ApiResponse.error(res, 'Missing required fields for booking', 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return ApiResponse.error(res, 'Invalid quantity', 400);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (deliveryDate < todayStr) {
    return ApiResponse.error(res, 'Delivery date cannot be in the past', 400);
  }

  try {
    // 1. Fetch product to verify price & stock
    const product = await Product.findById(productId);
    if (!product) return ApiResponse.notFound(res, 'Product not found');
    if (!product.is_active) return ApiResponse.error(res, 'Product is currently inactive', 400);

    // 2. Fetch customer to resolve address
    const customer = await Customer.findById(bookingCustomer);
    if (!customer) return ApiResponse.notFound(res, 'Customer profile not found');

    // Populate pricing
    req.body.price = product.price;
    req.body.total = product.price * quantity;

    // Populate address
    req.body.deliveryAddress = {
      line1: customer.address_line1,
      line2: customer.address_line2,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      landmark: customer.landmark,
    };

    req.body.createdBy = userId;

    const booking = await Booking.create(req.body);
    return ApiResponse.created(res, booking, 'Booking created successfully');
  } catch (err) {
    logger.error(`Error creating booking: ${err.message}`);
    return ApiResponse.error(res, `Failed to create booking: ${err.message}`, 500);
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
const updateBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && booking.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to update this booking');
  }

  const updated = await Booking.update(req.params.id, req.body);
  return ApiResponse.success(res, updated, 'Booking updated');
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.id || req.user._id;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && booking.customer !== userId) {
    return ApiResponse.forbidden(res, 'You are not authorized to cancel this booking');
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return ApiResponse.error(res, 'Booking cannot be cancelled', 400);
  }

  const updated = await Booking.update(booking.id, { status: 'cancelled', cancelReason: reason });
  return ApiResponse.success(res, updated, 'Booking cancelled');
};

// @desc    Convert booking to order
// @route   POST /api/bookings/:id/convert
const convertToOrder = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && booking.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to convert this booking');
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return ApiResponse.error(res, 'Booking is already converted or cancelled', 400);
  }

  const order = await Order.create({
    customer: booking.customer,
    items: [{ product: booking.product, quantity: booking.quantity, price: booking.price }],
    deliverySlot: booking.delivery_slot,
    deliveryDate: booking.delivery_date,
    deliveryAddress: booking.delivery_address,
    pricing: { subtotal: booking.total, total: booking.total },
    status: 'placed',
    timeline: [{ status: 'placed', timestamp: new Date().toISOString(), updatedBy: req.user.id || req.user._id }],
  });

  await Booking.update(booking.id, { status: 'converted', convertedToOrder: order.id });

  return ApiResponse.success(res, { booking: { ...booking, status: 'converted' }, order }, 'Booking converted to order');
};

// @desc    Get bookings calendar
// @route   GET /api/bookings/calendar
const getBookingCalendar = async (req, res) => {
  const { month, year } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const startDate = new Date(y, m - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  let query = supabase.from('bookings')
    .select('id, booking_id, delivery_date, delivery_slot, status, customer, product, quantity')
    .gte('delivery_date', startDate)
    .lte('delivery_date', endDate)
    .is('deleted_at', null);

  // Enforce customer isolation
  if (req.user.role === 'customer') {
    query = query.eq('customer', req.user.id || req.user._id);
  }

  const { data, error } = await query;
  if (error) {
    logger.error(`Error loading bookings calendar: ${error.message}`);
    return ApiResponse.error(res, `Failed to load calendar: ${error.message}`, 500);
  }

  const bookings = (data || []).map(r => ({ ...r, _id: r.id }));
  return ApiResponse.success(res, bookings);
};

// @desc    Delete booking (soft)
// @route   DELETE /api/bookings/:id
const deleteBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');

  // Enforce customer isolation
  if (req.user.role === 'customer' && booking.customer !== (req.user.id || req.user._id)) {
    return ApiResponse.forbidden(res, 'You are not authorized to delete this booking');
  }

  await Booking.softDelete(req.params.id);
  return ApiResponse.success(res, null, 'Booking deleted');
};

module.exports = { 
  getBookings, 
  getBooking, 
  createBooking, 
  updateBooking, 
  cancelBooking, 
  convertToOrder, 
  getBookingCalendar, 
  deleteBooking 
};
