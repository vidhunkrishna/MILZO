import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Calendar, ShoppingCart, CheckCircle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const mockBookings = [
  { _id: 'BKG001', customerName: 'Aarav Mehta', product: 'Organic Ghee (1L)', quantity: 2, amount: 1360, bookingDate: '2026-06-20', deliveryDate: '2026-06-22', status: 'Pending' },
  { _id: 'BKG002', customerName: 'Neha Sharma', product: 'Set Curd (500g)', quantity: 4, amount: 180, bookingDate: '2026-06-21', deliveryDate: '2026-06-21', status: 'Completed' },
  { _id: 'BKG003', customerName: 'Kabir Dev', product: 'Cow Milk (5L Can)', quantity: 1, amount: 320, bookingDate: '2026-06-18', deliveryDate: '2026-06-20', status: 'Completed' },
  { _id: 'BKG004', customerName: 'Anil Kumar', product: 'Organic Butter (1kg)', quantity: 1, amount: 520, bookingDate: '2026-06-21', deliveryDate: '2026-06-23', status: 'Pending' },
];

const Bookings = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form State
  const [formCust, setFormCust] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formDeliveryDate, setFormDeliveryDate] = useState('');
  const [formDeliverySlot, setFormDeliverySlot] = useState('morning');
  const [formStatus, setFormStatus] = useState('pending');

  // Fetch bookings
  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data.data;
    },
    retry: false
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data;
    },
    retry: false
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data.data;
    },
    retry: false
  });

  const listData = bookingData || mockBookings;

  const filteredData = listData.filter(b => {
    const custName = b.customer?.name || b.customerName || '';
    const prodName = b.product?.name || b.product || '';
    return custName.toLowerCase().includes(search.toLowerCase()) ||
           prodName.toLowerCase().includes(search.toLowerCase());
  });

  const openAddModal = () => {
    setSelectedBooking(null);
    setFormCust(customers[0]?.id || '');
    setFormProduct(products[0]?.id || '');
    setFormQty(1);
    setFormDeliveryDate(new Date().toISOString().split('T')[0]);
    setFormDeliverySlot('morning');
    setFormStatus('pending');
    setIsModalOpen(true);
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setFormCust(booking.customer?.id || booking.customer || '');
    setFormProduct(booking.product?.id || booking.product || '');
    setFormQty(booking.quantity);
    setFormDeliveryDate(booking.delivery_date || booking.deliveryDate || '');
    setFormDeliverySlot(booking.delivery_slot || 'morning');
    setFormStatus(booking.status || 'pending');
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (booking) => {
    setSelectedBooking(booking);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formCust || !formDeliveryDate) return toast.error('Please enter all required fields');

    const selectedProd = products.find(p => p.id === formProduct);
    const unitPrice = selectedProd ? parseFloat(selectedProd.price) : 300;

    const payload = {
      customer: formCust,
      product: formProduct,
      quantity: parseInt(formQty),
      price: unitPrice,
      deliveryDate: formDeliveryDate,
      deliverySlot: formDeliverySlot,
      status: formStatus,
    };

    try {
      if (selectedBooking) {
        await api.put(`/bookings/${selectedBooking._id}`, payload);
        toast.success('Booking details updated!');
      } else {
        await api.post('/bookings', payload);
        toast.success('One-time booking created!');
      }
      queryClient.invalidateQueries(['bookings']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save booking';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/bookings/${selectedBooking._id}`);
      toast.success('Booking deleted!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete booking';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries(['bookings']);
    }
  };

  const handleConvertToOrder = async (booking) => {
    try {
      await api.post(`/bookings/${booking._id}/convert`);
      toast.success(`Booking ${booking._id} converted to dispatch Order!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to convert booking';
      toast.error(msg);
    } finally {
      queryClient.invalidateQueries(['bookings']);
    }
  };

  const columns = [
    { label: 'Booking ID', key: '_id' },
    { label: 'Customer', key: 'customerName', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.customer?.name || row.customerName || 'Unknown'}</span> },
    { label: 'Item & Qty', key: 'product', render: (row) => (
      <span>{(row.product?.name || row.product || 'Unknown')} <strong className="text-primary-500 font-bold">x{row.quantity}</strong></span>
    )},
    { label: 'Total Price', key: 'amount', render: (row) => <span className="font-bold">₹{row.total || row.amount || 0}</span> },
    { label: 'Roster Date', key: 'bookingDate', render: (row) => row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : row.bookingDate },
    { label: 'Delivery Date', key: 'deliveryDate', render: (row) => row.delivery_date || row.deliveryDate },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { label: 'Dispatch', key: 'actions', render: (row) => (
      row.status?.toLowerCase() === 'pending' && (
        <button
          onClick={() => handleConvertToOrder(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xxs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
          title="Convert to Active Order"
        >
          <CheckCircle className="h-3.5 w-3.5" /> Dispatch
        </button>
      )
    )}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Special Bookings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage one-time client custom orders, weddings or party bulk reservations.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search special bookings..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Booking"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBooking ? 'Modify Custom Booking' : 'Create Special Booking'}
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
              <label className="input-label">Select Dairy Product *</label>
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
              <label className="input-label">Target Delivery Date *</label>
              <input
                type="date"
                className="input-field"
                value={formDeliveryDate}
                onChange={(e) => setFormDeliveryDate(e.target.value)}
                required
              />
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
              </select>
            </div>
            <div>
              <label className="input-label">Booking Status</label>
              <select
                className="input-field"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Place Booking</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Special Booking"
        message={`Are you sure you want to delete special booking for ${selectedBooking?.customer?.name || selectedBooking?.customerName}? This will cancel the pending dispatch queue.`}
      />
    </div>
  );
};

export default Bookings;
