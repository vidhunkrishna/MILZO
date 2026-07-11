import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { pageTransition } from '../lib/animations';

const getCustomerPageTitle = (pathname) => {
  switch (pathname) {
    case '/customer/dashboard': return 'Dashboard';
    case '/customer/products': return 'Products Catalog';
    case '/customer/cart': return 'Shopping Cart';
    case '/customer/orders': return 'My Orders';
    case '/customer/subscriptions': return 'My Subscriptions';
    case '/customer/bookings': return 'My Bookings';
    case '/customer/tracking': return 'Delivery Tracking';
    case '/customer/payments': return 'Payments & Wallet';
    case '/customer/profile': return 'Profile Settings';
    case '/customer/feedback': return 'Support Tickets';
    case '/customer/notifications': return 'Notifications';
    default: return '';
  }
};

const CustomerLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    const pageTitle = getCustomerPageTitle(location.pathname);
    document.title = pageTitle ? `MILZO Customer Portal | ${pageTitle}` : `MILZO Customer Portal`;
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex flex-col min-h-screen lg:pl-64 transition-all duration-300">
        <Header />

        {/* Dynamic subpages view area with page transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className="flex-1 p-6 lg:p-8 overflow-y-auto"
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerLayout;
