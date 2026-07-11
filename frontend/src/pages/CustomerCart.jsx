import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Trash2, Plus, Minus, CreditCard, 
  MapPin, Clock, Calendar, ChevronRight, ArrowLeft,
  AlertCircle, Globe
} from 'lucide-react';
import api from '../services/api';
import { 
  selectCartItems, selectCartSubtotal, selectCartCount,
  updateQuantity, removeFromCart, clearCart 
} from '../redux/slices/cartSlice';
import { staggerContainer, staggerChild } from '../lib/animations';

const CustomerCart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const cartCount = useSelector(selectCartCount);
  const { user } = useSelector((state) => state.auth);

  // Checkout inputs
  const [deliverySlot, setDeliverySlot] = useState('morning');
  
  // Set default delivery date to tomorrow
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowDateString());
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch customer profile details (for address and wallet balance)
  const { data: customerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['customerProfile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/customers/${user?.id}`);
      return res.data.data;
    },
    enabled: !!user?.id,
  });

  // Flat pricing details
  const tax = Number((subtotal * 0.05).toFixed(2)); // 5% GST
  const deliveryCharge = subtotal > 200 || subtotal === 0 ? 0 : 20; // Free delivery over ₹200
  const total = Number((subtotal + tax + deliveryCharge).toFixed(2));

  const handleUpdateQty = (productId, qty) => {
    dispatch(updateQuantity({ productId, quantity: qty }));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
    toast.success('Item removed from cart');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    if (!customerProfile) {
      return toast.error('Failed to load your profile address. Please try again.');
    }

    // Verify wallet balance if chosen
    if (paymentMethod === 'wallet') {
      const balance = Number(customerProfile.wallet_balance || 0);
      if (balance < total) {
        return toast.error(`Insufficient wallet balance. Total is ₹${total.toFixed(2)} but balance is ₹${balance.toFixed(2)}. Please recharge.`);
      }
    }

    const orderPayload = {
      customer: user.id,
      deliverySlot,
      deliveryDate,
      deliveryAddress: {
        line1: customerProfile.address_line1,
        line2: customerProfile.address_line2,
        city: customerProfile.city,
        state: customerProfile.state,
        pincode: customerProfile.pincode,
        landmark: customerProfile.landmark,
      },
      zone: customerProfile.zone,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'wallet' ? 'paid' : 'pending',
      },
      pricing: {
        subtotal,
        tax,
        deliveryCharge,
        discount: 0,
        total,
      },
      items: cartItems.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      notes,
    };

    try {
      setIsSubmitting(true);

      if (paymentMethod === 'razorpay') {
        // Load Razorpay script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Razorpay SDK failed to load. Are you offline?');
        }

        // 1. Create Razorpay order in backend
        const orderRes = await api.post('/payments/razorpay/create-order', { amount: total });
        const { razorpayOrder, payment } = orderRes.data.data;

        // 2. Configure Razorpay options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'MILZO Dairy',
          description: 'Order Payment',
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              toast.loading('Confirming order payment...');
              
              // Set the Razorpay payment details on payload
              orderPayload.payment = {
                method: 'razorpay',
                status: 'captured',
                transactionId: response.razorpay_payment_id,
                paidAt: new Date().toISOString(),
              };

              // Place the order
              await api.post('/orders', orderPayload);
              dispatch(clearCart());
              toast.dismiss();
              toast.success('Order placed successfully!');
              navigate('/customer/orders');
            } catch (err) {
              toast.dismiss();
              toast.error(err.message || 'Failed to place order after payment.');
            }
          },
          prefill: {
            name: customerProfile?.name || '',
            email: customerProfile?.email || '',
            contact: customerProfile?.phone || '',
          },
          theme: { color: '#3B82F6' },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        setIsSubmitting(false); // reset state as Razorpay modal is open now
      } else {
        // Handle COD and Wallet directly
        await api.post('/orders', orderPayload);
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate('/customer/orders');
      }
    } catch (err) {
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      if (paymentMethod !== 'razorpay') {
        setIsSubmitting(false);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/60 dark:border-dark-border">
        <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4 stroke-[1.25]" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Looks like you haven't added anything to your cart yet. Visit our catalog to find fresh milk and dairy.
        </p>
        <Link 
          to="/customer/products"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/10 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link to="/customer/products" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-500 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products Catalog
        </Link>
        <h1 className="page-title text-2xl md:text-3xl font-display font-bold mt-2">Shopping Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <motion.div
              key={item.product.id}
              className="p-4 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-4"
              layout
            >
              {/* Product Thumbnail */}
              <div className="h-16 w-20 rounded-xl bg-slate-50 dark:bg-dark-hover flex items-center justify-center shrink-0 border border-slate-100 dark:border-dark-border">
                {item.product.images && item.product.images[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="object-cover h-full w-full rounded-xl" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                )}
              </div>

              {/* Title & Details */}
              <div className="flex-1 space-y-0.5 text-center sm:text-left">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.product.name}</h3>
                <p className="text-xxs text-slate-400 capitalize">
                  {item.product.unit_size} {item.product.unit} • ₹{item.product.price} / unit
                </p>
              </div>

              {/* Quantity Picker & Pricing */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2.5 border border-slate-200 dark:border-dark-border rounded-xl px-2.5 py-1 bg-slate-50/50 dark:bg-dark-hover/10">
                  <button
                    onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                    className="p-1 hover:text-blue-500 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                    className="p-1 hover:text-blue-500 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="text-center sm:text-right min-w-[5rem]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-display block">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => handleRemove(item.product.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right: Summary & Checkout Forms */}
        <div className="space-y-6">
          <form onSubmit={handleCheckout} className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">Checkout Summary</h3>

            {/* Delivery address display */}
            <div className="bg-slate-50/60 dark:bg-dark-hover/10 p-3.5 border border-slate-200/50 dark:border-dark-border rounded-xl space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-blue-500" />
                Delivery Address
              </span>
              {profileLoading ? (
                <div className="h-10 bg-slate-200 dark:bg-dark-hover rounded animate-pulse"></div>
              ) : customerProfile ? (
                <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {customerProfile.name} • {customerProfile.phone} <br />
                  {customerProfile.address_line1}
                  {customerProfile.address_line2 ? `, ${customerProfile.address_line2}` : ''} <br />
                  {customerProfile.city}, {customerProfile.state} - {customerProfile.pincode}
                </p>
              ) : (
                <p className="text-xxs text-rose-500">Address could not be retrieved.</p>
              )}
            </div>

            {/* Delivery Date & Slot Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Delivery Slot
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Delivery Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    min={getTomorrowDateString()}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Delivery Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Leave at front door, ring bell..."
                className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[3.5rem] resize-none"
              />
            </div>

            {/* Payment Method Select */}
            <div className="space-y-2">
              <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Method
              </label>
              
              {/* Wallet select */}
              <div 
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'wallet'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4.5 w-4.5 text-blue-500" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Milzo Wallet</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Balance: ₹{Number(customerProfile?.wallet_balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                {paymentMethod === 'wallet' && <div className="h-3 w-3 rounded-full bg-blue-500 border border-white"></div>}
              </div>

              {/* COD select */}
              <div 
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4.5 w-4.5 text-slate-500" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay at your doorstep</span>
                  </div>
                </div>
                {paymentMethod === 'cod' && <div className="h-3 w-3 rounded-full bg-blue-500 border border-white"></div>}
              </div>

              {/* Razorpay select */}
              <div 
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-purple-500" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Razorpay</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay online instantly</span>
                  </div>
                </div>
                {paymentMethod === 'razorpay' && <div className="h-3 w-3 rounded-full bg-blue-500 border border-white"></div>}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-100 dark:border-dark-border/40 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? <span className="text-emerald-500 font-semibold">FREE</span> : `₹${deliveryCharge.toFixed(2)}`}</span>
              </div>
              {deliveryCharge > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  Add ₹{Number(200 - subtotal).toFixed(2)} more for FREE delivery
                </span>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-dark-border/60">
                <span>Total Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting || profileLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerCart;
