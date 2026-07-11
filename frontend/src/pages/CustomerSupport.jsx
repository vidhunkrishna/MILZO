import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LifeBuoy, Plus, Send, X, ArrowLeft, Loader, 
  AlertCircle, MessageSquare, ShieldAlert, Badge, User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { staggerContainer, staggerChild } from '../lib/animations';

const TICKET_TYPES = [
  { id: 'complaint', name: 'Complaint' },
  { id: 'query', name: 'General Query' },
  { id: 'suggestion', name: 'Suggestion' },
  { id: 'review', name: 'Review' },
];

const TICKET_CATEGORIES = [
  { id: 'delivery', name: 'Delivery Issue' },
  { id: 'product_quality', name: 'Product Quality' },
  { id: 'billing', name: 'Billing / Wallet' },
  { id: 'agent_behavior', name: 'Agent Behavior' },
  { id: 'app_issue', name: 'App Issue' },
  { id: 'other', name: 'Other' },
];

const TICKET_PRIORITIES = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
  { id: 'critical', name: 'Critical' },
];

const CustomerSupport = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const limit = 6;

  // New Ticket Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('complaint');
  const [category, setCategory] = useState('delivery');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Selected Ticket details (chat thread)
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch tickets list
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerTickets', page],
    queryFn: async () => {
      const res = await api.get('/feedback', { params: { page, limit } });
      return res.data;
    },
    keepPreviousData: true,
  });

  const tickets = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };

  // Fetch selected ticket detail (including comments thread)
  const { data: selectedTicket, isLoading: detailsLoading, refetch: refetchDetails } = useQuery({
    queryKey: ['ticketDetails', selectedTicketId],
    queryFn: async () => {
      const res = await api.get(`/feedback/${selectedTicketId}`);
      return res.data.data;
    },
    enabled: !!selectedTicketId,
  });

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return toast.error('Please enter a title and description');
    }

    const payload = {
      title,
      type,
      category,
      priority,
      description,
    };

    try {
      setIsCreating(true);
      await api.post('/feedback', payload);
      toast.success('Support ticket created successfully!');
      setIsDrawerOpen(false);
      setTitle('');
      setDescription('');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit support ticket');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.post(`/feedback/${selectedTicketId}/comments`, { text: commentText });
      setCommentText('');
      refetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">Help & Support</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit complaints, review resolution progress, and chat with agent support.
          </p>
        </div>

        <motion.button
          onClick={() => setIsDrawerOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5 justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/10 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-4 w-4" />
          Raise Ticket
        </motion.button>
      </div>

      {/* Tickets Grid */}
      {isLoading ? (
        <TicketsSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load support tickets</p>
          <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <LifeBuoy className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 stroke-[1.25]" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No support tickets</p>
          <p className="text-xs text-slate-400 mt-1">Need help with delivery or payments? Raise a support ticket.</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
          >
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                variants={staggerChild}
              >
                <div>
                  {/* Top line details */}
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-dark-border/40 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        {ticket.ticket_id}
                      </span>
                      <span className="text-xxs capitalize text-slate-400 block mt-0.5 font-bold">
                        {ticket.category?.replace('_', ' ')} • Priority {ticket.priority}
                      </span>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {ticket.title}
                  </h3>
                  <p className="text-xxs text-slate-450 dark:text-slate-400 mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>

                {/* Footer Details */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border/40 pt-3 mt-4 text-xxs text-slate-400">
                  <span>Opened {format(new Date(ticket.created_at), 'dd MMM yyyy')}</span>
                  <span className="inline-flex items-center gap-1 text-blue-500 font-bold hover:translate-x-0.5 transition-transform">
                    Chat Thread &rarr;
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

      {/* Raise Ticket Form Drawer */}
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

              <form onSubmit={handleCreateTicket}>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Raise Support Ticket</h3>
                  
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Ticket Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of your concern..."
                      className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Type & Category & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Ticket Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {TICKET_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {TICKET_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {TICKET_PRIORITIES.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Detailed Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please explain the problem in detail so our support staff can resolve it quickly..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[5.5rem] resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Footer Actions */}
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
                    {isCreating ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Details Chat Modal */}
      <AnimatePresence>
        {selectedTicketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm p-0 md:p-4">
            <motion.div
              className="bg-white dark:bg-dark-card h-full md:h-[95vh] w-full max-w-md md:rounded-2xl border-l md:border border-slate-200 dark:border-dark-border overflow-hidden shadow-2xl flex flex-col justify-between"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between shrink-0">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Ticket Chat</h3>
              </div>

              {/* Chat Body & Timeline */}
              {detailsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400">
                  <Loader className="h-5 w-5 animate-spin mb-1 text-blue-500" />
                  Loading chat thread...
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* Ticket Summary Details */}
                    <div className="border-b border-slate-100 dark:border-dark-border/40 pb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.ticket_id}</span>
                        <StatusBadge status={selectedTicket.status} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedTicket.title}</h4>
                      <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-dark-hover/10 p-3 rounded-xl border border-slate-200 dark:border-dark-border/20">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Resolution Section if solved */}
                    {selectedTicket.status === 'resolved' && selectedTicket.resolution && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-xl space-y-1 text-xxs">
                        <span className="font-bold uppercase tracking-wider block">Resolution Note</span>
                        <p className="italic">"{selectedTicket.resolution.notes || 'Issue resolved.'}"</p>
                        <span className="text-[9px] text-emerald-600 block mt-1">
                          Resolved on {format(new Date(selectedTicket.resolution.resolvedAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>
                    )}

                    {/* Comments list thread */}
                    <div className="space-y-4">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Chat History</span>
                      
                      {(selectedTicket.comments || []).length === 0 ? (
                        <div className="text-center py-6 text-xxs text-slate-400 italic">
                          No replies yet. Our support agents will write soon.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {(selectedTicket.comments || []).map((c, i) => {
                            const isUser = c.author === selectedTicket.customer || (authUser && c.author === (authUser.id || authUser._id));
                            return (
                              <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xxs ${
                                  isUser
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-slate-100 dark:bg-dark-hover text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-dark-border/40'
                                }`}>
                                  <p className="leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 block">
                                  {isUser ? 'You' : (c.author_name || 'Agent')} • {format(new Date(c.created_at), 'dd MMM hh:mm a')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Comment Input Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-dark-hover/10 border-t border-slate-100 dark:border-dark-border/40 shrink-0">
                    {['closed', 'resolved'].includes(selectedTicket.status) ? (
                      <div className="text-center text-xxs text-slate-400 italic py-2">
                        This ticket is {selectedTicket.status} and cannot receive replies.
                      </div>
                    ) : (
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type your reply message..."
                          className="flex-1 px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border h-44 rounded-2xl"></div>
      ))}
    </div>
  );
};

export default CustomerSupport;
