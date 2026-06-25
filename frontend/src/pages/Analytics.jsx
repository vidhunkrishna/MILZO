import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { BarChart3, FileDown, Calendar, ArrowRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  LineChart, Line, Legend
} from 'recharts';
import api from '../services/api';

const mockReports = {
  sales: [
    { month: 'Jan', offline: 120000, online: 340000, total: 460000 },
    { month: 'Feb', offline: 140000, online: 410000, total: 550000 },
    { month: 'Mar', offline: 135000, online: 490000, total: 625000 },
    { month: 'Apr', offline: 150000, online: 580000, total: 730000 },
    { month: 'May', offline: 170000, online: 640000, total: 810000 },
    { month: 'Jun', offline: 190000, online: 720000, total: 910000 },
  ],
  delivery: [
    { day: 'Mon', completed: 780, delayed: 22, missed: 8 },
    { day: 'Tue', completed: 810, delayed: 15, missed: 5 },
    { day: 'Wed', completed: 840, delayed: 18, missed: 4 },
    { day: 'Thu', completed: 830, delayed: 25, missed: 10 },
    { day: 'Fri', completed: 870, delayed: 12, missed: 6 },
    { day: 'Sat', completed: 920, delayed: 10, missed: 2 },
    { day: 'Sun', completed: 950, delayed: 8, missed: 1 },
  ]
};

const Analytics = () => {
  const [reportType, setReportType] = useState('sales'); // sales, delivery
  const [dateRange, setDateRange] = useState('This Month');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', reportType],
    queryFn: async () => {
      const response = await api.get(`/analytics/${reportType}`);
      return response.data.data;
    },
    retry: false
  });

  const handleDownload = () => {
    toast.success(`Exporting ${reportType} report as PDF format...`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate, audit, and analyze sales metrics, delivery percentages, and vendor payouts.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleDownload} 
            className="btn-primary inline-flex items-center gap-1.5 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <FileDown className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Selector Panels */}
      <div className="card p-4 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportType('sales')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              reportType === 'sales' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Revenue & Sales Report
          </button>
          <button
            onClick={() => setReportType('delivery')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              reportType === 'delivery' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Delivery Performance
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-dark-hover border border-slate-200/50 dark:border-dark-border/50 text-slate-600 dark:text-slate-300 rounded-xl">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>Active Period: {dateRange}</span>
        </div>
      </div>

      {/* Main Graph Card */}
      {reportType === 'sales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">Revenue Churn Breakdown</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockReports.sales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d314820" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #2d3148', color: '#f1f5f9', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" name="App Subscriptions" dataKey="online" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOnline)" />
                  <Area type="monotone" name="B2B Supply Orders" dataKey="offline" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOffline)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Financial Summary</h3>
              <p className="text-xs text-slate-400 mt-1">Aggregate earnings over the active period</p>
            </div>
            
            <div className="space-y-4 my-6">
              <div className="flex justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                <span className="text-xs text-slate-400">Total App Subscriptions</span>
                <span className="text-sm font-bold">₹3,090,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                <span className="text-xs text-slate-400">Total B2B Bulk Supplies</span>
                <span className="text-sm font-bold">₹905,000</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-xs text-slate-500 font-bold">Net Total Earnings</span>
                <span className="text-sm font-extrabold text-indigo-500">₹3,995,000</span>
              </div>
            </div>

            <div className="p-4 bg-primary-600/10 border border-primary-500/20 rounded-2xl flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary-500 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                App subscriptions remain the dominant channel (77.3% share), growing at +14% Month-on-Month.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">Daily Dispatch KPI (Stops success)</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockReports.delivery} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d314820" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #2d3148', color: '#f1f5f9', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="Successful Delivery" dataKey="completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar name="Late Delivery (>8:00 AM)" dataKey="delayed" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar name="Missed Stops" dataKey="missed" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Logistics Summary</h3>
              <p className="text-xs text-slate-400 mt-1">Aggregate delivery counts this week</p>
            </div>

            <div className="space-y-4 my-6">
              <div className="flex justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                <span className="text-xs text-slate-400">Total Stops Dispatched</span>
                <span className="text-sm font-bold">6,128 stops</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                <span className="text-xs text-slate-400">Success Rate</span>
                <span className="text-sm font-bold text-emerald-500">97.8%</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-xs text-slate-400">Delays Registered</span>
                <span className="text-sm font-bold text-amber-500">100 (1.6%)</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Logistics are highly stable with under 0.6% missed stops. Whitefield Route A holds the lowest delayed percentage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
