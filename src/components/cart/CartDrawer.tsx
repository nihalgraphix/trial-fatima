import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { ProductImage } from '../common/ProductImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartDeliveryCharge,
    cartTotal,
    setActivePage,
    navigateToProduct,
  } = useStore();

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 500;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    setActivePage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E8E8E3] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E8E8E3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#71883F]" />
            <h3 className="font-bold text-base text-[#171717]">Shopping Cart</h3>
            <span className="text-xs text-[#6B6B6B] tabular-nums">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Tracker */}
        <div className="bg-[#F7F8F3] px-4 py-3 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-2 text-xs font-medium text-[#171717]">
            <Truck className="w-4 h-4 text-[#71883F] shrink-0" />
            {remainingForFreeDelivery === 0 ? (
              <span className="text-[#71883F] font-semibold">
                You've unlocked FREE Delivery! 🎉
              </span>
            ) : (
              <span>
                Add <span className="font-bold text-[#71883F]">₹{remainingForFreeDelivery}</span> more for FREE Delivery!
              </span>
            )}
          </div>
          <div className="w-full bg-[#E8E8E3] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#71883F] h-full rounded-full transition-all duration-300"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F7F8F3] text-[#71883F] flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="font-bold text-base text-[#171717]">Your cart is empty</h4>
              <p className="text-xs text-[#6B6B6B] max-w-xs">
                Explore notebooks, gel pens, art kits, backpacks and office supplies ready for fast dispatch.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActivePage('shop');
                }}
                className="mt-2 px-5 py-2 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.product.id}-${idx}`}
                className="flex gap-3 pb-4 border-b border-[#E8E8E3] last:border-b-0"
              >
                <div
                  className="w-16 h-16 rounded-lg bg-[#F7F8F3] overflow-hidden shrink-0 cursor-pointer"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateToProduct(item.product.id);
                  }}
                >
                  <ProductImage
                    imageKey={item.product.images[0]}
                    name={item.product.name}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateToProduct(item.product.id);
                      }}
                      className="text-xs font-semibold text-[#171717] hover:text-[#71883F] cursor-pointer line-clamp-1"
                    >
                      {item.product.name}
                    </h5>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-neutral-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    {item.product.brand} · SKU: {item.product.sku}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#E8E8E3] rounded-md overflow-hidden bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-[#F7F8F3] text-neutral-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-[#171717] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-[#F7F8F3] text-neutral-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-[#171717] tabular-nums">
                        ₹{item.product.price * item.quantity}
                      </p>
                      {item.product.mrp > item.product.price && (
                        <p className="text-[10px] text-[#6B6B6B] line-through tabular-nums">
                          ₹{item.product.mrp * item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#E8E8E3] bg-[#F7F8F3]/60 space-y-3">
            <div className="space-y-1.5 text-xs text-[#6B6B6B]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#171717] tabular-nums">₹{cartSubtotal}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#71883F]">
                  <span>Discount</span>
                  <span className="font-semibold tabular-nums">-₹{cartDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-medium text-[#171717] tabular-nums">
                  {cartDeliveryCharge === 0 ? (
                    <span className="text-[#71883F] font-semibold">FREE</span>
                  ) : (
                    `₹${cartDeliveryCharge}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#171717] pt-2 border-t border-[#E8E8E3]">
                <span>Total Amount</span>
                <span className="text-[#71883F] text-base tabular-nums">₹{cartTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleViewCart}
                className="py-2.5 px-3 text-xs font-semibold text-[#171717] bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-center transition-colors"
              >
                View Full Cart
              </button>
              <button
                onClick={handleCheckoutClick}
                className="py-2.5 px-3 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                Checkout <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
