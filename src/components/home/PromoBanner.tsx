import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight, Tag, Image as ImageIcon, Upload, Check, Trash2, X, Sliders, Sparkles } from 'lucide-react';
import { compressImageTo200KB, formatFileSize } from '../../utils/imageCompressor';

export const PROMO_BG_PRESETS = [
  {
    id: 'stationery-desk',
    name: 'Minimalist Stationery Flatlay',
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80',
    tag: 'Minimalist Flatlay',
  },
  {
    id: 'study-journal',
    name: 'Study Desk & Fountain Pen',
    url: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80',
    tag: 'Classic Study',
  },
  {
    id: 'art-creative',
    name: 'Creative Art & Craft Workspace',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80',
    tag: 'Art & Craft',
  },
  {
    id: 'warm-library',
    name: 'Warm Wooden Book & Study Table',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
    tag: 'Warm Vintage',
  },
  {
    id: 'pastel-organizer',
    name: 'Pastel Study & Planner Workspace',
    url: 'https://images.unsplash.com/photo-1507842229458-574349320eef?auto=format&fit=crop&w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1507842229458-574349320eef?auto=format&fit=crop&w=300&q=80',
    tag: 'Pastel Planner',
  },
];

export const PromoBanner: React.FC = () => {
  return null;
};

