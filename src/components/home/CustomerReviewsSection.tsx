import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Quote, Star } from 'lucide-react';

export const CustomerReviewsSection: React.FC = () => {
  const { reviews, storeSettings } = useStore();
  const approvedReviews = reviews.filter((r) => r.status === 'approved');

  if (!storeSettings.showReviews || approvedReviews.length === 0) {
    return null;
  }

  return (
    <section className="py-14 bg-white border-t border-[#E8E8E3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              Customer Experiences & Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
              Verified feedback from students, parents, schools and office admins
            </p>
          </div>
        </div>

        {/* Testimonials Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {approvedReviews.slice(0, 6).map((review) => (
            <div
              key={review.id}
              className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 flex flex-col justify-between shadow-2xs"
            >
              <div>
                {/* Quote Icon in soft green badge */}
                <div className="w-8 h-8 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mb-4">
                  <Quote className="w-4 h-4 fill-current rotate-180" />
                </div>

                <p className="text-xs sm:text-sm text-[#171717] font-medium leading-relaxed mb-4">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3]/60 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#171717]">
                    {review.userName}
                  </h5>
                  <p className="text-[11px] text-[#6B6B6B] truncate max-w-[170px]">
                    Verified Buyer {review.productName ? `· ${review.productName}` : ''}
                  </p>
                </div>

                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? 'fill-current' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
