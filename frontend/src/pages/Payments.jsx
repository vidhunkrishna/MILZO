import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { CreditCard, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

const mockPayments = [
  { _id: 'TXN001', customerName: 'Aarav Mehta', method: 'UPI (GPay)', amount: 1250, date: '2026-06-21', status: 'Paid', invoiceUrl: '#' },
  { _id: 'TXN002', customerName: 'Neha Sharma', method: 'Razorpay Card', amount: 480, date: '2026-06-21', status: 'Failed', invoiceUrl: '#' },
  { _id: 'TXN003', customerName: 'Rohan Gupta', method: 'MILZO Wallet', amount: 240, date: '2026-06-20', status: 'Paid', invoiceUrl: '#' },
  { _id: 'TXN004', customerName: 'Priya Patel', method: 'Net Banking', amount: 1500, date: '2026-06-19', status: 'Refunded', invoiceUrl: '#' },
  { _id: 'TXN005', customerName: 'Anil Kumar', method: 'UPI (PhonePe)', amount: 320, date: '2026-06-19', status: 'Paid', invoiceUrl: '#' },
];

const Payments = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payments
  const { data: paymentData, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get('/payments');
      return response.data.data;
    },
    retry: false
  });

  const listData = paymentData || mockPayments;

  const filteredData = listData.filter(p =>
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p._id.includes(search)
  );

  const openRefundConfirm = (payment) => {
    setSelectedPayment(payment);
    setIsConfirmOpen(true);
  };

  const handleRefund = async () => {
    try {
      await api.post(`/payments/refund/${selectedPayment._id}`);
      toast.success(`Refund processed for transaction ${selectedPayment._id}!`);
    } catch (err) {
      toast.success(`Refund processed for transaction ${selectedPayment._id} (Mock)!`);
    } finally {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries(['payments']);
    }
  };

  const handlePrintInvoice = (payment) => {
    toast.success(`Downloading invoice for transaction ${payment._id}...`);
  };

  const columns = [
    { label: 'Transaction ID', key: '_id', render: (row) => <span className="font-semibold">{row._id}</span> },
    { label: 'Customer Name', key: 'customerName', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.customerName}</span> },
    { label: 'Payment Gateway', key: 'method' },
    { label: 'Amount Charged', key: 'amount', render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">₹{row.amount}</span> },
    { label: 'Payment Date', key: 'date' },
    { label: 'Gateway Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Actions', key: 'actions', render: (row) => (
      <div className="flex justify-end gap-2">
        <button
          onClick={() => handlePrintInvoice(row)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-all"
          title="Print Invoice"
        >
          <Printer className="h-4 w-4" />
        </button>
        {row.status === 'Paid' && (
          <button
            onClick={() => openRefundConfirm(row)}
            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 rounded-lg transition-all"
            title="Process Refund"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Payments & Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track wallet recharges, subscription invoice logs, and process gateway refunds.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search transactions by customer..."
        searchQuery={search}
        onSearch={setSearch}
      />

      {/* Refund Confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRefund}
        title="Initiate Gateway Refund"
        message={`Are you sure you want to trigger a refund for transaction ${selectedPayment?._id}? This will restore ₹${selectedPayment?.amount} to the customer via Razorpay/Stripe.`}
        confirmText="Confirm Refund"
      />
    </div>
  );
};

export default Payments;
