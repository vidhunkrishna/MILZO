import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Clock, Check, X, Calendar } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const mockShifts = [
  { _id: 'SHF001', name: 'Morning Milk Dispatch', startTime: '04:00 AM', endTime: '08:00 AM', activeAgentsCount: 12, status: 'Active' },
  { _id: 'SHF002', name: 'Evening Curd Run', startTime: '05:00 PM', endTime: '08:00 PM', activeAgentsCount: 8, status: 'Active' },
];

const mockAttendance = [
  { _id: 'ATT001', agentName: 'Suresh Raina', shiftName: 'Morning Milk Dispatch', date: '2026-06-21', status: 'Present' },
  { _id: 'ATT002', agentName: 'Vijay Kumar', shiftName: 'Morning Milk Dispatch', date: '2026-06-21', status: 'Present' },
  { _id: 'ATT003', agentName: 'Amit Mishra', shiftName: 'Morning Milk Dispatch', date: '2026-06-21', status: 'Absent' },
  { _id: 'ATT004', agentName: 'Dinesh Karthik', shiftName: 'Morning Milk Dispatch', date: '2026-06-21', status: 'Leave' },
];

const Shifts = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('shifts'); // shifts, attendance
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('04:00 AM');
  const [formEnd, setFormEnd] = useState('08:00 AM');

  // Fetch shifts
  const { data: shiftData, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await api.get('/shifts');
      return response.data.data;
    },
    retry: false
  });

  const listShifts = shiftData || mockShifts;

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!formName) return toast.error('Enter Shift Name');

    const payload = {
      name: formName,
      startTime: formStart,
      endTime: formEnd,
      activeAgentsCount: 0,
      status: 'Active',
    };

    try {
      await api.post('/shifts', payload);
      toast.success('Shift timetable saved!');
    } catch (err) {
      toast.success('Shift timetable saved (Mock)!');
    } finally {
      setIsModalOpen(false);
      queryClient.invalidateQueries(['shifts']);
    }
  };

  const handleMarkAttendance = async (id, status) => {
    try {
      await api.post(`/shifts/attendance/${id}`, { status });
      toast.success(`Marked attendance as ${status}!`);
    } catch (err) {
      toast.success(`Marked attendance as ${status} (Mock)!`);
    }
  };

  const shiftColumns = [
    { label: 'Shift ID', key: '_id' },
    { label: 'Shift Name', key: 'name', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</span> },
    { label: 'Start Time', key: 'startTime' },
    { label: 'End Time', key: 'endTime' },
    { label: 'Agents Rostered', key: 'activeAgentsCount', render: (row) => <span className="font-semibold">{row.activeAgentsCount} rostered</span> },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const attendanceColumns = [
    { label: 'Agent Name', key: 'agentName', render: (row) => <span className="font-semibold">{row.agentName}</span> },
    { label: 'Shift Name', key: 'shiftName' },
    { label: 'Roster Date', key: 'date' },
    { label: 'Attendance Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Register Roster', key: 'actions', render: (row) => (
      <div className="flex gap-2">
        <button 
          onClick={() => handleMarkAttendance(row._id, 'Present')} 
          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all"
          title="Mark Present"
        >
          <Check className="h-4 w-4" />
        </button>
        <button 
          onClick={() => handleMarkAttendance(row._id, 'Absent')} 
          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all"
          title="Mark Absent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Shifts & Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Define milk dispatch delivery times, record staff check-ins and absences.</p>
        </div>
        
        {/* Tab Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-dark-hover p-1 border border-slate-200/50 dark:border-dark-border/50">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'shifts' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Shift Configurations
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'attendance' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Live Attendance
          </button>
        </div>
      </div>

      {activeTab === 'shifts' ? (
        <DataTable
          columns={shiftColumns}
          data={listShifts}
          loading={isLoading}
          searchPlaceholder="Search shift profiles..."
          onCreateClick={() => {
            setFormName('');
            setIsModalOpen(true);
          }}
          createLabel="Configure Shift"
        />
      ) : (
        <DataTable
          columns={attendanceColumns}
          data={mockAttendance}
          searchPlaceholder="Search agent attendance logs..."
        />
      )}

      {/* Roster Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish Shift Period"
      >
        <form onSubmit={handleSaveShift} className="space-y-4">
          <div>
            <label className="input-label">Shift Name *</label>
            <input
              type="text"
              className="input-field"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Morning Milk Dispatch"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Time *</label>
              <input
                type="text"
                className="input-field"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                placeholder="04:00 AM"
                required
              />
            </div>
            <div>
              <label className="input-label">End Time *</label>
              <input
                type="text"
                className="input-field"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                placeholder="08:00 AM"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Timetable</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Shifts;
