const supabase = require('../config/supabase');
const DeliveryAgent = require('../models/DeliveryAgent');
const Vendor = require('../models/Vendor');
const ApiResponse = require('../utils/apiResponse');

// @desc    Revenue reports
// @route   GET /api/analytics/revenue
const getRevenueReport = async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query;
  
  try {
    const { data, error } = await supabase.rpc('get_revenue_report', {
      p_period: period,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });
    if (!error && data) {
      return ApiResponse.success(res, data);
    }
  } catch (rpcErr) {
    // Fallback to JS
  }

  try {
    // JS Query Fallback - include captured, refunded, and partially refunded statuses
    let query = supabase
      .from('payments')
      .select('*')
      .in('status', ['captured', 'refunded', 'partially_refunded'])
      .is('deleted_at', null);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: payments, error } = await query;
    if (error) throw new Error(error.message);

    const groups = {};
    (payments || []).forEach(p => {
      const d = new Date(p.created_at);
      let key;
      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      } else if (period === 'yearly') {
        key = String(d.getFullYear());
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[key]) {
        groups[key] = { _id: key, revenue: 0, count: 0, refunds: 0 };
      }
      
      const refundAmt = Number(p.refund?.amount || 0);
      if (p.status === 'captured') {
        groups[key].revenue += Number(p.amount || 0);
      } else if (p.status === 'partially_refunded') {
        groups[key].revenue += (Number(p.amount || 0) - refundAmt);
        groups[key].refunds += refundAmt;
      } else if (p.status === 'refunded') {
        groups[key].refunds += Number(p.amount || 0);
      }
      
      groups[key].count += 1;
    });

    const sortedResult = Object.values(groups).sort((a, b) => a._id.localeCompare(b._id));
    return ApiResponse.success(res, sortedResult);
  } catch (err) {
    return ApiResponse.success(res, []);
  }
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

  let deliveryStats = [];
  try {
    const { data, error } = await supabase.rpc('get_delivery_performance_stats');
    if (!error && data) {
      deliveryStats = data;
    } else {
      throw new Error(error?.message || 'RPC failed');
    }
  } catch (rpcErr) {
    // Fallback to JS
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: orders } = await supabase
        .from('orders')
        .select('status, delivery_date')
        .gte('delivery_date', sevenDaysAgoStr)
        .in('status', ['delivered', 'cancelled', 'failed'])
        .is('deleted_at', null);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const groups = {};
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = weekdays[d.getDay()];
        groups[dateStr] = { day: dayName, completed: 0, delayed: 0, missed: 0, _id: dateStr };
      }

      (orders || []).forEach(o => {
        const dateStr = o.delivery_date;
        if (groups[dateStr]) {
          if (o.status === 'delivered') {
            groups[dateStr].completed += 1;
          } else if (o.status === 'failed') {
            groups[dateStr].missed += 1;
          } else if (o.status === 'cancelled') {
            groups[dateStr].delayed += 1;
          }
        }
      });

      deliveryStats = Object.values(groups);
    } catch (e) {
      deliveryStats = [];
    }
  }

  return ApiResponse.success(res, { agentPerformance, deliveryStats });
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
