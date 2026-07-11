import { createSlice } from '@reduxjs/toolkit';

const getInitialCart = () => {
  try {
    const persisted = localStorage.getItem('milzo_cart');
    return persisted ? JSON.parse(persisted) : [];
  } catch (err) {
    return [];
  }
};

const saveCart = (items) => {
  try {
    localStorage.setItem('milzo_cart', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist cart:', err);
  }
};

const initialState = {
  items: getInitialCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
      saveCart(state.items);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.product.id !== action.payload);
      saveCart(state.items);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const existing = state.items.find((item) => item.product.id === productId);
      if (existing) {
        existing.quantity = Math.max(1, quantity);
      }
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

// Selectors for ease of use
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((acc, item) => acc + item.quantity * Number(item.product.price || 0), 0);

export default cartSlice.reducer;
