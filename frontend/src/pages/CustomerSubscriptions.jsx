import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Plus, Calendar, Clock, AlertCircle, X,
  Pause, Play, Trash2, ShieldAlert, Package, Loader, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild } from '../lib/animations';

const PLAN_TYPES = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'custom', name: 'Custom Days' },
];

const CustomerSubscriptions = () => {
  const [page, setPage] = useState(1);
  const limit = 6;

  // New Subscription Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [planType, setPlanType] = useState('daily');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  // Custom days of week select
  const [deliveryDays, setDeliveryDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false
  });

  // Action states (pause/cancel dialogs)
  const [actionSubId, setActionSubId] = useState(null);
  const [actionType, setActionType] = useState(''); // 'pause' or 'cancel'
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch subscriptions
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerSubscriptions', page],
    queryFn: async () => {
      const res = await api.get('/subscriptions', { params: { page, limit } });
      return res.data;
    },
    keepPreviousData: true,
  });

  // Fetch active products catalog (for creation picker)
  const { data: productsResponse } = useQuery({
    queryKey: ['productsCatalogForSubscription'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { isActive: 'true', limit: 100 } });
      return res.data.data;
    },
  });

  const subscriptions = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };
  const products = productsResponse || [];

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Please select a product');
    if (quantity <= 0) return toast.error('Please enter a valid quantity');

    const payload = {
      product: selectedProduct,
      planType,
      deliverySlot,
      quantity: Number(quantity),
      startDate,
      deliveryDays,
    };

    try {
      setIsCreating(true);
      await api.post('/subscriptions', payload);
      toast.success('Subscription created successfully!');
      setIsDrawerOpen(false);
      // Reset form
      setSelectedProduct('');
      setPlanType('daily');
      setQuantity(1);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to start subscription');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePauseResumeSub = async (subId, currentStatus) => {
    if (currentStatus === 'active') {
      setActionSubId(subId);
      setActionType('pause');
      setActionReason('');
    } else if (currentStatus === 'paused') {
      try {
        await api.patch(`/subscriptions/${subId}/resume`);
        toast.success('Subscription resumed');
        refetch();
      } catch (err) {
        toast.error(err.message || 'Failed to resume subscription');
      }
    }
  };

  const triggerCancelSub = (subId) => {
    setActionSubId(subId);
    setActionType('cancel');
    setActionReason('');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) return toast.error('Please provide a reason');

    try {
      setIsSubmittingAction(true);
      if (actionType === 'pause') {
        await api.patch(`/subscriptions/${actionSubId}/pause`, { reason: actionReason });
        toast.success('Subscription paused');
      } else if (actionType === 'cancel') {
        await api.patch(`/subscriptions/${actionSubId}/cancel`, { reason: actionReason });
        toast.success('Subscription cancelled');
      }
      setActionSubId(null);
      setActionReason('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const toggleDay = (day) => {
    setDeliveryDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="space-y-6">
      {/* Header & New Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">My Subscriptions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage recurring dispatches. Pause or cancel anytime.
          </p>
        </div>

        <motion.button
          onClick={() => setIsDrawerOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5 justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/10 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-4 w-4" />
          New Subscription
        </motion.button>
      </div>

      {/* Subscription List */}
      {isLoading ? (
        <SubscriptionsSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load subscriptions</p>
          <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <RefreshCw className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 stroke-[1.25]" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No active subscriptions</p>
          <p className="text-xs text-slate-400 mt-1">Set up a daily delivery plan and get fresh milk right at your door.</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
          >
            {subscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                variants={staggerChild}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-dark-border/40 pb-3.5 mb-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        {sub.subscription_id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {sub.product?.name || 'Dairy Subscription'}
                      </h3>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Pricing Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Plan Type</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{sub.plan_type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Slot / Qty</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{sub.delivery_slot} • {sub.quantity} unit</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Billing Type</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{sub.billing_cycle}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Next Dispatch</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {sub.next_delivery_date ? format(new Date(sub.next_delivery_date), 'dd MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Days Summary */}
                  {sub.delivery_days && (
                    <div className="border-t border-slate-100 dark:border-dark-border/40 pt-3 mb-4">
                      <span className="text-[9px] uppercase text-slate-400 tracking-wider block mb-1">Delivery Schedule</span>
                      <div className="flex gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const key = day.toLowerCase() === 'sun' ? 'sunday' : day.toLowerCase() === 'sat' ? 'saturday' : `${day.toLowerCase()}`;
                          const isSelected = sub.delivery_days[key];
                          return (
                            <span
                              key={day}
                              className={`text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-blue-500/10 border-blue-500/25 text-blue-500'
                                  : 'bg-slate-50 dark:bg-dark-hover border-slate-200 dark:border-dark-border text-slate-400'
                              }`}
                            >
                              {day.slice(0, 1)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action buttons */}
                <div className="grid grid-cols-2 gap-3.5 border-t border-slate-200 dark:border-dark-border/40 pt-4 mt-4">
                  {sub.status === 'active' ? (
                    <button
                      onClick={() => handlePauseResumeSub(sub.id, 'active')}
                      className="py-2 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center gap-1.5 text-xxs font-bold transition-colors"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause Plan
                    </button>
                  ) : sub.status === 'paused' ? (
                    <button
                      onClick={() => handlePauseResumeSub(sub.id, 'paused')}
                      className="py-2 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center gap-1.5 text-xxs font-bold transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Resume Plan
                    </button>
                  ) : (
                    <div className="py-2 text-center text-xxs text-slate-400 border border-transparent rounded-xl cursor-not-allowed">
                      Inactive
                    </div>
                  )}

                  {['active', 'paused'].includes(sub.status) ? (
                    <button
                      onClick={() => triggerCancelSub(sub.id)}
                      className="py-2 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/5 text-rose-600 dark:text-rose-450 rounded-xl flex items-center justify-center gap-1.5 text-xxs font-bold transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel Plan
                    </button>
                  ) : (
                    <div className="py-2 text-center text-xxs text-slate-400 border border-transparent rounded-xl cursor-not-allowed">
                      Terminated
                    </div>
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

      {/* Creation Modal / Sidebar Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-650 transition-colors z-20"
              >
                <X className="h-4 w-4" />
              </button>

              <form onSubmit={handleCreateSubscription}>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">New Delivery Subscription</h3>
                  
                  {/* Product Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Select Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose milk / product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit_size} {p.unit}) — ₹{p.price}/unit
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plan Type & Slot */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Frequency</label>
                      <select
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {PLAN_TYPES.map((plan) => (
                          <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Delivery Slot</label>
                      <select
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantity & Start Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Quantity per Delivery</label>
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
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        min={startDate}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Custom Delivery Days select */}
                  {planType === 'custom' && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-dark-border/40 pt-3">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Select Delivery Days</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const active = deliveryDays[day];
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={`px-3 py-1 rounded-full text-xxs font-semibold capitalize border transition-all ${
                                active
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer CTA */}
                <div className="bg-slate-50 dark:bg-dark-hover/20 px-6 py-4 flex gap-3 border-t border-slate-100 dark:border-dark-border/40">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-dark-border hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-all"
                  >
                    {isCreating ? 'Creating Plan...' : 'Start Subscription'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pause/Cancel Action Reason Dialog */}
      <AnimatePresence>
        {actionSubId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="text-center space-y-2">
                <ShieldAlert className={`h-10 w-10 mx-auto mb-2 ${actionType === 'pause' ? 'text-amber-500' : 'text-rose-500'}`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {actionType === 'pause' ? 'Pause Delivery Plan' : 'Cancel Subscription'}
                </h3>
                <p className="text-xxs text-slate-500">
                  {actionType === 'pause' 
                    ? 'Temporarily halt your deliveries. You can resume at any time without fees.'
                    : 'This action is permanent and stops all future dairy dispatches for this plan.'}
                </p>
              </div>

              <form onSubmit={handleConfirmAction} className="space-y-4">
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Reason for ${actionType === 'pause' ? 'pausing' : 'cancelling'} subscription...`}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[3.5rem] resize-none"
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActionSubId(null)}
                    className="flex-1 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 text-slate-650 rounded-xl text-xxs font-bold transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className={`flex-1 py-2 text-white rounded-xl text-xxs font-bold transition-all ${
                      actionType === 'pause' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'
                    }`}
                  >
                    {isSubmittingAction 
                      ? (actionType === 'pause' ? 'Pausing...' : 'Cancelling...') 
                      : (actionType === 'pause' ? 'Confirm Pause' : 'Confirm Cancel')}
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

const SubscriptionsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border h-64 rounded-2xl"></div>
      ))}
    </div>
  );
};

export default CustomerSubscriptions;
