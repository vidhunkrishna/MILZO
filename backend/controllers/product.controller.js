const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getProducts = async (req, res) => {
  const { search, category, isActive, vendor, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (category) filter.category = category;
  if (isActive !== undefined) filter.is_active = isActive === 'true';
  if (vendor) filter.vendor = vendor;
  if (search) filter.$or = [
    { name: { $regex: search } },
    { description: { $regex: search } },
  ];
  const result = await paginate('products', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return ApiResponse.notFound(res, 'Product not found');
  return ApiResponse.success(res, product);
};

const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  return ApiResponse.created(res, product, 'Product created successfully');
};

const updateProduct = async (req, res) => {
  const product = await Product.update(req.params.id, req.body);
  if (!product) return ApiResponse.notFound(res, 'Product not found');
  return ApiResponse.success(res, product, 'Product updated');
};

const deleteProduct = async (req, res) => {
  const product = await Product.softDelete(req.params.id);
  if (!product) return ApiResponse.notFound(res, 'Product not found');
  return ApiResponse.success(res, null, 'Product deleted');
};

const updateStock = async (req, res) => {
  const { available, reserved } = req.body;
  const product = await Product.updateStock(req.params.id, { available, reserved });
  if (!product) return ApiResponse.notFound(res, 'Product not found');
  return ApiResponse.success(res, product, 'Stock updated');
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock };
