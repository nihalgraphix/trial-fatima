import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { showToast, addCustomerMessage } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    addCustomerMessage({
      name,
      email,
      phone,
      subject: subject || 'General Customer Inquiry',
      message,
    });

    showToast('Your message has been sent to Fathima Stores support and delivered to the Admin Inbox!', 'success');
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-[#71883F] uppercase tracking-wider">
            Customer Support & Inquiries
          </span>
          <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight mt-1">
            Get in Touch with Us
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2">
            Have questions about an order, school bulk supplies or stationery products? Send us a message and our team will respond shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                Store Location & Helpline
              </h3>

              <div className="space-y-4 text-xs text-[#6B6B6B]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] text-[#71883F] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717]">Fathima Stores Flagship</h4>
                    <p className="mt-0.5">Commercial Complex, Near University Campus, MG Road, Trivandrum, Kerala - 695001</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] text-[#71883F] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717]">Phone & WhatsApp</h4>
                    <p className="mt-0.5">+91 98450 12345 / 0471 2345678</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] text-[#71883F] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717]">Email Support</h4>
                    <p className="mt-0.5">care@fathimastores.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] text-[#71883F] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717]">Store & Support Hours</h4>
                    <p className="mt-0.5">Monday – Saturday: 8:30 AM – 9:00 PM</p>
                    <p>Sunday: 10:00 AM – 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Order Banner */}
            <div className="border border-[#71883F]/30 bg-[#EFF4E6] rounded-2xl p-5 text-xs">
              <span className="font-bold text-[#71883F] uppercase block mb-1">
                Schools & Office Inquiries
              </span>
              <p className="text-[#171717] leading-relaxed">
                Planning bulk orders for schools, exam centers, or corporate offices? Email our institutional sales team at <span className="font-semibold underline">sales@fathimastores.com</span> for custom quotes.
              </p>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-[#E8E8E3] rounded-2xl p-6 sm:p-8 shadow-2xs">
            <h3 className="font-bold text-base text-[#171717] mb-2">
              Send us a Message
            </h3>
            <p className="text-xs text-[#6B6B6B] mb-6">
              Our support team will review your message in the Admin Inbox and respond shortly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
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
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Order Tracking or Product Inquiry"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you today?"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-[#71883F] hover:bg-[#5F7334] text-white font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Message
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
