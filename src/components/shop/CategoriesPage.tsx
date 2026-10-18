import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../common/ProductImage';
import { ArrowRight, BookOpen } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, products, navigateToCategory } = useStore();

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs text-[#71883F] font-semibold uppercase tracking-wider">
            Stationery Departments
          </p>
          <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight mt-1">
            Browse All Categories
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2 leading-relaxed">
            From classroom essentials to high-precision drafting tools and executive desk supplies, explore our full catalog.
          </p>
        </div>

        {/* Category Cards Grid */}
        {categories.length === 0 ? (
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center mx-auto text-[#71883F]">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">No categories listed</h3>
            <p className="text-xs text-[#6B6B6B]">
              All categories have been removed. Explore our full catalog of stationery items directly.
            </p>
            <button
              onClick={() => navigateToCategory('all')}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
            >
              Browse All Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => {
              const count = products.filter((p) => p.category === cat.slug).length;
              return (
                <div
                  key={`${cat.id}-${idx}`}
                  onClick={() => navigateToCategory(cat.slug)}
                  className="group bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 hover:border-[#71883F]/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center p-3 mb-4 mx-auto border border-[#E8E8E3] bg-white group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: cat.color }}
                    >
                      <ProductImage
                        imageKey={cat.image}
                        name={cat.name}
                        className="w-full h-full bg-transparent"
                      />
                    </div>

                    <h3 className="text-base font-bold text-[#171717] text-center group-hover:text-[#71883F] transition-colors">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-[#6B6B6B] text-center mt-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E8E8E3] mt-5 flex items-center justify-between text-xs">
                    <span className="text-[#6B6B6B] font-medium tabular-nums">
                      {count} Available Products
                    </span>
                    <span className="text-[#71883F] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
