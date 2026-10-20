import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, ShoppingBag, Heart, Star, Check, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { ProductImage } from './ProductImage';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateToProduct,
    storeSettings,
    reviews,
    addReview,
    currentUser,
    showToast,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quickRating, setQuickRating] = useState(5);
  const [quickComment, setQuickComment] = useState('');
  const [quickReviewerName, setQuickReviewerName] = useState(currentUser?.name || '');
  const [showReviewBox, setShowReviewBox] = useState(false);

  if (!quickViewProduct) return null;

  const productReviews = (reviews || []).filter(
    (r) => r.productId === quickViewProduct.id && (r.status === 'approved' || !r.status)
  );
  const isFavorited = isInWishlist(quickViewProduct.id);
  const hasOffer = quickViewProduct.offer?.active;

  const handleQuickReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) {
      showToast('Please enter a short review comment.', 'error');
      return;
    }
    await addReview({
      productId: quickViewProduct.id,
      productName: quickViewProduct.name,
      rating: quickRating,
      comment: quickComment.trim(),
      userName: quickReviewerName.trim() || currentUser?.name || 'Customer',
    });
    setQuickComment('');
    setShowReviewBox(false);
  };

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity);
    setQuickViewProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          aria-label="Close Quick View"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="w-full md:w-1/2 bg-[#F9F9F7] p-6 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#E8E8E3]">
          <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-white border border-[#E8E8E3] p-4 shadow-2xs">
            <ProductImage
              imageKey={quickViewProduct.images[activeImageIdx] || quickViewProduct.images[0]}
              name={quickViewProduct.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Thumbnails if multiple images exist */}
          {quickViewProduct.images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full pb-1">
              {quickViewProduct.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-12 h-12 rounded-lg p-1 bg-white border transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-[#71883F] ring-1 ring-[#71883F]'
                      : 'border-[#E8E8E3] hover:border-neutral-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage imageKey={img} name={quickViewProduct.name} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Value proposition badges */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4 text-[11px] text-[#6B6B6B]">
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-[#E8E8E3]">
              <Truck className="w-3.5 h-3.5 text-[#71883F] shrink-0" />
              <span className="truncate">Fast Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-[#E8E8E3]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#71883F] shrink-0" />
              <span className="truncate">100% Genuine</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Specs & Actions */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#71883F]">
                  {quickViewProduct.brand}
                </span>
                <span className="font-mono text-[11px]">{quickViewProduct.sku}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#171717] leading-snug">
                {quickViewProduct.name}
              </h2>
            </div>

            {/* Price & Discount */}
            <div className="flex items-baseline gap-2.5 pb-2 border-b border-[#E8E8E3]">
              <span className="text-xl sm:text-2xl font-extrabold text-[#171717] tabular-nums">
                ₹{quickViewProduct.price}
              </span>
              {quickViewProduct.mrp > quickViewProduct.price && (
                <>
                  <span className="text-xs text-[#6B6B6B] line-through tabular-nums">
                    ₹{quickViewProduct.mrp}
                  </span>
                  <span className="text-[11px] font-bold text-white bg-[#71883F] px-2 py-0.5 rounded-md">
                    {quickViewProduct.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Special Offer Box */}
            {hasOffer && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {quickViewProduct.offer?.badgeText || 'SPECIAL OFFER'}
                </span>
                <p className="text-xs font-semibold text-amber-900 mt-1">
                  {quickViewProduct.offer?.title}
                </p>
                {quickViewProduct.offer?.description && (
                  <p className="text-[11px] text-amber-700">{quickViewProduct.offer.description}</p>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-3">
              {quickViewProduct.description}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-xs">
              {quickViewProduct.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5" /> In Stock ({quickViewProduct.stock} units available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Key Specs */}
            {quickViewProduct.specs && Object.keys(quickViewProduct.specs).length > 0 && (
              <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[#171717] block mb-1">
                  Product Details
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {Object.entries(quickViewProduct.specs).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className="text-[#6B6B6B]">{key}:</span>
                      <span className="font-semibold text-[#171717] truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Rating & Customer Reviews Section */}
            <div className="bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(quickViewProduct.rating || 4.5)
                            ? 'fill-current'
                            : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-[#171717]">
                    {quickViewProduct.rating || 4.5}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    ({Math.max(productReviews.length, quickViewProduct.reviewCount || 0)} reviews)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewBox(!showReviewBox)}
                  className="text-[11px] font-bold text-[#71883F] hover:underline cursor-pointer"
                >
                  {showReviewBox ? 'Cancel' : '+ Write a Review'}
                </button>
              </div>

              {showReviewBox && (
                <form onSubmit={handleQuickReviewSubmit} className="space-y-2 pt-2 border-t border-[#E8E8E3] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#171717]">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setQuickRating(s)}
                          className="p-0.5 text-amber-500 cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= quickRating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={quickReviewerName || currentUser?.name || ''}
                    onChange={(e) => setQuickReviewerName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                    required
                  />
                  <textarea
                    rows={2}
                    value={quickComment}
                    onChange={(e) => setQuickComment(e.target.value)}
                    placeholder="Share your feedback about this product..."
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Post Review
                  </button>
                </form>
              )}

              {!showReviewBox && productReviews.length > 0 && (
                <div className="text-[11px] text-[#6B6B6B] pt-1 border-t border-[#E8E8E3]">
                  <span className="font-bold text-[#171717]">{productReviews[0].userName}:</span> "
                  {productReviews[0].comment.slice(0, 80)}
                  {productReviews[0].comment.length > 80 ? '...' : ''}"
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#E8E8E3] space-y-3 mt-4">
            <div className="flex items-center gap-3">
              {/* Quantity Picker */}
              <div className="flex items-center border border-[#E8E8E3] rounded-xl bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-9 text-neutral-600 hover:bg-[#F7F8F3] flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-9 text-center text-xs font-bold text-[#171717] tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(quickViewProduct.stock || 99, q + 1))}
                  className="w-8 h-9 text-neutral-600 hover:bg-[#F7F8F3] flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={quickViewProduct.stock <= 0}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${
                  quickViewProduct.stock <= 0
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-[#71883F] hover:bg-[#5F7334] text-white active:scale-[0.99]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart • ₹{(quickViewProduct.price * quantity).toLocaleString('en-IN')}
              </button>

              {/* Wishlist Heart */}
              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isFavorited
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-[#E8E8E3] hover:border-neutral-400 text-neutral-500 hover:text-rose-600 bg-white'
                }`}
                title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* View Full Product Page link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  navigateToProduct(quickViewProduct.id);
                  setQuickViewProduct(null);
                }}
                className="text-xs font-semibold text-[#71883F] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View Full Product Specs & Customer Reviews <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
