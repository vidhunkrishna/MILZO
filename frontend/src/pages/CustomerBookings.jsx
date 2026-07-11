import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, Clock, AlertCircle, X, ShieldAlert, 
  ShoppingBag, Trash2, Edit, ChevronLeft, ChevronRight, Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild } from '../lib/animations';

const CustomerBookings = () => {
  const [page, setPage] = useState(1);
  const limit = 6;

  // New Booking Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Cancellation states
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch bookings list
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerBookings', page],
    queryFn: async () => {
      const res = await api.get('/bookings', { params: { page, limit } });
      return res.data;
    },
    keepPreviousData: true,
  });

  // Fetch active products list for picker
  const { data: productsResponse } = useQuery({
    queryKey: ['productsCatalogForBookings'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { isActive: 'true', limit: 100 } });
      return res.data.data;
    },
  });

  const bookings = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };
  const products = productsResponse || [];

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Please select a product');
    if (quantity <= 0) return toast.error('Please enter a valid quantity');

    const payload = {
      product: selectedProduct,
      deliverySlot,
      deliveryDate,
      quantity: Number(quantity),
      notes,
    };

    try {
      setIsCreating(true);
      await api.post('/bookings', payload);
      toast.success('Booking created successfully!');
      setIsModalOpen(false);
      // Reset form
      setSelectedProduct('');
      setDeliverySlot('morning');
      setQuantity(1);
      setNotes('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule booking');
    } finally {
      setIsCreating(false);
    }
  };

  const triggerCancelBooking = (bookingId) => {
    setCancelBookingId(bookingId);
    setCancelReason('');
  };

  const handleCancelBookingSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error('Please provide a reason');

    try {
      setIsCancelling(true);
      await api.patch(`/bookings/${cancelBookingId}/cancel`, { reason: cancelReason });
      toast.success('Booking cancelled successfully');
      setCancelBookingId(null);
      setCancelReason('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">One-Time Bookings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule one-off milk deliveries on specific calendar dates.
          </p>
        </div>

        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5 justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/10 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-4 w-4" />
          Schedule Delivery
        </motion.button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <BookingsSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load bookings</p>
          <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 stroke-[1.25]" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No scheduled bookings</p>
          <p className="text-xs text-slate-400 mt-1">Need an extra bottle of milk tomorrow? Schedule a one-time booking now.</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
          >
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                variants={staggerChild}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-dark-border/40 pb-3.5 mb-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        {booking.booking_id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {booking.product?.name || 'One-Time Delivery'}
                      </h3>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Delivery Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{format(new Date(booking.delivery_date), 'dd MMM yyyy')}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Delivery Slot: <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{booking.delivery_slot}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <ShoppingBag className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Quantity: <span className="font-semibold text-slate-700 dark:text-slate-300">{booking.quantity} unit</span></span>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-border/40 pt-4 mt-4">
                  <div>
                    <span className="text-xxs text-slate-400 block">Total cost</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
                      ₹{Number(booking.total || 0).toFixed(2)}
                    </span>
                  </div>

                  {['pending', 'confirmed'].includes(booking.status) ? (
                    <button
                      onClick={() => triggerCancelBooking(booking.id)}
                      className="py-1.5 px-3 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/5 text-rose-600 dark:text-rose-400 rounded-xl text-xxs font-bold transition-colors"
                    >
                      Cancel Booking
                    </button>
                  ) : (
                    <span className="text-xxs text-slate-400 italic capitalize">
                      {booking.status}
                    </span>
                  )}
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

      {/* Booking Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-650 transition-colors z-20"
              >
                <X className="h-4 w-4" />
              </button>

              <form onSubmit={handleCreateBooking}>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Schedule One-Time Delivery</h3>
                  
                  {/* Product select */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Select Dairy Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit_size} {p.unit}) — ₹{p.price}/unit
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Delivery Date</label>
                      <input
                        type="date"
                        min={deliveryDate}
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Delivery Slot */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Preferred Slot</label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Delivery Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special instructions for this scheduled dispatch..."
                      className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[3.5rem] resize-none"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 dark:bg-dark-hover/20 px-6 py-4 flex gap-3 border-t border-slate-100 dark:border-dark-border/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-dark-border hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-all"
                  >
                    {isCreating ? 'Scheduling...' : 'Schedule Booking'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="text-center space-y-2">
                <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cancel Booking Request</h3>
                <p className="text-xxs text-slate-500">
                  Are you sure you want to cancel this scheduled delivery?
                </p>
              </div>

              <form onSubmit={handleCancelBookingSubmit} className="space-y-4">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancelling booking..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[3.5rem] resize-none"
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelBookingId(null)}
                    className="flex-1 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 text-slate-650 rounded-xl text-xxs font-bold transition-all"
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

const BookingsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border h-48 rounded-2xl"></div>
      ))}
    </div>
  );
};

export default CustomerBookings;
