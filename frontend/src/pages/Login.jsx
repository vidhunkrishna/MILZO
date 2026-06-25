import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import api from '../services/api';
import { staggerContainer, staggerChild, smoothSpring } from '../lib/animations';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    try {
      dispatch(loginStart());
      const response = await api.post('/auth/login', { email, password });
      
      const { user, accessToken: token } = response.data.data;
      dispatch(loginSuccess({ user, token }));
      
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(errMsg));
      toast.error(errMsg);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      variants={staggerContainer(0.1)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="text-center mb-6" variants={staggerChild}>
        <h3 className="text-xl font-bold text-white font-display">
          Welcome Back
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Access the MILZO admin dashboard portal
        </p>
      </motion.div>

      {error && (
        <motion.div
          className="p-3.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          initial={{ opacity: 0, height: 0, marginTop: 0, padding: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: undefined, padding: undefined }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      {/* Email Input */}
      <motion.div variants={staggerChild}>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@milzo.com"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            required
          />
        </div>
      </motion.div>

      {/* Password Input */}
      <motion.div variants={staggerChild}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={staggerChild}>
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-8"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px -8px rgba(79, 70, 229, 0.45)' }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
              Signing you in...
            </>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default Login;
