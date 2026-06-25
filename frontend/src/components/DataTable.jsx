import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, Plus } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  searchQuery = '',
  pagination = null, // { currentPage, totalPages, onPageChange, totalItems }
  actions = null, // { onView, onEdit, onDelete, viewLabel, editLabel, deleteLabel }
  onCreateClick = null,
  createLabel = 'Add New',
}) => {
  return (
    <div className="card border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
      {/* Top Action Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-dark-hover/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-white dark:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        {onCreateClick && (
          <motion.button
            onClick={onCreateClick}
            className="btn-primary inline-flex items-center gap-1.5 justify-center py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </motion.button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-dark-hover/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-dark-border">
              {columns.map((col, index) => (
                <th key={index} className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {loading ? (
                <tr key="loading">
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-20 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      <p className="mt-2 text-slate-400 dark:text-slate-500">Fetching records...</p>
                    </motion.div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr key="empty">
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      No records found.
                    </motion.span>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <motion.tr
                    key={row._id || rowIndex}
                    className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50/50 dark:hover:bg-dark-hover/10 transition-colors"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: rowIndex * 0.03,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    
                    {actions && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {actions.onView && (
                            <motion.button
                              onClick={() => actions.onView(row)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 dark:text-slate-400 rounded-lg transition-colors"
                              title={actions.viewLabel || 'View Detail'}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                          )}
                          {actions.onEdit && (
                            <motion.button
                              onClick={() => actions.onEdit(row)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 dark:text-slate-400 rounded-lg transition-colors"
                              title={actions.editLabel || 'Edit'}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </motion.button>
                          )}
                          {actions.onDelete && (
                            <motion.button
                              onClick={() => actions.onDelete(row)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 dark:text-slate-400 rounded-lg transition-colors"
                              title={actions.deleteLabel || 'Delete'}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-dark-hover/10">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Showing Page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalItems !== undefined && ` (${pagination.totalItems} total items)`}
          </span>
          
          <div className="flex items-center gap-1.5 justify-end">
            <motion.button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-dark-border rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Sliding window around currentPage
              let pageNum = i + 1;
              if (pagination.currentPage > 3 && pagination.totalPages > 5) {
                pageNum = pagination.currentPage - 3 + i;
                if (pageNum + (4 - i) > pagination.totalPages) {
                  pageNum = pagination.totalPages - 4 + i;
                }
              }
              return (
                <motion.button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    pagination.currentPage === pageNum
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {pageNum}
                </motion.button>
              );
            })}
            
            <motion.button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 border border-slate-200 dark:border-dark-border rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
