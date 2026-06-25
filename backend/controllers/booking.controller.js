const Booking = require('../models/Booking');
const Order = require('../models/Order');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const supabase = require('../config/supabase');

const getBookings = async (req, res) => {
  const { status, customer, date, deliverySlot, page = 1, limit = 10 } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (customer) filter.customer = customer;
  if (deliverySlot) filter.delivery_slot = deliverySlot;
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

const getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');
  return ApiResponse.success(res, booking);
};

const createBooking = async (req, res) => {
  const booking = await Booking.create({ ...req.body, createdBy: req.user._id });
  return ApiResponse.created(res, booking, 'Booking created');
};

const updateBooking = async (req, res) => {
  const booking = await Booking.update(req.params.id, req.body);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');
  return ApiResponse.success(res, booking, 'Booking updated');
};

const cancelBooking = async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found or cannot be cancelled');
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return ApiResponse.error(res, 'Booking cannot be cancelled', 400);
  }
  const updated = await Booking.update(booking.id, { status: 'cancelled', cancelReason: reason });
  return ApiResponse.success(res, updated, 'Booking cancelled');
};

const convertToOrder = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || !['pending', 'confirmed'].includes(booking.status)) {
    return ApiResponse.notFound(res, 'Booking not found');
  }

  const order = await Order.create({
    customer: booking.customer,
    items: [{ product: booking.product, quantity: booking.quantity, price: booking.price }],
    deliverySlot: booking.delivery_slot,
    deliveryDate: booking.delivery_date,
    deliveryAddress: booking.delivery_address,
    pricing: { subtotal: booking.total, total: booking.total },
    status: 'placed',
    timeline: [{ status: 'placed', timestamp: new Date().toISOString(), updatedBy: req.user._id }],
  });

  await Booking.update(booking.id, { status: 'converted', convertedToOrder: order.id });

  return ApiResponse.success(res, { booking: { ...booking, status: 'converted' }, order }, 'Booking converted to order');
};

const getBookingCalendar = async (req, res) => {
  const { month, year } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const startDate = new Date(y, m - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  const { data, error } = await supabase.from('bookings')
    .select('id, booking_id, delivery_date, delivery_slot, status, customer, product, quantity')
    .gte('delivery_date', startDate)
    .lte('delivery_date', endDate)
    .is('deleted_at', null);

  const bookings = (data || []).map(r => ({ ...r, _id: r.id }));
  return ApiResponse.success(res, bookings);
};

const deleteBooking = async (req, res) => {
  const booking = await Booking.softDelete(req.params.id);
  if (!booking) return ApiResponse.notFound(res, 'Booking not found');
  return ApiResponse.success(res, null, 'Booking deleted');
};

module.exports = { getBookings, getBooking, createBooking, updateBooking, cancelBooking, convertToOrder, getBookingCalendar, deleteBooking };
