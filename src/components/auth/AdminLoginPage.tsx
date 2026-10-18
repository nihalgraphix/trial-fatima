import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { loginUser, setActivePage, showToast } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter admin credentials.', 'error');
      return;
    }
    const success = await loginUser(email, password, 'admin');
    if (success) {
      setActivePage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <div className="bg-[#171717] min-h-screen py-14 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#E8E8E3] rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#71883F] tracking-wider block">
            Protected Area
          </span>
          <h2 className="text-xl font-bold text-[#171717] mt-0.5">Fathima Stores Admin Portal</h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Store management, inventory control & orders processing
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fathimastores.com"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
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
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Access Admin Console <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setActivePage('home')}
            className="text-xs text-[#6B6B6B] hover:text-[#171717] inline-flex items-center gap-1 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </button>
        </div>

      </div>
    </div>
  );
};
