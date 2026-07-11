import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, User, Phone, MapPin, Building, Home, Globe } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import api from '../services/api';
import { staggerContainer, staggerChild, smoothSpring } from '../lib/animations';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector((state) => state.auth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Address fields
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !line1 || !city || !state || !pincode) {
      return toast.error('Please fill in all required fields');
    }

    const payload = {
      name,
      email,
      phone,
      password,
      address: {
        line1,
        line2,
        city,
        state,
        pincode,
        landmark,
      },
    };

    try {
      dispatch(loginStart());
      const response = await api.post('/auth/register', payload);
      
      const { user, accessToken: token } = response.data.data;
      dispatch(loginSuccess({ user, token }));
      
      toast.success(`Welcome to MILZO, ${user.name}!`);
      navigate('/customer/dashboard');
    } catch (err) {
      const errMsg = err.message || 'Registration failed. Please check your details.';
      dispatch(loginFailure(errMsg));
      toast.error(errMsg);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5"
      variants={staggerContainer(0.08)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="text-center mb-4" variants={staggerChild}>
        <h3 className="text-xl font-bold text-white font-display">
          Create Account
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Sign up to get fresh milk delivered daily
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

      {/* Grid for basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Email Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Phone Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
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
      </div>

      {/* Address Header */}
      <motion.div className="border-t border-white/10 pt-4" variants={staggerChild}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Delivery Address</span>
      </motion.div>

      {/* Address Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Address Line 1 */}
        <motion.div variants={staggerChild} className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Flat/House No., Building, Street *
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Apt 4B, Emerald Heights"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Address Line 2 */}
        <motion.div variants={staggerChild} className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Area, Colony, Road
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Sneh Nagar, Bypass Road"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>
        </motion.div>

        {/* City Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            City *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Coimbatore"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* State Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            State *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Tamil Nadu"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Pincode Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Pincode *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="641001"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
        </motion.div>

        {/* Landmark Input */}
        <motion.div variants={staggerChild}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Landmark
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Near Temple"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div variants={staggerChild} className="pt-2">
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          whileHover={{ scale: 1.01, boxShadow: '0 8px 30px -8px rgba(79, 70, 229, 0.45)' }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </motion.button>

        <p className="text-center text-xs text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </motion.form>
  );
};

export default Register;
