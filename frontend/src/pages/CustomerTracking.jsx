import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, Search, Clock, Calendar, Phone, MapPin, User, ShieldAlert,
  ChevronRight, AlertCircle, ShoppingBag, Loader, CheckCircle2,
  TrendingUp, CircleDot
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild } from '../lib/animations';

const STATUS_PROGRESS = {
  placed: { step: 1, label: 'Placed', desc: 'Waiting for confirmation' },
  confirmed: { step: 2, label: 'Confirmed', desc: 'Preparing your order' },
  out_for_delivery: { step: 3, label: 'Out for Delivery', desc: 'Partner is on the way' },
  delivered: { step: 4, label: 'Delivered', desc: 'Delivery completed' }
};

const CustomerTracking = () => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Fetch all orders to identify active dispatches
  const { data: response, isLoading: listLoading, isError: listError, refetch: refetchList } = useQuery({
    queryKey: ['customerOrdersForTracking'],
    queryFn: async () => {
      const res = await api.get('/orders', { params: { limit: 20 } });
      return res.data;
    }
  });

  const orders = response?.data || [];

  // Filter active orders that are not finalized
  const activeOrders = orders.filter(o => ['placed', 'confirmed', 'out_for_delivery'].includes(o.status));
  // Fallback to most recent order if no active orders
  const targetOrderId = selectedOrderId || (activeOrders.length > 0 ? activeOrders[0].id : orders[0]?.id);

  // Fetch detailed details (including timeline and agent details) for target order
  const { data: orderResponse, isLoading: detailsLoading, isError: detailsError, refetch: refetchDetails } = useQuery({
    queryKey: ['orderTrackingDetails', targetOrderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${targetOrderId}`);
      return res.data.data;
    },
    enabled: !!targetOrderId
  });

  const order = orderResponse;

  const handleSelectOrder = (id) => {
    setSelectedOrderId(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl md:text-3xl font-display font-bold">Delivery Tracking</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your active orders, check assigned drivers, and view delivery updates.
        </p>
      </div>

      {listLoading ? (
        <TrackingSkeleton />
      ) : listError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load active dispatches</p>
          <button onClick={() => refetchList()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <Map className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 stroke-[1.25]" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No active dispatches</p>
          <p className="text-xs text-slate-400 mt-1">You don't have any placed or in-transit orders right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Active / Recent Orders List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Dispatch</h3>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {orders.map((o) => {
                const isActive = ['placed', 'confirmed', 'out_for_delivery'].includes(o.status);
                const isSelected = o.id === targetOrderId;
                return (
                  <div
                    key={o.id}
                    onClick={() => handleSelectOrder(o.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/10 border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-dark-card border-slate-200/60 dark:border-dark-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{o.order_id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center justify-between text-xxs text-slate-400">
                      <span>{format(new Date(o.delivery_date), 'dd MMM yyyy')} • {o.delivery_slot}</span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-blue-500 font-bold">
                          Active Dispatch
                          <CircleDot className="h-2 w-2 animate-pulse fill-blue-500" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: tracking Details & Timeline Progress */}
          <div className="lg:col-span-2">
            {detailsLoading ? (
              <div className="flex items-center justify-center p-12 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl h-80">
                <div className="flex flex-col items-center gap-2 text-sm text-slate-400">
                  <Loader className="h-6 w-6 animate-spin text-blue-500" />
                  <span>Loading tracking data...</span>
                </div>
              </div>
            ) : detailsError || !order ? (
              <div className="text-center p-12 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                 <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Failed to load dispatch details</p>
                <button onClick={() => refetchDetails()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Details Summary Card */}
                <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-dark-border/40 pb-4 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Tracking Order</span>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{order.order_id}</h2>
                    </div>
                    <div className="flex flex-col items-end text-right sm:items-start sm:text-left gap-1">
                      <StatusBadge status={order.status} />
                      <span className="text-xxs text-slate-400">
                        Placed on {format(new Date(order.created_at || new Date()), 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex gap-2">
                      <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Estimated Date</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {format(new Date(order.delivery_date), 'EEEE, dd MMM yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Delivery Time Slot</span>
                        <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                          {order.delivery_slot} Delivery
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:col-span-2 border-t border-slate-50 dark:border-dark-border/10 pt-3">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Recipient Address</span>
                        <p className="text-slate-600 dark:text-slate-300">
                          {order.delivery_address?.line1}
                          {order.delivery_address?.line2 ? `, ${order.delivery_address.line2}` : ''} <br />
                          {order.delivery_address?.city}, {order.delivery_address?.state} - {order.delivery_address?.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline Progress Tracker */}
                {!['cancelled', 'failed'].includes(order.status) && (
                  <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-5">Delivery Progress</h3>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative">
                      {/* Connector Line */}
                      <div className="absolute left-[15px] sm:left-4 sm:right-4 top-4 sm:top-[15px] bottom-4 sm:bottom-auto w-0.5 sm:w-auto sm:h-0.5 bg-slate-100 dark:bg-dark-border -z-0"></div>
                      
                      {Object.keys(STATUS_PROGRESS).map((statusKey) => {
                        const stepConfig = STATUS_PROGRESS[statusKey];
                        const orderStep = STATUS_PROGRESS[order.status]?.step || 1;
                        const isCompleted = stepConfig.step <= orderStep;
                        const isCurrent = stepConfig.step === orderStep;

                        return (
                          <div key={statusKey} className="flex sm:flex-col items-center gap-3 sm:gap-2 z-10 flex-1 w-full">
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs transition-colors ${
                                isCompleted
                                  ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                  : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-400'
                              }`}
                            >
                              {isCompleted && stepConfig.step < orderStep ? (
                                <CheckCircle2 className="h-4 w-4 fill-white text-blue-500" />
                              ) : (
                                stepConfig.step
                              )}
                            </span>
                            <div className="text-left sm:text-center space-y-0.5">
                              <span className={`text-xs font-bold block ${isCurrent ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                {stepConfig.label}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                {stepConfig.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Driver / Delivery Partner details */}
                {!['cancelled', 'failed'].includes(order.status) && (
                  <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Delivery Partner</h3>
                    
                    {order.delivery_agent_details ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 rounded-full bg-blue-50 dark:bg-dark-hover flex items-center justify-center text-blue-500 font-bold border border-blue-100 dark:border-dark-border">
                            <User className="h-5 w-5" />
                          </span>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Assigned Driver</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{order.delivery_agent_details.name}</h4>
                          </div>
                        </div>

                        <a
                          href={`tel:${order.delivery_agent_details.phone}`}
                          className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-650 dark:text-slate-250 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold transition-all"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call Partner
                        </a>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-dark-hover/10 border border-slate-200 dark:border-dark-border/40 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin text-slate-400" />
                        <span>Delivery partner will be assigned soon.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* detailed order Timeline Log */}
                <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Detailed Timeline</h3>

                  <div className="space-y-4">
                    {(order.timeline || []).map((t, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        {idx !== order.timeline.length - 1 && (
                          <div className="absolute left-1.5 top-3.5 bottom-0 w-0.5 bg-slate-200 dark:bg-dark-border"></div>
                        )}
                        <div className="h-3 w-3 rounded-full bg-blue-500 border border-white mt-1 shrink-0 z-10"></div>
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{t.status}</span>
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
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

const TrackingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="bg-slate-200 dark:bg-dark-hover/60 h-80 rounded-2xl border border-slate-200 dark:border-dark-border"></div>
      <div className="lg:col-span-2 bg-slate-200 dark:bg-dark-hover/60 h-80 rounded-2xl border border-slate-200 dark:border-dark-border"></div>
    </div>
  );
};

export default CustomerTracking;
