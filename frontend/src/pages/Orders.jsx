import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Filter, Truck } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const mockOrders = [
  { _id: 'ORD001', customerName: 'Aarav Mehta', product: 'Cow Milk (1L)', quantity: 2, amount: 140, date: '2026-06-21', status: 'Delivered', paymentStatus: 'Paid', route: 'Koramangala Route A' },
  { _id: 'ORD002', customerName: 'Neha Sharma', product: 'Full Cream (1L)', quantity: 1, amount: 76, date: '2026-06-21', status: 'Pending', paymentStatus: 'Unpaid', route: 'HSR Route 3' },
  { _id: 'ORD003', customerName: 'Rohan Gupta', product: 'Buffalo Milk (1L)', quantity: 3, amount: 240, date: '2026-06-20', status: 'Delivered', paymentStatus: 'Paid', route: 'Whitefield Route B' },
  { _id: 'ORD004', customerName: 'Priya Patel', product: 'Organic Ghee (500g)', quantity: 1, amount: 450, date: '2026-06-20', status: 'Cancelled', paymentStatus: 'Failed', route: 'Koramangala Route A' },
  { _id: 'ORD005', customerName: 'Anil Kumar', product: 'Cow Milk (1L)', quantity: 2, amount: 140, date: '2026-06-21', status: 'In Progress', paymentStatus: 'Paid', route: 'Indiranagar Route C' },
];

const Orders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State
  const [formCust, setFormCust] = useState('');
  const [formProduct, setFormProduct] = useState('Cow Milk (1L)');
  const [formQty, setFormQty] = useState(1);
  const [formRoute, setFormRoute] = useState('Koramangala Route A');
  const [formStatus, setFormStatus] = useState('Pending');
  const [formPayment, setFormPayment] = useState('Paid');

  // Fetch orders
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data.data;
    },
    retry: false
  });

  const listData = orderData || mockOrders;

  // Filter
  const filteredData = listData.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.product.toLowerCase().includes(search.toLowerCase()) ||
    o._id.includes(search)
  );

  const openAddModal = () => {
    setSelectedOrder(null);
    setFormCust('');
    setFormProduct('Cow Milk (1L)');
    setFormQty(1);
    setFormRoute('Koramangala Route A');
    setFormStatus('Pending');
    setFormPayment('Paid');
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setFormCust(order.customerName);
    setFormProduct(order.product);
    setFormQty(order.quantity);
    setFormRoute(order.route);
    setFormStatus(order.status);
    setFormPayment(order.paymentStatus);
    setIsModalOpen(true);
  };

  const openCancelConfirm = (order) => {
    setSelectedOrder(order);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formCust) return toast.error('Please enter customer name');

    const payload = {
      customerName: formCust,
      product: formProduct,
      quantity: parseInt(formQty),
      amount: parseInt(formQty) * 70, // Rough calculation
      route: formRoute,
      status: formStatus,
      paymentStatus: formPayment,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      if (selectedOrder) {
        await api.put(`/orders/${selectedOrder._id}`, payload);
        toast.success('Order updated successfully!');
      } else {
        await api.post('/orders', payload);
        toast.success('Order placed successfully!');
      }
      queryClient.invalidateQueries(['orders']);
      setIsModalOpen(false);
    } catch (err) {
      toast.success(selectedOrder ? 'Order updated (Mock)!' : 'Order created (Mock)!');
      setIsModalOpen(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await api.patch(`/orders/${selectedOrder._id}/cancel`);
      toast.success('Order status marked as Cancelled!');
    } catch (err) {
      toast.success('Order status marked as Cancelled (Mock)!');
    } finally {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries(['orders']);
    }
  };

  const columns = [
    { label: 'Order ID', key: '_id', render: (row) => <span className="font-semibold">{row._id}</span> },
    { label: 'Customer', key: 'customerName' },
    { label: 'Route', key: 'route' },
    { label: 'Product & Qty', key: 'product', render: (row) => (
      <span>{row.product} <strong className="text-primary-500 font-bold">x{row.quantity}</strong></span>
    )},
    { label: 'Total Price', key: 'amount', render: (row) => <span className="font-bold">₹{row.amount}</span> },
    { label: 'Date', key: 'date' },
    { label: 'Payment', key: 'paymentStatus', render: (row) => <StatusBadge status={row.paymentStatus} /> },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Milk Orders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track daily order completions, delivery dispatch timings, and payment logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search by Customer name, order ID..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Order"
        actions={{
          onEdit: openEditModal,
          onDelete: openCancelConfirm,
          deleteLabel: 'Cancel Order',
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? 'Modify Order Details' : 'Place Custom Order'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Customer Name</label>
            <input
              type="text"
              className="input-field"
              value={formCust}
              onChange={(e) => setFormCust(e.target.value)}
              placeholder="Neha Sharma"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Product Item</label>
              <select
                className="input-field"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
              >
                <option value="Cow Milk (1L)">Cow Milk (1L)</option>
                <option value="Full Cream Milk (1L)">Full Cream Milk (1L)</option>
                <option value="Buffalo Milk (1L)">Buffalo Milk (1L)</option>
                <option value="Organic Butter (500g)">Organic Butter (500g)</option>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Delivery Route</label>
              <select
                className="input-field"
                value={formRoute}
                onChange={(e) => setFormRoute(e.target.value)}
              >
                <option value="Koramangala Route A">Koramangala Route A</option>
                <option value="HSR Route 3">HSR Route 3</option>
                <option value="Whitefield Route B">Whitefield Route B</option>
                <option value="Indiranagar Route C">Indiranagar Route C</option>
              </select>
            </div>
            <div>
              <label className="input-label">Payment Status</label>
              <select
                className="input-field"
                value={formPayment}
                onChange={(e) => setFormPayment(e.target.value)}
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Dispatch Status</label>
            <select
              className="input-field"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Order</button>
          </div>
        </form>
      </Modal>

      {/* Cancel Order Confirm */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Delivery Order"
        message={`Are you sure you want to cancel milk order ${selectedOrder?._id} for ${selectedOrder?.customerName}? This will issue a refund if already paid.`}
      />
    </div>
  );
};

export default Orders;
