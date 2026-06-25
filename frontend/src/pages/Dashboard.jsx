import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, RefreshCw, IndianRupee, Truck, 
  TrendingUp, AlertCircle, ShoppingBag, ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import { staggerContainer, staggerChild, smoothSpring } from '../lib/animations';

// High-fidelity fallback/mock data for dashboard
const mockStats = {
  totalCustomers: '1,248',
  activeSubscriptions: '842',
  dailyRevenue: '₹48,250',
  completedDeliveries: '789/820',
  revenueTrend: '+14.2%',
  subscriptionTrend: '+8.4%',
  revenueTrendDesc: 'vs last week',
  subscriptionTrendDesc: 'vs last month',
  revenueChartData: [
    { name: 'Mon', revenue: 42000 },
    { name: 'Tue', revenue: 45000 },
    { name: 'Wed', revenue: 48250 },
    { name: 'Thu', revenue: 46000 },
    { name: 'Fri', revenue: 49000 },
    { name: 'Sat', revenue: 52000 },
    { name: 'Sun', revenue: 55000 },
  ],
  subscriptionChartData: [
    { name: 'Jan', Active: 500, Paused: 40 },
    { name: 'Feb', Active: 580, Paused: 45 },
    { name: 'Mar', Active: 640, Paused: 52 },
    { name: 'Apr', Active: 710, Paused: 48 },
    { name: 'May', Active: 780, Paused: 60 },
    { name: 'Jun', Active: 842, Paused: 68 },
  ],
  productData: [
    { name: 'Full Cream Milk', value: 45 },
    { name: 'Cow Milk', value: 30 },
    { name: 'Buffalo Milk', value: 15 },
    { name: 'Organic Butter', value: 10 },
  ],
  recentOrders: [
    { _id: 'ORD001', customerName: 'Aarav Mehta', product: 'Cow Milk (1L)', quantity: 2, amount: '₹140', status: 'Delivered' },
    { _id: 'ORD002', customerName: 'Neha Sharma', product: 'Full Cream (1L)', quantity: 1, amount: '₹76', status: 'Pending' },
    { _id: 'ORD003', customerName: 'Rohan Gupta', product: 'Buffalo Milk (1L)', quantity: 3, amount: '₹240', status: 'Delivered' },
    { _id: 'ORD004', customerName: 'Priya Patel', product: 'Organic Ghee (500g)', quantity: 1, amount: '₹450', status: 'Cancelled' },
    { _id: 'ORD005', customerName: 'Anil Kumar', product: 'Cow Milk (1L)', quantity: 2, amount: '₹140', status: 'In Progress' },
  ]
};

const COLORS = ['#1a73e8', '#4f46e5', '#0d9488', '#f59e0b'];

const Dashboard = () => {
  // Query to fetch dashboard stats
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    },
    retry: false,
  });

  const stats = dashboardData
    ? {
        ...mockStats,
        totalCustomers: dashboardData.totalCustomers !== undefined ? String(dashboardData.totalCustomers) : mockStats.totalCustomers,
        activeSubscriptions: dashboardData.activeSubscriptions !== undefined ? String(dashboardData.activeSubscriptions) : mockStats.activeSubscriptions,
        dailyRevenue: dashboardData.revenueToday !== undefined ? `₹${dashboardData.revenueToday}` : mockStats.dailyRevenue,
        completedDeliveries: (dashboardData.deliveredOrders !== undefined && dashboardData.pendingDeliveries !== undefined)
          ? `${dashboardData.deliveredOrders}/${dashboardData.deliveredOrders + dashboardData.pendingDeliveries}`
          : mockStats.completedDeliveries,
      }
    : mockStats;

  return (
    <div className="space-y-8">
      {/* Title */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights and operational overview of MILZO milk delivery system.
          </p>
        </div>
        
        <motion.div
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-sm text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...smoothSpring }}
        >
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span>All Services Operational</span>
        </motion.div>
      </motion.div>

      {/* Stats Grid — staggered entrance via StatCard's index prop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          trend={stats.subscriptionTrend}
          trendType="up"
          description={stats.subscriptionTrendDesc}
          color="blue"
          index={0}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={RefreshCw}
          trend={stats.subscriptionTrend}
          trendType="up"
          description={stats.subscriptionTrendDesc}
          color="indigo"
          index={1}
        />
        <StatCard
          title="Daily Revenue"
          value={stats.dailyRevenue}
          icon={IndianRupee}
          trend={stats.revenueTrend}
          trendType="up"
          description={stats.revenueTrendDesc}
          color="emerald"
          index={2}
        />
        <StatCard
          title="Completed Deliveries"
          value={stats.completedDeliveries}
          icon={Truck}
          trend="96.2%"
          trendType="up"
          description="success rate today"
          color="amber"
          index={3}
        />
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Graph */}
        <motion.div
          className="lg:col-span-2 card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Revenue Analytics</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Daily subscription and booking revenue</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2%</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d314820" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1d2e', 
                    border: '1px solid #2d3148',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#1a73e8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Product Share */}
        <motion.div
          className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Popular Products</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Share of product orders by category</p>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold font-display text-slate-900 dark:text-white">Milk</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Category</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {stats.productData.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Trends */}
        <motion.div
          className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Subscription Trends</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Active vs paused status tracking</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subscriptionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d314820" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1a1d2e', 
                    border: '1px solid #2d3148',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Active" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Paused" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Deliveries / Active Orders */}
        <motion.div
          className="lg:col-span-2 card border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden flex flex-col justify-between"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="p-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Recent Deliveries</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monitor current delivery dispatches</p>
            </div>
            <motion.button
              className="text-xs text-primary-500 hover:underline font-semibold flex items-center gap-1"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              View All Orders <ArrowUpRight className="h-3 w-3" />
            </motion.button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-dark-hover/40 text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                  <th className="px-5 py-3.5 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order, idx) => (
                  <motion.tr
                    key={order._id}
                    className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50/50 dark:hover:bg-dark-hover/10 transition-colors"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">{order._id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{order.customerName}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{order.product} <span className="text-[10px] text-slate-400">x{order.quantity}</span></td>
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-semibold">{order.amount}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
