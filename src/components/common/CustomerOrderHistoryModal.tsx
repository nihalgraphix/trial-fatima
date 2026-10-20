import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Printer,
  ArrowRight,
  ShoppingBag,
  Navigation,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { InvoiceModal } from '../checkout/InvoiceModal';
import { IndianPaymentGatewayModal } from '../checkout/IndianPaymentGatewayModal';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getHaversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CustomerOrderHistoryModal: React.FC<CustomerOrderHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    orders,
    currentUser,
    setSelectedOrderId,
    setActivePage,
    storeSettings,
    completeOnlineOrderPayment,
  } = useStore();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const storeLat = storeSettings?.storeLat ?? 8.5241;
  const storeLng = storeSettings?.storeLng ?? 76.9366;
  const storeHubName = storeSettings?.storeHubName || `${storeSettings?.storeName || 'Fathima Stores'} Hub`;

  const myOrders = currentUser
    ? orders.filter((o) => o.userId === currentUser.id || o.email === currentUser.email)
    : orders;

  const handleTrackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    onClose();
    setActivePage('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white border border-[#E8E8E3] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E8E3] flex items-center justify-between bg-[#F7F8F3]">
          <div>
            <h2 className="text-lg font-extrabold text-[#171717] tracking-tight text-left">
              My Orders & Tracking
            </h2>
            <p className="text-xs text-[#6B6B6B] text-left">
              View past orders, pay pending COD orders online, or track active deliveries from {storeHubName}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B6B6B] hover:text-[#171717] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Orders List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
          {myOrders.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#171717]">No orders found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">You haven't placed any stationery orders yet.</p>
              <button
                onClick={() => {
                  onClose();
                  setActivePage('shop');
                }}
                className="mt-4 px-4 py-2 bg-[#71883F] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            myOrders.map((order, idx) => {
              const isDelivered = order.status === 'Delivered';
              const targetLat =
                order.shippingAddress?.lat && !Number.isNaN(Number(order.shippingAddress.lat))
                  ? Number(order.shippingAddress.lat)
                  : storeLat + (((idx % 5) - 2) * 0.011 + 0.015);
              const targetLng =
                order.shippingAddress?.lng && !Number.isNaN(Number(order.shippingAddress.lng))
                  ? Number(order.shippingAddress.lng)
                  : storeLng + (((idx % 4) - 1.5) * 0.013 + 0.012);
              const roadKm = Math.max(
                1.2,
                getHaversineDistanceKm(storeLat, storeLng, targetLat, targetLng) * 1.32
              );
              const driveMins = Math.max(8, Math.round((roadKm / 26) * 60));
              const totalEtaMins =
                driveMins +
                (order.status === 'Out for Delivery'
                  ? 5
                  : order.status === 'Shipped'
                  ? 15
                  : 25);
              const canPayNow =
                order.paymentStatus !== 'Paid' &&
                order.paymentStatus !== 'Refunded' &&
                order.status !== 'Cancelled' &&
                order.status !== 'Delivered';

              return (
                <div
                  key={order.id}
                  className="border border-[#E8E8E3] rounded-xl p-4 sm:p-5 hover:border-[#71883F]/50 transition-colors space-y-4 bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8E8E3]">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-[#171717]">{order.id}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            isDelivered
                              ? 'bg-[#EFF4E6] text-[#71883F]'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.paymentStatus === 'Paid' && (
                            <ShieldCheck className="w-2.5 h-2.5" />
                          )}
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5" />
                          {isDelivered
                            ? `Delivered (${driveMins}m drive)`
                            : `ETA: ~${totalEtaMins} mins (${roadKm.toFixed(1)} km)`}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN')} •{' '}
                        {order.items.length} items
                        {order.utrNumber ? ` • UTR: ${order.utrNumber}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#71883F] tabular-nums">
                        ₹{order.finalTotal}
                      </span>
                      <p className="text-[10px] text-[#6B6B6B]">
                        {order.transactionId || order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {order.items.map((item, idx2) => (
                      <div
                        key={`${item.product.id}-${idx2}`}
                        className="flex items-center gap-2.5 bg-[#F7F8F3] px-3 py-2 rounded-lg border border-[#E8E8E3] shrink-0"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-[#171717] max-w-[140px] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-[#6B6B6B]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B]">
                      <MapPin className="w-3.5 h-3.5 text-[#71883F]" />
                      <span className="truncate max-w-[240px]">
                        {storeHubName} → {order.shippingAddress.house}, {order.shippingAddress.city}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPayNow && (
                        <button
                          onClick={() => setPayingOrder(order)}
                          className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Online
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3 py-1.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#71883F]" /> Invoice
                      </button>
                      <button
                        onClick={() => handleTrackOrder(order.id)}
                        className="px-3.5 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Track Live <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}

      {payingOrder && (
        <IndianPaymentGatewayModal
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          amount={payingOrder.BalanceAmount ?? payingOrder.finalTotal}
          customerName={payingOrder.customerName}
          customerPhone={payingOrder.phone}
          customerEmail={payingOrder.email}
          orderReferenceId={payingOrder.id}
          onPaymentSuccess={async (_, paymentDetails) => {
            await completeOnlineOrderPayment(payingOrder.id, paymentDetails);
            setPayingOrder(null);
          }}
        />
      )}
    </div>
  );
};
