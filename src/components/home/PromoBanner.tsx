import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const { setActivePage, banners, storeSettings } = useStore();

  // If the admin has toggled off the promotional banner in settings, do not render
  if (storeSettings.showPromoBanner === false) {
    return null;
  }
  const activeCustomBanner = banners.find((b) => b.active);

  // Default values matching the user's reference image
  const title = activeCustomBanner?.title || storeSettings.promoTitle || 'Up To 30% OFF';

  const subtitle =
    activeCustomBanner?.subtitle ||
    storeSettings.promoSubtitle ||
    "On Selected Women's Fashion";
  const badge = activeCustomBanner?.badge || storeSettings.promoBadge || 'Limited Time Offer';
  const buttonText =
    activeCustomBanner?.buttonText || storeSettings.promoButtonText || 'Grab the Deal';
  const buttonLink = activeCustomBanner?.buttonLink || 'shop';
  const bgTone = activeCustomBanner?.bgTone || storeSettings.promoBgTone || '#F05A4F';

  // Hanger/clothes rack image matching the user's uploaded reference photo
  const defaultRackImage =
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85';
  const image =
    activeCustomBanner?.image && activeCustomBanner.image !== 'promo-banner'
      ? activeCustomBanner.image
      : storeSettings.promoBgImage || defaultRackImage;

  const handleClick = () => {
    if (buttonLink && buttonLink.startsWith('category:')) {
      const slug = buttonLink.replace('category:', '');
      setActivePage('categories');
    } else {
      setActivePage('shop');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-6 sm:py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Banner Container - Matching User Reference Image */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-md transition-all duration-300 border border-black/5"
          style={{ backgroundColor: bgTone }}
        >
          {/* Subtle Botanical / Floral Line Art Watermark in the background */}
          <svg
            className="absolute left-1/4 sm:left-1/3 top-0 h-full w-auto pointer-events-none opacity-20 sm:opacity-25"
            viewBox="0 0 200 240"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M100 220 Q95 140 120 70 Q130 40 140 20" />
            <path d="M110 160 Q135 150 145 135 Q135 125 118 140" />
            <path d="M105 130 Q80 120 70 105 Q80 95 102 115" />
            <path d="M115 95 Q140 85 150 70 Q140 60 120 75" />
            <path d="M118 60 Q95 50 88 35 Q100 30 120 48" />
            <path d="M130 35 Q145 25 150 15 Q140 12 128 25" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[220px] sm:min-h-[260px] md:min-h-[280px]">
            {/* Left Content Column */}
            <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex items-center z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7 w-full text-left">
                {/* Circular Stitched Badge - Matching Reference Image */}
                {badge && (
                  <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-lg flex items-center justify-center p-2 relative group-hover:scale-105 transition-transform">
                    {/* Stitched / Dashed Inner Ring */}
                    <div className="w-full h-full rounded-full border-2 border-dashed border-[#F05A4F]/60 flex items-center justify-center p-2 text-center">
                      <span className="text-[11px] sm:text-xs font-black uppercase text-[#171717] leading-tight tracking-wider font-sans">
                        {badge}
                      </span>
                    </div>
                  </div>
                )}

                {/* Headline, Subtitle, and Grab the Deal Button */}
                <div className="space-y-3.5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-xs">
                      {title}
                    </h2>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-base font-medium mt-1 drop-shadow-2xs">
                      {subtitle}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={handleClick}
                      className="px-6 py-2.5 sm:px-7 sm:py-3 bg-white text-[#171717] hover:bg-neutral-50 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95 group"
                    >
                      <span>{buttonText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Showcase Column - Clothes Rack / Hanging Products matching Reference Image */}
            <div className="md:col-span-5 relative overflow-hidden flex items-end justify-center min-h-[190px] sm:min-h-[240px] md:min-h-full">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover object-center sm:object-right-bottom transform md:scale-105 transition-transform duration-700"
              />
              {/* Subtle gradient blending on mobile/desktop edges */}
              <div
                className="absolute inset-0 pointer-events-none md:bg-gradient-to-r from-transparent via-transparent to-black/5"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
