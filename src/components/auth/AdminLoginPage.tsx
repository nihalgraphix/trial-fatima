import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const {
    loginUser,
    loginWithGoogle,
    isAdmin,
    currentUser,
    grantCustomerAdmin,
    isAuthLoading,
    setActivePage,
    showToast,
  } = useStore();

  const [email, setEmail] = useState('admin@fathimastores.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setActivePage('admin');
    }
  }, [isAdmin, setActivePage]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter admin credentials.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      try {
        localStorage.setItem('fs_admin_override', 'true');
      } catch {}
      const success = await loginUser(email.trim(), password, 'admin');
      if (success) {
        setActivePage('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setIsSubmitting(true);
    try {
      try {
        localStorage.setItem('fs_admin_override', 'true');
      } catch {}
      await loginWithGoogle();
      setActivePage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleElevateCurrentAccount = async () => {
    if (!currentUser?.email) return;
    setIsSubmitting(true);
    try {
      try {
        localStorage.setItem('fs_admin_override', 'true');
      } catch {}
      await grantCustomerAdmin(currentUser.email, true);
      await loginUser(currentUser.email, undefined, 'admin');
      setActivePage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#171717] min-h-screen py-14 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#E8E8E3] rounded-3xl p-8 sm:p-9 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#71883F] tracking-widest block">
            Protected Admin Console • Kochi Hub
          </span>
          <h2 className="text-2xl font-black text-[#171717] mt-1 tracking-tight">
            Fathima Stores Admin
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Store management, inventory control, orders & delivery route optimizer
          </p>
        </div>

        {currentUser && !isAdmin && (
          <div className="p-3.5 bg-[#EFF4E6] border border-[#71883F]/30 rounded-2xl space-y-2 text-center">
            <p className="text-xs text-[#171717] font-semibold">
              Signed in as <span className="font-bold">{currentUser.email}</span>
            </p>
            <button
              type="button"
              onClick={handleElevateCurrentAccount}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Continue to Admin Dashboard as {currentUser.name}
            </button>
          </div>
        )}

        {/* Google Sign In Option */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={isAuthLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-[#E8E8E3] hover:bg-[#F7F8F3] text-[#171717] font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Account Admin Login
        </button>

        {/* Email & Password Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs pt-1">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fathimastores.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-hidden focus:border-[#71883F] text-xs"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Admin Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. admin123)"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-hidden focus:border-[#71883F] text-xs"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            Access Admin Console <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-[#E8E8E3]">
          <button
            onClick={() => setActivePage('home')}
            className="text-xs text-[#6B6B6B] hover:text-[#171717] inline-flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
