import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Heart, ShoppingBag, Star, Tag, Eye, Sliders } from 'lucide-react';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateToProduct,
    setQuickViewProduct,
    storeSettings,
    compareProductIds,
    toggleCompareProduct,
  } = useStore();

  const isFavorited = isInWishlist(product.id);
  const isComparing = compareProductIds.includes(product.id);
  const isLowStock =
    storeSettings?.showLowStockAlert !== false &&
    product.stock > 0 &&
    product.stock <= (storeSettings?.lowStockThreshold || 10);

  return (
    <div className="group relative bg-white border border-[#E8E8E3] hover:border-[#171717]/30 rounded-xl overflow-hidden hover:shadow-sm transition-all duration-200 flex flex-col text-left">
      {/* Top Image Showcase */}
      <div
        className="relative w-full aspect-square bg-[#F9F9F7] cursor-pointer overflow-hidden"
        onClick={() => navigateToProduct(product.id)}
      >
        <ProductImage
          imageKey={product.images[0]}
          name={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Quick Actions (Wishlist & Quick View) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isFavorited
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/90 hover:bg-white text-neutral-500 hover:text-rose-600'
            } shadow-2xs backdrop-blur-xs`}
            aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {storeSettings?.showQuickView !== false && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewProduct(product);
              }}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-500 hover:text-[#171717] flex items-center justify-center shadow-2xs backdrop-blur-xs transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Quick View"
              aria-label="Quick View Product"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompareProduct(product.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-xs ${
              isComparing
                ? 'bg-[#71883F] text-white'
                : 'bg-white/90 hover:bg-white text-neutral-500 hover:text-[#71883F]'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to compare'}
            aria-label="Toggle Comparison"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean Badges */}
        {storeSettings?.showProductBadges !== false && product.showBadge !== false ? (
          product.offer?.active ? (
            <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 px-2 py-0.5 rounded-md shadow-2xs uppercase tracking-wide border border-white/20 select-none">
              {product.offer.badgeText || product.offer.title}
            </span>
          ) : product.badge ? (
            <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold text-[#171717] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E8E8E3] shadow-2xs tracking-wide uppercase select-none">
              {product.badge}
            </span>
          ) : product.discount > 0 && product.showDiscountBadge !== false ? (
            <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold text-white bg-[#71883F] px-2 py-0.5 rounded-md shadow-2xs tracking-wide select-none">
              {product.discount}% OFF
            </span>
          ) : null
        ) : null}

        {/* Low Stock Indicator */}
        {isLowStock && (
          <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold text-amber-900 bg-amber-50/95 border border-amber-200 px-1.5 py-0.5 rounded backdrop-blur-xs">
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand & Subcategory Label */}
          <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mb-1">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-[#71883F] truncate">
              {product.brand}
            </span>
            <span className="text-[10px] truncate text-neutral-400">{product.subcategory}</span>
          </div>

          {/* Product Name */}
          <h4
            onClick={() => navigateToProduct(product.id)}
            className="text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#71883F] cursor-pointer line-clamp-1 leading-snug"
            title={product.name}
          >
            {product.name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5 text-xs">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="font-semibold text-xs text-[#171717] tabular-nums">
              {product.rating}
            </span>
            <span className="text-[10px] text-[#6B6B6B] tabular-nums">
              ({product.reviewCount})
            </span>
          </div>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="mt-3 pt-2.5 border-t border-[#F2F2EE]">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-[#171717] tabular-nums">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-[#6B6B6B] line-through tabular-nums font-normal">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            {product.stock <= 0 && (
              <span className="text-[10px] text-rose-600 font-semibold">Sold Out</span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stock <= 0}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              product.stock <= 0
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-[#71883F] hover:bg-[#5F7334] text-white active:scale-[0.99]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

