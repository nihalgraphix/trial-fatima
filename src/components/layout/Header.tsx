import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerNotificationsModal } from '../common/CustomerNotificationsModal';
import { ActivePage } from '../../types';
import {
  Bell,
  MessageSquare,
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  BookOpen,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activePage,
    setActivePage,
    cartCount,
    wishlist,
    setIsCartOpen,
    setIsSearchOpen,
    currentUser,
    isAdmin,
    isDriver,
    switchRole,
    logoutUser,
    loginWithGoogle,
    customerMessages,
    notifications,
    customerNotifications,
    isDeliveryLoggedIn,
    categories,
    storeSettings,
    setIsSupportChatOpen,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const activeNotifList = isAdmin
    ? notifications || []
    : (customerNotifications || []).length > 0
    ? customerNotifications
    : (notifications || []).filter((n) => !n.userId || n.userId === 'guest' || n.target === 'all');
  const unreadNotificationsCount = activeNotifList.filter((n) => !n.read).length;
  const userEmailNorm = currentUser?.email?.toLowerCase().trim();
  const unreadAdminRepliesCount = (customerMessages || []).filter(
    (m) =>
      (!userEmailNorm || m.email?.toLowerCase().trim() === userEmailNorm) &&
      (m.replyNotes || m.status === 'replied')
  ).length;
  const totalAlertsCount = unreadNotificationsCount + unreadAdminRepliesCount;
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', page: 'home' as const },
    { label: 'Shop', page: 'shop' as const },
    ...(categories.length > 0 ? [{ label: 'Categories', page: 'categories' as const }] : []),
    { label: 'Offers', page: 'shop' as const, filter: 'discount' },
    { label: 'Track Order', page: 'order-tracking' as const },
    { label: 'About', page: 'about' as const },
    { label: 'Contact', page: 'contact' as const },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E8E8E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Wordmark / Custom Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            {/* Image Logo Only */}
            {storeSettings?.logoType === 'image' && storeSettings?.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.storeName || 'Store Logo'}
                style={{ height: `${storeSettings.logoHeight || 36}px` }}
                className="max-w-[220px] object-contain transition-transform group-hover:scale-105"
              />
            ) : storeSettings?.logoType === 'both' && storeSettings?.logoUrl ? (
              /* Image Logo + Store Name Text */
              <>
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.storeName || 'Store Logo'}
                  style={{ height: `${storeSettings.logoHeight || 36}px` }}
                  className="max-w-[140px] object-contain transition-transform group-hover:scale-105"
                />
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-[#171717] block leading-tight">
                    {storeSettings.storeName || 'FATHIMA STORES'}
                  </span>
                </div>
              </>
            ) : (
              /* Default Text Logo + Icon */
              <>
                <div className="w-8 h-8 rounded-md bg-[#71883F] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-[#171717] block leading-tight">
                    {storeSettings.storeName || 'FATHIMA STORES'}
                  </span>
                </div>
              </>
            )}
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.page)}
                  className={`text-sm font-medium transition-colors hover:text-[#71883F] relative py-1 ${
                    isActive ? 'text-[#71883F] font-semibold' : 'text-[#171717]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#71883F] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Interactive Affordances */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#171717] hover:text-[#71883F] hover:bg-[#F7F8F3] rounded-lg transition-colors"
              title="Search products"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Customer Notifications & Admin Replies Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 text-[#171717] hover:text-[#71883F] hover:bg-[#F7F8F3] rounded-lg transition-colors relative cursor-pointer"
              title="Notifications & Admin Replies"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {totalAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums animate-pulse">
                  {totalAlertsCount}
                </span>
              )}

            </button>

            {/* Wishlist */}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="p-2 text-[#171717] hover:text-[#71883F] hover:bg-[#F7F8F3] rounded-lg transition-colors relative"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#71883F] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon & Count */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-[#171717] hover:text-[#71883F] hover:bg-[#F7F8F3] rounded-lg transition-colors relative"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#71883F] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile Pill / Account Button */}
            <div className="relative">
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className={`flex items-center gap-2 p-1 sm:pl-1 sm:pr-3 rounded-full border transition-all duration-300 ${
                  currentUser 
                    ? 'bg-[#EFF4E6] border-[#71883F]/20 hover:border-[#71883F] shadow-sm' 
                    : 'bg-white border-[#E8E8E3] hover:border-[#71883F] text-[#171717]'
                } text-xs font-medium cursor-pointer`}
              >
                {currentUser?.photoURL ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs">
                    <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                ) : isAdmin ? (
                  <div className="w-8 h-8 rounded-full bg-[#71883F] flex items-center justify-center text-white border-2 border-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                ) : currentUser ? (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#71883F] border-2 border-[#EFF4E6] shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 bg-[#F7F8F3] rounded-full">
                    <UserIcon className="w-4 h-4 text-[#6B6B6B]" />
                  </div>
                )}
                
                {(currentUser || isAdmin) && (
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="font-bold text-[#171717] max-w-[90px] truncate text-[11px]">
                      {isAdmin ? 'Admin' : currentUser?.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-[#71883F] font-semibold uppercase tracking-tighter">
                      {isAdmin ? 'Store Manager' : 'Member'}
                    </span>
                  </div>
                )}
                
                {!currentUser && !isAdmin && (
                  <span className="hidden sm:inline font-bold px-1">Account</span>
                )}
                
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${accountDropdownOpen ? 'rotate-180' : ''} text-[#6B6B6B]`} />
              </button>

              {accountDropdownOpen && (
                <div
                  className="absolute right-0 mt-3 w-64 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2"
                  onMouseLeave={() => setAccountDropdownOpen(false)}
                >
                  {currentUser ? (
                    <>
                      <div className="px-5 py-3 border-b border-[#F7F8F3] mb-2">
                        <div className="flex items-center gap-3 mb-2">
                          {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} className="w-10 h-10 rounded-full border border-[#EFF4E6]" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#EFF4E6] flex items-center justify-center text-[#71883F]">
                              <UserIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#171717] truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-[#6B6B6B] truncate">{currentUser.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-[#EFF4E6] text-[#71883F] font-black uppercase tracking-wider">
                            {currentUser.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
                          </span>
                          {isDriver && (
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider">
                              Driver
                            </span>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setActivePage('admin');
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-left px-5 py-2.5 text-xs font-bold text-[#171717] hover:bg-[#F7F8F3] hover:text-[#71883F] flex items-center gap-3 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#71883F]" />
                          Admin Dashboard
                        </button>
                      )}

                      {isDriver && (
                        <button
                          onClick={() => {
                            setActivePage('delivery-portal');
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-left px-5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Driver Dispatch Console</span>
                          </span>
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                            Live
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActivePage('account');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-5 py-2.5 text-xs font-bold text-[#171717] hover:bg-[#F7F8F3] hover:text-[#71883F] transition-colors flex items-center justify-between"
                      >
                        <span>Account Center & Orders</span>
                        {isDriver && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold">
                            Driver Portal
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setActivePage('profile');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-5 py-2.5 text-xs font-bold text-[#171717] hover:bg-[#F7F8F3] hover:text-[#71883F] transition-colors"
                      >
                        Edit Profile Details
                      </button>
                      <button
                        onClick={() => {
                          setActivePage('wishlist');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-5 py-2.5 text-xs font-bold text-[#171717] hover:bg-[#F7F8F3] hover:text-[#71883F] transition-colors flex items-center justify-between"
                      >
                        <span>Saved Items</span>
                        <span className="text-[10px] bg-[#EFF4E6] text-[#71883F] px-2 py-0.5 rounded-full">{wishlist.length}</span>
                      </button>

                      <div className="mt-2 pt-2 border-t border-[#F7F8F3]">
                        <button
                          onClick={() => {
                            logoutUser();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-left px-5 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out Account
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-2 space-y-2.5">
                      <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest text-center mb-1">Welcome to Fathima</p>
                      
                      <button
                        type="button"
                        onClick={() => {
                          loginWithGoogle();
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-[#E8E8E3] hover:bg-[#F7F8F3] text-[#171717] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google Sign In
                      </button>

                      <button
                        onClick={() => {
                          setActivePage('login');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-xl text-center transition-all shadow-xs active:scale-95"
                      >
                        Email Login / Join
                      </button>
                      
                      <div className="pt-2 border-t border-[#F7F8F3]">
                        <button
                          onClick={() => {
                            setActivePage('admin-login');
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full py-2 px-4 text-[10px] text-[#6B6B6B] hover:text-[#171717] font-bold text-center block uppercase tracking-widest"
                        >
                          Staff Portal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#171717] hover:text-[#71883F] hover:bg-[#F7F8F3] rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Side Drawer Navigation Bar */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar Content */}
            <aside className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-left duration-300">
              {/* Brand Top Header */}
              <div className="p-4 border-b border-[#E8E8E3] bg-[#FAFBF7] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {storeSettings?.logoUrl ? (
                    <img
                      src={storeSettings.logoUrl}
                      alt={storeSettings.storeName || 'Fathima Stores'}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#71883F] text-white flex items-center justify-center font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm text-[#171717] tracking-tight">
                      {storeSettings?.storeName || 'FATHIMA STORES'}
                    </h3>
                    <span className="text-[10px] text-[#71883F] font-semibold block">
                      {storeSettings?.brandTagline || 'Stationery & Supplies'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Banner */}
              <div className="p-4 bg-[#EFF4E6]/50 border-b border-[#E8E8E3]">
                {currentUser ? (
                  <div className="flex items-center gap-3">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#71883F]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#71883F] text-white flex items-center justify-center font-bold text-xs">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold text-[#171717] truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-[#6B6B6B] truncate">{currentUser.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#171717]">Welcome Guest</span>
                    <button
                      onClick={() => {
                        setActivePage('login');
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1 bg-[#71883F] text-white rounded-lg text-xs font-bold shadow-2xs"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Links List */}
              <div className="flex-1 p-4 space-y-1">
                <span className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider block mb-2 px-2">
                  Navigation Menu
                </span>

                {navLinks.map((item) => {
                  const isActive = activePage === item.page;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.page)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-[#71883F] text-white shadow-2xs'
                          : 'text-[#171717] hover:bg-[#F7F8F3]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-[#E8E8E3] space-y-1">
                  <span className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider block mb-2 px-2">
                    My Account & Support
                  </span>

                  <button
                    onClick={() => handleNavClick('wishlist')}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F8F3] rounded-xl flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" /> Saved Wishlist
                    </span>
                    <span className="text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('order-tracking')}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F8F3] rounded-xl flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#71883F]" /> Real-time Order Tracker
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActivePage('admin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl flex items-center gap-2 shadow-2xs mt-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Console
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Quick Help Bar */}
              <div className="p-4 border-t border-[#E8E8E3] bg-[#FAFBF7] space-y-1 text-xs">
                <p className="font-bold text-[#171717]">Need Assistance?</p>
                <p className="text-[11px] text-[#6B6B6B]">
                  Call: <a href={`tel:${storeSettings?.contactPhone || '+919845012345'}`} className="font-bold text-[#71883F]">{storeSettings?.contactPhone || '+91 98450 12345'}</a>
                </p>
              </div>
            </aside>
          </div>
        )}
      </header>

      <CustomerNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenLiveChat={() => setIsSupportChatOpen(true)}
      />
    </>
  );
};
