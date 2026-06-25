const supabase = require('../config/supabase');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data);
};

// @desc    Get revenue chart data (last 30 days)
// @route   GET /api/dashboard/revenue-graph
// @access  Private
const getRevenueGraph = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const { data, error } = await supabase.rpc('get_revenue_graph', { p_days: days });
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

// @desc    Get order trends
// @route   GET /api/dashboard/order-trends
// @access  Private
const getOrderTrends = async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const { data, error } = await supabase.rpc('get_order_trends', { p_days: days });
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

// @desc    Get delivery performance
// @route   GET /api/dashboard/delivery-performance
// @access  Private
const getDeliveryPerformance = async (req, res) => {
  const { data, error } = await supabase.rpc('get_delivery_performance_stats');
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

// @desc    Get subscription trends
// @route   GET /api/dashboard/subscription-trends
// @access  Private
const getSubscriptionTrends = async (req, res) => {
  const { data, error } = await supabase.rpc('get_subscription_trends');
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

module.exports = {
  getDashboardStats,
  getRevenueGraph,
  getOrderTrends,
  getDeliveryPerformance,
  getSubscriptionTrends,
};
