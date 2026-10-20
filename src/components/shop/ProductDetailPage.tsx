import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Gift,
  ThumbsUp,
  Award,
  Filter,
  PenLine,
} from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  5: 'Excellent — Highly Recommended',
  4: 'Very Good — Satisfied with Quality',
  3: 'Average — Good for the Price',
  2: 'Below Average — Could be Better',
  1: 'Poor — Not Satisfied',
};

const QUICK_REVIEW_TAGS = [
  'Genuine Brand',
  'Great Value for Money',
  'Premium Quality',
  'Student Essential',
  'Durable & Reliable',
  'Fast Delivery',
];

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
    showToast,
    storeSettings,
    currentUser,
    checkIfUserPurchasedProduct,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review form state
  const [reviewerName, setReviewerName] = useState(currentUser?.name || '');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Genuine Brand']);
  const [recommendProduct, setRecommendProduct] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isVerifiedCustomer, setIsVerifiedCustomer] = useState(false);

  // Review filtering & helpful state
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});

  const product = products.find((p) => p.id === selectedProductId) || products[0];

  React.useEffect(() => {
    setActiveImageIdx(0);
    setQuantity(1);
    setStarFilter('all');
  }, [selectedProductId]);

  React.useEffect(() => {
    if (currentUser?.name) {
      setReviewerName(currentUser.name);
    }
  }, [currentUser]);

  React.useEffect(() => {
    let mounted = true;
    const verify = async () => {
      if (currentUser && product) {
        const isVerified = await checkIfUserPurchasedProduct(product.id, currentUser.id);
        if (mounted) setIsVerifiedCustomer(isVerified);
      } else {
        if (mounted) setIsVerifiedCustomer(false);
      }
    };
    verify();
    return () => {
      mounted = false;
    };
  }, [currentUser, product, checkIfUserPurchasedProduct]);

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

  // All approved reviews for this product
  const productReviews = useMemo(() => {
    return reviews.filter(
      (r) => r.productId === product.id && (r.status === 'approved' || !r.status)
    );
  }, [reviews, product.id]);

  // Compute live average rating and review count from actual reviews + product baseline
  const computedRating = useMemo(() => {
    if (productReviews.length === 0) return Number(product.rating || 4.5);
    const avg = productReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / productReviews.length;
    return Number(avg.toFixed(1));
  }, [productReviews, product.rating]);

  const totalReviewCount = Math.max(productReviews.length, product.reviewCount || 0);

  // Filtered & sorted reviews list
  const displayedReviews = useMemo(() => {
    const filtered =
      starFilter === 'all'
        ? [...productReviews]
        : productReviews.filter((r) => Math.round(r.rating) === starFilter);

    return filtered.sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [productReviews, starFilter, sortBy]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const scrollToReviews = () => {
    const el = document.getElementById('product-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = reviewerName.trim() || currentUser?.name || 'Valued Customer';
    if (!reviewComment.trim()) {
      showToast('Please write a brief comment about the product.', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const tagSummary = selectedTags.length > 0 ? ` [${selectedTags.join(' • ')}]` : '';
      const fullComment = `${reviewComment.trim()}${tagSummary}`;

      await addReview({
        productId: product.id,
        productName: product.name,
        rating: reviewRating,
        comment: fullComment,
        userName: finalName,
        reviewTitle: reviewTitle.trim() || RATING_LABELS[reviewRating]?.split('—')[0]?.trim(),
        pros: selectedTags.join(', '),
        recommend: recommendProduct,
      });

      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setSelectedTags(['Genuine Brand']);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleHelpfulVote = (reviewId: string) => {
    if (votedIds[reviewId]) return;
    setVotedIds((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
    showToast('Marked review as helpful!', 'info');
  };

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6B6B6B] mb-6">
          <button onClick={() => setActivePage('home')} className="hover:text-[#71883F] cursor-pointer">
            Home
          </button>{' '}
          /{' '}
          <button onClick={() => setActivePage('shop')} className="hover:text-[#71883F] cursor-pointer">
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
                imageKey={product.images[activeImageIdx] || product.images[0]}
                name={product.name}
                className="w-full h-full max-h-[85%]"
              />
              {storeSettings?.showProductBadges !== false &&
                product.showBadge !== false &&
                (product.offer?.active ? (
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
                ) : null)}
            </div>

            {/* Thumbnail previews */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {(product.images.length > 0 ? product.images : [product.images[0]]).map((imgKey, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl bg-[#F9F9F7] border p-2 cursor-pointer transition-colors shrink-0 ${
                    activeImageIdx === idx
                      ? 'border-[#71883F] ring-1 ring-[#71883F]'
                      : 'border-[#E8E8E3] hover:border-neutral-400'
                  }`}
                >
                  <ProductImage
                    imageKey={imgKey || product.images[0]}
                    name={product.name}
                    className="w-full h-full"
                  />
                </button>
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

              {/* Interactive Rating & Reviews Summary Link */}
              <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(computedRating) ? 'fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-extrabold text-[#171717] tabular-nums">{computedRating}</span>
                  <span className="text-[#6B6B6B]">({totalReviewCount} Reviews)</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#71883F] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" /> Rate & Write a Review
                </button>

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
                    <span className="text-xs font-bold text-amber-950">{product.offer.title}</span>
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
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">{product.description}</p>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#171717]">Quantity:</span>
                <div className="flex items-center border border-[#E8E8E3] rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-neutral-600 hover:bg-[#F7F8F3] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-xs font-bold text-[#171717] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 text-neutral-600 hover:bg-[#F7F8F3] disabled:opacity-40 cursor-pointer"
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
                  className="py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#71883F] hover:bg-[#5F7334] text-white flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#171717] hover:bg-neutral-800 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
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
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#171717] transition-colors cursor-pointer"
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
                <span className="text-[10px]">Same-Day Local Dispatch</span>
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

        {/* Product Description & Technical Specifications Section */}
        <div className="mt-14 border-t border-[#E8E8E3] pt-10">
          <div className="flex border-b border-[#E8E8E3] gap-6 text-sm font-semibold mb-6">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 relative transition-colors cursor-pointer ${
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
              className={`pb-3 relative transition-colors cursor-pointer ${
                activeTab === 'specs' ? 'text-[#71883F]' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Specifications
              {activeTab === 'specs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#71883F]" />
              )}
            </button>
            <button
              onClick={scrollToReviews}
              className="pb-3 relative transition-colors text-[#6B6B6B] hover:text-[#71883F] cursor-pointer"
            >
              Customer Reviews ({productReviews.length})
            </button>
          </div>

          {activeTab === 'desc' && (
            <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
              <p>{product.description}</p>
              <p>
                All stationery supplies from {storeSettings.storeName || 'Fathima Stores'} are inspected for manufacturing standards, paper GSM verification, and non-toxic durability. Suitable for school students, competitive exam aspirants, and professional corporate use.
              </p>
            </div>
          )}

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
        </div>

        {/* ALWAYS-VISIBLE CUSTOMER RATINGS & PRODUCT REVIEWS SECTION UNDER EVERY PRODUCT */}
        <div
          id="product-reviews-section"
          className="mt-14 pt-10 border-t border-[#E8E8E3] scroll-mt-24 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#71883F] block">
                Verified Product Feedback
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
                Customer Ratings & Reviews for {product.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B6B6B] font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold text-[#171717] bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl px-3 py-2 outline-none focus:border-[#71883F]"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating (5★ to 1★)</option>
                <option value="lowest">Lowest Rating (1★ to 5★)</option>
              </select>
            </div>
          </div>

          {/* Star Rating Summary & Histogram Bar */}
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 text-center md:border-r border-[#E8E8E3] md:pr-8 space-y-2">
              <div className="text-5xl font-black text-[#171717] tabular-nums">{computedRating}</div>
              <div className="flex text-amber-500 justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(computedRating) ? 'fill-current' : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-[#6B6B6B] font-bold">
                Based on {totalReviewCount} Customer Rating{totalReviewCount === 1 ? '' : 's'}
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <Award className="w-3.5 h-3.5" /> 96% Recommend this product
              </span>
            </div>

            <div className="md:col-span-8 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#171717]">Filter Reviews by Star Rating</span>
                {starFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setStarFilter('all')}
                    className="text-[11px] font-bold text-[#71883F] hover:underline cursor-pointer"
                  >
                    Show All ({productReviews.length})
                  </button>
                )}
              </div>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = productReviews.filter((r) => Math.round(r.rating) === star).length;
                const percentage =
                  productReviews.length > 0 ? Math.round((count / productReviews.length) * 100) : star === 5 ? 80 : star === 4 ? 20 : 0;
                const isSelected = starFilter === star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarFilter(isSelected ? 'all' : star)}
                    className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected ? 'bg-white shadow-2xs ring-1 ring-[#71883F]' : 'hover:bg-white/60'
                    }`}
                  >
                    <span className="w-14 font-bold text-[#171717] flex items-center gap-1 shrink-0">
                      {star} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2.5 bg-[#E8E8E3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-[#6B6B6B] font-mono text-[11px]">
                      {count} ({percentage}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Layout: Write a Review & Rate Form (Left/Right) + Customer Reviews Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#171717]">
                  Customer Reviews ({displayedReviews.length})
                </h3>
                {starFilter !== 'all' && (
                  <span className="text-xs font-semibold text-[#71883F]">
                    Showing {starFilter}-Star Reviews
                  </span>
                )}
              </div>

              {displayedReviews.length === 0 ? (
                <div className="p-8 bg-[#FAFBF7] border border-[#E8E8E3] rounded-2xl text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-[#71883F] mx-auto" />
                  <h4 className="text-sm font-bold text-[#171717]">
                    {starFilter === 'all'
                      ? 'No written reviews yet for this product'
                      : `No ${starFilter}-star reviews yet`}
                  </h4>
                  <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                    Be the first to rate and review <span className="font-semibold text-[#171717]">{product.name}</span> using the form on the right!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedReviews.map((rev) => {
                    const extraHelpful = helpfulVotes[rev.id] || 0;
                    const hasVoted = votedIds[rev.id];
                    return (
                      <div
                        key={rev.id}
                        className="p-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#EFF4E6] text-[#71883F] font-extrabold text-xs flex items-center justify-center shrink-0">
                              {(rev.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-extrabold text-[#171717]">
                                  {rev.userName}
                                </span>
                                {(rev.verifiedPurchase || isVerifiedCustomer) && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-tight">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified Buyer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#6B6B6B] block">{rev.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-extrabold text-[#171717] ml-1">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>

                        {rev.reviewTitle && (
                          <h4 className="text-xs font-extrabold text-[#171717]">{rev.reviewTitle}</h4>
                        )}

                        <p className="text-xs text-[#4A4A4A] leading-relaxed">{rev.comment}</p>

                        <div className="pt-2 border-t border-[#F7F8F3] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recommends this product
                          </span>

                          <button
                            type="button"
                            onClick={() => handleHelpfulVote(rev.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                              hasVoted
                                ? 'bg-[#EFF4E6] border-[#71883F] text-[#71883F]'
                                : 'bg-[#FAFBF7] border-[#E8E8E3] text-[#6B6B6B] hover:text-[#171717]'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            Helpful ({(rev.helpfulCount || 0) + extraHelpful})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Interactive Rate & Write a Review Card (Open to all users!) */}
            <div className="lg:col-span-5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-3xl p-6 space-y-4 sticky top-24">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#171717]">
                    Rate & Review This Product
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Share your rating and experience with {product.name}
                  </p>
                </div>
                {isVerifiedCustomer && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    Verified Buyer
                  </span>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                {/* Interactive 5-Star Rating Picker */}
                <div className="p-4 bg-white border border-[#E8E8E3] rounded-2xl space-y-2">
                  <label className="font-bold text-[#171717] block">
                    Tap to Rate This Product *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => {
                      const activeStars = hoverRating ?? reviewRating;
                      return (
                        <button
                          key={stars}
                          type="button"
                          onMouseEnter={() => setHoverRating(stars)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setReviewRating(stars)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 transition-transform hover:scale-110 cursor-pointer"
                          aria-label={`Rate ${stars} stars`}
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              stars <= activeStars
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm font-extrabold text-[#171717]">
                      {hoverRating ?? reviewRating}.0 / 5
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#71883F]">
                    {RATING_LABELS[hoverRating ?? reviewRating]}
                  </p>
                </div>

                {/* Reviewer Name */}
                <div>
                  <label className="font-bold text-[#171717] block mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                    required
                  />
                </div>

                {/* Review Headline / Title */}
                <div>
                  <label className="font-bold text-[#171717] block mb-1">
                    Review Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Smooth writing & great paper quality!"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                  />
                </div>

                {/* Quick Highlight Tags */}
                <div>
                  <label className="font-bold text-[#171717] block mb-1.5">
                    What did you like most?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REVIEW_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#71883F] text-white border-[#71883F]'
                              : 'bg-white text-[#6B6B6B] border-[#E8E8E3] hover:border-[#71883F]'
                          }`}
                        >
                          {active ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review Comment */}
                <div>
                  <label className="font-bold text-[#171717] block mb-1">Your Review *</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other shoppers about the quality, durability, and value of this product..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                    required
                  />
                </div>

                {/* Recommend checkbox */}
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                  <input
                    type="checkbox"
                    checked={recommendProduct}
                    onChange={(e) => setRecommendProduct(e.target.checked)}
                    className="accent-[#71883F] w-4 h-4"
                  />
                  <span>I recommend this product to other buyers</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 px-4 text-xs font-extrabold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Publishing Review...' : 'Submit Rating & Review'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#E8E8E3]">
            <h3 className="text-lg font-bold text-[#171717] mb-6">You May Also Like</h3>
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
