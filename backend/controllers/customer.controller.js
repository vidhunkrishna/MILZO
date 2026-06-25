const Customer = require('../models/Customer');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const supabase = require('../config/supabase');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  const { search, status, zone, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (zone) filter.zone = zone;
  if (search) {
    filter.$or = [
      { name: { $regex: search } },
      { phone: { $regex: search } },
      { email: { $regex: search } },
      { customer_id: { $regex: search } },
    ];
  }

  const result = await paginate('customers', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return ApiResponse.notFound(res, 'Customer not found');
  return ApiResponse.success(res, customer);
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);

  await AuditLog.create({
    user: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'CREATE', module: 'Customer', entityType: 'Customer', entityId: customer._id,
    description: `Created customer ${customer.name}`, ipAddress: req.ip,
  });

  return ApiResponse.created(res, customer, 'Customer created successfully');
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  const customer = await Customer.update(req.params.id, req.body);
  if (!customer) return ApiResponse.notFound(res, 'Customer not found');

  await AuditLog.create({
    user: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'UPDATE', module: 'Customer', entityType: 'Customer', entityId: customer._id,
    description: `Updated customer ${customer.name}`, ipAddress: req.ip,
  });

  return ApiResponse.success(res, customer, 'Customer updated successfully');
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  const customer = await Customer.softDelete(req.params.id);
  if (!customer) return ApiResponse.notFound(res, 'Customer not found');
  return ApiResponse.success(res, null, 'Customer deleted successfully');
};

// @desc    Update customer status (block/suspend/activate)
// @route   PATCH /api/customers/:id/status
// @access  Private
const updateCustomerStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'suspended', 'blocked'];
  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, 'Invalid status', 400);
  }

  const customer = await Customer.update(req.params.id, { status });
  if (!customer) return ApiResponse.notFound(res, 'Customer not found');

  await AuditLog.create({
    user: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'STATUS_CHANGE', module: 'Customer', entityType: 'Customer', entityId: customer._id,
    description: `Changed customer ${customer.name} status to ${status}`, ipAddress: req.ip,
  });

  return ApiResponse.success(res, customer, `Customer ${status} successfully`);
};

// @desc    Get customer history (orders + subscriptions)
// @route   GET /api/customers/:id/history
// @access  Private
const getCustomerHistory = async (req, res) => {
  const { limit = 10 } = req.query;

  const [ordersRes, subsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('customer', req.params.id).is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(parseInt(limit)),
    supabase.from('subscriptions').select('*').eq('customer', req.params.id).is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const orders = (ordersRes.data || []).map(r => ({ ...r, _id: r.id }));
  const subscriptions = (subsRes.data || []).map(r => ({ ...r, _id: r.id }));

  return ApiResponse.success(res, { orders, subscriptions });
};

// @desc    Export customers as CSV data
// @route   GET /api/customers/export
// @access  Private
const exportCustomers = async (req, res) => {
  const customers = await Customer.findAllExport();

  const csv = [
    ['Customer ID', 'Name', 'Phone', 'Email', 'City', 'Status', 'Registered', 'Total Orders', 'Total Spent'],
    ...customers.map(c => [
      c.customer_id, c.name, c.phone, c.email || '',
      c.city || '', c.status,
      new Date(c.registration_date).toLocaleDateString(),
      c.total_orders, c.total_spent,
    ]),
  ].map(row => row.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
  return res.send(csv);
};

module.exports = {
  getCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, updateCustomerStatus, getCustomerHistory, exportCustomers,
};
