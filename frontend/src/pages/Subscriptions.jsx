import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { RefreshCw, Play, Pause, X } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const mockSubs = [
  { _id: 'SUB001', customerName: 'Aarav Mehta', product: 'Cow Milk (1L)', quantity: 2, frequency: 'Daily', startDate: '2026-05-01', nextDelivery: '2026-06-22', status: 'Subscribed' },
  { _id: 'SUB002', customerName: 'Neha Sharma', product: 'Full Cream (1L)', quantity: 1, frequency: 'Alternate Days', startDate: '2026-05-15', nextDelivery: '2026-06-23', status: 'Subscribed' },
  { _id: 'SUB003', customerName: 'Rohan Gupta', product: 'Buffalo Milk (1L)', quantity: 1, frequency: 'Daily', startDate: '2026-06-01', nextDelivery: '-', status: 'Paused' },
  { _id: 'SUB004', customerName: 'Priya Patel', product: 'Cow Milk (1L)', quantity: 2, frequency: 'Weekly', startDate: '2026-04-10', nextDelivery: '2026-06-28', status: 'Subscribed' },
  { _id: 'SUB005', customerName: 'Kabir Dev', product: 'Full Cream (1L)', quantity: 1, frequency: 'Daily', startDate: '2026-02-12', nextDelivery: '-', status: 'Cancelled' },
];

const Subscriptions = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // Form State
  const [formCust, setFormCust] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formFreq, setFormFreq] = useState('daily');
  const [formDeliverySlot, setFormDeliverySlot] = useState('morning');
  const [formStatus, setFormStatus] = useState('active');

  // Fetch subscriptions
  const { data: subData, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await api.get('/subscriptions');
      return response.data.data;
    },
    retry: false
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data;
    },
    retry: false
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data.data;
    },
    retry: false
  });

  const listData = subData || mockSubs;

  const filteredData = listData.filter(s => {
    const custName = s.customer?.name || s.customerName || '';
    const prodName = s.product?.name || s.product || '';
    return custName.toLowerCase().includes(search.toLowerCase()) ||
           prodName.toLowerCase().includes(search.toLowerCase());
  });

  const openAddModal = () => {
    setSelectedSub(null);
    setFormCust(customers[0]?.id || '');
    setFormProduct(products[0]?.id || '');
    setFormQty(1);
    setFormFreq('daily');
    setFormDeliverySlot('morning');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setSelectedSub(sub);
    setFormCust(sub.customer?.id || sub.customer || '');
    setFormProduct(sub.product?.id || sub.product || '');
    setFormQty(sub.quantity);
    setFormFreq(sub.plan_type || sub.planType || 'daily');
    setFormDeliverySlot(sub.delivery_slot || 'morning');
    setFormStatus(sub.status || 'active');
    setIsModalOpen(true);
  };

  const openCancelConfirm = (sub) => {
    setSelectedSub(sub);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formCust || !formProduct) return toast.error('Enter all required fields');

    const selectedProd = products.find(p => p.id === formProduct);
    const pricePerUnit = selectedProd ? parseFloat(selectedProd.price) : 50;

    const payload = {
      customer: formCust,
      product: formProduct,
      quantity: parseInt(formQty),
      planType: formFreq,
      deliverySlot: formDeliverySlot,
      pricePerUnit: pricePerUnit,
      status: formStatus,
      startDate: new Date().toISOString().split('T')[0],
      nextDeliveryDate: formStatus === 'active' ? new Date().toISOString().split('T')[0] : null,
    };

    try {
      if (selectedSub) {
        await api.put(`/subscriptions/${selectedSub._id}`, payload);
        toast.success('Subscription plan updated!');
      } else {
        await api.post('/subscriptions', payload);
        toast.success('Subscription program registered!');
      }
      queryClient.invalidateQueries(['subscriptions']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save subscription';
      toast.error(msg);
    }
  };

  const handleToggleState = async (sub) => {
    const isPaused = sub.status?.toLowerCase() === 'paused';
    const action = isPaused ? 'resume' : 'pause';
    try {
      await api.patch(`/subscriptions/${sub._id}/${action}`);
      toast.success(`Subscription plan ${isPaused ? 'resumed' : 'paused'}!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update subscription status';
      toast.error(msg);
    } finally {
      queryClient.invalidateQueries(['subscriptions']);
    }
  };

  const handleCancelSub = async () => {
    try {
      await api.patch(`/subscriptions/${selectedSub._id}/cancel`, { reason: 'Terminated by admin' });
      toast.success('Subscription terminated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to terminate subscription';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries(['subscriptions']);
    }
  };

  const columns = [
    { label: 'Sub ID', key: '_id' },
    { label: 'Customer', key: 'customerName', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.customer?.name || row.customerName || 'Unknown'}</span> },
    { label: 'Product Item', key: 'product', render: (row) => (
      <span>{(row.product?.name || row.product || 'Unknown')} <strong className="text-indigo-500 font-bold">x{row.quantity}</strong></span>
    )},
    { label: 'Frequency', key: 'frequency', render: (row) => <span className="capitalize">{row.plan_type || row.planType || row.frequency}</span> },
    { label: 'Start Date', key: 'startDate', render: (row) => row.start_date || row.startDate },
    { label: 'Next Delivery', key: 'nextDelivery', render: (row) => row.next_delivery_date || row.nextDelivery },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Quick Pause', key: 'actions', render: (row) => (
      row.status?.toLowerCase() !== 'cancelled' && (
        <button
          onClick={() => handleToggleState(row)}
          className={`p-1 border rounded-lg transition-all ${
            row.status?.toLowerCase() === 'paused'
              ? 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 border-emerald-200/50'
              : 'hover:bg-amber-50 text-amber-500 hover:text-amber-600 border-amber-200/50'
          }`}
          title={row.status?.toLowerCase() === 'paused' ? 'Resume Deliveries' : 'Pause Deliveries'}
        >
          {row.status?.toLowerCase() === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )
    )}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Milk Subscriptions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage recurring customer delivery logs, adjust delivery calendars, and handle pauses.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search subscription profiles..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Subscription"
        actions={{
          onEdit: openEditModal,
          onDelete: openCancelConfirm,
          deleteLabel: 'Terminate Plan',
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSub ? 'Modify Subscription Profile' : 'Configure Subscription'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Select Customer *</label>
            <select
              className="input-field"
              value={formCust}
              onChange={(e) => setFormCust(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Product Item *</label>
              <select
                className="input-field"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                required
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Frequency Interval *</label>
              <select
                className="input-field"
                value={formFreq}
                onChange={(e) => setFormFreq(e.target.value)}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Schedules</option>
              </select>
            </div>
            <div>
              <label className="input-label">Delivery Slot *</label>
              <select
                className="input-field"
                value={formDeliverySlot}
                onChange={(e) => setFormDeliverySlot(e.target.value)}
                required
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <select
                className="input-field"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Program</button>
          </div>
        </form>
      </Modal>

      {/* Cancel Sub Confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleCancelSub}
        title="Terminate Subscription Plan"
        message={`Are you sure you want to permanently terminate subscription for ${selectedSub?.customer?.name || selectedSub?.customerName}? This will clear the next delivery slot registry.`}
      />
    </div>
  );
};

export default Subscriptions;
