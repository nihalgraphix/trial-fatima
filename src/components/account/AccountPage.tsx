import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Package,
  Heart,
  MapPin,
  User,
  KeyRound,
  LogOut,
  Printer,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Camera,
  Plus,
  Trash2,
  Check,
  Edit2,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { InvoiceModal } from '../checkout/InvoiceModal';
import { Order, ShippingAddress } from '../../types';
import { compressImageTo200KB, formatFileSize } from '../../utils/imageCompressor';
import { OrderHistory } from './OrderHistory';
import { GoogleMapAddressSelector } from '../common/GoogleMapAddressSelector';
import { DeliveryPortalPage } from '../delivery/DeliveryPortalPage';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    isDriver,
    currentDeliveryPerson,
    orders,
    wishlist,
    logoutUser,
    setActivePage,
    updateUserProfile,
    addSavedAddress,
    deleteSavedAddress,
    setDefaultAddress,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'details' | 'password' | 'driver-portal'>('overview');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Edit details form state
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [state, setState] = useState(currentUser?.state || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address modal states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrForm, setAddrForm] = useState<ShippingAddress>({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    house: '',
    street: '',
    area: '',
    city: currentUser?.city || 'Trivandrum',
    district: 'Trivandrum',
    state: currentUser?.state || 'Kerala',
    pinCode: '695001',
    isDefault: false,
  });

  // Password fields
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || '');
      setState(currentUser.state || '');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.photoURL || '');
    }
  }, [currentUser]);

  // If driver access was revoked by admin, automatically fallback to overview
  useEffect(() => {
    if (!isDriver && activeTab === 'driver-portal') {
      setActiveTab('overview');
    }
  }, [isDriver, activeTab]);

  if (isAuthLoading && !currentUser) {
    return (
      <div className="bg-white min-h-[65vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#71883F]/20 border-t-[#71883F] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#6B6B6B]">Restoring your account session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white min-h-[65vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto shadow-2xs">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#171717]">Sign In to View Your Account</h2>
        <p className="text-xs text-[#6B6B6B] max-w-sm">
          Access your stationery order history, manage delivery addresses, edit your profile details, and track active shipments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          
          <button
            onClick={() => setActivePage('login')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-xl shadow-2xs cursor-pointer transition-all"
          >
            Email Sign In
          </button>
          <button
            onClick={() => setActivePage('register')}
            className="px-5 py-2.5 text-xs font-semibold text-[#171717] bg-[#F7F8F3] hover:bg-[#E8E8E3] rounded-xl cursor-pointer transition-all"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    try {
      showToast('Compressing avatar photo...', 'info');
      const res = await compressImageTo200KB(file, 80 * 1024); // max 80KB for avatar
      setAvatar(res.dataUrl);
      updateUserProfile({ avatar: res.dataUrl });
      showToast('Profile photo updated!', 'success');
    } catch {
      showToast('Could not process photo file', 'error');
    }
  };

  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Email address is required.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        bio: bio.trim(),
        avatar: avatar,
      });
      showToast('User profile and details saved successfully!', 'success');
    } catch {
      showToast('Could not save profile details.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.fullName || !addrForm.phone || !addrForm.house || !addrForm.city || !addrForm.pinCode) {
      showToast('Please fill out all address details.', 'error');
      return;
    }
    addSavedAddress(addrForm);
    setAddressModalOpen(false);
    setAddrForm({
      fullName: currentUser.name,
      phone: currentUser.phone,
      email: currentUser.email,
      house: '',
      street: '',
      area: '',
      city: currentUser.city || 'Trivandrum',
      district: 'Trivandrum',
      state: currentUser.state || 'Kerala',
      pinCode: '695001',
      isDefault: false,
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || newPwd.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setCurrentPwd('');
    setNewPwd('');
    setConfirmNewPwd('');
    showToast('Account password updated successfully!', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
      case 'Confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Account Header with Profile Avatar */}
        <div className="mb-8 p-6 sm:p-8 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-[#EFF4E6] flex items-center justify-center text-[#71883F] font-bold text-xl">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#71883F] hover:bg-[#5F7334] text-white shadow-md cursor-pointer transition-transform hover:scale-105"
                title="Change Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#71883F] font-semibold uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Customer Account'}
                </span>
                {isDriver && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <Truck className="w-3 h-3" /> Authorized Driver
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
                {currentUser.name}
              </h1>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {currentUser.email} {currentUser.phone ? `· ${currentUser.phone}` : ''}
              </p>
              {currentUser.bio && (
                <p className="text-xs text-[#171717] mt-1 italic max-w-md">"{currentUser.bio}"</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {isDriver && (
              <button
                onClick={() => setActiveTab('driver-portal')}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" /> Driver Portal
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActivePage('admin')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
              </button>
            )}
            <button
              onClick={() => {
                logoutUser();
                setActivePage('home');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Tabs */}
          <aside className="lg:col-span-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-[#71883F] shadow-2xs'
                  : 'text-[#171717] hover:bg-white/60'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Overview
            </button>

            <button
              onClick={() => setActivePage('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-[#171717] hover:bg-white/60`}
            >
              <User className="w-4 h-4" /> Edit Profile & Details
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-[#71883F] shadow-2xs'
                  : 'text-[#171717] hover:bg-white/60'
              }`}
            >
              <Package className="w-4 h-4" /> Orders History ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-white text-[#71883F] shadow-2xs'
                  : 'text-[#171717] hover:bg-white/60'
              }`}
            >
              <MapPin className="w-4 h-4" /> Delivery Addresses ({currentUser.addresses?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-[#71883F] shadow-2xs'
                  : 'text-[#171717] hover:bg-white/60'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Security & Password
            </button>

            {isDriver && (
              <div className="pt-2 mt-2 border-t border-[#E8E8E3]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 px-3 block mb-1">
                  Delivery Partner Access
                </span>
                <button
                  onClick={() => setActiveTab('driver-portal')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'driver-portal'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Driver Portal
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                      activeTab === 'driver-portal'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    Active
                  </span>
                </button>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-5">
                    <span className="text-xs text-[#6B6B6B] block">Total Orders</span>
                    <span className="text-2xl font-extrabold text-[#171717] tabular-nums mt-1 block">
                      {orders.length}
                    </span>
                    <span className="text-[11px] text-[#71883F] mt-1 block font-medium">All fulfilled & tracked</span>
                  </div>

                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-5">
                    <span className="text-xs text-[#6B6B6B] block">Wishlist Items</span>
                    <span className="text-2xl font-extrabold text-[#171717] tabular-nums mt-1 block">
                      {wishlist.length}
                    </span>
                    <button
                      onClick={() => setActivePage('wishlist')}
                      className="text-[11px] text-[#71883F] hover:underline mt-1 block font-medium"
                    >
                      View saved items →
                    </button>
                  </div>

                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-5">
                    <span className="text-xs text-[#6B6B6B] block">Primary Location</span>
                    <span className="text-sm font-bold text-[#171717] mt-1 block truncate">
                      {currentUser.city || 'Trivandrum'}, {currentUser.state || 'Kerala'}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] mt-1 block">Express shipping eligible</span>
                  </div>
                </div>

                {/* Authorized Driver Portal Card (Only visible if user is made Driver by Admin) */}
                {isDriver && (
                  <div className="bg-gradient-to-r from-[#1B2412] to-[#2F3E1E] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#71883F] flex items-center justify-center text-white shrink-0">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                          Authorized Store Driver
                        </span>
                        <h3 className="text-base font-extrabold">Driver Dispatch & Delivery Portal</h3>
                        <p className="text-xs text-white/75 mt-0.5 max-w-xl">
                          You have been authorized by the Store Administrator to fulfill deliveries. Manage assigned orders, navigate to customer drop-offs, and update live delivery statuses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => setActiveTab('driver-portal')}
                        className="px-4 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        Open Driver Portal
                      </button>
                      <button
                        onClick={() => setActivePage('delivery-portal')}
                        className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                      >
                        Full Screen
                      </button>
                    </div>
                  </div>
                )}

                {/* Profile Summary Card */}
                <div className="border border-[#E8E8E3] rounded-2xl p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#171717]">Account Profile Information</h3>
                    <button
                      onClick={() => setActivePage('profile')}
                      className="text-xs text-[#71883F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#6B6B6B] block">Full Name</span>
                      <span className="font-semibold text-[#171717]">{currentUser.name}</span>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B] block">Email Address</span>
                      <span className="font-semibold text-[#171717]">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B] block">Phone</span>
                      <span className="font-semibold text-[#171717]">{currentUser.phone || 'Not added'}</span>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B] block">Registered On</span>
                      <span className="font-semibold text-[#171717]">{currentUser.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="border border-[#E8E8E3] rounded-2xl p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#171717]">Recent Stationery Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#71883F] font-semibold hover:underline"
                    >
                      View All ({orders.length}) →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p className="text-xs text-[#6B6B6B]">You haven't placed any orders yet.</p>
                  ) : (
                    <div className="divide-y divide-[#E8E8E3]">
                      {orders.slice(0, 2).map((order) => (
                        <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#171717] block">{order.id}</span>
                            <span className="text-[#6B6B6B]">{order.date} · {order.items.length} items</span>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                            <span className="font-bold text-[#171717] tabular-nums">₹{order.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* EDIT PROFILE & DETAILS TAB (PRIMARY USER FEATURE) */}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <OrderHistory />
            )}

            {/* SAVED ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E3]">
                  <div>
                    <h3 className="text-base font-bold text-[#171717]">Delivery Address Book</h3>
                    <p className="text-xs text-[#6B6B6B]">Manage addresses for speedy checkout</p>
                  </div>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="px-3.5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </button>
                </div>

                {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
                  <div className="p-8 text-center bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-2">
                    <MapPin className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs font-semibold text-[#171717]">No saved addresses yet</p>
                    <p className="text-[11px] text-[#6B6B6B]">Add your home, school or office address for 1-click checkout.</p>
                    <button
                      onClick={() => setAddressModalOpen(true)}
                      className="mt-2 px-4 py-2 bg-[#71883F] text-white text-xs font-semibold rounded-lg"
                    >
                      Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentUser.addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-2xl p-5 text-xs space-y-2 relative transition-all ${
                          addr.isDefault
                            ? 'border-[#71883F] bg-[#F7F8F3] shadow-xs'
                            : 'border-[#E8E8E3] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {addr.isDefault ? (
                            <span className="text-[10px] font-bold text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded-full inline-block">
                              DEFAULT ADDRESS
                            </span>
                          ) : (
                            <button
                              onClick={() => setDefaultAddress(idx)}
                              className="text-[10px] text-[#6B6B6B] hover:text-[#71883F] font-semibold underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => deleteSavedAddress(idx)}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="font-bold text-[#171717] text-sm">{addr.fullName}</h4>
                        <p className="text-[#6B6B6B]">{addr.house}, {addr.street}</p>
                        <p className="text-[#6B6B6B]">{addr.area}, {addr.city}</p>
                        <p className="text-[#6B6B6B]">{addr.district}, {addr.state} - {addr.pinCode}</p>
                        <p className="text-[#171717] font-medium pt-1">Phone: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY & PASSWORD TAB */}
            {activeTab === 'password' && (
              <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 sm:p-8 max-w-lg">
                <h3 className="text-base font-bold text-[#171717] mb-1">
                  Change Account Password
                </h3>
                <p className="text-xs text-[#6B6B6B] mb-5">
                  Update your login password to keep your account safe
                </p>

                <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPwd}
                      onChange={(e) => setConfirmNewPwd(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-3 py-2.5 px-5 bg-[#71883F] hover:bg-[#5F7334] text-white font-semibold rounded-xl shadow-2xs cursor-pointer transition-all active:scale-98"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {/* DRIVER PORTAL TAB (ONLY FOR AUTHORIZED DRIVERS) */}
            {activeTab === 'driver-portal' && isDriver && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-[#171717]">Driver Dispatch Console</h3>
                    <p className="text-xs text-[#6B6B6B]">
                      Manage your assigned store deliveries, update statuses, and navigate to customers
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('delivery-portal')}
                    className="px-3.5 py-2 rounded-xl bg-[#EFF4E6] hover:bg-[#71883F] text-[#71883F] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Expand Full Screen →
                  </button>
                </div>
                <DeliveryPortalPage embedded />
              </div>
            )}

          </main>

        </div>

        {/* Add Address Modal */}
        {addressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#171717]">Add New Delivery Address</h3>
                <button
                  onClick={() => setAddressModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto space-y-3.5 text-xs">
                <div className="mb-4 p-4 bg-[#EFF4E6] rounded-2xl border border-[#71883F]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-[#71883F]" />
                    <h4 className="text-xs font-bold text-[#71883F]">Smart Address Finder</h4>
                  </div>
                  <GoogleMapAddressSelector 
                    onAddressSelect={(data) => {
                      setAddrForm({
                        ...addrForm,
                        street: data.formattedAddress,
                        city: data.city || addrForm.city,
                        state: data.state || addrForm.state,
                        pinCode: data.pinCode || addrForm.pinCode,
                        lat: data.lat,
                        lng: data.lng
                      });
                      showToast('Location pinned on map', 'info');
                    }}
                  />
                  <p className="text-[10px] text-[#71883F] mt-2 italic">Search for your building, landmark or street for precise delivery.</p>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addrForm.fullName}
                    onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                    placeholder="Recipient name"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      placeholder="+91 98450 12345"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.pinCode}
                      onChange={(e) => setAddrForm({ ...addrForm, pinCode: e.target.value })}
                      placeholder="695001"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Flat, House No., Building *</label>
                  <input
                    type="text"
                    required
                    value={addrForm.house}
                    onChange={(e) => setAddrForm({ ...addrForm, house: e.target.value })}
                    placeholder="e.g. Flat 3B, Sunshine Apartments"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Street Address & Landmark</label>
                  <input
                    type="text"
                    value={addrForm.street}
                    onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                    placeholder="Near Government College, MG Road"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.state}
                      onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>Make this my default delivery address</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {selectedInvoiceOrder && (
          <InvoiceModal
            order={selectedInvoiceOrder}
            isOpen={!!selectedInvoiceOrder}
            onClose={() => setSelectedInvoiceOrder(null)}
          />
        )}

      </div>
    </div>
  );
};
