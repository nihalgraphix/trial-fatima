import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../common/ProductImage';
import { ProductCard } from '../common/ProductCard';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus,
  MessageSquare,
  Share2,
  Tag,
  Sparkles,
  Gift,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    products,
    selectedProductId,
    addToCart,
    toggleWishlist,
    isInWishlist,
    reviews,
    addReview,
    setActivePage,
    setIsCartOpen,
    showToast,
    storeSettings,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review form state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const product = products.find((p) => p.id === selectedProductId) || products[0];

  if (!product) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-[#171717]">Product not found</h2>
        <p className="text-xs text-[#6B6B6B] max-w-sm">
          No product was found with this ID, or the catalog is currently being updated.
        </p>
        <button
          onClick={() => setActivePage('shop')}
          className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg"
        >
          Browse Shop
        </button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const productReviews = reviews.filter(
    (r) => r.productId === product.id && r.status === 'approved'
  );
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) {
      showToast('Please enter your name and comments.', 'error');
      return;
    }
    addReview({
      productId: product.id,
      productName: product.name,
      rating: reviewRating,
      comment: reviewComment,
      userName: reviewerName,
    });
    setReviewComment('');
    setReviewerName('');
    showToast('Your review has been published!');
  };

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6B6B6B] mb-6">
          <button onClick={() => setActivePage('home')} className="hover:text-[#71883F]">
            Home
          </button>{' '}
          / <button onClick={() => setActivePage('shop')} className="hover:text-[#71883F]">
            Shop
          </button>{' '}
          / <span className="text-[#171717] font-medium">{product.name}</span>
        </nav>

        {/* Top Product Showcase (Gallery Left + Purchase Module Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left: Product Image Gallery Showcase */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square bg-[#F9F9F7] border border-[#E8E8E3] rounded-2xl flex items-center justify-center p-8 overflow-hidden relative shadow-2xs">
              <ProductImage
                imageKey={product.images[0]}
                name={product.name}
                className="w-full h-full max-h-[85%]"
              />
              {storeSettings?.showProductBadges !== false && product.showBadge !== false && (
                product.offer?.active ? (
                  <span className="absolute top-4 left-4 z-10 text-xs font-bold text-white bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 px-3 py-1 rounded-md shadow-xs flex items-center gap-1.5 uppercase tracking-wide border border-white/20 select-none">
                    <span>🔥</span>
                    <span>{product.offer.badgeText || product.offer.title}</span>
                  </span>
                ) : product.badge ? (
                  <span className="absolute top-4 left-4 z-10 text-xs font-bold text-[#171717] bg-white/95 backdrop-blur-xs px-3 py-1 rounded-md border border-[#E8E8E3] shadow-2xs tracking-wide uppercase select-none">
                    {product.badge}
                  </span>
                ) : product.discount > 0 && product.showDiscountBadge !== false ? (
                  <span className="absolute top-4 left-4 z-10 text-xs font-bold text-white bg-[#71883F] px-3 py-1 rounded-md shadow-2xs tracking-wide select-none">
                    {product.discount}% OFF
                  </span>
                ) : null
              )}
            </div>

            {/* Thumbnail previews */}
            <div className="flex gap-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 rounded-xl bg-[#F9F9F7] border p-2 cursor-pointer transition-colors ${
                    idx === 0
                      ? 'border-[#71883F] ring-1 ring-[#71883F]'
                      : 'border-[#E8E8E3] hover:border-neutral-400'
                  }`}
                >
                  <ProductImage
                    imageKey={product.images[0]}
                    name={product.name}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Purchase Module */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1.5">
                <span className="font-semibold text-[#71883F] uppercase tracking-wider">
                  {product.brand}
                </span>
                <span>SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews summary */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-current'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 font-bold text-xs text-[#171717] tabular-nums">
                    {product.rating}
                  </span>
                </div>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-[#6B6B6B] tabular-nums">
                  {product.reviewCount} Customer Reviews
                </span>
                <span className="text-[#6B6B6B]">·</span>
                {product.stock > 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} left)
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#171717] tabular-nums">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm text-[#6B6B6B] line-through tabular-nums">
                    ₹{product.mrp}
                  </span>
                  <span className="text-xs font-bold text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded">
                    Save ₹{product.mrp - product.price} ({product.discount}%)
                  </span>
                </>
              )}
            </div>

            {/* Exclusive Product Offer Display */}
            {product.offer?.active && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-gradient-to-r from-amber-600 to-rose-600 px-2 py-0.5 rounded shadow-2xs uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      {product.offer.badgeText || 'SPECIAL OFFER'}
                    </span>
                    <span className="text-xs font-bold text-amber-950">
                      {product.offer.title}
                    </span>
                  </div>
                  {product.offer.validUntil && (
                    <span className="text-[10px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                      {product.offer.validUntil}
                    </span>
                  )}
                </div>
                {product.offer.description && (
                  <p className="text-xs text-[#4A4A4A] leading-relaxed">
                    {product.offer.description}
                  </p>
                )}
                {product.offer.type === 'bogo' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 pt-1">
                    <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Buy 1 Get 1 Free deal automatically applied on this item!</span>
                  </div>
                )}
              </div>
            )}

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#171717]">Quantity:</span>
                <div className="flex items-center border border-[#E8E8E3] rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-neutral-600 hover:bg-[#F7F8F3] disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-xs font-bold text-[#171717] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 text-neutral-600 hover:bg-[#F7F8F3] disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#71883F] hover:bg-[#5F7334] text-white flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#171717] hover:bg-neutral-800 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    isFavorited ? 'text-rose-600' : 'text-[#6B6B6B] hover:text-[#171717]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Saved in Wishlist' : 'Add to Wishlist'}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast('Product link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#171717] transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share Product
                </button>
              </div>
            </div>

            {/* Delivery & Trust highlights */}
            <div className="pt-4 border-t border-[#E8E8E3] grid grid-cols-3 gap-2 text-center text-xs text-[#6B6B6B]">
              <div className="p-2 rounded-lg bg-[#F7F8F3]">
                <Truck className="w-4 h-4 text-[#71883F] mx-auto mb-1" />
                <span className="font-semibold text-[#171717] block">Fast Shipping</span>
                <span className="text-[10px]">2-4 Days Delivery</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8F3]">
                <ShieldCheck className="w-4 h-4 text-[#71883F] mx-auto mb-1" />
                <span className="font-semibold text-[#171717] block">100% Genuine</span>
                <span className="text-[10px]">Direct from Brands</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8F3]">
                <RotateCcw className="w-4 h-4 text-[#71883F] mx-auto mb-1" />
                <span className="font-semibold text-[#171717] block">Easy Return</span>
                <span className="text-[10px]">7-Day Policy</span>
              </div>
            </div>

          </div>

        </div>

        {/* Tabbed Info: Description, Specifications, Reviews */}
        <div className="mt-16 border-t border-[#E8E8E3] pt-10">
          
          <div className="flex border-b border-[#E8E8E3] gap-6 text-sm font-semibold mb-6">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'desc' ? 'text-[#71883F]' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Product Description
              {activeTab === 'desc' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#71883F]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'specs' ? 'text-[#71883F]' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Specifications
              {activeTab === 'specs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#71883F]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'reviews' ? 'text-[#71883F]' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Reviews ({productReviews.length})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#71883F]" />
              )}
            </button>
          </div>

          {/* Description Content */}
          {activeTab === 'desc' && (
            <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
              <p>{product.description}</p>
              <p>
                All stationery supplies from Fathima Stores are inspected for manufacturing standards, paper GSM verification, and non-toxic durability. Suitable for school students, competitive exam aspirants, and professional corporate use.
              </p>
            </div>
          )}

          {/* Specifications Content */}
          {activeTab === 'specs' && (
            <div className="max-w-2xl bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-[#E8E8E3]">
                    <td className="py-2.5 px-4 font-semibold text-[#171717] w-1/3">Brand</td>
                    <td className="py-2.5 px-4 text-[#6B6B6B]">{product.brand}</td>
                  </tr>
                  <tr className="border-b border-[#E8E8E3]">
                    <td className="py-2.5 px-4 font-semibold text-[#171717]">Category</td>
                    <td className="py-2.5 px-4 text-[#6B6B6B]">{product.category}</td>
                  </tr>
                  <tr className="border-b border-[#E8E8E3]">
                    <td className="py-2.5 px-4 font-semibold text-[#171717]">Subcategory</td>
                    <td className="py-2.5 px-4 text-[#6B6B6B]">{product.subcategory}</td>
                  </tr>
                  <tr className="border-b border-[#E8E8E3]">
                    <td className="py-2.5 px-4 font-semibold text-[#171717]">SKU Code</td>
                    <td className="py-2.5 px-4 text-[#6B6B6B] font-mono">{product.sku}</td>
                  </tr>
                  {Object.entries(product.specs || {}).map(([key, val]) => (
                    <tr key={key} className="border-b border-[#E8E8E3] last:border-b-0">
                      <td className="py-2.5 px-4 font-semibold text-[#171717]">{key}</td>
                      <td className="py-2.5 px-4 text-[#6B6B6B]">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reviews Content & Submission */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Existing Reviews */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-[#171717]">Customer Feedback</h4>
                {productReviews.length === 0 ? (
                  <p className="text-xs text-[#6B6B6B]">
                    No reviews yet for this product. Be the first to share your thoughts!
                  </p>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171717]">{rev.userName}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-current' : 'text-neutral-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6B6B] leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-neutral-400 block">{rev.date}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Submit a Review Form */}
              <div className="lg:col-span-5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-5">
                <h4 className="text-sm font-bold text-[#171717] mb-1">Write a Review</h4>
                <p className="text-xs text-[#6B6B6B] mb-4">
                  Share your experience with other students and shoppers.
                </p>

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#171717] block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Rahul S."
                      className="w-full text-xs px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#171717] block mb-1">
                      Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setReviewRating(stars)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              stars <= reviewRating ? 'fill-current' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-[#6B6B6B] ml-2">{reviewRating} of 5 stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#171717] block mb-1">
                      Review Comments
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review here..."
                      className="w-full text-xs px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg shadow-2xs transition-colors"
                  >
                    Submit Review
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#E8E8E3]">
            <h3 className="text-lg font-bold text-[#171717] mb-6">
              You May Also Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
