import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  IndianRupee, RefreshCw, CalendarRange, Clock, 
  MapPin, Phone, Mail, User, ShieldAlert, AlertCircle,
  ChevronRight, RefreshCw as Spinner, BellRing, Package,
  Trash2, Bell
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild, fadeIn } from '../lib/animations';

const CustomerDashboard = () => {
  // Query to fetch customer dashboard data in a single request
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/customer');
      return response.data.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ShieldAlert className="h-10 w-10" />
        </motion.div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
          Failed to load dashboard
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          {error?.message || 'Something went wrong while retrieving your dashboard statistics.'}
        </p>
        <motion.button
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/10 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Spinner className="h-4 w-4 animate-spin-slow" />
          Try Again
        </motion.button>
      </div>
    );
  }

  const {
    profile,
    walletBalance,
    todayDeliveries = [],
    upcomingDeliveries = [],
    activeSubscriptions = [],
    monthlySpending = 0,
    recentOrders = [],
    recentNotifications = []
  } = dashboardData || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide font-display">
            Welcome back, {profile?.name || 'Customer'}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-lg font-medium">
            Manage your daily milk deliveries, wallets, and subscriptions on the go.
          </p>
        </div>
        
        {/* Floating background graphics */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white blur-3xl"></div>
          <div className="absolute right-10 top-0 w-32 h-32 rounded-full bg-indigo-300 blur-2xl"></div>
        </div>
      </motion.div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Wallet Balance"
          value={`₹${(walletBalance || 0).toFixed(2)}`}
          icon={IndianRupee}
          color="emerald"
          index={0}
        />
        <StatCard
          title="Spent This Month"
          value={`₹${(monthlySpending || 0).toFixed(2)}`}
          icon={Clock}
          color="blue"
          index={1}
        />
        <StatCard
          title="Active Subscriptions"
          value={String(activeSubscriptions.length)}
          icon={RefreshCw}
          color="indigo"
          index={2}
        />
        <StatCard
          title="Today's Deliveries"
          value={todayDeliveries.length > 0 ? String(todayDeliveries.length) : 'None'}
          icon={CalendarRange}
          color="amber"
          index={3}
        />
      </div>

      {/* Core sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Delivery Panel */}
          <motion.div
            className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 md:p-6 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-amber-500" />
              Today's Delivery Status
            </h3>

            {todayDeliveries.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-dark-hover/10 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
                <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No dispatches scheduled for today</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Subscriptions are paused on Sundays or based on schedule</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayDeliveries.map((delivery) => (
                  <div key={delivery._id} className="p-4 rounded-xl border border-slate-200/80 dark:border-dark-border bg-slate-50/40 dark:bg-dark-hover/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                          {delivery.order_id}
                        </span>
                        <StatusBadge status={delivery.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Slot: <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{delivery.delivery_slot}</span>
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-2">
                        {(delivery.order_items || []).map((item, i) => (
                          <span key={i} className="inline-flex items-center text-xxs font-medium px-2 py-0.5 bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded text-slate-600 dark:text-slate-300">
                            {item.products?.name} x {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block">Total cost</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display block">
                        ₹{(delivery.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Orders List */}
          <motion.div
            className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Recent Orders
              </h3>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 dark:bg-dark-hover/10 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
                <Package className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No orders placed yet</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Explore our fresh dairy catalog and place your first order!</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 md:-mx-6">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-hover/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-dark-border">
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Order ID</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Slot</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-slate-100 dark:border-dark-border/40 hover:bg-slate-50/50 dark:hover:bg-dark-hover/10 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300">{order.order_id}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {format(new Date(order.delivery_date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-5 py-3.5 capitalize text-slate-600 dark:text-slate-400">{order.delivery_slot}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">₹{(order.total || 0).toFixed(2)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column (1/3 width on desktop) */}
        <div className="space-y-6">
          
          {/* Profile & Addresses Card */}
          <motion.div
            className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 md:p-6 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-indigo-500" />
              Delivery Preferences
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[10px]">Primary Address</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {profile?.address?.line1}
                    {profile?.address?.line2 ? `, ${profile?.address?.line2}` : ''}
                    {`, ${profile?.address?.city}, ${profile?.address?.state} - ${profile?.address?.pincode}`}
                  </p>
                  {profile?.address?.landmark && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Landmark: <span className="font-semibold">{profile.address.landmark}</span>
                    </p>
                  )}
                  {profile?.address?.zoneName && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Zone: <span className="font-semibold text-primary-500">{profile.address.zoneName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 dark:border-dark-border pt-3">
                <Clock className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[10px]">Preferred delivery slot</span>
                  <p className="text-slate-700 dark:text-slate-300 font-bold capitalize text-sm">
                    {profile?.deliverySlotPref || 'Morning'}
                  </p>
                </div>
              </div>

              {profile?.milkType && (
                <div className="flex gap-3 border-t border-slate-100 dark:border-dark-border pt-3">
                  <Package className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[10px]">Milk Type / Quantity</span>
                    <p className="text-slate-700 dark:text-slate-300 font-bold capitalize">
                      {profile.milkType.replace(/_/g, ' ')} ({profile.quantity || 1} unit)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Notifications Widget */}
          <motion.div
            className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 md:p-6 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-indigo-500" />
              Notifications
            </h3>

            {recentNotifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xxs text-slate-400 dark:text-slate-500">All caught up! No new notifications.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentNotifications.map((notif) => (
                  <div key={notif._id} className="flex gap-2.5 pb-3.5 last:pb-0 border-b last:border-0 border-slate-100 dark:border-dark-border/40">
                    <div className="h-2 w-2 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-4">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block pt-1">
                        {format(new Date(notif.created_at || notif.createdAt), 'dd MMM hh:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component matching layout structure exactly to prevent Layout Shift
const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-32 md:h-40 bg-slate-200 dark:bg-dark-hover rounded-3xl"></div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-2xl"></div>
        ))}
      </div>

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-44 bg-slate-200 dark:bg-dark-hover rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-dark-hover rounded-2xl"></div>
        </div>
        <div className="space-y-6">
          <div className="h-56 bg-slate-200 dark:bg-dark-hover rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-dark-hover rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
