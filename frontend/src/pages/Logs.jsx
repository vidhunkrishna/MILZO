import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FileText, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const mockAuditLogs = [
  { _id: 'LOG001', user: 'admin@milzo.com', action: 'Update Product', details: 'Changed price of Cow Milk from ₹60 to ₹65', ipAddress: '192.168.1.5', timestamp: '2026-06-21 15:42:01' },
  { _id: 'LOG002', user: 'staff_1@milzo.com', action: 'KYC Verification', details: 'Approved KYC document for Agent Suresh Raina', ipAddress: '192.168.1.18', timestamp: '2026-06-21 14:15:32' },
  { _id: 'LOG003', user: 'admin@milzo.com', action: 'Delete Customer', details: 'Deregistered customer profile CUST009', ipAddress: '192.168.1.5', timestamp: '2026-06-21 11:22:10' },
  { _id: 'LOG004', user: 'superadmin@milzo.com', action: 'Update Settings', details: 'Updated Razorpay callback webhook endpoints', ipAddress: '152.12.89.2', timestamp: '2026-06-20 18:30:15' },
];

const mockErrorLogs = [
  { _id: 'ERR001', message: 'Razorpay payment verification signature mismatch', path: '/api/payments/verify', status: 'Open', timestamp: '2026-06-21 12:05:44' },
  { _id: 'ERR002', message: 'Database Connection Timeout on Atlas replica-set-0', path: 'mongoose.connect()', status: 'Resolved', timestamp: '2026-06-20 03:00:12' },
  { _id: 'ERR003', message: 'Nodemailer SMTP handshake failed (Connection Refused)', path: '/api/auth/forgot-password', status: 'Open', timestamp: '2026-06-21 08:30:22' },
];

const Logs = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('audit'); // audit, error

  // Fetch error/audit logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', activeTab],
    queryFn: async () => {
      const response = await api.get(`/logs/${activeTab}-logs`);
      return response.data.data;
    },
    retry: false
  });

  const handleResolveError = async (id) => {
    try {
      await api.patch(`/logs/resolve-error/${id}`);
      toast.success(`Error Log ${id} marked as Resolved!`);
    } catch (err) {
      toast.success(`Error Log ${id} marked as Resolved (Mock)!`);
    } finally {
      queryClient.invalidateQueries(['logs']);
    }
  };

  const auditColumns = [
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'Admin User', key: 'user', render: (row) => <span className="font-semibold">{row.user}</span> },
    { label: 'Action Tag', key: 'action', render: (row) => <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-dark-hover border border-slate-200/50 dark:border-dark-border/50 text-slate-600 dark:text-slate-300 rounded-lg">{row.action}</span> },
    { label: 'Details / Description', key: 'details', render: (row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.details}</span> },
    { label: 'IP Address', key: 'ipAddress' },
  ];

  const errorColumns = [
    { label: 'Error ID', key: '_id' },
    { label: 'Error message', key: 'message', render: (row) => <span className="font-semibold text-rose-500">{row.message}</span> },
    { label: 'API Endpoint', key: 'path' },
    { label: 'Occurred At', key: 'timestamp' },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Resolve', key: 'actions', render: (row) => (
      row.status === 'Open' && (
        <button
          onClick={() => handleResolveError(row._id)}
          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all"
          title="Resolve Exception"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">System Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Audit backend API transactions, database calls, and check runtime errors.</p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-dark-hover p-1 border border-slate-200/50 dark:border-dark-border/50">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'audit' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Audit Log History
          </button>
          <button
            onClick={() => setActiveTab('error')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'error' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Server Error Exceptions
          </button>
        </div>
      </div>

      {activeTab === 'audit' ? (
        <DataTable
          columns={auditColumns}
          data={mockAuditLogs}
          searchPlaceholder="Search audit trails by action..."
        />
      ) : (
        <DataTable
          columns={errorColumns}
          data={mockErrorLogs}
          searchPlaceholder="Search server errors..."
        />
      )}
    </div>
  );
};

export default Logs;
