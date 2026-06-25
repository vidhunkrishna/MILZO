import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { MessageSquare, ShieldAlert, Check } from 'lucide-react';
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

  // Form Response
  const [responseComment, setResponseComment] = useState('');
  const [formSeverity, setFormSeverity] = useState('Low');
  const [formStatus, setFormStatus] = useState('Open');

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
    f.customerName.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (feedback) => {
    setSelectedFeedback(feedback);
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
        onClose={() => setIsModalOpen(false)}
        title="Resolve Support Ticket"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-dark-hover rounded-xl text-xs space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-dark-border/50">
            <p><strong>Customer:</strong> {selectedFeedback?.customerName}</p>
            <p><strong>Issue Category:</strong> {selectedFeedback?.category}</p>
            <p><strong>Grievance Details:</strong> "{selectedFeedback?.comment}"</p>
          </div>
          
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
              className="input-field h-24"
              value={responseComment}
              onChange={(e) => setResponseComment(e.target.value)}
              placeholder="Record explanation or dispatch route re-assignments..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Resolve Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Feedback;
