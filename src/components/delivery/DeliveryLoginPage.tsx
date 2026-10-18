import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Truck, ShieldCheck, Phone, Lock, ArrowRight } from 'lucide-react';

export const DeliveryLoginPage: React.FC = () => {
  const { setActivePage, showToast, deliveryPersonnel } = useStore();
  const [selectedWorkerId, setSelectedWorkerId] = useState(deliveryPersonnel[0]?.id || 'dp-1');
  const [password, setPassword] = useState('delivery123');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = deliveryPersonnel.find((d) => d.id === selectedWorkerId);
    if (worker) {
      localStorage.setItem('fs_v5_active_delivery_worker', worker.id);
      showToast(`Welcome back, Delivery Partner ${worker.name}!`, 'success');
      setActivePage('delivery');
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8F3] py-12 px-4 flex items-center justify-center text-left">
      <div className="max-w-md w-full bg-white border border-[#E8E8E3] rounded-3xl p-8 shadow-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#71883F] text-white flex items-center justify-center mx-auto shadow-xs">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">Delivery Partner Portal</h2>
          <p className="text-xs text-[#6B6B6B]">
            Authorized portal for Fathima Express delivery workers & route managers
          </p>
        </div>



        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#171717] block mb-1">Passcode / PIN</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter 6-digit delivery passcode"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F] font-mono"
              />
              <Lock className="w-4 h-4 text-[#71883F] absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to Delivery Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
