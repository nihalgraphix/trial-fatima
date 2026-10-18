import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Loader2, ShieldCheck, Globe, Package, ChevronRight } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile, setActivePage, isAuthLoading } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    bio: '',
    city: '',
    state: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        photoURL: currentUser.photoURL || '',
        bio: currentUser.bio || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
      });
    }
  }, [currentUser]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#71883F] animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-[#F7F8F3] rounded-2xl flex items-center justify-center mb-4 text-[#71883F]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#171717]">Sign In Required</h2>
        <p className="text-sm text-[#6B6B6B] mt-2 max-w-xs">
          Please sign in to view and manage your profile settings.
        </p>
        <button
          onClick={() => setActivePage('login')}
          className="mt-6 px-6 py-2.5 bg-[#71883F] text-white font-bold rounded-xl shadow-xs"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserProfile({
      name: formData.name,
      phone: formData.phone,
      photoURL: formData.photoURL,
      bio: formData.bio,
      city: formData.city,
      state: formData.state,
    });
    setIsSaving(false);
  };

  return (
    <div className="bg-[#F7F8F3] min-h-screen py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => setActivePage('account')}
          className="flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-[#171717] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Account
        </button>

        <div className="bg-white border border-[#E8E8E3] rounded-3xl overflow-hidden shadow-sm">
          
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-[#71883F]/10 to-[#EFF4E6] relative">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-md border border-[#E8E8E3]">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#F7F8F3] relative group">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#71883F]">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-10 px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-black text-[#171717] tracking-tight">Edit Profile</h1>
                <p className="text-xs text-[#6B6B6B]">Update your personal information and public profile</p>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFF4E6] text-[#71883F] rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Verified Account
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Photo URL Input */}
              <div>
                <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">Profile Photo URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.photoURL}
                    onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-10 pr-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
                  />
                  <Globe className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[10px] text-[#6B6B6B] mt-1.5 ml-1">Paste a direct link to an image file (JPG, PNG, etc.)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
                    />
                    <User className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">Email Address</label>
                  <div className="relative opacity-60">
                    <input
                      type="email"
                      readOnly
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] cursor-not-allowed outline-none"
                    />
                    <Mail className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98450 12345"
                      className="w-full pl-10 pr-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
                    />
                    <Phone className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* City/State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Trivandrum"
                      className="w-full px-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Kerala"
                      className="w-full px-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[11px] font-black text-[#171717] uppercase tracking-wider block mb-2">Bio / About Me</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-[#71883F] hover:bg-[#5F7334] text-white font-black text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile Updates
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('account')}
                  className="px-8 py-3.5 bg-white border border-[#E8E8E3] hover:bg-neutral-50 text-[#171717] font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Quick Links / Navigation */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActivePage('account')}
            className="flex items-center justify-between p-4 bg-white border border-[#E8E8E3] rounded-2xl hover:border-[#71883F] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F7F8F3] rounded-xl flex items-center justify-center text-[#71883F] group-hover:bg-[#EFF4E6] transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-[#171717]">View Order History</h4>
                <p className="text-[10px] text-[#6B6B6B]">Track shipments and past purchases</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1A1] group-hover:text-[#71883F] transition-colors" />
          </button>

          <button
            onClick={() => setActivePage('wishlist')}
            className="flex items-center justify-between p-4 bg-white border border-[#E8E8E3] rounded-2xl hover:border-[#71883F] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F7F8F3] rounded-xl flex items-center justify-center text-[#71883F] group-hover:bg-[#EFF4E6] transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-[#171717]">Manage Wishlist</h4>
                <p className="text-[10px] text-[#6B6B6B]">View items you've saved for later</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1A1] group-hover:text-[#71883F] transition-colors" />
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-8 flex items-start gap-3 p-4 bg-white/50 border border-[#E8E8E3] rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-[#71883F] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#171717]">Security & Data Privacy</h4>
            <p className="text-[10px] text-[#6B6B6B] mt-0.5 leading-relaxed">
              Your profile information is stored securely in our cloud database. We never share your contact details with third-party advertisers. 
              Only your public display name and avatar may be visible when you post reviews.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
