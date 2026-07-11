import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Eye, Plus, Minus, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { addToCart } from '../redux/slices/cartSlice';
import { staggerContainer, staggerChild } from '../lib/animations';

const CATEGORIES = [
  { id: '', name: 'All Products' },
  { id: 'cow_milk', name: 'Cow Milk' },
  { id: 'buffalo_milk', name: 'Buffalo Milk' },
  { id: 'a2_milk', name: 'A2 Milk' },
  { id: 'toned_milk', name: 'Toned Milk' },
  { id: 'full_cream', name: 'Full Cream' },
  { id: 'skimmed', name: 'Skimmed Milk' },
  { id: 'flavored', name: 'Flavored Milk' },
  { id: 'other', name: 'Other Dairy' },
];

const CustomerProducts = () => {
  const dispatch = useDispatch();
  
  // Local state for filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Selected product for Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Debouncing search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Query to fetch products
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['productsCatalog', debouncedSearch, category, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
        isActive: 'true',
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      const res = await api.get('/products', { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  const products = response?.data || [];
  const pagination = response?.pagination || { currentPage: 1, totalPages: 1 };

  const handleAddToCart = (product, qty = 1) => {
    dispatch(addToCart({ product, quantity: qty }));
    toast.success(`${qty}x ${product.name} added to cart`);
  };

  const openDetails = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">Products Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose fresh milk and dairy products for daily home deliveries.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              category === cat.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Catalog Render */}
      {isLoading ? (
        <CatalogSkeleton />
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Failed to load catalog</p>
          <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
          <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try expanding your search query or selecting a different category.</p>
        </div>
      ) : (
        <>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
          >
            {products.map((product) => {
              const stock = product.stock?.available || 0;
              const isOutOfStock = stock <= 0;
              const hasDiscount = product.mrp && product.mrp > product.price;
              const discountPercent = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

              return (
                <motion.div
                  key={product.id}
                  className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  variants={staggerChild}
                >
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Save {discountPercent}%
                    </div>
                  )}

                  {/* Image container */}
                  <div className="relative aspect-video rounded-xl bg-slate-50 dark:bg-dark-hover/40 flex items-center justify-center overflow-hidden mb-4 border border-slate-100 dark:border-dark-border/40">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                        <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                        <span className="text-[10px] mt-1 capitalize font-medium">{product.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {product.category?.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xxs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                      {product.description || 'Fresh milk sourced from local organic dairy farms.'}
                    </p>
                    
                    {/* Sizing & Price */}
                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                        {product.unit_size} {product.unit}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasDiscount && (
                          <span className="text-xxs line-through text-slate-400">
                            ₹{product.mrp}
                          </span>
                        )}
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
                          ₹{product.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                    <button
                      onClick={() => openDetails(product)}
                      className="col-span-2 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center gap-1 text-xxs font-bold transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </button>

                    {isOutOfStock ? (
                      <div className="col-span-3 py-2 bg-slate-100 dark:bg-dark-hover border border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-600 rounded-xl text-center text-xxs font-bold cursor-not-allowed">
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product, 1)}
                        className="col-span-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center gap-1 text-xxs font-bold shadow-sm shadow-blue-500/10 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Page <span className="font-semibold text-slate-700 dark:text-slate-300">{page}</span> of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 transition-colors z-20"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Product Info */}
              <div className="p-6 space-y-5">
                <div className="aspect-video rounded-xl bg-slate-100 dark:bg-dark-hover/40 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-dark-border/50 relative">
                  {selectedProduct.images && selectedProduct.images[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                      <ShoppingBag className="h-14 w-14 stroke-[1.5]" />
                      <span className="text-xs mt-1 capitalize font-medium">{selectedProduct.unit}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">
                    {selectedProduct.category?.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-5">
                    {selectedProduct.description || 'Fresh milk sourced from local organic dairy farms.'}
                  </p>
                </div>

                <div className="flex justify-between items-center border-y border-slate-100 dark:border-dark-border/40 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 tracking-wider">Unit Size</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5 block">{selectedProduct.unit_size} {selectedProduct.unit}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 tracking-wider">Stock Status</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{(selectedProduct.stock?.available || 0) > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase text-slate-400 tracking-wider">Price</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">₹{selectedProduct.price}</span>
                  </div>
                </div>

                {/* Quantity Select */}
                {(selectedProduct.stock?.available || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity</span>
                    <div className="flex items-center gap-3 border border-slate-200 dark:border-dark-border rounded-xl px-3 py-1.5 bg-slate-50/50 dark:bg-dark-hover/10">
                      <button
                        onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                        className="p-1 hover:text-blue-500 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-5 text-center">
                        {modalQuantity}
                      </span>
                      <button
                        onClick={() => setModalQuantity((q) => Math.min(selectedProduct.stock.available, q + 1))}
                        className="p-1 hover:text-blue-500 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 dark:bg-dark-hover/20 px-6 py-4 flex gap-3 border-t border-slate-100 dark:border-dark-border/40">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                
                {(selectedProduct.stock?.available || 0) > 0 ? (
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct, modalQuantity);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-all"
                  >
                    Add to Cart (₹{(selectedProduct.price * modalQuantity).toFixed(2)})
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 bg-slate-200 dark:bg-dark-hover border border-slate-300 dark:border-dark-border text-slate-400 dark:text-slate-600 rounded-xl text-center text-xs font-bold cursor-not-allowed">
                    Out of Stock
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CatalogSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border h-80 rounded-2xl"></div>
      ))}
    </div>
  );
};

export default CustomerProducts;
