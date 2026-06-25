import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

// Category enum mapping: DB value -> Display label
const CATEGORIES = [
  { value: 'cow_milk', label: 'Cow Milk' },
  { value: 'buffalo_milk', label: 'Buffalo Milk' },
  { value: 'a2_milk', label: 'A2 Milk' },
  { value: 'toned_milk', label: 'Toned Milk' },
  { value: 'full_cream', label: 'Full Cream' },
  { value: 'skimmed', label: 'Skimmed' },
  { value: 'flavored', label: 'Flavored' },
  { value: 'other', label: 'Other' },
];

const UNITS = [
  { value: 'litre', label: 'Litre' },
  { value: 'ml', label: 'ml' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'piece', label: 'Piece' },
];

const getCategoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;
const getUnitLabel = (val) => UNITS.find(u => u.value === val)?.label || val;

const Products = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('cow_milk');
  const [formPrice, setFormPrice] = useState(60);
  const [formMrp, setFormMrp] = useState('');
  const [formUnit, setFormUnit] = useState('litre');
  const [formUnitSize, setFormUnitSize] = useState(1);
  const [formStock, setFormStock] = useState(100);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDesc, setFormDesc] = useState('');

  // Fetch products
  const { data: productData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data.data;
    },
    retry: false
  });

  const listData = productData || [];

  const filteredData = listData.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setSelectedProduct(null);
    setFormName('');
    setFormCategory('cow_milk');
    setFormPrice(60);
    setFormMrp('');
    setFormUnit('litre');
    setFormUnitSize(1);
    setFormStock(100);
    setFormIsActive(true);
    setFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormCategory(product.category || 'cow_milk');
    setFormPrice(product.price);
    setFormMrp(product.mrp || '');
    setFormUnit(product.unit || 'litre');
    setFormUnitSize(product.unit_size || 1);
    setFormStock(product.stock?.available || 0);
    setFormIsActive(product.is_active !== false);
    setFormDesc(product.description || '');
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (product) => {
    setSelectedProduct(product);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) return toast.error('Please fill required fields');

    const payload = {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      mrp: formMrp ? parseFloat(formMrp) : parseFloat(formPrice),
      unit: formUnit,
      unitSize: parseFloat(formUnitSize) || 1,
      stock: { available: parseInt(formStock) || 0, reserved: 0, minStock: 10 },
      isActive: formIsActive,
      description: formDesc,
    };

    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product added to catalog!');
      }
      queryClient.invalidateQueries(['products']);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${selectedProduct._id}`);
      toast.success('Product deleted from catalog!');
      queryClient.invalidateQueries(['products']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product';
      toast.error(msg);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleQuickStockUpdate = async (product, val) => {
    const currentStock = product.stock?.available || product.stock || 0;
    const newStock = Math.max(0, (typeof currentStock === 'number' ? currentStock : 0) + val);
    try {
      await api.patch(`/products/${product._id}/stock`, { available: newStock });
      toast.success('Stock inventory updated!');
      queryClient.invalidateQueries(['products']);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update stock';
      toast.error(msg);
    }
  };

  const getStockCount = (product) => {
    if (product.stock && typeof product.stock === 'object') return product.stock.available || 0;
    if (typeof product.stock === 'number') return product.stock;
    return 0;
  };

  const columns = [
    { label: 'Item Name', key: 'name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</div>
        <div className="text-[10px] text-slate-400">{row.description}</div>
      </div>
    )},
    { label: 'Category', key: 'category', render: (row) => getCategoryLabel(row.category) },
    { label: 'Base Price', key: 'price', render: (row) => <span className="font-semibold">₹{row.price} / {row.unit_size}{getUnitLabel(row.unit)}</span> },
    { label: 'Inventory Stock', key: 'stock', render: (row) => {
      const stock = getStockCount(row);
      return (
        <div className="flex items-center gap-3">
          <span className={`font-bold ${stock < 15 ? 'text-rose-500 flex items-center gap-1' : 'text-slate-700 dark:text-slate-300'}`}>
            {stock < 15 && <AlertTriangle className="h-3.5 w-3.5" />}
            {stock} units
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => handleQuickStockUpdate(row, 10)} 
              className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700 border border-slate-200/50 dark:border-dark-border/50 text-slate-600 dark:text-slate-300 rounded"
            >
              +10
            </button>
          </div>
        </div>
      );
    }},
    { label: 'Status', key: 'is_active', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Catalog Inventory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage dairy items, update retail prices, and log raw stock levels.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Search catalog items..."
        searchQuery={search}
        onSearch={setSearch}
        onCreateClick={openAddModal}
        createLabel="Add Product"
        actions={{
          onEdit: openEditModal,
          onDelete: openDeleteConfirm,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Modify Catalog Item' : 'Add New Product'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Product Name *</label>
            <input
              type="text"
              className="input-field"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Full Cream Milk"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Category *</label>
              <select
                className="input-field"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Unit *</label>
              <select
                className="input-field"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Unit Size *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="input-field"
                value={formUnitSize}
                onChange={(e) => setFormUnitSize(e.target.value)}
                placeholder="1"
                required
              />
            </div>
            <div>
              <label className="input-label">Retail Price (₹) *</label>
              <input
                type="number"
                className="input-field"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">MRP (₹)</label>
              <input
                type="number"
                className="input-field"
                value={formMrp}
                onChange={(e) => setFormMrp(e.target.value)}
                placeholder="Same as price"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Warehouse Stock</label>
              <input
                type="number"
                className="input-field"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Status</label>
              <select
                className="input-field"
                value={formIsActive ? 'active' : 'inactive'}
                onChange={(e) => setFormIsActive(e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Product Description</label>
            <textarea
              className="input-field h-20"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Brief details about fat content, source, etc."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border pt-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* Delete product */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Deregister Product"
        message={`Are you sure you want to remove ${selectedProduct?.name} from active catalog sales? This will pause active subscriptions linked to this product.`}
      />
    </div>
  );
};

export default Products;
