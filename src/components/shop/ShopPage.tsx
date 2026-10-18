import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../common/ProductCard';
import { Filter, SlidersHorizontal, X, Star, RotateCcw } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const {
    products,
    categories,
    selectedCategorySlug,
    setSelectedCategorySlug,
  } = useStore();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(
    selectedCategorySlug || 'all'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceMax, setPriceMax] = useState<number>(1500);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyOffers, setOnlyOffers] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Derive unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.brand)));
    return list.sort();
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }
        // Brand
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
          return false;
        }
        // Price
        if (p.price > priceMax) {
          return false;
        }
        // Rating
        if (minRating > 0 && p.rating < minRating) {
          return false;
        }
        // Stock
        if (inStockOnly && p.stock <= 0) {
          return false;
        }
        // Discount
        if (minDiscount > 0 && p.discount < minDiscount) {
          return false;
        }
        // Special Offers
        if (onlyOffers && !p.offer?.active) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'best-selling':
            return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || b.reviewCount - a.reviewCount;
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'featured':
          default:
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
      });
  }, [
    products,
    selectedCategory,
    selectedBrand,
    priceMax,
    minRating,
    inStockOnly,
    minDiscount,
    onlyOffers,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCategorySlug(null);
    setSelectedBrand('all');
    setPriceMax(1500);
    setMinRating(0);
    setInStockOnly(false);
    setMinDiscount(0);
    setOnlyOffers(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    priceMax < 1500 ||
    minRating > 0 ||
    inStockOnly ||
    onlyOffers ||
    minDiscount > 0;

  const renderFilterSidebar = () => (
    <div className="space-y-6 text-left">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
        <span className="text-xs font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#71883F]" /> Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-[#71883F] hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Special Offers Deal Toggle */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            🔥 Special Offers Only
          </span>
          <input
            type="checkbox"
            checked={onlyOffers}
            onChange={(e) => setOnlyOffers(e.target.checked)}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
        </label>
        <p className="text-[10px] text-amber-700/90 mt-1">
          BOGO, combo deals & flat cash discounts
        </p>
      </div>

      {/* Category Filter - Only shown when categories exist */}
      {categories.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[#171717] mb-2.5 uppercase tracking-wider">
            Categories
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors flex items-center justify-between ${
                selectedCategory === 'all'
                  ? 'bg-[#EFF4E6] text-[#71883F] font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              <span>All Categories</span>
              <span className="tabular-nums">({products.length})</span>
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat.slug).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? 'bg-[#EFF4E6] text-[#71883F] font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#171717]'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      <div className="pt-4 border-t border-[#E8E8E3]">
        <h4 className="text-xs font-bold text-[#171717] mb-2.5 uppercase tracking-wider">
          Brand
        </h4>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedBrand('all')}
            className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors ${
              selectedBrand === 'all'
                ? 'bg-[#EFF4E6] text-[#71883F] font-semibold'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors truncate ${
                selectedBrand === brand
                  ? 'bg-[#EFF4E6] text-[#71883F] font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Range Slider */}
      <div className="pt-4 border-t border-[#E8E8E3]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
            Price Range
          </h4>
          <span className="text-xs font-semibold text-[#71883F] tabular-nums">
            Up to ₹{priceMax}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="1500"
          step="25"
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#71883F] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[#6B6B6B] mt-1">
          <span>₹50</span>
          <span>₹1500</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="pt-4 border-t border-[#E8E8E3]">
        <h4 className="text-xs font-bold text-[#171717] mb-2.5 uppercase tracking-wider">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 0].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
            >
              <input
                type="radio"
                name="ratingFilter"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="accent-[#71883F]"
              />
              {rating === 0 ? (
                <span>All Ratings</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>{rating}★ & above</span>
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Discount Filter */}
      <div className="pt-4 border-t border-[#E8E8E3]">
        <h4 className="text-xs font-bold text-[#171717] mb-2.5 uppercase tracking-wider">
          Discount
        </h4>
        <div className="space-y-1.5">
          {[0, 15, 20, 25].map((disc) => (
            <label
              key={disc}
              className="flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
            >
              <input
                type="radio"
                name="discountFilter"
                checked={minDiscount === disc}
                onChange={() => setMinDiscount(disc)}
                className="accent-[#71883F]"
              />
              <span>{disc === 0 ? 'All Discounts' : `${disc}% or more`}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-4 border-t border-[#E8E8E3]">
        <label className="flex items-center gap-2 text-xs text-[#171717] font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-[#71883F] rounded"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Breadcrumb & Title */}
        <div className="mb-6">
          <p className="text-xs text-[#6B6B6B] mb-1">
            Home · Shop ·{' '}
            <span className="text-[#171717] font-medium">
              {selectedCategory === 'all'
                ? 'All Stationery'
                : categories.find((c) => c.slug === selectedCategory)?.name || 'Category'}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                {selectedCategory === 'all'
                  ? 'All Products'
                  : categories.find((c) => c.slug === selectedCategory)?.name}
              </h1>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Showing {filteredProducts.length} stationery items
              </p>
            </div>

            {/* Sort & Mobile Filter Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden px-3 py-2 text-xs font-semibold text-[#171717] bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#71883F]" />
                Filters {hasActiveFilters && '•'}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B6B6B] hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold text-[#171717] bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg px-3 py-2 outline-none focus:border-[#71883F]"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="best-selling">Best Selling</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout Grid (Desktop Sidebar Left + Product Grid Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E8E8E3] rounded-2xl p-5 sticky top-24">
            {renderFilterSidebar()}
          </aside>

          {/* Right Product Grid */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white text-[#71883F] flex items-center justify-center mx-auto shadow-2xs">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#171717]">
                  No products matched your filters
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                  Try adjusting your price range, selected brand or category to find what you're looking for.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((product, idx) => (
                  <ProductCard key={`${product.id}-${idx}`} product={product} />
                ))}
              </div>
            )}
          </main>

        </div>

      </div>

      {/* Mobile Filter Modal / Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in">
          <div className="w-full max-w-xs bg-white h-full p-5 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3] mb-4">
              <h3 className="font-bold text-sm text-[#171717]">Filter Products</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1">
              {renderFilterSidebar()}
            </div>

            <div className="pt-4 border-t border-[#E8E8E3] mt-6">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg"
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
