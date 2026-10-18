import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';

export const BestSellingSection: React.FC = () => {
  const { products, setActivePage, storeSettings } = useStore();

  if (!storeSettings.showBestSellers) {
    return null;
  }

  // Curated best selling products
  const displayedProducts = useMemo(() => {
    const bests = products.filter((p) => p.bestSeller);
    return bests.length > 0 ? bests : products;
  }, [products]);

  return (
    <section className="py-12 bg-white border-t border-[#E8E8E3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with dynamic titles & working filter tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              {storeSettings.bestSellersTitle || 'Featured & Best Selling Products'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
              {storeSettings.bestSellersSubtitle || 'Discover student favorites, premium pens, and daily essentials'}
            </p>
          </div>

          <button
            onClick={() => {
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-semibold text-[#71883F] hover:text-[#5F7334] inline-flex items-center gap-1 transition-colors"
          >
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Column Product Grid */}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {displayedProducts.slice(0, 10).map((product, idx) => (
              <ProductCard key={`${product.id}-${idx}`} product={product} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs font-semibold text-[#6B6B6B]">
              Discover all available products in our store catalog.
            </p>
            <button
              onClick={() => setActivePage('shop')}
              className="px-3.5 py-1.5 bg-[#71883F] text-white rounded-lg text-xs font-semibold inline-block cursor-pointer hover:bg-[#5F7334]"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-10 text-center space-y-3">
            <h3 className="text-sm font-bold text-[#171717]">Catalog Ready for Products</h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
              Ready to add your stationery items? Open the Admin Console to add products with special offers, discounts, and automatic image compression.
            </p>
            <button
              onClick={() => setActivePage('admin-login')}
              className="mt-2 px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              Add Products in Admin Portal
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
