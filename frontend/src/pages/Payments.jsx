import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Eye, CreditCard, RefreshCw, Printer, AlertCircle, Calendar, DollarSign, User, ShieldAlert, X } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

const Payments = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Refund form state
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // Fetch payments from API
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get('/payments');
      return response.data.data;
    },
    retry: false
  });

  const listData = payments || [];

  const filteredData = listData.filter(p =>
    (p.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p._id || '').includes(search) ||
    (p.razorpay_payment_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    const maxRefundable = payment.amount - (payment.refund?.amount || 0);
    setRefundAmount(maxRefundable.toString());
    setRefundReason('');
    setIsRefundOpen(true);
  };

  const openDetailsModal = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const amt = Number(refundAmount);
    const maxRefundable = selectedPayment.amount - (selectedPayment.refund?.amount || 0);

    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid refund amount.');
      return;
    }
    if (amt > maxRefundable) {
      toast.error(`Refund amount cannot exceed the remaining balance of ₹${maxRefundable}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/payments/${selectedPayment._id}/refund`, {
        amount: amt,
        reason: refundReason
      });
      toast.success(`Refund of ₹${amt} successfully processed!`);
      setIsRefundOpen(false);
      queryClient.invalidateQueries(['payments']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintInvoice = async (payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker enabled. Please allow popups to print invoices.');
      return;
    }

    printWindow.document.write('<html><head><title>Loading Invoice...</title></head><body><div style="font-family: sans-serif; text-align: center; margin-top: 100px; color: #64748b;">Generating invoice print layout... Please wait.</div></body></html>');

    try {
      const response = await api.post(`/payments/${payment._id}/invoice`);
      const inv = response.data.data.payment;
      
      const formattedMethod = inv.method === 'wallet' ? 'MILZO Wallet' : inv.method === 'online' ? 'Razorpay Online' : 'Cash on Delivery';
      const formattedDate = format(new Date(inv.invoice?.generatedAt || Date.now()), 'dd MMM yyyy, hh:mm a');

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${inv.invoice?.invoiceNumber || 'INV'}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: 700; color: #2563eb; }
              .meta-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
              .meta-table td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
              .meta-table td.label { color: #64748b; font-weight: bold; width: 40%; }
              .meta-table td.value { font-weight: 600; text-align: right; color: #0f172a; }
              .summary { background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 30px; border: 1px solid #e2e8f0; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #475569; }
              .summary-total { border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 15px; font-weight: bold; color: #0f172a; }
              .footer { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">MILZO INVOICE</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Milzo Dairy & Grocery Services</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 15px; color: #0f172a;">${inv.invoice?.invoiceNumber || 'INV-TEMP'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ${formattedDate}</div>
              </div>
            </div>

            <table class="meta-table">
              <tr>
                <td class="label">Customer Name</td>
                <td class="value">${inv.customerName}</td>
              </tr>
              <tr>
                <td class="label">Transaction Reference</td>
                <td class="value" style="font-family: monospace;">${inv.id.toUpperCase()}</td>
              </tr>
              <tr>
                <td class="label">Payment Method</td>
                <td class="value">${formattedMethod}</td>
              </tr>
              <tr>
                <td class="label">Payment Status</td>
                <td class="value" style="color: #10b981; font-weight: bold; text-transform: uppercase;">${inv.status}</td>
              </tr>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Charged Amount</span>
                <span>₹${Number(inv.amount).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Processing & Platform Fees</span>
                <span>₹0.00</span>
              </div>
              <div class="summary-row summary-total">
                <span>Net Paid / Settled</span>
                <span>₹${Number(inv.amount).toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              Thank you for choosing MILZO! This is a system-generated statement.
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      printWindow.close();
      toast.error('Failed to generate invoice print statement.');
    }
  };

  const formatPaymentMethod = (method) => {
    if (method === 'wallet') return 'MILZO Wallet';
    if (method === 'cod') return 'Cash on Delivery';
    if (method === 'online') return 'Razorpay Online';
    return method;
  };

  const columns = [
    { label: 'Transaction ID', key: '_id', render: (row) => <span className="font-semibold text-xs font-mono">{row._id.slice(-8).toUpperCase()}</span> },
    { label: 'Customer Name', key: 'customerName', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.customerName}</span> },
    { label: 'Payment Method', key: 'method', render: (row) => <span>{formatPaymentMethod(row.method)}</span> },
    { label: 'Amount', key: 'amount', render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">₹{row.amount}</span> },
    { label: 'Refunded', key: 'refunded_amount', render: (row) => <span className="font-semibold text-rose-500">{row.refund?.amount ? `₹${row.refund.amount}` : '-'}</span> },
    { label: 'Payment Date', key: 'created_at', render: (row) => <span>{format(new Date(row.created_at), 'dd MMM yyyy')}</span> },
    { label: 'Gateway Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Actions', key: 'actions', render: (row) => {
        const isRefundable = (row.status === 'captured' || row.status === 'partially_refunded') && row.method !== 'cod';
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => openDetailsModal(row)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-all"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePrintInvoice(row)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-all"
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
            {isRefundable && (
              <button
                onClick={() => openRefundModal(row)}
                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 rounded-lg transition-all"
                title="Process Refund"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      }
    }
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
        searchPlaceholder="Search transactions by customer or Gateway ID..."
        searchQuery={search}
        onSearch={setSearch}
      />

      {/* 1. REFUND MODAL */}
      {isRefundOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-dark-border/40">
              <div className="flex items-center gap-2 text-rose-600">
                <RefreshCw className="h-5 w-5 animate-spin-slow" />
                <h3 className="text-sm font-bold font-display">Process Gateway Refund</h3>
              </div>
              <button onClick={() => setIsRefundOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRefundSubmit}>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-dark-hover/40 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs text-slate-550 dark:text-slate-400">
                    <span>Original Charged</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">₹{selectedPayment.amount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-550 dark:text-slate-400">
                    <span>Previously Refunded</span>
                    <span className="font-bold text-rose-500">₹{selectedPayment.refund?.amount || 0}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-dark-border/40 pt-2 flex justify-between text-xs text-slate-800 dark:text-slate-200 font-bold">
                    <span>Max Refundable</span>
                    <span>₹{selectedPayment.amount - (selectedPayment.refund?.amount || 0)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs uppercase tracking-wider font-bold text-slate-400">Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedPayment.amount - (selectedPayment.refund?.amount || 0)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-slate-200"
                    placeholder="Enter amount to refund"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs uppercase tracking-wider font-bold text-slate-400">Reason for Refund</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-slate-200 h-20 resize-none"
                    placeholder="Provide reason (e.g. Customer cancelled order, Payment issue)"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 dark:bg-dark-hover/20 border-t border-slate-150 dark:border-dark-border/40">
                <button
                  type="button"
                  onClick={() => setIsRefundOpen(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-dark-border text-slate-700 dark:text-slate-250 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/10 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. TRANSACTION DETAILS MODAL */}
      {isDetailsOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-dark-border/40">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <CreditCard className="h-5 w-5 text-blue-550" />
                <h3 className="text-sm font-bold font-display">Transaction Overview</h3>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1"><User className="h-3 w-3" /> Customer</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{selectedPayment.customerName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> Payment Date</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{format(new Date(selectedPayment.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1"><DollarSign className="h-3 w-3" /> Charged Amount</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">₹{selectedPayment.amount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">Status</span>
                  <div>
                    <StatusBadge status={selectedPayment.status} />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">Gateway ID</span>
                  <p className="text-xs font-mono font-semibold text-slate-650 dark:text-slate-350">{selectedPayment.razorpay_payment_id || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">Method</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{formatPaymentMethod(selectedPayment.method)}</p>
                </div>
              </div>

              {/* Refund Info Section */}
              {selectedPayment.refund && (
                <div className="border-t border-slate-150 dark:border-dark-border/40 pt-4 space-y-4">
                  <h4 className="text-xxs uppercase tracking-wider font-bold text-slate-450 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Refund History</h4>
                  
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-550 dark:text-slate-400">Total Refunded:</span>
                      <span className="font-bold text-rose-600">₹{selectedPayment.refund.amount}</span>
                    </div>
                    {selectedPayment.refund.processedAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-550 dark:text-slate-400">Latest Process Date:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{format(new Date(selectedPayment.refund.processedAt), 'dd MMM yyyy, hh:mm a')}</span>
                      </div>
                    )}
                  </div>

                  {/* Multi-stage refund logs */}
                  {selectedPayment.refund.history && selectedPayment.refund.history.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Refund Events</span>
                      <div className="space-y-2 divide-y divide-slate-100 dark:divide-dark-border/30">
                        {selectedPayment.refund.history.map((log, idx) => (
                          <div key={log.refundId || idx} className="pt-2 text-xs space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-800 dark:text-slate-200">₹{log.amount} Refunded</span>
                              <span className="font-mono text-slate-500 text-[10px]">{log.refundId}</span>
                            </div>
                            <div className="flex justify-between text-slate-450 text-[10px]">
                              <span>Reason: {log.reason}</span>
                              <span>{format(new Date(log.processedAt), 'dd MMM, hh:mm a')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-dark-hover/20 border-t border-slate-150 dark:border-dark-border/40 text-right">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVOICE VIEWER MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-dark-border/40">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Printer className="h-5 w-5 text-blue-550" />
                <h3 className="text-sm font-bold font-display">Invoice Statement</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bill details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-dark-border/30 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{selectedInvoice.invoice?.invoiceNumber || 'INV-TEMP'}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Generated Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedInvoice.invoice?.generatedAt 
                      ? format(new Date(selectedInvoice.invoice.generatedAt), 'dd MMM yyyy')
                      : format(new Date(), 'dd MMM yyyy')
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Customer Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="font-mono text-slate-800 dark:text-slate-202">{selectedInvoice._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gateway Status</span>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-202">{formatPaymentMethod(selectedInvoice.method)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-dark-border/30 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Charged Amount</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 font-display font-bold">₹{Number(selectedInvoice.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fees</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">₹0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-250 dark:border-dark-border/60">
                  <span>Net Paid Amount</span>
                  <span>₹{Number(selectedInvoice.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-dark-hover/20 border-t border-slate-150 dark:border-dark-border/40">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2 border border-slate-250 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-250 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
