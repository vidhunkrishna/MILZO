import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme } from '../redux/slices/uiSlice';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.ui.darkMode);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-hover dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-all duration-200 hover:scale-105 active:scale-95 border border-slate-200/50 dark:border-dark-border/50"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse-slow" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-indigo-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
