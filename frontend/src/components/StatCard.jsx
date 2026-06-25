import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { smoothSpring } from '../lib/animations';

const StatCard = ({ title, value, icon: Icon, trend, trendType = 'up', description, color = 'blue', index = 0 }) => {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      className="stat-card p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...smoothSpring,
        delay: index * 0.08,
      }}
      whileHover={{
        y: -4,
        scale: 1.015,
        boxShadow: '0 12px 40px -12px rgba(0,0,0,0.12)',
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background soft glow on hover */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-current opacity-[0.02] rounded-full transition-all duration-500 group-hover:scale-150 text-slate-400 dark:text-slate-200"></div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <motion.div
          className={`p-2.5 rounded-xl border ${selectedColor}`}
          whileHover={{ rotate: 8, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div>
        <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendType === 'up' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {trendType === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {description}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
