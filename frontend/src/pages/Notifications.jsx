import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Bell, Eye, CheckCheck, Trash2 } from 'lucide-react';
import api from '../services/api';
import { markRead, markAllRead, setNotifications } from '../redux/slices/notificationSlice';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const Notifications = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { items: notifications, isLoading } = useSelector((state) => state.notifications);

  // Fetch notifications
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      dispatch(setNotifications(response.data.data));
      return response.data.data;
    },
    retry: false
  });

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markRead(id));
      toast.success('Alert marked as read');
    } catch (err) {
      dispatch(markRead(id));
      toast.success('Alert marked as read (Mock)');
    } finally {
      queryClient.invalidateQueries(['notifications']);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      dispatch(markAllRead());
      toast.success('All alerts marked as read');
    } catch (err) {
      dispatch(markAllRead());
      toast.success('All alerts marked as read (Mock)');
    } finally {
      queryClient.invalidateQueries(['notifications']);
    }
  };

  const columns = [
    { label: 'Roster Date', key: 'createdAt', render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span> },
    { label: 'Notification Alert Message', key: 'message', render: (row) => (
      <span className={!row.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
        {row.message}
      </span>
    )},
    { label: 'Category', key: 'type', render: (row) => (
      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-dark-hover rounded font-semibold capitalize text-slate-500">
        {row.type || 'system'}
      </span>
    )},
    { label: 'Status', key: 'read', render: (row) => (
      <StatusBadge status={row.read ? 'Read' : 'Unread'} />
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Notifications Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Audit live warning alerts, low inventory reminders, and customer cancellations.</p>
        </div>

        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAll}
            className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs font-semibold"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        loading={isLoading}
        searchPlaceholder="Filter system notifications..."
        actions={{
          onView: (row) => handleMarkRead(row._id),
          viewLabel: 'Mark Read',
        }}
      />
    </div>
  );
};

export default Notifications;
