import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AuthLayout from './layouts/AuthLayout';

// Guest / Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Authenticated Admin Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

import Delivery from './pages/Delivery';
import Agents from './pages/Agents';
import Shifts from './pages/Shifts';
import Vendors from './pages/Vendors';
import Products from './pages/Products';
import Subscriptions from './pages/Subscriptions';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Feedback from './pages/Feedback';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Authenticated Customer Pages
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerProducts from './pages/CustomerProducts';
import CustomerCart from './pages/CustomerCart';
import CustomerOrders from './pages/CustomerOrders';
import CustomerSubscriptions from './pages/CustomerSubscriptions';
import CustomerBookings from './pages/CustomerBookings';
import CustomerTracking from './pages/CustomerTracking';
import CustomerPayments from './pages/CustomerPayments';
import CustomerProfile from './pages/CustomerProfile';
import CustomerSupport from './pages/CustomerSupport';

// Helper Redirect component for role-based fallback routing
const DashboardRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'customer' ? "/customer/dashboard" : "/dashboard"} replace />;
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Root entry point redirects based on auth/role */}
        <Route path="/" element={<DashboardRedirect />} />

        {/* Auth Guest Route wrapper */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Authenticated Admin Dashboard Roster */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/delivery/agents" element={<Agents />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/products" element={<Products />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Authenticated Customer Dashboard Roster */}
        <Route element={<CustomerLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/products" element={<CustomerProducts />} />
          <Route path="/customer/cart" element={<CustomerCart />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/customer/subscriptions" element={<CustomerSubscriptions />} />
          <Route path="/customer/bookings" element={<CustomerBookings />} />
          <Route path="/customer/tracking" element={<CustomerTracking />} />
          <Route path="/customer/payments" element={<CustomerPayments />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/feedback" element={<CustomerSupport />} />
          <Route path="/customer/notifications" element={<Notifications />} />
        </Route>

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
