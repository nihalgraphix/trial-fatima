import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../common/ProductImage';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const {
    wishlist,
    products,
    toggleWishlist,
    addToCart,
    setActivePage,
    navigateToProduct,
  } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            My Wishlist ({wishlist.length} Items)
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Keep track of stationery items and school essentials you plan to purchase.
          </p>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-white text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">
              No items in your wishlist yet.
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Explore our best-selling notebooks, gel pens and student backpacks to save your favorites.
            </p>
            <button
              onClick={() => setActivePage('shop')}
              className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg shadow-2xs transition-colors"
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistedProducts.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
                className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#71883F]/50 transition-colors"
              >
                <div>
                  <div
                    className="relative w-full aspect-square bg-[#F9F9F7] cursor-pointer p-4 overflow-hidden"
                    onClick={() => navigateToProduct(product.id)}
                  >
                    <ProductImage
                      imageKey={product.images[0]}
                      name={product.name}
                      className="w-full h-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white text-rose-600 shadow-2xs hover:bg-rose-50"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] text-[#6B6B6B]">
                      {product.brand} · {product.subcategory}
                    </p>
                    <h4
                      onClick={() => navigateToProduct(product.id)}
                      className="text-sm font-semibold text-[#171717] hover:text-[#71883F] cursor-pointer mt-1 line-clamp-1"
                    >
                      {product.name}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-[#171717] tabular-nums">
                        ₹{product.price}
                      </span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-[#6B6B6B] line-through tabular-nums">
                          ₹{product.mrp}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs">
                      {product.stock > 0 ? (
                        <span className="text-emerald-700 font-medium">In Stock</span>
                      ) : (
                        <span className="text-rose-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => addToCart(product, 1)}
                    disabled={product.stock <= 0}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
