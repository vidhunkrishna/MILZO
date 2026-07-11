import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, ArrowDownRight, ArrowUpRight, Plus, 
  Printer, Loader, AlertCircle, RefreshCw, X, Receipt, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { staggerContainer, staggerChild } from '../lib/animations';

const CustomerPayments = () => {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);
  
  // Invoice state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 8;

  // 1. Fetch wallet balance from profile
  const { data: profileResponse, refetch: refetchProfile } = useQuery({
    queryKey: ['customerProfileForWallet'],
    queryFn: async () => {
      const res = await api.get('/auth/me'); // Retrieves current customer statistics
      return res.data.data;
    }
  });

  const walletBalance = profileResponse?.customerProfile?.wallet_balance || 0;

  // 2. Fetch wallet transactions list
  const { data: response, isLoading: transactionsLoading, isError, refetch: refetchTransactions } = useQuery({
    queryKey: ['walletTransactions', page],
    queryFn: async () => {
      const res = await api.get('/payments/wallet/transactions', { params: { page, limit } });
      return res.data;
    },
    keepPreviousData: true,
  });

  const transactions = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Recharge Wallet handler
  const handleRecharge = async (e) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
    if (amount < 10) return toast.error('Minimum recharge amount is ₹10');

    try {
      setIsRecharging(true);
      
      // Load script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      // 1. Create Razorpay order in backend
      const orderRes = await api.post('/payments/razorpay/create-order', { amount });
      const { razorpayOrder, payment } = orderRes.data.data;

      // 2. Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'MILZO Dairy',
        description: 'Wallet Recharge',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            toast.loading('Verifying transaction...');
            
            // 3. Verify Razorpay payment signature
            await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: payment.id,
            });

            toast.dismiss();
            toast.success('Wallet recharged successfully!');
            setRechargeAmount('');
            refetchProfile();
            refetchTransactions();
          } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Signature verification failed');
          }
        },
        prefill: {
          name: profileResponse?.name || '',
          email: profileResponse?.email || '',
          contact: profileResponse?.phone || '',
        },
        theme: { color: '#3B82F6' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setIsRecharging(false);
    }
  };

  // Generate / View Invoice
  const handleViewInvoice = async (paymentId) => {
    try {
      setIsInvoiceLoading(true);
      const res = await api.post(`/payments/${paymentId}/invoice`);
      setSelectedInvoice(res.data.data.payment);
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice');
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl md:text-3xl font-display font-bold">Payments & Wallet</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add funds, review wallet usage, and print receipts/invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wallet Balance Display Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-500/10 flex flex-col justify-between relative overflow-hidden h-52">
          {/* Decorative background grid */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <CreditCard className="h-44 w-44" />
          </div>

          <div>
            <span className="text-xxs uppercase tracking-widest font-bold opacity-75">Milzo Digital Wallet</span>
            <div className="text-3xl font-display font-bold mt-2">
              ₹{Number(walletBalance).toFixed(2)}
            </div>
            <p className="text-xxs mt-1 opacity-75">Active Balance</p>
          </div>

          <div className="text-xxs opacity-75">
            Refreshes automatically upon transaction captures.
          </div>
        </div>

        {/* Quick Recharge Form */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">Wallet Recharge</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quickly credit your account for hassle-free order checkouts.</p>
          </div>

          <form onSubmit={handleRecharge} className="space-y-4 mt-4">
            <div className="flex gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setRechargeAmount(amt.toString())}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold transition-all"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="10"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Enter amount (Min ₹10)"
                  className="pl-7 pr-4 py-2.5 w-full text-xs bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isRecharging}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                {isRecharging ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Recharge Balance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Wallet Transactions Table */}
      <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-dark-border/40">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">Wallet Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Summary logs of credits and debits.</p>
          </div>
          <button
            onClick={() => { refetchProfile(); refetchTransactions(); }}
            className="p-2 hover:bg-slate-50 dark:hover:bg-dark-hover rounded-lg text-slate-400 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-6 text-xs text-rose-500">
            Failed to load transaction history.
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-450">
            No transactions logged yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-dark-border/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-dark-border/25">
                  {transactions.map((t) => {
                    const isCredit = t.type === 'credit';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/10 transition-colors">
                        <td className="py-3 text-slate-500">{format(new Date(t.date), 'dd MMM yyyy, hh:mm a')}</td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{t.description || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-xxs px-2 py-0.5 rounded-full ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-550'
                              : 'bg-rose-500/10 text-rose-550'
                          }`}>
                            {isCredit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {t.type}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-bold ${isCredit ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {isCredit ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Page <span className="font-semibold text-slate-700 dark:text-slate-300">{page}</span> of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-250 dark:border-dark-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border/40 pb-4">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-display font-bold">
                  <Receipt className="h-5 w-5 text-blue-500" />
                  <span>Invoice Statement</span>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-lg bg-slate-50 dark:bg-dark-hover text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Invoice Bill details */}
              <div className="space-y-4 text-xs">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xxs text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{selectedInvoice.invoice?.invoiceNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xxs text-slate-400 uppercase tracking-wider block">Generated Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {format(new Date(selectedInvoice.invoice?.generatedAt || new Date()), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border/20 pt-4">
                  <span className="text-xxs text-slate-400 uppercase tracking-wider block">Transaction Summary</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Milzo Wallet Deposit</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">₹{Number(selectedInvoice.amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border/20 pt-4 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (0% GST for deposits)</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Processing Fees</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-dark-border/60">
                    <span>Net Credit Amount</span>
                    <span>₹{Number(selectedInvoice.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-dark-border hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CustomerPayments;
