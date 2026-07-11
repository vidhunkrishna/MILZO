const supabase = require('../config/supabase');
const ApiResponse = require('../utils/apiResponse');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartStr = todayStart.toISOString().split('T')[0];
    
    const todayEnd = new Date();
    todayEnd.setHours(24, 0, 0, 0);
    const todayEndStr = todayEnd.toISOString().split('T')[0];

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthStartStr = monthStart.toISOString();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      customersCount,
      subsCount,
      morningOrders,
      eveningOrders,
      pendingDeliveries,
      deliveredOrders,
      paymentsToday,
      paymentsMonth,
      vendorsCount,
      agentsCount,
      complaintsCount,
      currentWeekCustomers,
      prevWeekCustomers,
      currentWeekSubs,
      prevWeekSubs,
      currentWeekRevRes,
      prevWeekRevRes,
      recentOrdersData,
      orderItems
    ] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('delivery_slot', 'morning').eq('delivery_date', todayStartStr).is('deleted_at', null),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('delivery_slot', 'evening').eq('delivery_date', todayStartStr).is('deleted_at', null),
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['placed', 'confirmed', 'packed', 'assigned', 'out_for_delivery']).is('deleted_at', null),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').eq('delivery_date', todayStartStr).is('deleted_at', null),
      supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', todayStart.toISOString()).lt('created_at', todayEnd.toISOString()).is('deleted_at', null),
      supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', monthStartStr).lt('created_at', todayEnd.toISOString()).is('deleted_at', null),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('delivery_agents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('type', 'complaint').in('status', ['open', 'in_progress']),
      // growth stats
      supabase.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo.toISOString()).lt('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo.toISOString()).lt('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', fourteenDaysAgo.toISOString()).lt('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      // recent orders
      supabase.from('orders').select('id, customer:customers(name), total, status, order_items(quantity, products(name))').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      // popular products
      supabase.from('order_items').select('quantity, products(name)')
    ]);

    const revToday = (paymentsToday.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const revMonth = (paymentsMonth.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

    let customerTrend = 'Not enough data';
    if (prevWeekCustomers.count > 0) {
      const growth = ((customersCount.count - prevWeekCustomers.count) / prevWeekCustomers.count) * 100;
      customerTrend = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }

    let subscriptionTrend = 'Not enough data';
    if (prevWeekSubs.count > 0) {
      const growth = ((subsCount.count - prevWeekSubs.count) / prevWeekSubs.count) * 100;
      subscriptionTrend = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }

    const currentWeekRev = (currentWeekRevRes.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const prevWeekRev = (prevWeekRevRes.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    let revenueTrend = 'Not enough data';
    if (prevWeekRev > 0) {
      const growth = ((currentWeekRev - prevWeekRev) / prevWeekRev) * 100;
      revenueTrend = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }

    const totalDeliveriesToday = (deliveredOrders.count || 0) + (pendingDeliveries.count || 0);
    const successRateToday = totalDeliveriesToday > 0 
      ? ((deliveredOrders.count / totalDeliveriesToday) * 100).toFixed(1) + '%' 
      : '0.0%';

    const formattedRecentOrders = (recentOrdersData.data || []).map(o => {
      const productName = o.order_items?.[0]?.products?.name || 'Milk Products';
      const quantity = o.order_items?.[0]?.quantity || 1;
      return {
        _id: o.id,
        customerName: o.customer?.name || 'Walk-in Customer',
        product: productName,
        quantity,
        amount: `₹${Number(o.total || 0).toLocaleString()}`,
        status: o.status,
      };
    });

    const productCounts = {};
    (orderItems.data || []).forEach(item => {
      const name = item.products?.name;
      if (name) {
        productCounts[name] = (productCounts[name] || 0) + Number(item.quantity || 1);
      }
    });
    const popularProducts = Object.entries(productCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    return ApiResponse.success(res, {
      totalCustomers: customersCount.count || 0,
      activeSubscriptions: subsCount.count || 0,
      revenueToday: revToday,
      revenueThisMonth: revMonth,
      deliveredOrders: deliveredOrders.count || 0,
      pendingDeliveries: pendingDeliveries.count || 0,
      customerTrend,
      subscriptionTrend,
      revenueTrend,
      successRateToday,
      recentOrders: formattedRecentOrders,
      popularProducts
    });
  } catch (err) {
    logger.error(`Error calculating dashboard statistics: ${err.message}`);
    return ApiResponse.error(res, `Failed to load dashboard: ${err.message}`, 500);
  }
};

// @desc    Get revenue chart data (last 30 days)
// @route   GET /api/dashboard/revenue-graph
// @access  Private
const getRevenueGraph = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const { data: payments } = await supabase
      .from('payments')
      .select('amount,created_at')
      .eq('status', 'captured')
      .gte('created_at', cutoffDate.toISOString())
      .is('deleted_at', null);

    const groups = {};
    (payments || []).forEach(p => {
      const key = new Date(p.created_at).toISOString().split('T')[0];
      if (!groups[key]) {
        groups[key] = { _id: key, revenue: 0, count: 0 };
      }
      groups[key].revenue += Number(p.amount || 0);
      groups[key].count += 1;
    });

    const chartData = Object.values(groups).sort((a, b) => a._id.localeCompare(b._id));
    return ApiResponse.success(res, chartData);
  } catch (err) {
    return ApiResponse.success(res, []);
  }
};

// @desc    Get order trends
// @route   GET /api/dashboard/order-trends
// @access  Private
const getOrderTrends = async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const { data: orders } = await supabase
      .from('orders')
      .select('delivery_date,delivery_slot')
      .gte('created_at', cutoffDate.toISOString())
      .is('deleted_at', null);

    const groups = {};
    (orders || []).forEach(o => {
      if (!o.delivery_date) return;
      const dateStr = o.delivery_date;
      const slot = o.delivery_slot || 'morning';
      const key = `${dateStr}_${slot}`;
      if (!groups[key]) {
        groups[key] = {
          _id: { date: dateStr, slot },
          count: 0
        };
      }
      groups[key].count += 1;
    });

    const chartData = Object.values(groups).sort((a, b) => a._id.date.localeCompare(b._id.date));
    return ApiResponse.success(res, chartData);
  } catch (err) {
    return ApiResponse.success(res, []);
  }
};

