import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, KeyRound, ShieldAlert,
  Loader, Check, Edit, Save, Calendar, Landmark, Settings, X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const CustomerProfile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [milkType, setMilkType] = useState('cow_milk');
  const [quantity, setQuantity] = useState(1);

  // Password Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch current profile details
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerProfileData'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    }
  });

  // Synchronize form state with fetched profile after API request completes
  useEffect(() => {
    if (profile && !isEditing) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAlternatePhone(profile.customerProfile?.alternate_phone || '');
      setLine1(profile.customerProfile?.address_line1 || '');
      setLine2(profile.customerProfile?.address_line2 || '');
      setLandmark(profile.customerProfile?.landmark || '');
      setCity(profile.customerProfile?.city || '');
      setState(profile.customerProfile?.state || '');
      setPincode(profile.customerProfile?.pincode || '');
      setDeliverySlot(profile.customerProfile?.delivery_slot_pref || 'morning');
      setMilkType(profile.customerProfile?.milk_type || 'cow_milk');
      setQuantity(profile.customerProfile?.quantity || 1);
    }
  }, [profile, isEditing]);

  // Profile Update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      return api.put(`/customers/${profile.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries(['customerProfileData']);
      queryClient.invalidateQueries(['customerProfileForWallet']);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update profile');
    }
  });

  const handleUpdateProfileSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (!phone.trim() || phone.length !== 10) return toast.error('Phone number must be exactly 10 digits');
    if (!line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      return toast.error('Address specifications are incomplete');
    }
    if (pincode.length !== 6) return toast.error('Pincode must be 6 digits');

    const payload = {
      name,
      phone,
      alternatePhone,
      address: {
        line1,
        line2,
        landmark,
        city,
        state,
        pincode,
      },
      preferences: {
        deliverySlot,
        milkType,
        quantity: Number(quantity),
      }
    };

    updateProfileMutation.mutate(payload);
  };

  // Password Update handler
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Please enter your current password');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    try {
      setIsChangingPassword(true);
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl h-80 animate-pulse">
        <Loader className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center p-12 bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Failed to load profile details</p>
        <button onClick={() => refetch()} className="text-blue-500 underline text-xs mt-1">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-display font-bold">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage contact details, delivery preferences, and security passwords.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
            isEditing 
              ? 'bg-slate-100 hover:bg-slate-250 text-slate-650 dark:bg-dark-hover dark:hover:bg-slate-700/60 dark:text-slate-250'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          }`}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancel Edit
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Profile Summary Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <span className="h-20 w-20 rounded-full bg-blue-50 dark:bg-dark-hover flex items-center justify-center text-blue-500 border border-blue-100 dark:border-dark-border shadow-inner">
              <User className="h-10 w-10" />
            </span>

            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">{profile.name}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                ID: {profile.customerProfile?.customer_id || 'N/A'}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-550 border border-emerald-500/15 capitalize">
                Account: {profile.customerProfile?.status || 'Active'}
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-dark-border/40 w-full pt-4 space-y-2.5 text-left text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>+91 {profile.phone}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-50 dark:border-dark-border/10">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Joined {profile.customerProfile?.registration_date ? format(new Date(profile.customerProfile.registration_date), 'dd MMM yyyy') : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Form panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* edit details panel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display border-b border-slate-100 dark:border-dark-border/40 pb-3 mb-4">
              Profile Specifications
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Name & Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Primary Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Alternate Phone</label>
                  <input
                    type="text"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address specifications</span>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Address Line 1</label>
                      <input
                        type="text"
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Address Line 2</label>
                      <input
                        type="text"
                        value={line2}
                        onChange={(e) => setLine2(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Landmark</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Preferences */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Preferences</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Preferred Slot</label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Preferred Milk</label>
                    <select
                      value={milkType}
                      onChange={(e) => setMilkType(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="cow_milk">Cow Milk</option>
                      <option value="buffalo_milk">Buffalo Milk</option>
                      <option value="toned_milk">Toned Milk</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Default Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card disabled:opacity-65 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              {isEditing && (
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="btn-primary py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/10 transition-all flex items-center gap-1.5"
                  >
                    {updateProfileMutation.isLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password panel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200/60 dark:border-dark-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display border-b border-slate-100 dark:border-dark-border/40 pb-3 mb-4 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-blue-500" />
              Change Credentials Password
            </h3>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xxs font-bold text-slate-450 uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;
