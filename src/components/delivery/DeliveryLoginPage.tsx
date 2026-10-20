import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Truck, ShieldCheck, Phone, Mail, ArrowRight, UserCheck, Star, MapPin } from 'lucide-react';

export const DeliveryLoginPage: React.FC = () => {
  const { setActivePage, showToast, deliveryPersonnel, deliveryLogin } = useStore();

  const defaultDriver = deliveryPersonnel[0] || {
    id: 'dp-1',
    name: 'Rahul Nair',
    email: 'rahul.nair@fathimastore.in',
    phone: '+91 98471 22011',
    vehicleType: 'Bike',
    vehicleNumber: 'KL-01-CA-4421',
  };

  const [email, setEmail] = useState(defaultDriver.email);
  const [phone, setPhone] = useState(defaultDriver.phone);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectDriver = (driverEmail: string, driverPhone: string) => {
    setEmail(driverEmail);
    setPhone(driverPhone);
    setErrorMsg('');
  };

  const handleQuickDriverLogin = (driverEmail: string, driverPhone: string) => {
    const ok = deliveryLogin(driverEmail, driverPhone);
    if (ok) {
      setActivePage('delivery-portal');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = deliveryLogin(email, phone);
    if (success) {
      setActivePage('delivery-portal');
    } else {
      setErrorMsg('Invalid driver email or phone number. Select an authorized driver below.');
      showToast('Invalid driver credentials. Please select an authorized driver.', 'error');
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8F3] py-10 px-4 flex items-center justify-center text-left">
      <div className="max-w-2xl w-full bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#71883F] text-white flex items-center justify-center mx-auto shadow-xs">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">
            Delivery Driver Portal
          </h2>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Authorized dispatch & navigation console for Fathima Express delivery drivers. View assigned queues, navigate to customer pinned locations via Google Maps, and complete deliveries.
          </p>
        </div>

        {/* Authorized Fleet Quick-Access Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#71883F] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Authorized Delivery Fleet (Click to Sign In)
            </span>
            <span className="text-[10px] text-[#6B6B6B]">1-Click Instant Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {deliveryPersonnel.map((driver) => {
              const isSelected = email.toLowerCase() === driver.email.toLowerCase();
              return (
                <div
                  key={driver.id}
                  onClick={() => handleSelectDriver(driver.email, driver.phone)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#EFF4E6]/70 border-[#71883F] shadow-2xs'
                      : 'bg-[#FAFBF7] border-[#E8E8E3] hover:border-[#71883F]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold text-[#171717] truncate">{driver.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#E8E8E3] text-[#71883F]">
                        {driver.vehicleType}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#6B6B6B] truncate mt-0.5">{driver.email}</p>
                    <p className="text-[10px] text-[#6B6B6B] font-mono flex items-center gap-1 mt-0.5">
                      <span>{driver.vehicleNumber}</span>
                      <span>•</span>
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 inline" />
                      <span>{driver.rating}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickDriverLogin(driver.email, driver.phone);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#71883F] hover:bg-[#5F7334] text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Enter</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Driver Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-[#E8E8E3]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Driver Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.nair@fathimastore.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
                />
                <Mail className="w-4 h-4 text-[#71883F] absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Registered Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98471 22011"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F] font-mono"
                />
                <Phone className="w-4 h-4 text-[#71883F] absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to Delivery Driver Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
