import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Store, Package, RefreshCw, 
  CalendarCheck, ShoppingBag, Map, Truck, Clock, 
  CreditCard, MessageSquare, BarChart3, FileText, 
  Bell, Settings, ChevronLeft, X
} from 'lucide-react';
import { toggleSidebar } from '../redux/slices/uiSlice';
import Logo from './Logo';
import { fadeIn, slideInLeft, gentleSpring, staggerContainer, staggerChildLeft } from '../lib/animations';

const Sidebar = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const menuGroups = [
    {
      title: 'Core',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Orders', path: '/orders', icon: ShoppingBag },
        { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
        { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
      ]
    },
    {
      title: 'Directory',
      items: [
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Vendors', path: '/vendors', icon: Store },
        { name: 'Products', path: '/products', icon: Package },
      ]
    },
    {
      title: 'Logistics',
      items: [
        { name: 'Delivery Routes', path: '/delivery', icon: Map },
        { name: 'Delivery Agents', path: '/delivery/agents', icon: Truck },
        { name: 'Shifts & Attendance', path: '/shifts', icon: Clock },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Payments & Invoices', path: '/payments', icon: CreditCard },
        { name: 'Feedback & Tickets', path: '/feedback', icon: MessageSquare },
        { name: 'Reports & Analytics', path: '/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Audit & Error Logs', path: '/logs', icon: FileText },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-30 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            exit={fadeIn.exit}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-xl font-bold font-display text-white tracking-wider">
              MILZO
            </span>
          </Link>
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
          {menuGroups.map((group, groupIdx) => (
            <motion.div
              key={groupIdx}
              className="space-y-2"
              variants={staggerContainer(0.04)}
              initial="initial"
              animate="animate"
            >
              <motion.h4
                className="px-3 text-xxs font-bold text-slate-500 uppercase tracking-widest"
                variants={staggerChildLeft}
              >
                {group.title}
              </motion.h4>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <motion.div
                    key={itemIdx}
                    variants={staggerChildLeft}
                  >
                    <NavLink
                      to={item.path}
                      end={item.path === '/delivery'}
                      className={({ isActive }) => 
                        `sidebar-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium ${
                          isActive 
                            ? 'text-white bg-primary-600/20 border border-primary-500/20 shadow-inner' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`
                      }
                    >
                      {({ isActive }) => {
                        const Icon = item.icon;
                        return (
                          <>
                            <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                            <span>{item.name}</span>
                          </>
                        );
                      }}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
