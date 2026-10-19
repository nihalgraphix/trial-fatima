import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  X,
  ShieldCheck,
} from 'lucide-react';

interface ForceSignInModalProps {
  isOpen: boolean;
  onClose?: () => void;
  reason?: string;
}

export const ForceSignInModal: React.FC<ForceSignInModalProps> = ({
  isOpen,
  onClose,
  reason = 'Please sign in to browse products, add items to cart, and make purchases.',
}) => {
  const {
    loginUser,
    registerUser,
    loginWithGoogle,
    isAuthLoading,
    currentUser,
    setActivePage,
    showToast,
  } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || currentUser) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both your email and password.', 'error');
      return;
    }

    setIsSubmitting(true);
    const success = await loginUser(email.trim(), password, 'customer');
    setIsSubmitting(false);

    if (success && onClose) {
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsSubmitting(true);
    const success = await registerUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98450 12345',
      password,
      role: 'customer',
    });
    setIsSubmitting(false);

    if (success && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button if dismissable */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-[#FAFBF7] to-white border-b border-[#E8E8E3]">
          <div className="w-14 h-14 rounded-2xl bg-[#71883F] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF4E6] text-[#71883F] text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Sign In Required
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
            {mode === 'signin' ? 'Sign In to Continue' : 'Create Free Account'}
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-xs mx-auto leading-relaxed">
            {reason}
          </p>
        </div>

        {/* Auth Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Quick Google Sign In */}
          <button
            type="button"
            disabled={isAuthLoading}
            onClick={async () => {
              await loginWithGoogle();
              if (onClose) onClose();
            }}
            className="w-full py-3 px-4 bg-white border-2 border-[#E8E8E3] hover:border-[#71883F] text-[#171717] font-bold text-xs sm:text-sm rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E8E8E3]" />
            <span className="text-[11px] font-bold text-[#A3A3A3] uppercase">or with email</span>
            <div className="flex-1 h-px bg-[#E8E8E3]" />
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#F7F8F3] rounded-xl border border-[#E8E8E3] text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#6B6B6B]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#6B6B6B]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anish Kumar"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                  />
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Register & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Admin Access switch */}
          <div className="pt-2 border-t border-[#E8E8E3] text-center">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                setActivePage('admin-login');
              }}
              className="text-[11px] font-bold text-neutral-600 hover:text-[#71883F] inline-flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Are you a Store Administrator? Portal Sign In →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
