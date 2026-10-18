import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BookOpen, Phone, Mail, MapPin, Send, ShieldCheck, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActivePage, showToast, storeSettings } = useStore();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast(`Thank you for subscribing to ${storeSettings?.storeName || 'our'} newsletter!`);
    setEmail('');
  };

  const navigateTo = (page: any) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#E8E8E3] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#E8E8E3]">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {storeSettings?.logoUrl && (storeSettings?.logoType === 'image' || storeSettings?.logoType === 'both') ? (
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.storeName || 'Logo'}
                  className="h-9 max-w-[200px] object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-[#71883F] flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
              )}
              {storeSettings?.logoType !== 'image' && (
                <span className="text-lg font-bold tracking-tight text-[#171717]">
                  {storeSettings?.storeName || 'FATHIMA STORES'}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed max-w-sm">
              Quality stationery and everyday essentials at affordable prices. Serving students, educators, creative artists and businesses with reliable supplies.
            </p>

            <div className="space-y-2 text-xs text-[#6B6B6B] pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#71883F]" />
                <span>+91 98450 12345 / 0471 2345678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#71883F]" />
                <span>care@fathimastores.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#71883F]" />
                <span>Fathima Complex, College Road, Trivandrum, India</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#6B6B6B]">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-[#71883F] transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop')} className="hover:text-[#71883F] transition-colors">
                  Shop All Products
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('categories')} className="hover:text-[#71883F] transition-colors">
                  Categories
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-[#71883F] transition-colors">
                  About Fathima Stores
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-[#71883F] transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Customer Service
            </h4>
            <ul className="space-y-2 text-xs text-[#6B6B6B]">
              <li>
                <button onClick={() => navigateTo('order-tracking')} className="hover:text-[#71883F] transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-[#71883F] transition-colors">
                  Return & Exchange Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-[#71883F] transition-colors">
                  Shipping & Delivery Info
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-[#71883F] transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-[#71883F] transition-colors">
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Subscribe to Newsletter
            </h4>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Get the latest updates on new arrivals, exam essentials and seasonal discount coupons.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex rounded-lg overflow-hidden border border-[#E8E8E3] focus-within:border-[#71883F]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full text-xs px-3 py-2 text-[#171717] placeholder:text-[#6B6B6B] bg-[#F7F8F3] outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#71883F] text-white hover:bg-[#5F7334] transition-colors flex items-center justify-center shrink-0"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="pt-2 text-[11px] text-[#6B6B6B]">
              <span className="font-semibold text-[#171717]">Payment Methods:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['UPI / GPay / PhonePe', 'RuPay', 'Visa / Mastercard', 'Cash on Delivery', 'Net Banking'].map((m) => (
                  <span key={m} className="px-1.5 py-0.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded text-[10px] text-[#171717]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Admin Portal Link */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6B6B] gap-3">
          <p>© {new Date().getFullYear()} Fathima Stores. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('admin-login')}
              className="hover:text-[#71883F] font-medium flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </button>
            <span>·</span>
            <span>Designed with precision</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
