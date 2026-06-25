import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import ThemeToggle from './ThemeToggle';
import { dropdownVariants, smoothSpring } from '../lib/animations';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { unreadCount, items: notifications } = useSelector((state) => state.notifications);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-6 backdrop-blur-md dark:border-dark-border dark:bg-dark-bg/85 transition-all">
      {/* Left side: Hamburger Toggle */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-lg transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-6 w-6" />
        </motion.button>
        
        {/* Breadcrumbs or Status text */}
        <span className="hidden sm:inline text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-dark-hover border border-slate-200/50 dark:border-dark-border/50 text-slate-500 dark:text-slate-400 rounded-full">
          Admin Portal Mode
        </span>
      </div>

      {/* Right side: Actions & User Dropdowns */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/50 dark:border-dark-border/50 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="h-4.5 w-4.5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-dark-bg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-2 shadow-xl z-50"
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={smoothSpring}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-dark-border flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Alert Notifications</span>
                  <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-primary-500 hover:underline">View All</Link>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">No new notifications</p>
                  ) : (
                    notifications.slice(0, 5).map((notif, idx) => (
                      <motion.div
                        key={notif._id}
                        className={`px-3 py-2 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-dark-hover/40 transition-colors mb-1 ${
                          !notif.read ? 'bg-primary-500/5 font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                      >
                        <p className="line-clamp-2">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-dark-border bg-slate-50/50 hover:bg-slate-100 dark:bg-dark-hover/30 dark:hover:bg-dark-hover/70 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-sm uppercase">
              {user?.name?.slice(0, 2) || <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-3">
                {user?.name || 'Milzo Admin'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {user?.role || 'Staff'}
              </span>
            </div>
            <motion.div
              animate={{ rotate: profileOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                className="absolute right-0 mt-2.5 w-52 origin-top-right rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-1 shadow-xl z-50"
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={smoothSpring}
              >
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-dark-border">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Profile Settings
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Sign Out
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
