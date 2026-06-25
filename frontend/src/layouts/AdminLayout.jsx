import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatWidget from '../components/AIChatWidget';
import { pageTransition } from '../lib/animations';

const AdminLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

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
        
        {/* Floating AI chatbot support assistant */}
        <AIChatWidget />
      </div>
    </div>
  );
};

export default AdminLayout;
