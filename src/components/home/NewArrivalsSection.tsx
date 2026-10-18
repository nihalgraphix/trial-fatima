import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';

export const NewArrivalsSection: React.FC = () => {
  const { products, setActivePage, storeSettings } = useStore();

  if (!storeSettings.showNewArrivals) return null;

  const newArrivals = products.filter((p) => p.newArrival).slice(0, 5);

  if (newArrivals.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#71883F] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Fresh In Stock
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              {storeSettings.newArrivalsTitle || 'New Arrivals & Latest Stationery'}
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {storeSettings.newArrivalsSubtitle || 'Fresh additions to our catalog for art, study and workspace'}
            </p>
          </div>

          <button
            onClick={() => {
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-semibold text-[#71883F] hover:text-[#5F7334] flex items-center gap-1 transition-colors"
          >
            Explore Collection <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {newArrivals.map((product, idx) => (
            <ProductCard key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
};
