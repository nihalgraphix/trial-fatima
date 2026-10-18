import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, ShieldCheck, Truck } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const {
    setActivePage,
    storeSettings,
    heroSlides,
  } = useStore();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!storeSettings.showHeroSection) {
    return null;
  }

  // Active slides only
  const activeSlides = heroSlides && heroSlides.length > 0
    ? heroSlides.filter((s) => s.active !== false)
    : [];

  const slidesToRender = activeSlides.length > 0 ? activeSlides : [
    {
      id: 'default-1',
      badge: storeSettings.heroBadge || 'Stationery & Essentials',
      title: storeSettings.heroHeadline || 'Everything You Need, All in One Place.',
      subtitle: storeSettings.heroSubheadline || 'Discover quality stationery, school supplies, office essentials, notebooks, pens, art materials and everyday products at honest prices.',
      buttonText: storeSettings.heroButtonText || 'Shop Now',
      buttonLink: storeSettings.heroButtonTarget || 'shop',
      secondaryButtonText: 'Browse Catalog',
      secondaryButtonLink: 'shop',
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1600&q=80',
      bgTone: '#F7F8F3',
      overlay: 'light' as const,
      overlayOpacity: 50,
      active: true,
      order: 0,
    },
  ];

  const totalSlides = slidesToRender.length;
  const currentSlide = slidesToRender[currentSlideIndex % totalSlides] || slidesToRender[0];

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);


  // Continuous Banner Auto-Play Timer
  useEffect(() => {
    if (totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = storeSettings.heroSliderInterval || 3000;
    timerRef.current = setInterval(() => {
      handleNextSlide();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, storeSettings.heroSliderInterval, handleNextSlide]);

  const isDarkOverlay = currentSlide.overlay === 'dark';

  return (
    <section className="w-full py-4 sm:py-6 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Rounded Image Banner Container */}
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E8E8E3] min-h-[460px] sm:min-h-[520px] md:min-h-[560px] lg:min-h-[580px] flex items-center transition-all duration-700 group"
          style={{
            backgroundColor: currentSlide.bgTone || '#F7F8F3',
          }}
        >
          {/* Background Image of the Slide with smooth cross-fade animation */}
          {currentSlide.image && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                key={`bg-img-${currentSlide.id}-${currentSlideIndex}`}
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-102 animate-in fade-in duration-700"
              />
              {/* Overlay for cinematic depth & readability */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                  isDarkOverlay
                    ? 'bg-gradient-to-r from-neutral-950/90 via-neutral-950/70 to-transparent'
                    : currentSlide.overlay === 'gradient'
                    ? 'bg-gradient-to-r from-white/95 via-white/80 to-transparent'
                    : currentSlide.overlay === 'none'
                    ? 'bg-transparent'
                    : 'bg-gradient-to-r from-white/90 via-white/70 to-transparent'
                }`}
                style={{
                  opacity: (currentSlide.overlayOpacity ?? 60) / 100,
                }}
              />
            </div>
          )}

          {/* FLOATING TEXT OVER THE IMAGE BANNER SLIDE (Transparent) */}
          <div className="relative z-20 w-full p-4 sm:p-8 md:p-12 lg:p-16 flex items-center">
            <div
              key={`float-card-${currentSlide.id}-${currentSlideIndex}`}
              className={`max-w-lg sm:max-w-2xl bg-transparent transition-all duration-500 text-left animate-in fade-in slide-in-from-left-4 p-2 sm:p-4 md:p-6 ${
                isDarkOverlay ? 'text-white' : 'text-[#171717]'
              }`}
            >
              {/* Badge & Active Slide Indicator */}
              <div className="flex items-center gap-2.5 mb-3.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 dark:bg-black/50 backdrop-blur-xs border border-white/60 dark:border-white/20 text-[#71883F] text-[11px] font-bold tracking-wider uppercase shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#71883F] animate-pulse" />
                  {currentSlide.badge || 'Stationery & Essentials'}
                </span>

                {totalSlides > 1 && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border backdrop-blur-xs ${
                      isDarkOverlay
                        ? 'bg-neutral-800/80 text-neutral-300 border-neutral-700'
                        : 'bg-white/80 text-[#525252] border-white/60 shadow-2xs'
                    }`}
                  >
                    0{((currentSlideIndex % totalSlides) + 1)} / 0{totalSlides}
                  </span>
                )}
              </div>

              {/* Bold Floating Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] mb-3.5 text-balance drop-shadow-2xs">
                {currentSlide.title}
              </h1>

              {/* Subtitle / Description */}
              <p
                className={`text-xs sm:text-sm md:text-base leading-relaxed mb-6 font-medium line-clamp-3 sm:line-clamp-none ${
                  isDarkOverlay ? 'text-neutral-200 drop-shadow-2xs' : 'text-[#404040]'
                }`}
              >
                {currentSlide.subtitle}
              </p>

              {/* Trust Subtext */}
              <div
                className={`flex items-center gap-3 pt-4 mt-5 border-t ${
                  isDarkOverlay ? 'border-neutral-800/80 text-neutral-300' : 'border-black/10 text-[#404040]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Truck className="w-3.5 h-3.5 text-[#71883F]" />
                  <span>Fast Delivery</span>
                </div>
                <span className="opacity-40">•</span>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#71883F]" />
                  <span>100% Genuine</span>
                </div>
                <span className="opacity-40">•</span>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#71883F]" />
                  <span>Direct Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Micro Progress Line on bottom edge showing automatic slide progression */}
          {totalSlides > 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 z-20 overflow-hidden">
              <div
                key={`progress-${currentSlideIndex}`}
                className="h-full bg-[#71883F] animate-progress origin-left"
                style={{
                  animationDuration: `${storeSettings.heroSliderInterval || 3000}ms`,
                }}
              />
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
