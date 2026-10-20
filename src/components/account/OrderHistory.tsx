import React, { useState, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useStore } from '../../context/StoreContext';
import { Order, OrderItem, Product } from '../../types';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Printer,
  Navigation,
  MapPin,
  Route as RouteIcon,
  RefreshCw,
  Loader2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { InvoiceModal } from '../checkout/InvoiceModal';
import { IndianPaymentGatewayModal } from '../checkout/IndianPaymentGatewayModal';

interface DistanceMatrixEtaResult {
  distanceKm: string;
  driveDurationMins: number;
  etaLabel: string;
  etaClockTime: string;
  isLiveMatrix: boolean;
  pinnedCoordsText: string;
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

function getOrderTargetCoords(order: Order, idx: number, baseLat: number, baseLng: number): { lat: number; lng: number } {
  if (
    order.shippingAddress?.lat &&
    order.shippingAddress?.lng &&
    !Number.isNaN(Number(order.shippingAddress.lat)) &&
    !Number.isNaN(Number(order.shippingAddress.lng))
  ) {
    return {
      lat: Number(order.shippingAddress.lat),
      lng: Number(order.shippingAddress.lng),
    };
  }
  const offsetLat = ((idx % 5) - 2) * 0.011 + 0.016;
  const offsetLng = ((idx % 4) - 1.5) * 0.013 + 0.014;
  return {
    lat: Number((baseLat + offsetLat).toFixed(5)),
    lng: Number((baseLng + offsetLng).toFixed(5)),
  };
}

export const OrderHistory: React.FC = () => {
  const {
    orders,
    currentUser,
    setActivePage,
    setSelectedOrderId,
    showToast,
    storeSettings,
    completeOnlineOrderPayment,
  } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [etaByOrderId, setEtaByOrderId] = useState<Record<string, DistanceMatrixEtaResult>>({});
  const [isCalculatingMatrix, setIsCalculatingMatrix] = useState(false);

  const routesLib = useMapsLibrary('routes');

  const storeHubCoords = {
    lat: storeSettings?.storeLat ?? 8.5241,
    lng: storeSettings?.storeLng ?? 76.9366,
    name: storeSettings?.storeHubName || `${storeSettings?.storeName || 'Fathima Stores'} Hub`,
  };

  if (!currentUser) return null;

  const userOrders = (orders || [])
    .filter((o) => o && (o.userId === currentUser.id || o.email === currentUser.email))
    .map((o) => ({
      ...o,
      rawOrder: o,
      orderStatus: o.orderStatus || o.status || 'Confirmed',
      date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'),
      total: o.total ?? o.finalTotal ?? o.totalAmount ?? 0,
      items: Array.isArray(o.items)
        ? o.items.map((item: OrderItem & { product?: Product }) => ({
            productId: item.productId || item.product?.id || '',
            name: item.name || item.product?.name || 'Stationery Item',
            price: item.price ?? item.product?.price ?? 0,
            quantity: item.quantity || 1,
            image: item.image || item.product?.image || '',
          }))
        : [],
    }));

  const filteredOrders = userOrders.filter((order) => {
    const matchesSearch =
      (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || order.orderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Ordered':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Processing':
      case 'Packed':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Shipped':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Out for Delivery':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const handleCopyInvoiceLink = (orderId: string) => {
    const url = `${window.location.origin}/?invoice=${orderId}`;
    navigator.clipboard.writeText(url);
    showToast('Invoice link copied to clipboard!', 'success');
  };

  const computeFallbackEta = useCallback(
    (order: Order, idx: number): DistanceMatrixEtaResult => {
      const coords = getOrderTargetCoords(order, idx, storeHubCoords.lat, storeHubCoords.lng);
      const straightKm = getHaversineDistanceKm(
        storeHubCoords.lat,
        storeHubCoords.lng,
        coords.lat,
        coords.lng
      );
      const roadKm = Math.max(1.2, straightKm * 1.32);
      const driveMins = Math.max(8, Math.round((roadKm / 26) * 60));

      const status = order.orderStatus || order.status || 'Confirmed';
      const prepBufferMins =
        status === 'Out for Delivery'
          ? 5
          : status === 'Shipped'
          ? 15
          : status === 'Processing' || status === 'Packed'
          ? 25
          : 35;

      const totalEtaMins = driveMins + prepBufferMins;
      const arrivalDate = new Date(Date.now() + totalEtaMins * 60000);
      const etaClockTime = arrivalDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        distanceKm: `${roadKm.toFixed(1)} km`,
        driveDurationMins: driveMins,
        etaLabel:
          status === 'Delivered'
            ? 'Delivered to Pin'
            : status === 'Cancelled'
            ? 'Order Cancelled'
            : `~${totalEtaMins} mins (${etaClockTime})`,
        etaClockTime,
        isLiveMatrix: false,
        pinnedCoordsText: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      };
    },
    [storeHubCoords.lat, storeHubCoords.lng]
  );

  const calculateDistanceMatrixEtas = useCallback(async () => {
    const rawUserOrders = (orders || []).filter(
      (o) => o && (o.userId === currentUser.id || o.email === currentUser.email)
    );
    if (rawUserOrders.length === 0) return;

    const initialMap: Record<string, DistanceMatrixEtaResult> = {};
    rawUserOrders.forEach((o, idx) => {
      initialMap[o.id] = computeFallbackEta(o, idx);
    });
    setEtaByOrderId(initialMap);

    if (!routesLib || typeof google === 'undefined' || !google.maps?.DistanceMatrixService) {
      return;
    }

    setIsCalculatingMatrix(true);
    try {
      const matrixService = new google.maps.DistanceMatrixService();
      const batchOrders = rawUserOrders.slice(0, 20);
      const destinations = batchOrders.map((o, idx) =>
        getOrderTargetCoords(o, idx, storeHubCoords.lat, storeHubCoords.lng)
      );

      const response = await matrixService.getDistanceMatrix({
        origins: [{ lat: storeHubCoords.lat, lng: storeHubCoords.lng }],
        destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (response && response.rows && response.rows[0]?.elements) {
        const elements = response.rows[0].elements;
        const updatedMap: Record<string, DistanceMatrixEtaResult> = { ...initialMap };

        elements.forEach((el, idx) => {
          const ord = batchOrders[idx];
          if (!ord) return;
          const coords = destinations[idx];

          if (el.status === 'OK' && el.distance && el.duration) {
            const driveMins = Math.max(5, Math.round(el.duration.value / 60));
            const status = ord.orderStatus || ord.status || 'Confirmed';
            const prepBufferMins =
              status === 'Out for Delivery'
                ? 5
                : status === 'Shipped'
                ? 15
                : status === 'Processing' || status === 'Packed'
                ? 25
                : 35;

            const totalEtaMins = driveMins + prepBufferMins;
            const arrivalDate = new Date(Date.now() + totalEtaMins * 60000);
            const etaClockTime = arrivalDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            updatedMap[ord.id] = {
              distanceKm: el.distance.text,
              driveDurationMins: driveMins,
              etaLabel:
                status === 'Delivered'
                  ? 'Delivered to Pin'
                  : status === 'Cancelled'
                  ? 'Order Cancelled'
                  : `${totalEtaMins} mins (${etaClockTime})`,
              etaClockTime,
              isLiveMatrix: true,
              pinnedCoordsText: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
            };
          }
        });

        setEtaByOrderId(updatedMap);
      }
    } catch (err: any) {
      console.warn('Distance Matrix ETA calculation notice:', err);
      const msg = String(err?.message || err || '');
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('OVER_QUERY_LIMIT') ||
        msg.includes('429')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsCalculatingMatrix(false);
    }
  }, [
    orders,
    currentUser.id,
    currentUser.email,
    routesLib,
    computeFallbackEta,
    storeHubCoords.lat,
    storeHubCoords.lng,
  ]);

  useEffect(() => {
    calculateDistanceMatrixEtas();
  }, [calculateDistanceMatrixEtas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-[#171717] tracking-tight">Order History</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/20 flex items-center gap-1">
              <RouteIcon className="w-3 h-3" /> Live Distance Matrix ETA
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Track your orders with real-time travel time & ETA calculated from{' '}
            <span className="font-semibold text-[#171717]">{storeHubCoords.name}</span> to your
            pinned delivery location
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              calculateDistanceMatrixEtas();
              showToast(`Recalculated live travel times from ${storeHubCoords.name}!`, 'info');
            }}
            disabled={isCalculatingMatrix}
            className="px-3 py-2 bg-[#F7F8F3] border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh Distance Matrix Travel Time & ETA"
          >
            {isCalculatingMatrix ? (
              <Loader2 className="w-3.5 h-3.5 text-[#71883F] animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-[#71883F]" />
            )}
            <span className="hidden sm:inline">Refresh ETAs</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs outline-none focus:border-[#71883F] w-full sm:w-48"
            />
          </div>
          <div className="relative group">
            <button className="p-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl hover:bg-white transition-colors">
              <Filter className="w-4 h-4 text-[#171717]" />
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E8E8E3] rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-10 p-2">
              {[
                'All',
                'Confirmed',
                'Processing',
                'Shipped',
                'Out for Delivery',
                'Delivered',
                'Cancelled',
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    filterStatus === status
                      ? 'bg-[#EFF4E6] text-[#71883F]'
                      : 'text-[#6B6B6B] hover:bg-[#F7F8F3]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E8E8E3] rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-[#F7F8F3] rounded-2xl flex items-center justify-center mx-auto text-[#71883F]">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-[#171717]">No orders found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs mx-auto">
              {searchTerm || filterStatus !== 'All'
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You haven't placed any orders yet. Start shopping to see your history here!"}
            </p>
          </div>
          {!searchTerm && filterStatus === 'All' && (
            <button
              onClick={() => setActivePage('shop')}
              className="px-6 py-2.5 bg-[#71883F] text-white text-xs font-black rounded-xl shadow-xs"
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => {
            const matrixEta = etaByOrderId[order.id] || computeFallbackEta(order, idx);
            const hasExactPin = Boolean(
              order.shippingAddress?.lat && order.shippingAddress?.lng
            );
            const canPayOnlineNow =
              order.paymentStatus !== 'Paid' &&
              order.paymentStatus !== 'Refunded' &&
              order.orderStatus !== 'Cancelled' &&
              order.orderStatus !== 'Delivered';

            return (
              <div
                key={order.id}
                className="bg-white border border-[#E8E8E3] rounded-3xl overflow-hidden hover:border-[#71883F]/30 transition-all shadow-xs group"
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#F7F8F3] rounded-2xl flex items-center justify-center shrink-0 text-[#71883F]">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-black text-[#171717]">{order.id}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.paymentStatus === 'Refunded'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.paymentStatus === 'Paid' && <ShieldCheck className="w-2.5 h-2.5" />}
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                        <span className="text-[10px] font-bold text-[#71883F] bg-[#EFF4E6] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {matrixEta.etaLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B6B6B]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {order.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" /> {order.items.length} items
                        </span>
                        <span className="font-bold text-[#71883F]">₹{order.total}</span>
                        {order.utrNumber && (
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            UTR: {order.utrNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canPayOnlineNow && (
                      <button
                        type="button"
                        onClick={() => setPayingOrder(order.rawOrder)}
                        className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5e7233] text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <CreditCard className="w-3 h-3" /> Pay ₹{order.total} Online
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-3 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] hover:bg-white text-[9px] font-black uppercase tracking-wider text-[#171717] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-[#71883F]" /> Invoice
                    </button>
                    <button
                      onClick={() => handleCopyInvoiceLink(order.id)}
                      className="px-3 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] hover:bg-white text-[9px] font-black uppercase tracking-wider text-[#171717] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copy Invoice Link"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActivePage('order-tracking');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-1.5 bg-[#171717] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-2xs hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-[#A9C46C]" />
                      <span>Track Live Route</span>
                    </button>
                  </div>
                </div>

                {/* Distance Matrix Travel Time & Pinned Delivery Destination Banner */}
                <div className="px-4 sm:px-6 py-3 bg-[#EFF4E6]/50 border-t border-[#E8E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#71883F] text-white flex items-center justify-center shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#171717] text-[11px] truncate">
                        {storeHubCoords.name} → {order.shippingAddress?.house},{' '}
                        {order.shippingAddress?.area || order.shippingAddress?.city} (
                        {order.shippingAddress?.pinCode})
                      </p>
                      <p className="text-[10px] text-[#6B6B6B]">
                        Distance Matrix:{' '}
                        <span className="font-bold text-[#71883F]">{matrixEta.distanceKm}</span> road
                        distance •{' '}
                        <span className="font-bold text-[#171717]">
                          {matrixEta.driveDurationMins} mins
                        </span>{' '}
                        travel time •{' '}
                        <span className="font-mono">
                          {hasExactPin ? `GPS Pin: ${matrixEta.pinnedCoordsText}` : 'Geocoded Pin'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#71883F]/20 text-[10px] font-extrabold text-[#71883F]">
                      {order.orderStatus === 'Delivered'
                        ? `Delivered (${matrixEta.driveDurationMins}m trip)`
                        : `Est. Arrival: ${matrixEta.etaClockTime}`}
                    </span>
                  </div>
                </div>

                {/* Collapsible Items Preview */}
                <div className="px-6 py-4 bg-[#F7F8F3]/50 border-t border-[#E8E8E3] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover border border-[#E8E8E3] bg-white"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-[#171717] truncate">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-[#6B6B6B]">
                            Qty: {item.quantity} · ₹{item.price}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[9px] font-bold text-[#71883F] pl-11">
                        + {order.items.length - 2} more items
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col justify-center text-[10px] text-[#6B6B6B] space-y-1">
                    {order.trackingNumber && (
                      <p className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-[#71883F]" />
                        Tracking:{' '}
                        <span className="font-mono font-bold text-[#171717]">
                          {order.trackingNumber}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-[#71883F]" />
                      Calculated ETA:{' '}
                      <span className="font-bold text-[#171717]">{matrixEta.etaLabel}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#71883F]" />
                      Delivery Method:{' '}
                      <span className="font-bold text-[#171717]">
                        {order.deliveryMethod || 'Standard Doorstep Delivery'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {payingOrder && (
        <IndianPaymentGatewayModal
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          amount={payingOrder.BalanceAmount ?? payingOrder.finalTotal ?? payingOrder.total ?? 0}
          customerName={payingOrder.customerName}
          customerPhone={payingOrder.phone}
          customerEmail={payingOrder.email}
          orderReferenceId={payingOrder.id}
          onPaymentSuccess={async (chosenMethod, paymentDetails) => {
            await completeOnlineOrderPayment(payingOrder.id, chosenMethod, paymentDetails);
            setPayingOrder(null);
          }}
        />
      )}
    </div>
  );
};
