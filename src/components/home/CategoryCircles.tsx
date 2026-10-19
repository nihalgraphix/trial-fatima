import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../common/ProductImage';

export const CategoryCircles: React.FC = () => {
  const { categories, navigateToCategory, storeSettings } = useStore();

  const displayedCategories = useMemo(() => {
    let list = categories;
    if (storeSettings.removeFirstCategoryButton && list.length > 0) {
      list = list.slice(1);
    }
    if (storeSettings.removedCategoryIds && storeSettings.removedCategoryIds.length > 0) {
      list = list.filter((c) => !storeSettings.removedCategoryIds?.includes(c.id));
    }
    return list;
  }, [categories, storeSettings.removeFirstCategoryButton, storeSettings.removedCategoryIds]);

  if (!storeSettings.showCategoryCircles || displayedCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">
              {storeSettings.categorySectionTitle || 'Shop by Categories'}
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {storeSettings.categorySectionSubtitle || 'Browse our curated departments for school, college and office'}
            </p>
          </div>
        </div>

        {/* Circular Categories Row / Grid (matching reference) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
          {displayedCategories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigateToCategory(cat.slug)}
              className="group flex flex-col items-center text-center focus:outline-none cursor-pointer"
            >
              {/* Circular Container with soft tinted background */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center p-3 mb-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-sm border border-[#E8E8E3] overflow-hidden"
                style={{ backgroundColor: cat.color || '#F7F8F3' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <ProductImage
                    imageKey={cat.image}
                    name={cat.name}
                    className="w-full h-full bg-transparent"
                  />
                </div>
              </div>

              {/* Category Name */}
              <span className="text-xs sm:text-sm font-semibold text-[#171717] group-hover:text-[#71883F] transition-colors line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[11px] text-[#6B6B6B] mt-0.5">
                {cat.itemCount} Items
              </span>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
