import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Calendar, Clock, MapPin, 
  ChevronRight, AlertCircle, X, ShieldAlert, ArrowLeft,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild } from '../lib/animations';

const CustomerOrders = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Selected order for timeline/detail drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Cancel dialog triggers
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Debouncing search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch orders
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerOrders', debouncedSearch, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/orders', { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  // Fetch timeline for selected order
  const { data: timelineResponse, isLoading: timelineLoading } = useQuery({
    queryKey: ['orderTimeline', selectedOrder?.id],
    queryFn: async () => {
      const res = await api.get(`/orders/${selectedOrder?.id}/timeline`);
      return res.data.data;
    },
    enabled: !!selectedOrder?.id,
  });

  const orders = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error('Please enter a cancellation reason');

    try {
      setIsCancelling(true);
      await api.patch(`/orders/${cancelOrderId}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled successfully');
      setCancelOrderId(null);
      setCancelReason('');
      setSelectedOrder(null); // Close details
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">My Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track dispatches, check previous invoices, and view order delivery history.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <OrdersSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load order history</p>
          <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No orders found</p>
          <p className="text-xs text-slate-400 mt-1">You haven't placed any dispatches yet.</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
          >
            {orders.map((order) => (
              <motion.div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden group flex flex-col justify-between"
                variants={staggerChild}
                whileHover={{ y: -2 }}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border/40 pb-3 mb-3">
                    <div className="space-y-0.5">
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Order Code</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                        {order.order_id}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Delivery Detail */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{format(new Date(order.delivery_date), 'dd MMM yyyy')}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Slot: <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{order.delivery_slot}</span></span>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border/40 pt-3 mt-4">
                  <div>
                    <span className="text-xxs text-slate-400 dark:text-slate-500 block">Total paid</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-display block">
                      ₹{Number(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 group-hover:translate-x-0.5 transition-transform">
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
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
        </>
      )}

      {/* Order Detail Modal / Sidebar Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm p-0 md:p-4">
            <motion.div
              className="bg-white dark:bg-dark-card h-full md:h-[95vh] w-full max-w-md md:rounded-2xl border-l md:border border-slate-250 dark:border-dark-border overflow-hidden shadow-2xl flex flex-col justify-between"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Order Details</h3>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status & Code */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Order ID</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 block">{selectedOrder.order_id}</span>
                  </div>
                  <StatusBadge status={selectedOrder.status} />
                </div>

                {/* Items Summary */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Items Purchased</span>
                  <div className="space-y-2.5">
                    {/* Render order items, checking if populated or needs to be resolved */}
                    {(selectedOrder.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 dark:border-dark-border/20 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-250">{item.product_name || `Dairy Item #${i+1}`}</p>
                          <span className="text-xxs text-slate-400 block mt-0.5">Quantity: {item.quantity}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">₹{Number(item.total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Delivery Specifications</span>
                  
                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-400">Delivery Slot & Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {selectedOrder.delivery_slot} slot on {format(new Date(selectedOrder.delivery_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-400">Recipient Address</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedOrder.delivery_address?.line1}
                          {selectedOrder.delivery_address?.line2 ? `, ${selectedOrder.delivery_address.line2}` : ''} <br />
                          {selectedOrder.delivery_address?.city}, {selectedOrder.delivery_address?.state} - {selectedOrder.delivery_address?.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Billing Summary</span>
                  
                  <div className="space-y-1.5 text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span>₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>₹{(selectedOrder.delivery_charge || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-dark-border/60">
                      <span>Total Price</span>
                      <span>₹{Number(selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Payment Details</span>
                  
                  <div className="space-y-2 text-slate-500">
                    <div className="flex justify-between items-center">
                      <span>Payment Method</span>
                      <StatusBadge status={selectedOrder.payment?.method || 'Unknown'} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Status</span>
                      <StatusBadge status={selectedOrder.payment?.status || 'Unknown'} />
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction ID</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.payment?.transactionId || 'N/A'}</span>
                    </div>
                    {selectedOrder.payment?.paidAt && (
                      <div className="flex justify-between">
                        <span>Payment Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {format(new Date(selectedOrder.payment.paidAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>
                    )}
                    {selectedOrder.payment?.refund && (
                      <div className="border-t border-dashed border-slate-200 dark:border-dark-border/40 pt-2 mt-2 space-y-1.5 text-xs text-rose-500">
                        <div className="flex justify-between font-bold">
                          <span>Refund Amount</span>
                          <span>₹{(selectedOrder.payment.refund.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Refund ID</span>
                          <span className="font-mono font-semibold">{selectedOrder.payment.refund.refundId || 'N/A'}</span>
                        </div>
                        {selectedOrder.payment.refund.processedAt && (
                          <div className="flex justify-between">
                            <span>Refund Date</span>
                            <span>
                              {format(new Date(selectedOrder.payment.refund.processedAt), 'dd MMM yyyy, hh:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Timeline Tracking */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dispatch Timeline</span>

                  {timelineLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader className="h-4 w-4 animate-spin" />
                      Loading timeline...
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {(timelineResponse?.timeline || []).map((t, idx) => (
                        <div key={idx} className="flex gap-3 relative">
                          {/* Dot line */}
                          {idx !== timelineResponse.timeline.length - 1 && (
                            <div className="absolute left-1.5 top-3.5 bottom-0 w-0.5 bg-slate-200 dark:bg-dark-border"></div>
                          )}
                          <div className="h-3 w-3 rounded-full bg-blue-500 border border-white mt-1 shrink-0 z-10"></div>
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold capitalize text-slate-800 dark:text-slate-100">{t.status}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                              {format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a')}
                            </span>
                            {t.note && (
                              <p className="text-[11px] text-slate-400 italic">"{t.note}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Actions (Cancel Order option) */}
              <div className="p-4 bg-slate-50 dark:bg-dark-hover/10 border-t border-slate-100 dark:border-dark-border/40">
                {['placed', 'confirmed', 'pending'].includes(selectedOrder.status) ? (
                  <button
                    onClick={() => {
                      setCancelOrderId(selectedOrder.id);
                      setCancelReason('');
                    }}
                    className="w-full py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/20 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="text-center text-xxs text-slate-400 italic">
                    This order is already {selectedOrder.status} and cannot be cancelled.
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {cancelOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="text-center space-y-2">
                <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cancel Order Request</h3>
                <p className="text-xxs text-slate-500">
                  Please provide a brief reason for cancelling your order. Refunds (if paid via wallet) will be auto-credited to your account.
                </p>
              </div>

              <form onSubmit={handleCancelOrder} className="space-y-4">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Plans changed, ordered wrong milk type..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[3.5rem] resize-none"
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelOrderId(null)}
                    className="flex-1 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 text-slate-600 dark:text-slate-400 rounded-xl text-xxs font-bold transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelling}
                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xxs font-bold transition-all"
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrdersSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border h-40 rounded-2xl"></div>
      ))}
    </div>
  );
};

export default CustomerOrders;
