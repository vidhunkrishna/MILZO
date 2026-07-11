import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { pageTransition } from '../lib/animations';

const getAdminPageTitle = (pathname) => {
  switch (pathname) {
    case '/dashboard': return 'Dashboard';
    case '/customers': return 'Customers';
    case '/orders': return 'Orders';
    case '/delivery': return 'Delivery';
    case '/delivery/agents': return 'Delivery Agents';
    case '/shifts': return 'Shifts & Attendance';
    case '/vendors': return 'Vendors';
    case '/products': return 'Products';
    case '/subscriptions': return 'Subscriptions';
    case '/bookings': return 'Bookings';
    case '/payments': return 'Payments & Invoices';
    case '/feedback': return 'Feedback & Tickets';
    case '/analytics': return 'Reports & Analytics';
    case '/logs': return 'Audit & Error Logs';
    case '/notifications': return 'Notifications';
    case '/settings': return 'Settings';
    default: return '';
  }
};

const AdminLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  React.useEffect(() => {
    const pageTitle = getAdminPageTitle(location.pathname);
    document.title = pageTitle ? `MILZO Admin Panel | ${pageTitle}` : `MILZO Admin Panel`;
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

export default AdminLayout;