export const LegacyPromoBanner: React.FC = () => {
  const { setActivePage, storeSettings, banners, updateStoreSettings, showToast } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!storeSettings.showPromoBanner) {
    return null;
  }

  // If admin has created active banners, use the first active one
  const activeCustomBanner = banners.find((b) => b.active);

  const title = activeCustomBanner ? activeCustomBanner.title : storeSettings.promoTitle || 'Special Offers';
  const subtitle =
    activeCustomBanner
      ? activeCustomBanner.subtitle
      : storeSettings.promoSubtitle || 'Limited time offers on selected stationery, bags, and writing gear.';
  const badge = activeCustomBanner ? activeCustomBanner.badge : storeSettings.promoBadge || 'Special Offer';
  const buttonText =
    activeCustomBanner ? activeCustomBanner.buttonText : storeSettings.promoButtonText || 'Shop Now';

  // Active Background Image, Overlay Tone, and Opacity
  const activeBgImage =
    storeSettings.promoBgImage !== undefined
      ? storeSettings.promoBgImage
      : activeCustomBanner?.image || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80';

  const overlayType = storeSettings.promoBgOverlay || 'light';
  const overlayOpacity = storeSettings.promoBgOpacity ?? 85;

  // Local state for modal editing
  const [tempBgImage, setTempBgImage] = useState(activeBgImage);
  const [tempOverlay, setTempOverlay] = useState<'light' | 'dark' | 'gradient' | 'none'>(overlayType);
  const [tempOpacity, setTempOpacity] = useState(overlayOpacity);

  const handleOpenModal = () => {
    setTempBgImage(activeBgImage);
    setTempOverlay(overlayType);
    setTempOpacity(overlayOpacity);
    setIsModalOpen(true);
  };

  const handleApplyBg = () => {
    updateStoreSettings({
      promoBgImage: tempBgImage,
      promoBgOverlay: tempOverlay,
      promoBgOpacity: tempOpacity,
    });
    showToast(tempBgImage ? 'Banner background image updated!' : 'Banner background image cleared!', 'success');
    setIsModalOpen(false);
  };

  const handleRemoveBg = () => {
    setTempBgImage('');
    updateStoreSettings({
      promoBgImage: '',
    });
    showToast('Background image removed from promotional banner', 'info');
    setIsModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    try {
      showToast('Optimizing and compressing promo image...', 'info');
      const res = await compressImageTo200KB(file, 160 * 1024);
      setTempBgImage(res.dataUrl);
      showToast(`Image compressed (${formatFileSize(res.compressedSize)}) successfully!`, 'success');
    } catch {
      showToast('Could not process image file. Please try another image.', 'error');
    }
  };

  const isDarkOverlay = tempOverlay === 'dark';

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The Selected Promotional Banner Card Div */}
        <div className="relative rounded-2xl bg-[#F7F8F3] border border-[#E8E8E3] overflow-hidden p-6 sm:p-10 lg:p-12 group transition-all duration-300 shadow-2xs hover:shadow-xs">
          
          {/* Background Image Layer (When image is configured) */}
          {activeBgImage ? (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src={activeBgImage}
                alt="Promo Banner Background"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-102"
              />
              
              {/* Overlay with dynamic tint & opacity */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  overlayType === 'dark'
                    ? 'bg-gradient-to-r from-neutral-950/95 via-neutral-900/85 to-neutral-900/60'
                    : overlayType === 'gradient'
                    ? 'bg-gradient-to-r from-[#F7F8F3]/95 via-[#F7F8F3]/85 to-transparent'
                    : overlayType === 'none'
                    ? 'bg-white/10'
                    : 'bg-gradient-to-r from-white/95 via-white/88 to-white/70 backdrop-blur-[0.5px]'
                }`}
                style={{
                  opacity: overlayOpacity / 100,
                }}
              />
            </div>
          ) : (
            /* Subtle geometric texture fallback */
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(#71883F_0.75px,transparent_0.75px)] [background-size:16px_16px]" />
          )}


          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Text & CTA */}
            <div className="md:col-span-7 space-y-4 text-left">
              <span
                className={`text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xs backdrop-blur-xs ${
                  overlayType === 'dark'
                    ? 'text-emerald-300 bg-neutral-800/90 border border-neutral-700'
                    : 'text-[#71883F] bg-[#EFF4E6]/90 border border-[#E8E8E3]'
                }`}
              >
                <Tag className="w-3 h-3" /> {badge}
              </span>

              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight transition-colors ${
                  overlayType === 'dark' ? 'text-white' : 'text-[#171717]'
                }`}
              >
                {title}
              </h3>

              <p
                className={`text-xs sm:text-sm max-w-md leading-relaxed transition-colors ${
                  overlayType === 'dark' ? 'text-neutral-300' : 'text-[#6B6B6B]'
                }`}
              >
                {subtitle}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    setActivePage('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] shadow-xs hover:shadow-sm transition-all inline-flex items-center gap-2"
                >
                  {buttonText} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Stationery Bag Graphic */}
            <div className="md:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-xs h-56 sm:h-64 flex items-center justify-center">
                {/* Kraft Stationery Bag Graphic */}
                <div className="w-48 h-52 relative drop-shadow-md">
                  <svg viewBox="0 0 200 240" className="w-full h-full">
                    <path
                      d="M70 70 C70 30, 95 30, 95 70"
                      fill="none"
                      stroke="#A88B66"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M105 70 C105 30, 130 30, 130 70"
                      fill="none"
                      stroke="#A88B66"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <polygon points="40,70 160,70 150,225 50,225" fill="#D2B48C" />
                    <polygon points="40,70 50,225 75,225 65,70" fill="#C19D70" />
                    <polygon points="38,70 162,70 160,82 40,82" fill="#BA9666" />

                    <rect x="75" y="45" width="45" height="60" rx="3" fill="#586E30" transform="rotate(-8 95 75)" />
                    <rect x="105" y="48" width="40" height="55" rx="3" fill="#3B82F6" transform="rotate(10 125 75)" />

                    <g transform="rotate(12 110 135)">
                      <rect
                        x="70"
                        y="110"
                        width="80"
                        height="42"
                        rx="6"
                        fill="#71883F"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <circle cx="78" cy="131" r="3" fill="#FFFFFF" />
                      <text
                        x="114"
                        y="130"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        SPECIAL
                      </text>
                      <text
                        x="114"
                        y="142"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        DEALS
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Desk Plant beside the bag */}
                <div className="absolute right-0 bottom-4 w-20 h-24 drop-shadow-sm">
                  <svg viewBox="0 0 100 120" className="w-full h-full">
                    <polygon points="30,70 70,70 65,110 35,110" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
                    <ellipse cx="50" cy="70" rx="19" ry="5" fill="#4B3A26" />
                    <path d="M50 70 Q30 50 25 35 Q40 45 50 70" fill="#71883F" />
                    <path d="M50 70 Q70 50 75 35 Q60 45 50 70" fill="#5F7334" />
                    <path d="M50 70 Q50 35 50 25 Q58 40 50 70" fill="#849F4B" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Panel: Change Banner Background Image */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-5 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#171717]">Change Banner Background</h3>
                  <p className="text-xs text-[#6B6B6B]">Select presets, upload an image, or paste an image URL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Preview Box */}
            <div>
              <span className="text-xs font-semibold text-[#171717] block mb-1.5">Live Preview</span>
              <div className="relative h-28 rounded-xl overflow-hidden border border-[#E8E8E3] bg-[#F7F8F3] flex items-center p-4">
                {tempBgImage ? (
                  <>
                    <img
                      src={tempBgImage}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={() => {
                        showToast('Failed to load image preview. Check URL.', 'error');
                      }}
                    />
                    <div
                      className={`absolute inset-0 ${
                        tempOverlay === 'dark'
                          ? 'bg-neutral-950/80'
                          : tempOverlay === 'gradient'
                          ? 'bg-gradient-to-r from-white/95 to-transparent'
                          : tempOverlay === 'none'
                          ? 'bg-transparent'
                          : 'bg-white/80 backdrop-blur-[0.5px]'
                      }`}
                      style={{ opacity: tempOpacity / 100 }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
                    No image set (Solid #F7F8F3 tone)
                  </div>
                )}
                <div className="relative z-10">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDarkOverlay ? 'bg-neutral-800 text-emerald-300' : 'bg-[#EFF4E6] text-[#71883F]'
                    }`}
                  >
                    {badge}
                  </span>
                  <h4 className={`text-sm font-extrabold ${isDarkOverlay ? 'text-white' : 'text-[#171717]'} mt-1`}>
                    {title}
                  </h4>
                  <p className={`text-[11px] ${isDarkOverlay ? 'text-neutral-300' : 'text-[#6B6B6B]'}`}>
                    {subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Curated Presets */}
            <div>
              <span className="text-xs font-semibold text-[#171717] block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#71883F]" /> Curated Preset Backgrounds
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROMO_BG_PRESETS.map((preset) => {
                  const isSelected = tempBgImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTempBgImage(preset.url)}
                      className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all ${
                        isSelected
                          ? 'border-[#71883F] ring-2 ring-[#71883F]/20 bg-[#EFF4E6]'
                          : 'border-[#E8E8E3] hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden bg-neutral-100 relative">
                        <img src={preset.thumb} alt={preset.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#71883F] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-[#171717] block mt-1 truncate">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom URL or Upload File */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#171717] block mb-1">
                  Custom Image URL (HTTP / HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tempBgImage}
                    onChange={(e) => setTempBgImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                  {tempBgImage && (
                    <button
                      type="button"
                      onClick={() => setTempBgImage('')}
                      className="px-2.5 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg"
                      title="Clear URL"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Local File */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 border border-dashed border-[#71883F]/60 hover:border-[#71883F] rounded-xl text-xs font-semibold text-[#71883F] bg-[#EFF4E6]/50 hover:bg-[#EFF4E6] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Image from Computer / Phone
                </button>
              </div>
            </div>

            {/* Overlay Mode & Opacity */}
            <div className="space-y-3 pt-2 border-t border-[#E8E8E3]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#171717] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#71883F]" /> Readability Overlay Wash
                </span>
                <span className="text-[11px] text-[#6B6B6B]">{tempOpacity}% opacity</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'light', label: 'Frosted Light' },
                  { id: 'gradient', label: 'Gradient Fade' },
                  { id: 'dark', label: 'Dark Slate' },
                  { id: 'none', label: 'Minimal Wash' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTempOverlay(mode.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition-all ${
                      tempOverlay === mode.id
                        ? 'border-[#71883F] bg-[#EFF4E6] text-[#71883F] font-bold'
                        : 'border-[#E8E8E3] text-[#6B6B6B] hover:text-[#171717]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="20"
                max="95"
                value={tempOpacity}
                onChange={(e) => setTempOpacity(Number(e.target.value))}
                className="w-full accent-[#71883F] cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E8E8E3]">
              <div className="flex items-center gap-2">
                {tempBgImage && (
                  <button
                    type="button"
                    onClick={handleRemoveBg}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Image
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActivePage('admin');
                  }}
                  className="text-xs text-[#71883F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3" /> Go to Admin Dashboard &rarr;
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 border border-[#E8E8E3]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBg}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Apply & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
