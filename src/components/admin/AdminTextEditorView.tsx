import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Type, Save, RotateCcw, Check, Sparkles, Layout, MessageSquare, PhoneCall, ShoppingBag, Award, HeartHandshake } from 'lucide-react';

export const AdminTextEditorView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();

  const [form, setForm] = useState({
    storeName: storeSettings.storeName || 'FATHIMA STORES',
    brandTagline: storeSettings.brandTagline || 'Premium School & Office Supplies',
    announcementText: storeSettings.announcementText || 'Free delivery on orders above ₹500 | Back to school sale live!',
    searchPlaceholder: storeSettings.searchPlaceholder || 'Search 1,000+ pens, notebooks, art supplies...',
    
    // Hero Section
    heroBadge: storeSettings.heroBadge || 'Back to School Collection 2026',
    heroHeadline: storeSettings.heroHeadline || 'Your Everyday Stationery & Study Store',
    heroSubheadline: storeSettings.heroSubheadline || 'Explore premium notebooks, calligraphy pens, art supplies, and office stationery with fast local delivery.',
    heroButtonText: storeSettings.heroButtonText || 'Explore Catalog',

    // Benefits Bar
    benefit1Title: storeSettings.benefit1Title || 'Free Delivery',
    benefit1Desc: storeSettings.benefit1Desc || `On orders above ₹${storeSettings.freeDeliveryThreshold || 500}`,
    benefit2Title: storeSettings.benefit2Title || '100% Genuine',
    benefit2Desc: storeSettings.benefit2Desc || 'Authentic stationery guaranteed',
    benefit3Title: storeSettings.benefit3Title || 'Easy Returns',
    benefit3Desc: storeSettings.benefit3Desc || 'Simple return & exchange policy',
    benefit4Title: storeSettings.benefit4Title || 'Dedicated Support',
    benefit4Desc: storeSettings.benefit4Desc || storeSettings.contactPhone || "We're here to help",

    // Homepage Section Headings
    categorySectionTitle: storeSettings.categorySectionTitle || 'Shop by Categories',
    categorySectionSubtitle: storeSettings.categorySectionSubtitle || 'Browse our curated departments for school, college and office',
    bestSellersTitle: storeSettings.bestSellersTitle || 'Featured & Best Selling Products',
    bestSellersSubtitle: storeSettings.bestSellersSubtitle || 'Discover student favorites, premium pens, and daily essentials',
    newArrivalsTitle: storeSettings.newArrivalsTitle || 'Fresh New Arrivals',
    newArrivalsSubtitle: storeSettings.newArrivalsSubtitle || 'Latest additions to our stationery store',
    reviewsSectionTitle: storeSettings.reviewsSectionTitle || 'What Our Customers Say',
    reviewsSectionSubtitle: storeSettings.reviewsSectionSubtitle || 'Verified reviews from students, artists, and office professionals',

    // Promo Banner
    promoBadge: storeSettings.promoBadge || 'Exclusive Offer',
    promoTitle: storeSettings.promoTitle || 'Up To 30% OFF Student Essentials',
    promoSubtitle: storeSettings.promoSubtitle || 'Get special seasonal discounts on exam kits, notebooks, and calligraphy sets.',
    promoButtonText: storeSettings.promoButtonText || 'Claim Discount',

    // Footer & Contact
    footerAboutText: storeSettings.footerAboutText || 'Fathima Stores is Trivandrum\'s trusted destination for high-quality stationery, school kits, art supplies, and office materials.',
    contactPhone: storeSettings.contactPhone || '+91 98450 12345',
    contactEmail: storeSettings.contactEmail || 'support@fathimastores.com',
    storeAddress: storeSettings.storeAddress || 'MG Road, Statue, Trivandrum, Kerala - 695001',
    storeWorkingHours: storeSettings.storeWorkingHours || 'Mon - Sat: 9:00 AM - 8:30 PM',
    footerCopyrightText: storeSettings.footerCopyrightText || '© 2026 Fathima Stores. All rights reserved.',

    // Support & Chat
    liveSupportTitle: storeSettings.liveSupportTitle || 'FATHIMA STORES Live Support',
    liveSupportGreeting: storeSettings.liveSupportGreeting || 'Hello! Welcome to Fathima Stores. How can we assist you today with stationery products, school supplies, or order delivery?',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStoreSettings(form);
      showToast('All website copy and text edits saved live!', 'success');
    } catch (err) {
      showToast('Failed to update store copy.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all website text edits back to standard defaults?')) {
      const defaults = {
        storeName: 'FATHIMA STORES',
        brandTagline: 'Premium School & Office Supplies',
        announcementText: 'Free delivery on orders above ₹500 | Back to school sale live!',
        searchPlaceholder: 'Search 1,000+ pens, notebooks, art supplies...',
        heroBadge: 'Back to School Collection 2026',
        heroHeadline: 'Your Everyday Stationery & Study Store',
        heroSubheadline: 'Explore premium notebooks, calligraphy pens, art supplies, and office stationery with fast local delivery.',
        heroButtonText: 'Explore Catalog',
        benefit1Title: 'Free Delivery',
        benefit1Desc: 'On orders above ₹500',
        benefit2Title: '100% Genuine',
        benefit2Desc: 'Authentic stationery guaranteed',
        benefit3Title: 'Easy Returns',
        benefit3Desc: 'Simple return & exchange policy',
        benefit4Title: 'Dedicated Support',
        benefit4Desc: "We're here to help",
        categorySectionTitle: 'Shop by Categories',
        categorySectionSubtitle: 'Browse our curated departments for school, college and office',
        bestSellersTitle: 'Featured & Best Selling Products',
        bestSellersSubtitle: 'Discover student favorites, premium pens, and daily essentials',
        newArrivalsTitle: 'Fresh New Arrivals',
        newArrivalsSubtitle: 'Latest additions to our stationery store',
        reviewsSectionTitle: 'What Our Customers Say',
        reviewsSectionSubtitle: 'Verified reviews from students, artists, and office professionals',
        promoBadge: 'Exclusive Offer',
        promoTitle: 'Up To 30% OFF Student Essentials',
        promoSubtitle: 'Get special seasonal discounts on exam kits, notebooks, and calligraphy sets.',
        promoButtonText: 'Claim Discount',
        footerAboutText: 'Fathima Stores is Trivandrum\'s trusted destination for high-quality stationery, school kits, art supplies, and office materials.',
        contactPhone: '+91 98450 12345',
        contactEmail: 'support@fathimastores.com',
        storeAddress: 'MG Road, Statue, Trivandrum, Kerala - 695001',
        storeWorkingHours: 'Mon - Sat: 9:00 AM - 8:30 PM',
        footerCopyrightText: '© 2026 Fathima Stores. All rights reserved.',
        liveSupportTitle: 'FATHIMA STORES Live Support',
        liveSupportGreeting: 'Hello! Welcome to Fathima Stores. How can we assist you today with stationery products, school supplies, or order delivery?',
      };
      setForm(defaults);
      updateStoreSettings(defaults);
      showToast('Store copy reset to defaults', 'info');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E8E3] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center font-bold">
              <Type className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
              Website Text Editor
            </h1>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Customize headlines, taglines, button labels, banners, benefits, and support texts across your live web store.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" /> Reset Defaults
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Section 1: Header, Branding & Announcements */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <Layout className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            1. Store Header & Navigation Copy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Store Name *</label>
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-bold"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Brand Tagline / Slogan</label>
            <input
              type="text"
              value={form.brandTagline}
              onChange={(e) => setForm({ ...form, brandTagline: e.target.value })}
              placeholder="e.g. Premium School & Office Supplies"
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Top Announcement Bar Message</label>
            <input
              type="text"
              value={form.announcementText}
              onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Header Search Box Placeholder</label>
            <input
              type="text"
              value={form.searchPlaceholder}
              onChange={(e) => setForm({ ...form, searchPlaceholder: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Store Benefits Bar */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <Award className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            2. Benefits Bar Cards (4 Guarantees)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Benefit 1 */}
          <div className="p-4 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2">
            <span className="font-bold text-[#71883F]">Benefit 1: Delivery Guarantee</span>
            <input
              type="text"
              value={form.benefit1Title}
              onChange={(e) => setForm({ ...form, benefit1Title: e.target.value })}
              placeholder="Title e.g. Free Delivery"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
            <input
              type="text"
              value={form.benefit1Desc}
              onChange={(e) => setForm({ ...form, benefit1Desc: e.target.value })}
              placeholder="Subtitle e.g. On orders above ₹500"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
          </div>

          {/* Benefit 2 */}
          <div className="p-4 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2">
            <span className="font-bold text-[#71883F]">Benefit 2: Quality Guarantee</span>
            <input
              type="text"
              value={form.benefit2Title}
              onChange={(e) => setForm({ ...form, benefit2Title: e.target.value })}
              placeholder="Title e.g. 100% Genuine"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
            <input
              type="text"
              value={form.benefit2Desc}
              onChange={(e) => setForm({ ...form, benefit2Desc: e.target.value })}
              placeholder="Subtitle e.g. Authentic stationery guaranteed"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
          </div>

          {/* Benefit 3 */}
          <div className="p-4 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2">
            <span className="font-bold text-[#71883F]">Benefit 3: Return Policy</span>
            <input
              type="text"
              value={form.benefit3Title}
              onChange={(e) => setForm({ ...form, benefit3Title: e.target.value })}
              placeholder="Title e.g. Easy Returns"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
            <input
              type="text"
              value={form.benefit3Desc}
              onChange={(e) => setForm({ ...form, benefit3Desc: e.target.value })}
              placeholder="Subtitle e.g. Simple return & exchange policy"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
          </div>

          {/* Benefit 4 */}
          <div className="p-4 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2">
            <span className="font-bold text-[#71883F]">Benefit 4: Customer Support</span>
            <input
              type="text"
              value={form.benefit4Title}
              onChange={(e) => setForm({ ...form, benefit4Title: e.target.value })}
              placeholder="Title e.g. Dedicated Support"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
            <input
              type="text"
              value={form.benefit4Desc}
              onChange={(e) => setForm({ ...form, benefit4Desc: e.target.value })}
              placeholder="Subtitle e.g. We're here to help"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Homepage Section Headings */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <ShoppingBag className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            3. Homepage Section Titles & Subtitles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Categories */}
          <div className="space-y-2">
            <label className="font-bold text-[#171717]">Shop by Categories Section</label>
            <input
              type="text"
              value={form.categorySectionTitle}
              onChange={(e) => setForm({ ...form, categorySectionTitle: e.target.value })}
              placeholder="Section Title"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
            <input
              type="text"
              value={form.categorySectionSubtitle}
              onChange={(e) => setForm({ ...form, categorySectionSubtitle: e.target.value })}
              placeholder="Section Subtitle"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          {/* Best Sellers */}
          <div className="space-y-2">
            <label className="font-bold text-[#171717]">Best Sellers Section</label>
            <input
              type="text"
              value={form.bestSellersTitle}
              onChange={(e) => setForm({ ...form, bestSellersTitle: e.target.value })}
              placeholder="Section Title"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
            <input
              type="text"
              value={form.bestSellersSubtitle}
              onChange={(e) => setForm({ ...form, bestSellersSubtitle: e.target.value })}
              placeholder="Section Subtitle"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          {/* New Arrivals */}
          <div className="space-y-2">
            <label className="font-bold text-[#171717]">New Arrivals Section</label>
            <input
              type="text"
              value={form.newArrivalsTitle}
              onChange={(e) => setForm({ ...form, newArrivalsTitle: e.target.value })}
              placeholder="Section Title"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
            <input
              type="text"
              value={form.newArrivalsSubtitle}
              onChange={(e) => setForm({ ...form, newArrivalsSubtitle: e.target.value })}
              placeholder="Section Subtitle"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          {/* Reviews */}
          <div className="space-y-2">
            <label className="font-bold text-[#171717]">Customer Reviews Section</label>
            <input
              type="text"
              value={form.reviewsSectionTitle}
              onChange={(e) => setForm({ ...form, reviewsSectionTitle: e.target.value })}
              placeholder="Section Title"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
            <input
              type="text"
              value={form.reviewsSectionSubtitle}
              onChange={(e) => setForm({ ...form, reviewsSectionSubtitle: e.target.value })}
              placeholder="Section Subtitle"
              className="w-full px-3.5 py-2 border border-[#E8E8E3] rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Promo Banner Text */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <Sparkles className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            4. Promotional Image Banner Text
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Badge Tag</label>
            <input
              type="text"
              value={form.promoBadge}
              onChange={(e) => setForm({ ...form, promoBadge: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Banner Button Label</label>
            <input
              type="text"
              value={form.promoButtonText}
              onChange={(e) => setForm({ ...form, promoButtonText: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#171717] block mb-1">Main Banner Title</label>
            <input
              type="text"
              value={form.promoTitle}
              onChange={(e) => setForm({ ...form, promoTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#171717] block mb-1">Banner Subtitle / Description</label>
            <textarea
              rows={2}
              value={form.promoSubtitle}
              onChange={(e) => setForm({ ...form, promoSubtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Footer & Contact Details */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <PhoneCall className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            5. Footer & Contact Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="font-semibold text-[#171717] block mb-1">Footer About Us Brief</label>
            <textarea
              rows={2}
              value={form.footerAboutText}
              onChange={(e) => setForm({ ...form, footerAboutText: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Contact Phone Number</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Contact Email Address</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Store Physical Address</label>
            <input
              type="text"
              value={form.storeAddress}
              onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Working Hours</label>
            <input
              type="text"
              value={form.storeWorkingHours}
              onChange={(e) => setForm({ ...form, storeWorkingHours: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#171717] block mb-1">Footer Copyright Line</label>
            <input
              type="text"
              value={form.footerCopyrightText}
              onChange={(e) => setForm({ ...form, footerCopyrightText: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Section 6: Live Chat & Support Messages */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8E3]">
          <MessageSquare className="w-4 h-4 text-[#71883F]" />
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            6. Live Support Chat Copy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Chat Widget Header Title</label>
            <input
              type="text"
              value={form.liveSupportTitle}
              onChange={(e) => setForm({ ...form, liveSupportTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-[#171717] block mb-1">Initial Welcome Greeting Message</label>
            <textarea
              rows={2}
              value={form.liveSupportGreeting}
              onChange={(e) => setForm({ ...form, liveSupportGreeting: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E8E8E3] rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Submit Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E8E8E3] shadow-lg flex items-center justify-between">
        <span className="text-xs text-[#6B6B6B]">
          Edits take immediate effect across your live website storefront.
        </span>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#71883F] hover:bg-[#5F7334] rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Live Store Copy...' : 'Save Website Copy'}
        </button>
      </div>
    </form>
  );
};
