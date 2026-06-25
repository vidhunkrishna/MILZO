import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FileDown } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const CUSTOMER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'blocked', label: 'Blocked' },
];

const DELIVERY_SLOTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'both', label: 'Both' },
];

const Customers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddressLine1, setFormAddressLine1] = useState('');
  const [formAddressLine2, setFormAddressLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formWallet, setFormWallet] = useState(0);
  const [formStatus, setFormStatus] = useState('active');
  const [formDeliverySlot, setFormDeliverySlot] = useState('morning');

  // Fetch query
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data;
    },
    retry: false
  });

  const listData = customerData || [];
  
  // Filter search
  const filteredData = listData.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  // CRUD actions
  const openAddModal = () => {
    setSelectedCust(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddressLine1('');
    setFormAddressLine2('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormLandmark('');
    setFormWallet(0);
    setFormStatus('active');
    setFormDeliverySlot('morning');
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setSelectedCust(cust);
    setFormName(cust.name || '');
    setFormEmail(cust.email || '');
    setFormPhone(cust.phone || '');
    setFormAddressLine1(cust.address_line1 || '');
    setFormAddressLine2(cust.address_line2 || '');
    setFormCity(cust.city || '');
    setFormState(cust.state || '');
    setFormPincode(cust.pincode || '');
    setFormLandmark(cust.landmark || '');
    setFormWallet(cust.wallet_balance || 0);
    setFormStatus(cust.status || 'active');
    setFormDeliverySlot(cust.delivery_slot_pref || 'morning');
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (cust) => {
    setSelectedCust(cust);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      return toast.error('Name and phone are required');
    }

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      address: {
        line1: formAddressLine1,
        line2: formAddressLine2,
        city: formCity,
        state: formState,
        pincode: formPincode,
        landmark: formLandmark,
      },
      wallet: { balance: parseFloat(formWallet) || 0 },
      status: formStatus,
      preferences: {
        deliverySlot: formDeliverySlot,
      },
    };

    try {
      if (selectedCust) {
        await api.put(`/customers/${selectedCust._id}`, payload);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer created successfully!');
      }
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save customer';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${selectedCust._id}`);
      toast.success('Customer profile deleted!');
      queryClient.invalidateQueries(['customers']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete customer';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Customer records exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const columns = [
    { label: 'Name', key: 'name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500">{row.customer_id || row._id}</div>
      </div>
    )},
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Address', key: 'address_line1', render: (row) => (
      <span className="truncate max-w-xs block" title={row.address_line1}>
        {row.address_line1}{row.city ? `, ${row.city}` : ''}
      </span>
    )},
    { label: 'Wallet Balance', key: 'wallet_balance', render: (row) => (
      <span className={`font-semibold ${(row.wallet_balance || 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
        ₹{row.wallet_balance || 0}
      </span>
    )},
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage accounts, wallet balances, and subscriptions.</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs bg-slate-100 dark:bg-dark-hover">
            <FileDown className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search customers by name, email..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Customer"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCust ? 'Modify Customer Profile' : 'Register New Customer'}
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
                placeholder="Aarav Mehta"
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
                placeholder="9876543210"
                required
              />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="aarav@gmail.com"
              />
            </div>
            <div>
              <label className="input-label">Initial Wallet Balance (₹)</label>
              <input
                type="number"
                className="input-field"
                value={formWallet}
                onChange={(e) => setFormWallet(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="input-label">Address Line 1 *</label>
            <input
              type="text"
              className="input-field"
              value={formAddressLine1}
              onChange={(e) => setFormAddressLine1(e.target.value)}
              placeholder="B-402, Green Glen Layout"
              required
            />
          </div>
          <div>
            <label className="input-label">Address Line 2</label>
            <input
              type="text"
              className="input-field"
              value={formAddressLine2}
              onChange={(e) => setFormAddressLine2(e.target.value)}
              placeholder="Near Park, Sector 5"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">City *</label>
              <input
                type="text"
                className="input-field"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="Bangalore"
                required
              />
            </div>
            <div>
              <label className="input-label">State *</label>
              <input
                type="text"
                className="input-field"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                placeholder="Karnataka"
                required
              />
            </div>
            <div>
              <label className="input-label">Pincode *</label>
              <input
                type="text"
                className="input-field"
                value={formPincode}
                onChange={(e) => setFormPincode(e.target.value)}
                placeholder="560001"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Landmark</label>
              <input
                type="text"
                className="input-field"
                value={formLandmark}
                onChange={(e) => setFormLandmark(e.target.value)}
                placeholder="Near Big Bazaar"
              />
            </div>
            <div>
              <label className="input-label">Delivery Slot Preference</label>
              <select
                className="input-field"
                value={formDeliverySlot}
                onChange={(e) => setFormDeliverySlot(e.target.value)}
              >
                {DELIVERY_SLOTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Profile Status</label>
            <select
              className="input-field"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              {CUSTOMER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer Profile"
        message={`Are you sure you want to permanently delete customer profile for ${selectedCust?.name}? This removes their subscription plan and active bookings.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
};

export default Customers;
