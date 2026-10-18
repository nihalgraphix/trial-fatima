import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../common/ProductImage';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartDeliveryCharge,
    cartTotal,
    setActivePage,
    navigateToProduct,
  } = useStore();

  if (cart.length === 0) {
    return (
      <div className="bg-white min-h-[65vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F7F8F3] text-[#71883F] flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#171717]">Your cart is empty.</h2>
        <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 max-w-sm">
          Discover something you'll love from our stationery, art and study collection.
        </p>
        <button
          onClick={() => {
            setActivePage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-5 px-6 py-2.5 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg shadow-2xs transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  const freeDeliveryThreshold = 500;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight mb-8">
          Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Table / List */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free shipping banner */}
            <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <Truck className="w-4 h-4 text-[#71883F] shrink-0" />
              {remainingForFreeDelivery === 0 ? (
                <span className="text-[#71883F] font-semibold">
                  Congratulations! You've unlocked FREE Standard Delivery! 🎉
                </span>
              ) : (
                <span>
                  Add <span className="font-bold text-[#71883F]">₹{remainingForFreeDelivery}</span> more of stationery for FREE Delivery.
                </span>
              )}
            </div>

            {/* Table */}
            <div className="border border-[#E8E8E3] rounded-xl overflow-hidden divide-y divide-[#E8E8E3]">
              {cart.map((item, idx) => (
                <div
                  key={`${item.product.id}-${idx}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-16 h-16 rounded-lg bg-[#F7F8F3] p-1 shrink-0 cursor-pointer overflow-hidden border border-[#E8E8E3]"
                      onClick={() => navigateToProduct(item.product.id)}
                    >
                      <ProductImage
                        imageKey={item.product.images[0]}
                        name={item.product.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4
                        onClick={() => navigateToProduct(item.product.id)}
                        className="text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#71883F] cursor-pointer truncate"
                      >
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {item.product.brand} · SKU: {item.product.sku}
                      </p>
                      <p className="text-xs font-semibold text-[#71883F] mt-1 tabular-nums sm:hidden">
                        ₹{item.product.price} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8">
                    {/* Stepper */}
                    <div className="flex items-center border border-[#E8E8E3] rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-[#F7F8F3] text-neutral-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-9 text-center text-xs font-semibold text-[#171717] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-[#F7F8F3] text-neutral-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-sm font-bold text-[#171717] tabular-nums">
                        ₹{item.product.price * item.quantity}
                      </span>
                      {item.product.mrp > item.product.price && (
                        <span className="text-[11px] text-[#6B6B6B] line-through block tabular-nums">
                          ₹{item.product.mrp * item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActivePage('shop')}
                className="text-xs font-semibold text-[#71883F] hover:underline"
              >
                ← Continue Shopping
              </button>
            </div>
          </div>

          {/* Right Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Cart Summary */}
            <div className="bg-white border border-[#E8E8E3] rounded-xl p-5 space-y-3.5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider border-b border-[#E8E8E3] pb-2">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs text-[#6B6B6B]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#171717] tabular-nums">
                    ₹{cartSubtotal}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-medium text-[#171717] tabular-nums">
                    {cartDeliveryCharge === 0 ? (
                      <span className="text-[#71883F] font-semibold">FREE</span>
                    ) : (
                      `₹${cartDeliveryCharge}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#171717] pt-3 border-t border-[#E8E8E3]">
                  <span>Total</span>
                  <span className="text-[#71883F] tabular-nums">₹{cartTotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActivePage('checkout');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-[#6B6B6B] text-center pt-2">
                <span>Safe & Secure 256-bit Encrypted Checkout</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
