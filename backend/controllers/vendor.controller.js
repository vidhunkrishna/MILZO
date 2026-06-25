const Vendor = require('../models/Vendor');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getVendors = async (req, res) => {
  const { search, status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (search) filter.$or = [
    { vendor_name: { $regex: search } },
    { phone: { $regex: search } },
    { vendor_id: { $regex: search } },
  ];
  const result = await paginate('vendors', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return ApiResponse.notFound(res, 'Vendor not found');
  return ApiResponse.success(res, vendor);
};

const createVendor = async (req, res) => {
  const vendor = await Vendor.create(req.body);
  return ApiResponse.created(res, vendor, 'Vendor created successfully');
};

const updateVendor = async (req, res) => {
  const vendor = await Vendor.update(req.params.id, req.body);
  if (!vendor) return ApiResponse.notFound(res, 'Vendor not found');
  return ApiResponse.success(res, vendor, 'Vendor updated');
};

const deleteVendor = async (req, res) => {
  const vendor = await Vendor.softDelete(req.params.id);
  if (!vendor) return ApiResponse.notFound(res, 'Vendor not found');
  return ApiResponse.success(res, null, 'Vendor deleted');
};

const updateVendorStatus = async (req, res) => {
  const { status } = req.body;
  const vendor = await Vendor.update(req.params.id, { status });
  if (!vendor) return ApiResponse.notFound(res, 'Vendor not found');
  return ApiResponse.success(res, vendor, `Vendor ${status}`);
};

const verifyVendorKYC = async (req, res) => {
  const vendor = await Vendor.verifyKYC(req.params.id, req.user._id);
  if (!vendor) return ApiResponse.notFound(res, 'Vendor not found');
  return ApiResponse.success(res, vendor, 'KYC verified');
};

module.exports = { getVendors, getVendor, createVendor, updateVendor, deleteVendor, updateVendorStatus, verifyVendorKYC };
