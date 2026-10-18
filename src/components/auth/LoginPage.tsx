import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BookOpen, Lock, Mail, ArrowRight, Eye, EyeOff, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginUser, registerUser, loginWithGoogle, isAuthLoading, setActivePage, showToast } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useStore();

  React.useEffect(() => {
    if (!isAuthLoading && currentUser) {
      setActivePage('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAuthLoading, currentUser, setActivePage]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both your email and password.', 'error');
      return;
    }

    setIsSubmitting(true);
    const success = await loginUser(email.trim(), password, 'customer');
    setIsSubmitting(false);

    if (success) {
      setActivePage('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (success) {
      setActivePage('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <div className="bg-[#F7F8F3] min-h-[85vh] py-10 sm:py-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-9 shadow-sm">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#71883F] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {mode === 'signin'
              ? 'Sign in to access your orders, wishlist, and saved addresses'
              : 'Join Fathima Stores for special offers and faster checkout'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex p-1 bg-[#F7F8F3] rounded-2xl border border-[#E8E8E3] mb-5">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-[#171717] shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#171717] shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        {mode === 'signin' ? (
          <>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#E8E8E3] hover:bg-[#F7F8F3] text-[#171717] font-bold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                {isAuthLoading ? 'Connecting...' : 'Continue with Google'}
              </button>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E8E8E3]"></div>
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[#E8E8E3]"></div>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="font-bold text-[#171717] block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#171717]">Password</label>
                  <button
                    type="button"
                    onClick={() => showToast('Password reset link sent to your email address.', 'info')}
                    className="text-[#71883F] hover:underline cursor-pointer text-[11px]"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
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
                className="w-full py-3 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-98"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3.5 text-xs text-left">
            <div>
              <label className="font-bold text-[#171717] block mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
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

            <div>
              <label className="font-bold text-[#171717] block mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717]"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-98"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Admin Link */}
        <div className="mt-6 pt-4 border-t border-[#E8E8E3] text-center">
          <button
            type="button"
            onClick={() => {
              setActivePage('admin-login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#71883F] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Store Owner / Administrator Access Portal →
          </button>
        </div>

      </div>
    </div>
  );
};
