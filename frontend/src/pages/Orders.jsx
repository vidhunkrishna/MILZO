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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.product || '').toLowerCase().includes(search.toLowerCase()) ||
    (o._id || '').includes(search)
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
    
    // Map DB status to dropdown status option
    const dbStatus = (order.status || '').toLowerCase();
    const mappedStatus = dbStatus === 'placed' ? 'Pending' :
                         ['confirmed', 'packed', 'assigned', 'out_for_delivery'].includes(dbStatus) ? 'In Progress' :
                         dbStatus === 'delivered' ? 'Delivered' :
                         dbStatus === 'cancelled' ? 'Cancelled' : 'Pending';
    setFormStatus(mappedStatus);
    
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
    { label: 'Product & Qty', key: 'product', render: (row) => {
      const itemsList = row.items && row.items.length > 0 
        ? row.items 
        : [{ product_name: row.product, quantity: row.quantity }];
      return (
        <div className="flex flex-col gap-1 text-xs">
          {itemsList.map((item, idx) => (
            <div key={idx} className="whitespace-nowrap">
              {item.product_name} <strong className="text-primary-500 font-bold">×{item.quantity}</strong>
            </div>
          ))}
        </div>
      );
    }},
    { label: 'Total Price', key: 'amount', render: (row) => <span className="font-bold">₹{row.amount}</span> },
    { label: 'Date', key: 'date' },
    { 
      label: 'Payment', 
      key: 'payment', 
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={row.payment?.method || 'Unknown'} />
          <StatusBadge status={row.payment?.status || 'Unknown'} />
        </div>
      ) 
    },
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
          onView: (order) => {
            setSelectedOrder(order);
            setIsViewModalOpen(true);
          },
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
          {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-dark-hover rounded-xl text-xs space-y-1.5 border border-slate-200/50 dark:border-dark-border/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordered Products</span>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{item.product_name}</span>
                  <span className="text-slate-500 font-bold">×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
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

      {/* View Order Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Admin Order Details"
      >
        {selectedOrder && (
          <div className="space-y-6 text-sm">
            {/* Order Code & Status */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Order ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedOrder._id || selectedOrder.id}</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Route</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedOrder.route}</span>
              </div>
            </div>

            {/* Ordered Items */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Items Purchased</span>
              <div className="p-3 bg-slate-50 dark:bg-dark-hover rounded-xl border border-slate-200/50 dark:border-dark-border/50 space-y-2">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.product_name || item.product}</span>
                      <span className="text-slate-500 font-bold">×{item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedOrder.product}</span>
                    <span className="text-slate-500 font-bold">×{selectedOrder.quantity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Summary */}
            <div className="space-y-2 border-t border-slate-100 dark:border-dark-border pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Summary</span>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.subtotal || selectedOrder.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{(selectedOrder.delivery_charge || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-dark-border/60">
                  <span>Total Price</span>
                  <span>₹{Number(selectedOrder.total || selectedOrder.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 border-t border-slate-100 dark:border-dark-border pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Details</span>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Payment Method</span>
                  <StatusBadge status={selectedOrder.payment?.method || 'Unknown'} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Payment Status</span>
                  <StatusBadge status={selectedOrder.payment?.status || 'Unknown'} />
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.payment?.transactionId || 'N/A'}</span>
                </div>
                {selectedOrder.payment?.paidAt && (
                  <div className="flex justify-between">
                    <span>Payment Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedOrder.payment.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                )}
                {selectedOrder.payment?.refund && (
                  <div className="border-t border-dashed border-slate-200 dark:border-dark-border/40 pt-2 mt-2 space-y-1.5 text-xs text-rose-500">
                    <div className="flex justify-between font-bold">
                      <span>Refund Amount</span>
                      <span>₹{(selectedOrder.payment.refund.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refund ID</span>
                      <span className="font-mono font-semibold">{selectedOrder.payment.refund.refundId || 'N/A'}</span>
                    </div>
                    {selectedOrder.payment.refund.processedAt && (
                      <div className="flex justify-between">
                        <span>Refunded Date</span>
                        <span>{new Date(selectedOrder.payment.refund.processedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
