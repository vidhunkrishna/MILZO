import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { CheckSquare } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const VENDOR_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const Vendors = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form State
  const [formVendorName, setFormVendorName] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState('pending');
  const [formCommission, setFormCommission] = useState(0);

  // Fetch vendors
  const { data: vendorData, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await api.get('/vendors');
      return response.data.data;
    },
    retry: false
  });

  const listData = vendorData || [];

  const filteredData = listData.filter(v =>
    (v.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.phone || '').includes(search)
  );

  const openAddModal = () => {
    setSelectedVendor(null);
    setFormVendorName('');
    setFormOwnerName('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('pending');
    setFormCommission(0);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor) => {
    setSelectedVendor(vendor);
    setFormVendorName(vendor.vendor_name || '');
    setFormOwnerName(vendor.owner_name || '');
    setFormEmail(vendor.email || '');
    setFormPhone(vendor.phone || '');
    setFormStatus(vendor.status || 'pending');
    setFormCommission(vendor.commission_rate || 0);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (vendor) => {
    setSelectedVendor(vendor);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formVendorName || !formOwnerName || !formPhone) return toast.error('Please enter all required fields');

    const payload = {
      vendorName: formVendorName,
      ownerName: formOwnerName,
      email: formEmail,
      phone: formPhone,
      status: formStatus,
      commissionRate: parseFloat(formCommission) || 0,
    };

    try {
      if (selectedVendor) {
        await api.put(`/vendors/${selectedVendor._id}`, payload);
        toast.success('Vendor updated successfully!');
      } else {
        await api.post('/vendors', payload);
        toast.success('Vendor registered successfully!');
      }
      queryClient.invalidateQueries(['vendors']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save vendor';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vendors/${selectedVendor._id}`);
      toast.success('Vendor account deleted!');
      queryClient.invalidateQueries(['vendors']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete vendor';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleApproveKYC = async (vendor) => {
    try {
      await api.patch(`/vendors/${vendor._id}/verify-kyc`);
      toast.success(`Vendor ${vendor.vendor_name} KYC approved!`);
      queryClient.invalidateQueries(['vendors']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to approve KYC';
      toast.error(msg);
    }
  };

  const columns = [
    { label: 'Vendor & Hub', key: 'vendor_name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-200">{row.vendor_name}</div>
        <div className="text-xs text-slate-400">{row.owner_name}</div>
      </div>
    )},
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Rating', key: 'rating', render: (row) => <span className="font-bold text-indigo-500">★ {row.rating || 0}</span> },
    { label: 'Payout Due', key: 'pending_payout', render: (row) => (
      <span className={`font-semibold ${(row.pending_payout || 0) < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
        ₹{row.pending_payout || 0}
      </span>
    )},
    { label: 'KYC Status', key: 'kyc', render: (row) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={row.kyc?.verified ? 'active' : 'pending'} />
        {!row.kyc?.verified && (
          <button 
            onClick={() => handleApproveKYC(row)} 
            className="p-1 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg text-emerald-500 hover:text-emerald-600 transition-all"
            title="Approve KYC Documents"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
        )}
      </div>
    )},
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Vendor Network</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Register supply-side dairy partners, configure stock deposits, and check KYC documents.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search vendor by name, shop..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Register Vendor"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedVendor ? 'Modify Vendor Profile' : 'Register Milk Vendor'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Vendor / Dairy Name *</label>
              <input
                type="text"
                className="input-field"
                value={formVendorName}
                onChange={(e) => setFormVendorName(e.target.value)}
                placeholder="Krishna Dairies"
                required
              />
            </div>
            <div>
              <label className="input-label">Owner Name *</label>
              <input
                type="text"
                className="input-field"
                value={formOwnerName}
                onChange={(e) => setFormOwnerName(e.target.value)}
                placeholder="Ramesh Kumar"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="krishna@dairies.com"
              />
            </div>
            <div>
              <label className="input-label">Phone Number *</label>
              <input
                type="text"
                className="input-field"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="9885544332"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={formCommission}
                onChange={(e) => setFormCommission(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="input-label">Status</label>
              <select
                className="input-field"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                {VENDOR_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register Vendor</button>
          </div>
        </form>
      </Modal>

      {/* Delete Vendor */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Deregister Vendor"
        message={`Are you sure you want to deregister supplier vendor ${selectedVendor?.vendor_name}? Active catalog products mapped to this supplier will be locked.`}
      />
    </div>
  );
};

export default Vendors;
