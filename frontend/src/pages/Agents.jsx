import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const AGENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
];

const VEHICLE_TYPES = [
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'three_wheeler', label: 'Three Wheeler' },
];

const Agents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVehicleType, setFormVehicleType] = useState('motorcycle');
  const [formVehicleNumber, setFormVehicleNumber] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  // Fetch agents
  const { data: agentData, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get('/delivery/agents');
      return response.data.data;
    },
    retry: false
  });

  const listData = agentData || [];

  const filteredData = listData.filter(a =>
    (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.vehicle_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.phone || '').includes(search)
  );

  const openAddModal = () => {
    setSelectedAgent(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormVehicleType('motorcycle');
    setFormVehicleNumber('');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setFormName(agent.name || '');
    setFormPhone(agent.phone || '');
    setFormEmail(agent.email || '');
    setFormVehicleType(agent.vehicle_type || 'motorcycle');
    setFormVehicleNumber(agent.vehicle_number || '');
    setFormStatus(agent.status || 'active');
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (agent) => {
    setSelectedAgent(agent);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      return toast.error('Please enter all required fields');
    }

    const payload = {
      name: formName,
      phone: formPhone,
      email: formEmail,
      vehicleType: formVehicleType,
      vehicleNumber: formVehicleNumber,
      status: formStatus,
    };

    try {
      if (selectedAgent) {
        await api.put(`/delivery/agents/${selectedAgent._id}`, payload);
        toast.success('Agent updated successfully!');
      } else {
        await api.post('/delivery/agents', payload);
        toast.success('Agent registered successfully!');
      }
      queryClient.invalidateQueries(['agents']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save agent';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/delivery/agents/${selectedAgent._id}`);
      toast.success('Agent deregistered!');
      queryClient.invalidateQueries(['agents']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete agent';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleVerifyKYC = async (agent) => {
    try {
      await api.patch(`/delivery/agents/${agent._id}/verify`);
      toast.success(`Agent ${agent.name} KYC Verified!`);
      queryClient.invalidateQueries(['agents']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to verify KYC';
      toast.error(msg);
    }
  };

  const getVehicleLabel = (val) => VEHICLE_TYPES.find(v => v.value === val)?.label || val;

  const columns = [
    { label: 'Name', key: 'name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</div>
        <div className="text-[10px] text-slate-400">{row.agent_id || row._id}</div>
      </div>
    )},
    { label: 'Phone', key: 'phone' },
    { label: 'Vehicle', key: 'vehicle_number', render: (row) => (
      <div>
        <div>{row.vehicle_number || '-'}</div>
        <div className="text-[10px] text-slate-400">{getVehicleLabel(row.vehicle_type)}</div>
      </div>
    )},
    { label: 'Rating', key: 'performance', render: (row) => (
      <span className="font-bold text-amber-500">★ {row.performance?.rating || 0}</span>
    )},
    { label: 'Deliveries', key: 'performance', render: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.performance?.totalDeliveries || 0}</span>
    )},
    { label: 'KYC Status', key: 'is_verified', render: (row) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={row.is_verified ? 'active' : 'pending'} />
        {!row.is_verified && (
          <button 
            onClick={() => handleVerifyKYC(row)} 
            className="p-1 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg text-emerald-500 hover:text-emerald-600 transition-all"
            title="Approve KYC Verification"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
      </div>
    )},
    { label: 'Duty Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Delivery Agents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage delivery boys fleet, document validations, ratings, and vehicle logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search agent fleet by name or vehicle..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Register Agent"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAgent ? 'Modify Agent' : 'Register Delivery Agent'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                className="input-field"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Dinesh Karthik"
                required
              />
            </div>
            <div>
              <label className="input-label">Phone Number *</label>
              <input
                type="text"
                className="input-field"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="9550123456"
                required
              />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="agent@email.com"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Vehicle Type</label>
              <select
                className="input-field"
                value={formVehicleType}
                onChange={(e) => setFormVehicleType(e.target.value)}
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Vehicle Registration Number</label>
              <input
                type="text"
                className="input-field"
                value={formVehicleNumber}
                onChange={(e) => setFormVehicleNumber(e.target.value)}
                placeholder="KA-01-EE-1122"
              />
            </div>
          </div>
          <div>
            <label className="input-label">Duty Status</label>
            <select
              className="input-field"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              {AGENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register Agent</button>
          </div>
        </form>
      </Modal>

      {/* Delete Agent */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Deregister Agent"
        message={`Are you sure you want to deregister agent ${selectedAgent?.name}? This will remove them from their assigned delivery routes.`}
      />
    </div>
  );
};

export default Agents;
