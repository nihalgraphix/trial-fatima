import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search, X, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { ProductImage } from './ProductImage';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    categories,
    navigateToProduct,
    navigateToCategory,
  } = useStore();

  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTerm('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const cleanTerm = term.trim().toLowerCase();

  // Matching categories
  const matchingCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(cleanTerm)
  );

  // Matching products
  const matchingProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(cleanTerm) ||
      p.description.toLowerCase().includes(cleanTerm) ||
      p.brand.toLowerCase().includes(cleanTerm) ||
      p.tags.some((t) => t.toLowerCase().includes(cleanTerm))
    );
  });

  const popularSearches = [
    'Notebook',
    'Blue pen',
    'Geometry box',
    'Calculator',
    'School bag',
    'Sticky notes',
    'Art supplies',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8E8E3] gap-3">
          <Search className="w-5 h-5 text-[#71883F] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search notebooks, pens, geometry boxes, calculators..."
            className="flex-1 text-sm bg-transparent outline-none text-[#171717] placeholder:text-[#6B6B6B]"
          />
          {term && (
            <button
              onClick={() => setTerm('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs font-semibold px-2 py-1 text-[#6B6B6B] hover:text-[#171717] bg-[#F7F8F3] rounded-md"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {cleanTerm === '' ? (
            <div>
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => setTerm(keyword)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-[#F7F8F3] hover:bg-[#EFF4E6] text-[#171717] hover:text-[#71883F] border border-[#E8E8E3] transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Category Matches */}
              {matchingCategories.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    Categories ({matchingCategories.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {matchingCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          navigateToCategory(cat.slug);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F7F8F3] border border-transparent hover:border-[#E8E8E3] text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-[#171717] truncate">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              {matchingProducts.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    Products ({matchingProducts.length})
                  </p>
                  <div className="space-y-2">
                    {matchingProducts.slice(0, 6).map((product, idx) => (
                      <button
                        key={`${product.id}-${idx}`}
                        onClick={() => {
                          navigateToProduct(product.id);
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F7F8F3] text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                            <ProductImage
                              imageKey={product.images[0]}
                              name={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#171717] group-hover:text-[#71883F] line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-[#6B6B6B]">
                              {product.brand} · {product.subcategory}
                            </p>
                            <p className="text-xs font-bold text-[#71883F] mt-0.5 tabular-nums">
                              ₹{product.price}
                              {product.mrp > product.price && (
                                <span className="text-[10px] text-[#6B6B6B] line-through font-normal ml-1.5">
                                  ₹{product.mrp}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#71883F] transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#F7F8F3] text-[#71883F] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#171717]">No products found</h4>
                  <p className="text-xs text-[#6B6B6B] mt-1 max-w-sm mx-auto">
                    We couldn't find any results matching "{term}". Try browsing our popular stationery categories.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {categories.slice(0, 4).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          navigateToCategory(cat.slug);
                          setIsSearchOpen(false);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#EFF4E6] text-[#71883F] font-medium hover:bg-[#e2edd3]"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
