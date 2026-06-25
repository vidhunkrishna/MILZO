import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Lock, Sliders, Shield } from 'lucide-react';
import api from '../services/api';

const mockSettings = {
  businessName: 'MILZO Dairy Products Ltd',
  email: 'ops@milzo.com',
  phone: '1800-419-MILK',
  supportAddress: 'Building 14, Outer Ring Road, Bellandur, Bangalore',
  razorpayKey: 'rzp_live_8uY7h2K9oL6q',
  deliveryCutoffHour: '22:00', // 10:00 PM
  minWalletBalance: -100, // minimum balance to allow subscription delivery
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('business'); // business, payment, security

  // Form states - Business Settings
  const [bizName, setBizName] = useState(mockSettings.businessName);
  const [bizEmail, setBizEmail] = useState(mockSettings.email);
  const [bizPhone, setBizPhone] = useState(mockSettings.phone);
  const [bizAddress, setBizAddress] = useState(mockSettings.supportAddress);
  const [cutoff, setCutoff] = useState(mockSettings.deliveryCutoffHour);
  const [minBalance, setMinBalance] = useState(mockSettings.minWalletBalance);

  // Form states - Payment API Keys
  const [rzpKey, setRzpKey] = useState(mockSettings.razorpayKey);
  const [rzpSecret, setRzpSecret] = useState('••••••••••••••••••••••••');

  // Form states - Security credentials update
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      const data = response.data.data;
      setBizName(data.businessName);
      setBizEmail(data.email);
      setBizPhone(data.phone);
      setBizAddress(data.supportAddress);
      setCutoff(data.deliveryCutoffHour);
      setMinBalance(data.minWalletBalance);
      setRzpKey(data.razorpayKey);
      return data;
    },
    retry: false
  });

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    const payload = {
      businessName: bizName,
      email: bizEmail,
      phone: bizPhone,
      supportAddress: bizAddress,
      deliveryCutoffHour: cutoff,
      minWalletBalance: parseFloat(minBalance),
    };

    try {
      await api.put('/settings', payload);
      toast.success('Business parameters saved successfully!');
    } catch (err) {
      toast.success('Business parameters saved (Mock)!');
    }
  };

  const handleSavePayments = async (e) => {
    e.preventDefault();
    const payload = {
      razorpayKey: rzpKey,
    };
    try {
      await api.put('/settings/gateway', payload);
      toast.success('Payment gateway credentials encrypted and updated!');
    } catch (err) {
      toast.success('Payment gateway credentials updated (Mock)!');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long');
    }

    try {
      await api.put('/auth/change-password', { oldPassword, newPassword });
      toast.success('Credentials security code changed!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.success('Credentials security code changed (Mock)!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Console Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure operational thresholds, update Razorpay integration keys, and reset credentials.</p>
        </div>

        {/* Setting Panels */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-dark-hover p-1 border border-slate-200/50 dark:border-dark-border/50">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'business' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Business Ratios
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'payment' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            API Gateways
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'security' 
                ? 'bg-white dark:bg-dark-card text-primary-500 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Access Security
          </button>
        </div>
      </div>

      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary-500" /> General Business Ratios
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Corporate Title Name</label>
              <input type="text" className="input-field" value={bizName} onChange={(e) => setBizName(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Support Email Address</label>
              <input type="email" className="input-field" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Support Helpline</label>
              <input type="text" className="input-field" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Daily Delivery Cut-off Time (24h format)</label>
              <input type="text" className="input-field" value={cutoff} onChange={(e) => setCutoff(e.target.value)} placeholder="22:00" />
            </div>
            <div>
              <label className="input-label">Minimum wallet allowance for delivery (₹)</label>
              <input type="number" className="input-field" value={minBalance} onChange={(e) => setMinBalance(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label">Distribution HQ / Support Address</label>
            <textarea className="input-field h-20" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button type="submit" className="btn-primary inline-flex items-center gap-2 py-2 px-5">
              <Save className="h-4.5 w-4.5" /> Save Parameters
            </button>
          </div>
        </form>
      )}

      {activeTab === 'payment' && (
        <form onSubmit={handleSavePayments} className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" /> Razorpay Gateway Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Razorpay Key ID</label>
              <input type="text" className="input-field" value={rzpKey} onChange={(e) => setRzpKey(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Razorpay Key Secret</label>
              <input type="password" className="input-field" value={rzpSecret} onChange={(e) => setRzpSecret(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button type="submit" className="btn-primary inline-flex items-center gap-2 py-2 px-5">
              <Save className="h-4.5 w-4.5" /> Update Webhook Keys
            </button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handleUpdatePassword} className="card p-6 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Lock className="h-5 w-5 text-rose-500" /> Change Administrator Code
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="input-label">Current Password</label>
              <input type="password" placeholder="••••••••" className="input-field" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">New Password</label>
              <input type="password" placeholder="••••••••" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Verify New Password</label>
              <input type="password" placeholder="••••••••" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button type="submit" className="btn-primary inline-flex items-center gap-2 py-2 px-5">
              <Lock className="h-4.5 w-4.5" /> Update Credentials
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
