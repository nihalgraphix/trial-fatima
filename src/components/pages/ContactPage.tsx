import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  Navigation,
  Settings,
  X,
} from 'lucide-react';
import { StoreLocationConfigCard } from '../admin/StoreLocationConfigCard';

export const ContactPage: React.FC = () => {
  const { addCustomerMessage, currentUser, isAdmin, showToast, storeSettings } = useStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showLocationEditor, setShowLocationEditor] = useState(false);

  const storeLat = storeSettings?.storeLat ?? 8.5241;
  const storeLng = storeSettings?.storeLng ?? 76.9366;
  const storeHubName =
    storeSettings?.storeHubName || `${storeSettings?.storeName || 'Fathima Stores'} Hub`;
  const storeAddress =
    storeSettings?.address || 'MG Road, Opposite Secretariat, Trivandrum, Kerala - 695001';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in your name, email, and message.', 'error');
      return;
    }

    addCustomerMessage({
      userId: currentUser?.id,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      subject,
      message,
    });

    setSubmitted(true);
    setMessage('');
  };

  return (
    <div className="bg-[#F7F8F3] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E8E3] pb-6 text-left">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#71883F] block mb-2">
              Customer Support & Bulk Orders
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              Get in Touch with {storeSettings?.storeName || 'Fathima Stores'}
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">
              Have questions about an order, institutional supplies, or delivery coverage from{' '}
              <span className="font-semibold text-[#171717]">{storeHubName}</span>? Send us a
              message or visit our store hub.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLocationEditor((prev) => !prev)}
            className="px-4 py-2.5 bg-white hover:bg-[#EFF4E6] text-[#171717] border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-[#71883F]" />
            <span>{showLocationEditor ? 'Close Store Location Editor' : 'Change Store Location'}</span>
          </button>
        </div>

        {/* Optional Inline Store Location Editor */}
        {showLocationEditor && (
          <div className="relative">
            <StoreLocationConfigCard onSaved={() => setShowLocationEditor(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Cols: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
                  Store Information
                </h3>
                <span className="text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] px-2 py-0.5 rounded-full">
                  Active Hub
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#171717]">{storeHubName}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">{storeAddress}</p>
                  <p className="text-[10px] font-mono text-[#71883F] mt-1">
                    GPS: {storeLat.toFixed(5)}, {storeLng.toFixed(5)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">Phone & WhatsApp</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {storeSettings?.contactPhone || '+91 94470 12345'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">Email Support</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {storeSettings?.contactEmail || 'support@fathimastores.in'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">Operating Hours</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Monday – Saturday: 9:00 AM – 8:30 PM
                    <br />
                    Sunday: 10:00 AM – 4:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-[#E8E8E3]">
                <div className="w-9 h-9 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">GST Registration</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    GSTIN: {storeSettings?.gstNumber || '32AABCF4521H1Z6'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Map Preview */}
            <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
              <div className="h-56 w-full bg-[#EFF4E6]/40">
                <iframe
                  title="Fathima Stores Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${storeLng - 0.015},${storeLat - 0.015},${storeLng + 0.015},${storeLat + 0.015}&layer=mapnik&marker=${storeLat},${storeLng}`}
                />
              </div>
              <div className="p-3 bg-white border-t border-[#E8E8E3] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171717] truncate pr-2">{storeHubName}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${storeLat},${storeLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#71883F] font-bold hover:underline flex items-center gap-1 shrink-0"
                >
                  <Navigation className="w-3 h-3" /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-[#E8E8E3] rounded-2xl p-6 sm:p-8 shadow-2xs text-left">
            <h2 className="text-lg font-extrabold text-[#171717] mb-1">Send Us a Message</h2>
            <p className="text-xs text-[#6B6B6B] mb-6">
              Our customer desk responds within 2 business hours.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#171717]">Message Sent Successfully!</h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                  Thank you for contacting {storeSettings?.storeName || 'Fathima Stores'}. Our support team has received your inquiry and will reply shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-[#71883F] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98470 XXXXX"
                      className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F] bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Status / Delivery">Order Status / Delivery</option>
                      <option value="School / Office Bulk Order">School / Office Bulk Order</option>
                      <option value="Billing / GST Invoice">Billing / GST Invoice</option>
                      <option value="Return / Replacement">Return / Replacement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your query or bulk order item list here..."
                    className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
