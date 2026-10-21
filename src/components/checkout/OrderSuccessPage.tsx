import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  ArrowRight,
  Printer,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { IndianPaymentGatewayModal } from './IndianPaymentGatewayModal';

export const OrderSuccessPage: React.FC = () => {
  const {
    orders,
    allOrders,
    selectedOrderId,
    setSelectedOrderId,
    setActivePage,
    completeOnlineOrderPayment,
    storeSettings,
  } = useStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayNowModal, setShowPayNowModal] = useState(false);

  // Retrieve order with multiple fallbacks: selectedOrderId in orders, allOrders, or local cached orders
  const order = React.useMemo(() => {
    if (selectedOrderId) {
      const match = (orders || []).find((o) => o.id === selectedOrderId) ||
                    (allOrders || []).find((o) => o.id === selectedOrderId);
      if (match) return match;
    }
    if (orders && orders.length > 0) return orders[0];
    if (allOrders && allOrders.length > 0) return allOrders[0];
    try {
      const cached = localStorage.getItem('fs_saved_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (selectedOrderId) {
            const found = parsed.find((o: any) => o.id === selectedOrderId);
            if (found) return found;
          }
          return parsed[0];
        }
      }
    } catch {}
    return null;
  }, [orders, allOrders, selectedOrderId]);

  if (!order) {
    return (
      <div className="bg-[#F7F8F3] min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-8 max-w-md w-full shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-[#171717]">No Recent Order Found</h2>
          <p className="text-xs text-[#6B6B6B] mt-2">
            You haven&apos;t placed an order in this session yet, or your order details are still syncing. Browse our stationery collection or track an existing order.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActivePage('shop')}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Browse Shop
            </button>
            <button
              onClick={() => setActivePage('order-tracking')}
              className="px-5 py-2.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] border border-[#E8E8E3] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Track Existing Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOnlinePaid = order.paymentStatus === 'Paid';
  const orderStatusText = order.orderStatus || order.status || 'Confirmed';
  const finalAmount = order.finalTotal ?? order.total ?? 0;
  const paymentMethodLabel =
    typeof order.paymentMethod === 'string' ? order.paymentMethod : 'Online Payment';

  return (
    <div className="bg-[#F7F8F3] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 sm:p-10 shadow-xs text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-block px-3 py-1 bg-[#EFF4E6] text-[#71883F] text-[11px] font-bold uppercase tracking-wider rounded-full mb-2">
            {isOnlinePaid ? 'Order Confirmed & Auto-Verified' : 'Order Confirmed'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Thank you for your purchase!
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2 max-w-md mx-auto">
            Your order <span className="font-bold text-[#171717]">{order.id}</span> has been
            received and is being prepared at{' '}
            <span className="font-semibold text-[#171717]">
              {storeSettings?.storeHubName || storeSettings?.storeName || 'Fathima Stores'}
            </span>
            .
          </p>

          {/* Automated Online Payment Verification Banner */}
          {isOnlinePaid ? (
            <div className="mt-6 bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                    Automated Payment Verification Certificate
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Auto-Verified
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 block">
                    Transaction ID
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-[11px]">
                    {order.transactionId || `TXN-${order.id.replace('ORD-', '')}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 block">
                    12-Digit Bank UTR / RRN
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-[11px]">
                    {order.utrNumber || 'Verified NPCI'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 block">
                    Payment Channel
                  </span>
                  <span className="font-bold text-emerald-950 text-[11px]">
                    {paymentMethodLabel} ({order.paymentGateway || 'Razorpay / NPCI'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 block">
                    Order Status
                  </span>
                  <span className="font-bold text-emerald-800 text-[11px]">
                    {orderStatusText} (Fast-Tracked)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Cash on Delivery Order — Want Faster Priority Dispatch?
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Complete your ₹{finalAmount.toLocaleString('en-IN')} payment online now via UPI or Card for instant UTR verification and zero doorstep cash hassle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayNowModal(true)}
                className="px-4 py-2 bg-[#71883F] hover:bg-[#5e7233] text-white text-xs font-bold rounded-lg shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay ₹{finalAmount} Online Now
              </button>
            </div>
          )}

          {/* Order Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 text-left bg-[#F7F8F3] p-5 rounded-xl border border-[#E8E8E3]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#71883F]" /> Order Status
              </span>
              <p className="text-sm font-bold text-[#171717] mt-1">{orderStatusText}</p>
              <p className="text-[11px] text-[#6B6B6B]">
                Est. Arrival: {order.estimatedDelivery || '2-3 Business Days'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#71883F]" /> Payment
              </span>
              <p className="text-sm font-bold text-[#171717] mt-1">{paymentMethodLabel}</p>
              <p className="text-[11px] text-[#71883F] font-semibold">
                Status: {order.paymentStatus}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#71883F]" /> Delivery Address
              </span>
              <p className="text-xs font-bold text-[#171717] mt-1 truncate">
                {order.shippingAddress?.fullName || order.customerName}
              </p>
              <p className="text-[11px] text-[#6B6B6B] truncate">
                {order.shippingAddress?.house || order.shippingAddress?.street || ''},{' '}
                {order.shippingAddress?.city || 'Trivandrum'} -{' '}
                {order.shippingAddress?.pinCode || '695001'}
              </p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="text-left border-t border-[#E8E8E3] pt-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Order Summary ({order.items?.length || 0} items)
              </h3>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#71883F]" /> Hub:{' '}
                {storeSettings?.storeHubName || 'MG Road, Trivandrum'}
              </span>
            </div>
            <div className="space-y-3 divide-y divide-[#E8E8E3]">
              {(order.items || []).map((item: any, idx: number) => {
                const itemId = item.productId || item.product?.id || `item-${idx}`;
                const itemName = item.name || item.product?.name || 'Stationery Item';
                const itemPrice = item.price ?? item.product?.price ?? 0;
                const itemImage =
                  item.image ||
                  item.product?.image ||
                  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80';
                return (
                  <div
                    key={`${itemId}-${idx}`}
                    className="pt-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E8E8E3]"
                      />
                      <div>
                        <p className="font-bold text-[#171717]">{itemName}</p>
                        <p className="text-[11px] text-[#6B6B6B]">
                          Qty: {item.quantity} × ₹{itemPrice}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#171717] tabular-nums">
                      ₹{itemPrice * item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E8E3] flex justify-between items-center text-base font-extrabold text-[#171717]">
              <span>Total Amount</span>
              <span className="text-[#71883F] tabular-nums">₹{finalAmount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedOrderId(order.id);
                setActivePage('order-tracking');
              }}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Track Order Live <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowInvoice(true)}
              className="px-5 py-2.5 bg-white hover:bg-[#F7F8F3] text-[#171717] border border-[#E8E8E3] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#71883F]" /> View / Print Tax Invoice
            </button>

            <button
              onClick={() => setActivePage('shop')}
              className="px-5 py-2.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </button>
          </div>
        </div>
      </div>

      {showInvoice && <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />}

      <IndianPaymentGatewayModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        amount={order.outstandingBalance ?? (order as any).BalanceAmount ?? finalAmount}
        customerName={order.customerName}
        customerPhone={order.phone}
        customerEmail={order.email}
        orderReferenceId={order.id}
        onPaymentSuccess={async (chosenMethod, paymentDetails) => {
          await completeOnlineOrderPayment(order.id, chosenMethod, paymentDetails);
          setShowPayNowModal(false);
        }}
      />
    </div>
  );
};
