import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  type = 'danger', // danger, warning, info
  loading = false,
}) => {
  const typeColors = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      icon: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
    },
    warning: {
      btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
      icon: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    },
    info: {
      btn: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
      icon: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20',
    },
  };

  const selectedColor = typeColors[type] || typeColors.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <motion.div
          className={`p-3 rounded-full border mb-4 ${selectedColor.icon}`}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
        >
          <motion.div
            animate={{
              rotate: [0, -8, 8, -8, 8, 0],
            }}
            transition={{
              duration: 0.5,
              delay: 0.4,
              ease: 'easeInOut',
            }}
          >
            <AlertTriangle className="h-6 w-6" />
          </motion.div>
        </motion.div>
        
        <motion.p
          className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          {message}
        </motion.p>

        <motion.div
          className="flex items-center justify-end gap-3 w-full border-t border-slate-100 dark:border-dark-border pt-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <motion.button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary py-2 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {cancelText}
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex justify-center items-center px-4 py-2 text-sm font-semibold text-white border border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${selectedColor.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
            ) : null}
            {confirmText}
          </motion.button>
        </motion.div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
