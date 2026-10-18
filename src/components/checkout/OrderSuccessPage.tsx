import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, Package, Printer, ArrowRight, Truck } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

export const OrderSuccessPage: React.FC = () => {
  const { orders, selectedOrderId, setActivePage } = useStore();
  const [showInvoice, setShowInvoice] = useState(false);

  // Get most recent or selected order
  const order =
    orders.find((o) => o.id === selectedOrderId) || orders[0];

  if (!order) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-[#171717]">No order found</h2>
        <button
          onClick={() => setActivePage('shop')}
          className="mt-4 px-5 py-2 text-xs font-semibold text-white bg-[#71883F] rounded-lg"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Card */}
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 sm:p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2]" />
          </div>

          <span className="text-xs font-semibold text-[#71883F] uppercase tracking-wider block">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Order Placed Successfully!
          </h1>

          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
            Thank you for your order, <span className="font-semibold text-[#171717]">{order.customerName}</span>. We've sent an SMS confirmation to <span className="font-semibold text-[#171717]">{order.phone}</span>.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E8E8E3] text-left">
            <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">Order ID</span>
              <span className="text-xs font-bold text-[#171717]">{order.id}</span>
            </div>
            <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">Estimated Delivery</span>
              <span className="text-xs font-bold text-[#71883F]">{order.estimatedDelivery}</span>
            </div>
            <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">Total Amount</span>
              <span className="text-xs font-bold text-[#171717] tabular-nums">₹{order.total}</span>
            </div>
            <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">Payment Method</span>
              <span className="text-xs font-bold text-[#171717]">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Delivery Address Summary */}
          <div className="p-4 bg-white border border-[#E8E8E3] rounded-xl text-left text-xs space-y-1">
            <span className="font-bold text-[#171717] uppercase tracking-wider block mb-1">
              Delivery Address:
            </span>
            <p className="text-[#171717] font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-[#6B6B6B]">
              {order.shippingAddress.house}, {order.shippingAddress.street}, {order.shippingAddress.area}
            </p>
            <p className="text-[#6B6B6B]">
              {order.shippingAddress.city}, {order.shippingAddress.district}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
            </p>
          </div>

          {/* Ordered Products */}
          <div className="text-left border border-[#E8E8E3] rounded-xl bg-white overflow-hidden divide-y divide-[#E8E8E3]">
            <div className="px-4 py-2.5 bg-[#F7F8F3] text-xs font-bold text-[#171717]">
              Items in this Shipment
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#171717] block">{item.name}</span>
                  <span className="text-[11px] text-[#6B6B6B]">SKU: {item.sku} · Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-[#171717] tabular-nums">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setShowInvoice(true)}
              className="px-4 py-2.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[#71883F]" /> View & Print Invoice
            </button>

            <button
              onClick={() => {
                setActivePage('account');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" /> Track in My Account
            </button>

            <button
              onClick={() => {
                setActivePage('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-transparent hover:bg-neutral-100 rounded-lg text-xs font-semibold text-[#171717] transition-colors"
            >
              Continue Shopping
            </button>
          </div>

        </div>

        {/* Invoice Modal */}
        <InvoiceModal
          order={order}
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
        />

      </div>
    </div>
  );
};
