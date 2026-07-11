import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { MessageSquare, ShieldAlert, Check, Loader, Send } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const mockFeedbacks = [
  { _id: 'FBK001', customerName: 'Aarav Mehta', category: 'Delivery Delay', comment: 'Milk delivered at 8:30 AM instead of 6:00 AM.', date: '2026-06-21', severity: 'Medium', status: 'Open' },
  { _id: 'FBK002', customerName: 'Neha Sharma', category: 'Quality Issue', comment: 'Bottle cap was leaky. Milk spilled in tray.', date: '2026-06-20', severity: 'High', status: 'Escalated' },
  { _id: 'FBK003', customerName: 'Rohan Gupta', category: 'Billing Query', comment: 'Double charged for yesterday alternate subscription.', date: '2026-06-19', severity: 'Low', status: 'Resolved' },
  { _id: 'FBK004', customerName: 'Priya Patel', category: 'Other', comment: 'Loved the butter quality, outstanding flavor!', date: '2026-06-18', severity: 'Low', status: 'Resolved' },
];

const Feedback = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Form Response
  const [responseComment, setResponseComment] = useState('');
  const [formSeverity, setFormSeverity] = useState('Low');
  const [formStatus, setFormStatus] = useState('Open');
  const [adminCommentText, setAdminCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch comments thread when ticket is selected
  const { data: ticketDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['adminTicketDetails', selectedTicketId],
    queryFn: async () => {
      const res = await api.get(`/feedback/${selectedTicketId}`);
      return res.data.data;
    },
    enabled: !!selectedTicketId,
  });

  const handleAdminCommentSubmit = async (e) => {
    e.preventDefault();
    if (!adminCommentText.trim()) return;
    try {
      setIsSubmittingComment(true);
      await api.post(`/feedback/${selectedTicketId}/comments`, { text: adminCommentText });
      setAdminCommentText('');
      toast.success('Message sent to customer!');
      queryClient.invalidateQueries(['adminTicketDetails', selectedTicketId]);
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Fetch feedback
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const response = await api.get('/feedback');
      return response.data.data;
    },
    retry: false
  });

  const listData = feedbackData || mockFeedbacks;

  const filteredData = listData.filter(f =>
    (f.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (feedback) => {
    setSelectedFeedback(feedback);
    setSelectedTicketId(feedback._id);
    setFormSeverity(feedback.severity);
    setFormStatus(feedback.status);
    setResponseComment('');
    setIsModalOpen(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();

    const payload = {
      severity: formSeverity,
      status: formStatus,
      comment: responseComment,
    };

    try {
      await api.put(`/feedback/resolve/${selectedFeedback._id}`, payload);
      toast.success('Ticket response filed successfully!');
    } catch (err) {
      toast.success('Ticket response filed (Mock)!');
    } finally {
      setIsModalOpen(false);
      queryClient.invalidateQueries(['feedbacks']);
    }
  };

  const handleQuickResolve = async (feedback) => {
    try {
      await api.patch(`/feedback/resolve/${feedback._id}`);
      toast.success(`Ticket ${feedback._id} marked as Resolved!`);
    } catch (err) {
      toast.success(`Ticket ${feedback._id} marked as Resolved (Mock)!`);
    } finally {
      queryClient.invalidateQueries(['feedbacks']);
    }
  };

  const columns = [
    { label: 'Ticket ID', key: '_id' },
    { label: 'Customer', key: 'customerName', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.customerName}</span> },
    { label: 'Category', key: 'category' },
    { label: 'Details', key: 'comment', render: (row) => (
      <span className="truncate max-w-xs block text-slate-500 dark:text-slate-400" title={row.comment}>{row.comment}</span>
    )},
    { label: 'File Date', key: 'date' },
    { label: 'Severity', key: 'severity', render: (row) => (
      <span className={`inline-flex items-center gap-1 font-semibold ${
        row.severity === 'High' ? 'text-rose-500' : row.severity === 'Medium' ? 'text-amber-500' : 'text-slate-500'
      }`}>
        {row.severity}
      </span>
    )},
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Resolve', key: 'actions', render: (row) => (
      row.status !== 'Resolved' && (
        <button
          onClick={() => handleQuickResolve(row)}
          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all"
          title="Quick Mark Resolved"
        >
          <Check className="h-4 w-4" />
        </button>
      )
    )}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Support Tickets</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review customer feedback, quality surveys, and resolve grievance tickets.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search tickets by customer, issue category..."
        searchQuery={search}
        onSearch={setSearch}
        actions={{
          onEdit: openEditModal,
          editLabel: 'Respond Ticket',
        }}
      />

      {/* Response Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicketId(null);
        }}
        title="Resolve Support Ticket"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-dark-hover rounded-xl text-xs space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-dark-border/50">
            <p><strong>Customer:</strong> {selectedFeedback?.customerName}</p>
            <p><strong>Issue Category:</strong> {selectedFeedback?.category}</p>
            <p><strong>Grievance Details:</strong> "{selectedFeedback?.comment}"</p>
          </div>

          {/* Chat History / Comments Log */}
          <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-dark-border p-3.5 rounded-xl bg-slate-50/50 dark:bg-dark-hover/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Chat History</span>
            {detailsLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 py-4">
                <Loader className="h-4 w-4 animate-spin text-blue-500" />
                <span>Loading replies...</span>
              </div>
            ) : (ticketDetails?.comments || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic block py-4 text-center">No replies or comments recorded yet.</span>
            ) : (
              <div className="space-y-2.5">
                {(ticketDetails.comments || []).map((c, i) => (
                  <div key={i} className="bg-white dark:bg-dark-card p-2.5 rounded-xl border border-slate-200/50 dark:border-dark-border text-xxs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>{c.author_name} ({c.author_role})</span>
                      <span className="text-[10px] text-slate-400 font-normal">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Reply Form */}
          <form onSubmit={handleAdminCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={adminCommentText}
              onChange={(e) => setAdminCommentText(e.target.value)}
              placeholder="Send a reply message directly to the customer..."
              className="flex-1 px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !adminCommentText.trim()}
              className="p-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center"
            >
              {isSubmittingComment ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>

          {/* Action Form */}
          <form onSubmit={handleResolve} className="space-y-4 border-t border-slate-100 dark:border-dark-border/40 pt-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Ticket Severity</label>
                <select
                  className="input-field"
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="input-label">Ticket Status</label>
                <select
                  className="input-field"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">Staff Resolution Note / Response *</label>
              <textarea
                className="input-field h-20"
                value={responseComment}
                onChange={(e) => setResponseComment(e.target.value)}
                placeholder="Record final resolution notes to solve the ticket..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTicketId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">Resolve Ticket</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Feedback;