// @desc    Get delivery performance
// @route   GET /api/dashboard/delivery-performance
// @access  Private
const getDeliveryPerformance = async (req, res) => {
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
      groups[dateStr] = { day: dayName, completed: 0, delayed: 0, missed: 0 };
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

    const chartData = Object.values(groups);
    return ApiResponse.success(res, chartData);
  } catch (err) {
    return ApiResponse.success(res, []);
  }
};

// @desc    Get subscription trends
// @route   GET /api/dashboard/subscription-trends
// @access  Private
const getSubscriptionTrends = async (req, res) => {
  try {
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan_type,status')
      .is('deleted_at', null);

    const groups = {};
    (subscriptions || []).forEach(s => {
      const key = s.plan_type || 'daily';
      if (!groups[key]) {
        groups[key] = { _id: key, count: 0, active: 0 };
      }
      groups[key].count += 1;
      if (s.status === 'active') {
        groups[key].active += 1;
      }
    });

    const chartData = Object.values(groups);
    return ApiResponse.success(res, chartData);
  } catch (err) {
    return ApiResponse.success(res, []);
  }
};

// @desc    Get customer dashboard statistics
// @route   GET /api/dashboard/customer
// @access  Private (Customer)
const getCustomerDashboardStats = async (req, res) => {
  const userId = req.user.id || req.user._id;

  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  try {
    const [
      customerRes,
      todayOrdersRes,
      upcomingOrdersRes,
      activeSubsRes,
      recentOrdersRes,
      monthlyOrdersRes,
      notificationsRes
    ] = await Promise.all([
      supabase.from('customers').select('*, routes(name)').eq('id', userId).is('deleted_at', null).maybeSingle(),
      supabase.from('orders').select('*, order_items(*, products(*))').eq('customer', userId).eq('delivery_date', todayStr).is('deleted_at', null),
      supabase.from('orders').select('*, order_items(*, products(*))').eq('customer', userId).gt('delivery_date', todayStr).is('deleted_at', null).order('delivery_date', { ascending: true }).limit(5),
      supabase.from('subscriptions').select('*, products(*)').eq('customer', userId).eq('status', 'active').is('deleted_at', null),
      supabase.from('orders').select('*, order_items(*, products(*))').eq('customer', userId).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('total').eq('customer', userId).gte('delivery_date', startOfMonth).not('status', 'in', '("cancelled","failed")').is('deleted_at', null),
      Notification.findForUser(userId, { limit: 5 })
    ]);

    if (customerRes.error) throw new Error(customerRes.error.message);
    if (todayOrdersRes.error) throw new Error(todayOrdersRes.error.message);
    if (upcomingOrdersRes.error) throw new Error(upcomingOrdersRes.error.message);
    if (activeSubsRes.error) throw new Error(activeSubsRes.error.message);
    if (recentOrdersRes.error) throw new Error(recentOrdersRes.error.message);
    if (monthlyOrdersRes.error) throw new Error(monthlyOrdersRes.error.message);

    const customerProfile = customerRes.data;
    if (!customerProfile) {
      return ApiResponse.notFound(res, 'Customer profile details not found');
    }

    const monthlySpending = (monthlyOrdersRes.data || []).reduce((acc, order) => acc + Number(order.total || 0), 0);

    return ApiResponse.success(res, {
      profile: {
        id: customerProfile.id,
        _id: customerProfile.id,
        customerId: customerProfile.customer_id,
        name: customerProfile.name,
        email: customerProfile.email,
        phone: customerProfile.phone,
        address: {
          line1: customerProfile.address_line1,
          line2: customerProfile.address_line2,
          city: customerProfile.city,
          state: customerProfile.state,
          pincode: customerProfile.pincode,
          landmark: customerProfile.landmark,
          zoneName: customerProfile.routes?.name
        },
        deliverySlotPref: customerProfile.delivery_slot_pref,
        milkType: customerProfile.milk_type,
        quantity: customerProfile.quantity,
        status: customerProfile.status,
      },
      walletBalance: customerProfile.wallet_balance || 0,
      todayDeliveries: (todayOrdersRes.data || []).map(o => ({ ...o, _id: o.id })),
      upcomingDeliveries: (upcomingOrdersRes.data || []).map(o => ({ ...o, _id: o.id })),
      activeSubscriptions: (activeSubsRes.data || []).map(s => ({ ...s, _id: s.id })),
      monthlySpending,
      recentOrders: (recentOrdersRes.data || []).map(o => ({ ...o, _id: o.id })),
      recentNotifications: notificationsRes.data || []
    });
  } catch (err) {
    logger.error(`Error loading customer dashboard stats: ${err.message}`);
    return ApiResponse.error(res, `Failed to load dashboard: ${err.message}`, 500);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueGraph,
  getOrderTrends,
  getDeliveryPerformance,
  getSubscriptionTrends,
  getCustomerDashboardStats,
};
