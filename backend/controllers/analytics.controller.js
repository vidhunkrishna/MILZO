const supabase = require('../config/supabase');
const DeliveryAgent = require('../models/DeliveryAgent');
const Vendor = require('../models/Vendor');
const ApiResponse = require('../utils/apiResponse');

// @desc    Revenue reports
// @route   GET /api/analytics/revenue
const getRevenueReport = async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query;
  const { data, error } = await supabase.rpc('get_revenue_report', {
    p_period: period,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data || []);
};

// @desc    Order analytics
// @route   GET /api/analytics/orders
const getOrderAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { data, error } = await supabase.rpc('get_order_analytics', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data);
};

// @desc    Subscription analytics
// @route   GET /api/analytics/subscriptions
const getSubscriptionAnalytics = async (req, res) => {
  const { data, error } = await supabase.rpc('get_subscription_analytics');
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data);
};

// @desc    Delivery performance report
// @route   GET /api/analytics/delivery
const getDeliveryPerformance = async (req, res) => {
  const agentPerformance = await DeliveryAgent.findTopPerformers(20);

  const { data: deliveryStats, error } = await supabase.rpc('get_delivery_performance_stats');
  if (error) throw new Error(error.message);

  return ApiResponse.success(res, { agentPerformance, deliveryStats: deliveryStats || [] });
};

// @desc    Vendor performance report
// @route   GET /api/analytics/vendors
const getVendorReport = async (req, res) => {
  const vendors = await Vendor.findAllForReport();
  return ApiResponse.success(res, vendors);
};

// @desc    Customer analytics
// @route   GET /api/analytics/customers
const getCustomerAnalytics = async (req, res) => {
  const { data, error } = await supabase.rpc('get_customer_analytics');
  if (error) throw new Error(error.message);
  return ApiResponse.success(res, data);
};

module.exports = { getRevenueReport, getOrderAnalytics, getSubscriptionAnalytics, getDeliveryPerformance, getVendorReport, getCustomerAnalytics };
