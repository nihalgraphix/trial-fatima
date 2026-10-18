import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BookOpen, Lock, Mail, ArrowRight, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { registerUser, setActivePage, showToast } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
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
    const success = registerUser({
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#71883F] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">
            Join Fathima Stores
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Create an account for special offers, order tracking, and faster checkout
          </p>
        </div>

        {/* Email & Password Registration Form */}
        <form onSubmit={handleRegister} className="space-y-3.5 text-xs text-left">
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
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
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

        <div className="mt-8 pt-6 border-t border-[#E8E8E3] text-center">
          <button
            onClick={() => setActivePage('login')}
            className="text-xs text-[#6B6B6B] hover:text-[#71883F] font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Already have an account? Sign In
          </button>
        </div>

      </div>
    </div>
  );
};
