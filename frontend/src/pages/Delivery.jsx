import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Map, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const mockRoutes = [
  { _id: 'RTE001', name: 'Koramangala Route A', startPoint: 'MILZO Hub 1', endPoint: 'Koramangala 8th Block', stops: 18, agentName: 'Suresh Raina', distance: '12 km', status: 'Active' },
  { _id: 'RTE002', name: 'HSR Route 3', startPoint: 'MILZO Hub 1', endPoint: 'HSR Layout Sector 7', stops: 22, agentName: 'Vijay Kumar', distance: '15 km', status: 'Active' },
  { _id: 'RTE003', name: 'Whitefield Route B', startPoint: 'MILZO Hub Whitefield', endPoint: 'Channasandra Layout', stops: 15, agentName: 'Amit Mishra', distance: '8 km', status: 'Active' },
  { _id: 'RTE004', name: 'Indiranagar Route C', startPoint: 'MILZO Hub 1', endPoint: 'Defence Colony', stops: 25, agentName: 'Unassigned', distance: '18 km', status: 'Inactive' },
];

const Delivery = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formStops, setFormStops] = useState(10);
  const [formAgent, setFormAgent] = useState('Unassigned');
  const [formDistance, setFormDistance] = useState('5 km');
  const [formStatus, setFormStatus] = useState('Active');

  // Fetch routes
  const { data: routeData, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await api.get('/delivery/routes');
      return response.data.data;
    },
    retry: false
  });

  const listData = routeData || mockRoutes;

  const filteredData = listData.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.agentName.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setSelectedRoute(null);
    setFormName('');
    setFormStart('MILZO Hub 1');
    setFormEnd('');
    setFormStops(10);
    setFormAgent('Unassigned');
    setFormDistance('5 km');
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setFormName(route.name);
    setFormStart(route.startPoint);
    setFormEnd(route.endPoint);
    setFormStops(route.stops);
    setFormAgent(route.agentName);
    setFormDistance(route.distance);
    setFormStatus(route.status);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (route) => {
    setSelectedRoute(route);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formEnd) return toast.error('Please enter Route Name and End Point');

    const payload = {
      name: formName,
      startPoint: formStart,
      endPoint: formEnd,
      stops: parseInt(formStops),
      agentName: formAgent,
      distance: formDistance,
      status: formStatus,
    };

    try {
      if (selectedRoute) {
        await api.put(`/delivery/routes/${selectedRoute._id}`, payload);
        toast.success('Route updated successfully!');
      } else {
        await api.post('/delivery/routes', payload);
        toast.success('Route created successfully!');
      }
      queryClient.invalidateQueries(['routes']);
      setIsModalOpen(false);
    } catch (err) {
      toast.success(selectedRoute ? 'Route updated (Mock)!' : 'Route created (Mock)!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/delivery/routes/${selectedRoute._id}`);
      toast.success('Route deleted!');
    } catch (err) {
      toast.success('Route deleted (Mock)!');
    } finally {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries(['routes']);
    }
  };

  const columns = [
    { label: 'Route Name', key: 'name', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</span> },
    { label: 'Start Point', key: 'startPoint' },
    { label: 'End Point/Boundary', key: 'endPoint' },
    { label: 'Stops', key: 'stops', render: (row) => <span className="font-semibold">{row.stops} stops</span> },
    { label: 'Distance', key: 'distance' },
    { label: 'Assigned Agent', key: 'agentName', render: (row) => (
      <span className={row.agentName === 'Unassigned' ? 'text-amber-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
        {row.agentName}
      </span>
    )},
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Delivery Routes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage delivery service zones and stops per distribution area.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search routes by name or agent..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Route"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoute ? 'Modify Route' : 'Establish Route'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Route Name *</label>
              <input
                type="text"
                className="input-field"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Koramangala Route A"
                required
              />
            </div>
            <div>
              <label className="input-label">Distance</label>
              <input
                type="text"
                className="input-field"
                value={formDistance}
                onChange={(e) => setFormDistance(e.target.value)}
                placeholder="10 km"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Point</label>
              <input
                type="text"
                className="input-field"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                placeholder="MILZO Hub 1"
              />
            </div>
            <div>
              <label className="input-label">End Point / Hub Boundary *</label>
              <input
                type="text"
                className="input-field"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                placeholder="Koramangala 8th Block"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Stops Count</label>
              <input
                type="number"
                className="input-field"
                value={formStops}
                onChange={(e) => setFormStops(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Assigned Delivery Agent</label>
              <select
                className="input-field"
                value={formAgent}
                onChange={(e) => setFormAgent(e.target.value)}
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Suresh Raina">Suresh Raina</option>
                <option value="Vijay Kumar">Vijay Kumar</option>
                <option value="Amit Mishra">Amit Mishra</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Route Status</label>
            <select
              className="input-field"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Route</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Delivery Route"
        message={`Are you sure you want to delete route ${selectedRoute?.name}? Unresolved orders on this route will need manual re-assignment.`}
      />
    </div>
  );
};

export default Delivery;
