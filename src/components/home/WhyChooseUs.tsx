import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, BadgePercent, Zap, HeartHandshake } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const { storeSettings } = useStore();

  if (!storeSettings.showBenefits) {
    return null;
  }

  const points = [
    {
      icon: CheckCircle2,
      title: 'Quality Products',
      desc: 'Carefully curated and 100% genuine products directly sourced from leading stationery manufacturers.',
    },
    {
      icon: BadgePercent,
      title: 'Affordable Prices',
      desc: 'Honest everyday pricing with exclusive student bundles and school bulk purchase discounts.',
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      desc: 'Prompt order processing and dependable courier dispatch with live tracking straight to your doorstep.',
    },
    {
      icon: HeartHandshake,
      title: 'Friendly Support',
      desc: 'Dedicated customer support team ready to assist with stationery recommendations and inquiries.',
    },
  ];

  return (
    <section className="py-12 bg-[#F7F8F3] border-y border-[#E8E8E3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-[#71883F] tracking-wider uppercase">
            The {storeSettings.storeName || 'Fathima'} Standard
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight mt-1">
            Why Shop with {storeSettings.storeName || 'Fathima Stores'}?
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5">
            Serving students, teachers, artists and businesses with reliable stationery essentials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="bg-white p-6 rounded-xl border border-[#E8E8E3] hover:border-[#71883F]/40 transition-colors shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <h4 className="text-sm font-bold text-[#171717] mb-1.5">
                  {point.title}
                </h4>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  {point.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
