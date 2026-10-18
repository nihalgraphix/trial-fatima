import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export const StoreBenefits: React.FC = () => {
  const { storeSettings } = useStore();

  if (!storeSettings.showBenefits) {
    return null;
  }

  const benefits = [
    {
      icon: Truck,
      title: 'Free Delivery',
      desc: `On orders above ₹${storeSettings.freeDeliveryThreshold || 500}`,
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine',
      desc: 'Authentic stationery guaranteed',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      desc: 'Simple return & exchange policy',
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      desc: storeSettings.contactPhone || "We're here to help",
    },
  ];

  return (
    <section className="bg-white py-6 border-b border-[#E8E8E3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl py-4 px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E8E3]">
            {benefits.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`flex items-center gap-3.5 ${
                    index > 0 ? 'pt-3 sm:pt-0 sm:pl-6' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E8E8E3] text-[#71883F] flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#171717]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
