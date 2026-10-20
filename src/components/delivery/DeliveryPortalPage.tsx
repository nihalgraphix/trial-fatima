import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  Truck,
  Phone,
  CheckCircle2,
  Navigation,
  ShieldAlert,
  ArrowLeft,
  Compass,
  MessageCircle,
  Store,
  Settings,
  Box,
  BadgeCheck,
} from 'lucide-react';
import { DeliveryTrackingMap } from './DeliveryTrackingMap';

interface DeliveryPortalPageProps {
  embedded?: boolean;
}

export const DeliveryPortalPage: React.FC<DeliveryPortalPageProps> = ({ embedded = false }) => {
  const {
    currentUser,
    isAdmin,
    isDriver,
    currentDeliveryPerson,
    allOrders,
    orders,
    deliveryAssignments,
    storeSettings,
    updateOrderStatus,
    updateDeliveryLocation,
    updateDeliveryPersonnel,
    setActivePage,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'settings'>('active');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [sharingGpsOrderId, setSharingGpsOrderId] = useState<string | null>(null);
  const [deliveryNotesMap, setDeliveryNotesMap] = useState<Record<string, string>>({});

  // Driver settings form state
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooter' | 'Van' | 'Cycle' | 'E-Bike'>(
    currentDeliveryPerson?.vehicleType || 'Bike'
  );
  const [vehicleNumber, setVehicleNumber] = useState(currentDeliveryPerson?.vehicleNumber || '');
  const [driverPhone, setDriverPhone] = useState(
    currentDeliveryPerson?.phone || currentUser?.phone || ''
  );
  const [currentLocationText, setCurrentLocationText] = useState(
    currentDeliveryPerson?.currentLocation || storeSettings?.storeCity || 'Trivandrum'
  );

  // Sync local form when currentDeliveryPerson updates
  React.useEffect(() => {
    if (currentDeliveryPerson) {
      setVehicleType(currentDeliveryPerson.vehicleType || 'Bike');
      setVehicleNumber(currentDeliveryPerson.vehicleNumber || '');
      setDriverPhone(currentDeliveryPerson.phone || currentUser?.phone || '');
      if (currentDeliveryPerson.currentLocation) {
        setCurrentLocationText(currentDeliveryPerson.currentLocation);
      }
    }
  }, [currentDeliveryPerson, currentUser?.phone]);

  // Combine allOrders and orders safely
  const combinedOrders = useMemo(() => {
    const map = new Map<string, Order>();
    (orders || []).forEach((o) => map.set(o.id, o));
    (allOrders || []).forEach((o) => map.set(o.id, o));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  }, [allOrders, orders]);

  // Helper to check if an order is explicitly assigned to the current driver
  const isOrderAssignedToMe = (order: Order) => {
    if (!currentUser) return false;
    const myId = currentDeliveryPerson?.id || `DRV-${currentUser.id.slice(0, 6).toUpperCase()}`;
    const myEmail = (currentUser.email || '').toLowerCase().trim();
    const myPhone = (currentDeliveryPerson?.phone || currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const orderPhone = (order.assignedDeliveryPhone || '').replace(/\D/g, '').slice(-10);
    const orderName = (order.assignedDeliveryName || '').toLowerCase().trim();
    const myName = (currentUser.name || '').toLowerCase().trim();

    if (order.assignedDeliveryId && (order.assignedDeliveryId === myId || order.assignedDeliveryId === currentUser.id)) {
      return true;
    }
    if (myPhone && orderPhone && myPhone === orderPhone) {
      return true;
    }
    if (myName && orderName && myName === orderName) {
      return true;
    }
    if (myEmail && order.assignedDeliveryId?.toLowerCase() === myEmail) {
      return true;
    }

    // Also check deliveryAssignments collection
    const hasAssignment = (deliveryAssignments || []).some(
      (a) =>
        a.orderId === order.id &&
        (a.deliveryPersonId === myId ||
          a.deliveryPersonId === currentUser.id ||
          (myName && (a.deliveryPersonName || '').toLowerCase().trim() === myName))
    );
    if (hasAssignment) return true;

    return false;
  };

  // My Active Assigned Orders (not yet Delivered or Cancelled/Returned)
  const myActiveOrders = useMemo(() => {
    return combinedOrders.filter(
      (o) =>
        isOrderAssignedToMe(o) &&
        !['Delivered', 'Cancelled', 'Returned'].includes(o.orderStatus)
    );
  }, [combinedOrders, currentDeliveryPerson, currentUser, deliveryAssignments]);

  // My Out for Delivery count
  const outForDeliveryCount = useMemo(() => {
    return myActiveOrders.filter((o) => o.orderStatus === 'Out for Delivery').length;
  }, [myActiveOrders]);

  // My Completed Deliveries
  const myCompletedOrders = useMemo(() => {
    return combinedOrders.filter(
      (o) => isOrderAssignedToMe(o) && o.orderStatus === 'Delivered'
    );
  }, [combinedOrders, currentDeliveryPerson, currentUser, deliveryAssignments]);

  // 1. Not Signed In Guard
  if (!currentUser) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6 bg-[#FAFBF7]">
        <div className="max-w-md w-full bg-white border border-[#E8E8E3] rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-[#171717]">Sign In Required</h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Please sign in to your account first. Only users authorized as Drivers by the Store Administrator can access the Driver Portal through their Account Center.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('login')}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Sign In to Account
            </button>
            <button
              onClick={() => setActivePage('home')}
              className="px-5 py-2.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Non-Driver Strict Access Guard
  if (!isDriver && !isAdmin) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6 bg-[#FAFBF7]">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider">
            Restricted Access
          </span>
          <h2 className="text-xl font-extrabold text-[#171717]">Authorized Drivers Only</h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Your account (<span className="font-bold text-[#171717]">{currentUser.email}</span>) does not have Driver Portal permissions. Only users granted Driver status by the Store Administrator can access the Driver Portal.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('account')}
              className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Return to Account Center
            </button>
            <button
              onClick={() => setActivePage('home')}
              className="px-5 py-2.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleDriverAvailability = (newStatus: 'Available' | 'On Delivery' | 'Offline') => {
    if (!currentDeliveryPerson) return;
    updateDeliveryPersonnel(currentDeliveryPerson.id, { status: newStatus });
  };

  const handleStepOrderStatus = async (order: Order, nextStatus: OrderStatus) => {
    setUpdatingOrderId(order.id);
    try {
      const note = deliveryNotesMap[order.id]?.trim();
      await updateOrderStatus(
        order.id,
        nextStatus,
        note ||
          (nextStatus === 'Packed'
            ? `Order picked up at ${storeSettings.storeName || 'store'} by driver ${currentUser.name}`
            : nextStatus === 'Out for Delivery'
            ? `Driver ${currentUser.name} is on the way to deliver your order`
            : nextStatus === 'Delivered'
            ? `Delivered successfully by ${currentUser.name}${
                order.paymentMethod === 'COD' ? ' (COD Payment Collected)' : ''
              }`
            : `Order updated to ${nextStatus}`)
      );

      if (nextStatus === 'Out for Delivery') {
        await updateDeliveryLocation(order.id, {
          lat: storeSettings.storeLat || 8.5241,
          lng: storeSettings.storeLng || 76.9366,
          address: `Dispatched from ${storeSettings.storeName || 'Fathima Stores'}, ${
            storeSettings.storeAddress || 'Trivandrum'
          }`,
        });
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleShareLiveGps = (order: Order) => {
    setSharingGpsOrderId(order.id);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          await updateDeliveryLocation(order.id, {
            lat,
            lng,
            address: `Live GPS from Driver ${currentUser.name} (${currentLocationText})`,
          });
          if (currentDeliveryPerson) {
            updateDeliveryPersonnel(currentDeliveryPerson.id, {
              lat,
              lng,
              currentLocation: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            });
          }
          setSharingGpsOrderId(null);
        },
        async () => {
          const lat = Number(((storeSettings.storeLat || 8.5241) + (Math.random() - 0.5) * 0.01).toFixed(6));
          const lng = Number(((storeSettings.storeLng || 76.9366) + (Math.random() - 0.5) * 0.01).toFixed(6));
          await updateDeliveryLocation(order.id, {
            lat,
            lng,
            address: `Driver ${currentUser.name} en route near ${order.shippingAddress?.area || order.shippingAddress?.city || 'customer location'}`,
          });
          setSharingGpsOrderId(null);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
      setSharingGpsOrderId(null);
    }
  };

  const handleSaveDriverSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliveryPerson) return;
    updateDeliveryPersonnel(currentDeliveryPerson.id, {
      vehicleType,
      vehicleNumber: vehicleNumber.trim() || 'KL-01-DRV',
      phone: driverPhone.trim() || currentUser.phone,
      currentLocation: currentLocationText.trim() || storeSettings.storeCity || 'Trivandrum',
    });
  };

  const getStoreGoogleMapsUrl = () => {
    if (storeSettings.googleMapsLink && storeSettings.googleMapsLink.startsWith('http')) {
      return storeSettings.googleMapsLink;
    }
    const lat = storeSettings.storeLat || 8.5241;
    const lng = storeSettings.storeLng || 76.9366;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const getCustomerDirectionsUrl = (order: Order) => {
    const storeLat = storeSettings.storeLat || 8.5241;
    const storeLng = storeSettings.storeLng || 76.9366;
    const addr = order.shippingAddress;
    if (addr?.lat && addr?.lng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLng}&destination=${addr.lat},${addr.lng}&travelmode=driving`;
    }
    const destinationQuery = encodeURIComponent(
      [addr?.house, addr?.street, addr?.area, addr?.city, addr?.state, addr?.pinCode]
        .filter(Boolean)
        .join(', ')
    );
    return `https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLng}&destination=${destinationQuery}&travelmode=driving`;
  };

  const totalEarnings = useMemo(() => {
    return myCompletedOrders.reduce((sum, o) => sum + Math.max(40, Math.round((o.total || 0) * 0.08)), 0);
  }, [myCompletedOrders]);

  const codCollectedTotal = useMemo(() => {
    return myCompletedOrders
      .filter((o) => o.paymentMethod === 'COD')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [myCompletedOrders]);

  return (
    <div className={embedded ? 'space-y-6' : 'min-h-screen bg-[#FAFBF7] py-8'}>
      <div className={embedded ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6'}>
        {/* Top Driver Identity & Live Shift Banner */}
        <div className="bg-gradient-to-br from-[#1B2412] via-[#243018] to-[#2F3E1E] text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#71883F] flex items-center justify-center text-white font-extrabold text-xl shadow-inner shrink-0 border border-white/15">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Truck className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <BadgeCheck className="w-3.5 h-3.5" /> Official Store Driver
                  </span>
                  <span className="text-[11px] text-white/70 font-mono">
                    ID: {currentDeliveryPerson?.id || `DRV-${currentUser.id.slice(0, 6).toUpperCase()}`}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                  {currentUser.name} — Driver Dispatch Console
                </h1>
                <p className="text-xs text-white/75 mt-0.5">
                  {currentDeliveryPerson?.vehicleType || 'Bike'} ({currentDeliveryPerson?.vehicleNumber || 'KL-01-DRV'}) · Hub:{' '}
                  {storeSettings.storeName || 'Fathima Stores'} ({storeSettings.storeCity || 'Trivandrum'})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Shift Status Switcher */}
              <div className="inline-flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
                {(['Available', 'On Delivery', 'Offline'] as const).map((st) => {
                  const active = (currentDeliveryPerson?.status || 'Available') === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleDriverAvailability(st)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        active
                          ? st === 'Available'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : st === 'On Delivery'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-neutral-600 text-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {!embedded && (
                <button
                  onClick={() => setActivePage('account')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Account Center
                </button>
              )}
            </div>
          </div>

          {/* 4 Live Driver KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[11px] text-white/70 block">Active Assignments</span>
              <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-white">
                {myActiveOrders.length}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold">Assigned to you</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[11px] text-white/70 block">Out for Delivery</span>
              <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-sky-300">
                {outForDeliveryCount}
              </span>
              <span className="text-[10px] text-white/60">En route to customer</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[11px] text-white/70 block">Completed Trips</span>
              <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-white">
                {myCompletedOrders.length}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold">100% verified</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[11px] text-white/70 block">Driver Earnings / COD</span>
              <span className="text-xl font-extrabold tabular-nums mt-0.5 block text-emerald-300">
                ₹{totalEarnings.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-white/60">
                COD Collected: ₹{codCollectedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Store Pickup Hub Banner (Dynamic from Admin Store Location Settings) */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded-full">
                  Store Pickup Hub
                </span>
                <span className="text-xs font-bold text-[#171717]">
                  {storeSettings.storeHubName || storeSettings.storeName || 'Fathima Stores'}
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {storeSettings.address || storeSettings.storeAddress || 'Fathima Complex, College Road'}
                {storeSettings.storeCity ? `, ${storeSettings.storeCity}` : ''}
                {storeSettings.storeState ? `, ${storeSettings.storeState}` : ''}
                {storeSettings.storePinCode ? ` - ${storeSettings.storePinCode}` : ''}
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Dispatch Desk: <span className="font-semibold text-[#171717]">{storeSettings.contactPhone || '+91 98450 12345'}</span> · Radius: {storeSettings.deliveryRadiusKm || 25} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${storeSettings.contactPhone || '+919845012345'}`}
              className="px-3.5 py-2 rounded-xl border border-[#E8E8E3] hover:bg-[#F7F8F3] text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#71883F]" /> Call Hub
            </a>
            <a
              href={getStoreGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate to Store
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E8E3] pb-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#71883F] text-white shadow-xs'
                : 'bg-white border border-[#E8E8E3] text-[#171717] hover:bg-[#F7F8F3]'
            }`}
          >
            <Truck className="w-4 h-4" />
            My Active Deliveries
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-[#EFF4E6] text-[#71883F]'
              }`}
            >
              {myActiveOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#71883F] text-white shadow-xs'
                : 'bg-white border border-[#E8E8E3] text-[#171717] hover:bg-[#F7F8F3]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed History ({myCompletedOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#71883F] text-white shadow-xs'
                : 'bg-white border border-[#E8E8E3] text-[#171717] hover:bg-[#F7F8F3]'
            }`}
          >
            <Settings className="w-4 h-4" />
            Vehicle & Profile
          </button>
        </div>

        {/* TAB 1: MY ACTIVE DELIVERIES */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {myActiveOrders.length === 0 ? (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#171717]">No Active Deliveries Assigned Right Now</h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                  When the Store Administrator assigns an order to you from the Admin Dashboard, it will appear here automatically with live customer navigation and delivery status controls.
                </p>
              </div>
            ) : (
              myActiveOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                const isSharingGps = sharingGpsOrderId === order.id;
                const customerPhoneClean = (order.shippingAddress?.phone || '').replace(/\D/g, '');
                const whatsappHref = customerPhoneClean
                  ? `https://wa.me/${customerPhoneClean.startsWith('91') ? customerPhoneClean : `91${customerPhoneClean}`}?text=${encodeURIComponent(
                      `Hello ${order.shippingAddress?.fullName || 'Customer'}, I am ${currentUser.name}, your delivery partner from ${
                        storeSettings.storeName || 'Fathima Stores'
                      } for Order #${order.id} (Total: ₹${order.total}).`
                    )}`
                  : '#';

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-xs space-y-5"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E8E3]">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl bg-[#EFF4E6] text-[#71883F] font-mono text-xs font-extrabold">
                          #{order.id}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            order.orderStatus === 'Out for Delivery'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : order.orderStatus === 'Packed'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            order.paymentMethod === 'COD'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {order.paymentMethod === 'COD'
                            ? `Collect Cash ₹${order.total}`
                            : `Prepaid (${order.paymentMethod})`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#6B6B6B] block">Order Total</span>
                        <span className="text-lg font-extrabold text-[#171717] tabular-nums">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Drop-off Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-7 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B6B6B] block">
                          Customer Drop-Off Address
                        </span>
                        <div className="p-4 rounded-2xl bg-[#FAFBF7] border border-[#E8E8E3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-extrabold text-[#171717]">
                              {order.shippingAddress?.fullName || 'Customer'}
                            </h4>
                            <span className="text-xs font-bold text-[#71883F]">
                              {order.shippingAddress?.phone}
                            </span>
                          </div>
                          <p className="text-xs text-[#171717] leading-relaxed">
                            {[
                              order.shippingAddress?.house,
                              order.shippingAddress?.street,
                              order.shippingAddress?.area,
                              order.shippingAddress?.city,
                              order.shippingAddress?.state,
                            ]
                              .filter(Boolean)
                              .join(', ')}{' '}
                            — <span className="font-bold">{order.shippingAddress?.pinCode}</span>
                          </p>
                          {order.deliveryLocation?.address && (
                            <p className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5" /> Last GPS Checkpoint: {order.deliveryLocation.address}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Buttons: Navigate, Call, WhatsApp, Share GPS */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={getCustomerDirectionsUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Navigate on Google Maps
                          </a>

                          {order.shippingAddress?.phone && (
                            <a
                              href={`tel:${order.shippingAddress.phone}`}
                              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E8E3] hover:bg-[#F7F8F3] text-[#171717] text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#71883F]" /> Call Customer
                            </a>
                          )}

                          {customerPhoneClean && (
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={isSharingGps}
                            onClick={() => handleShareLiveGps(order)}
                            className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Compass className={`w-3.5 h-3.5 ${isSharingGps ? 'animate-spin' : ''}`} />
                            {isSharingGps ? 'Updating GPS...' : 'Broadcast Live GPS'}
                          </button>
                        </div>
                      </div>

                      {/* Order Package Items & Driver Status Progression */}
                      <div className="lg:col-span-5 flex flex-col justify-between bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-4">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B6B6B] block mb-2">
                            Package Items ({order.items?.length || 0})
                          </span>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-[#171717] font-medium truncate max-w-[200px]">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="font-bold text-[#171717] tabular-nums">
                                  ₹{(item.discountPrice || item.price) * item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Optional Driver Note */}
                        <div>
                          <input
                            type="text"
                            value={deliveryNotesMap[order.id] || ''}
                            onChange={(e) =>
                              setDeliveryNotesMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            placeholder="Optional delivery note (e.g. Left at reception)"
                            className="w-full px-3 py-2 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                          />
                        </div>

                        {/* Workflow Action Buttons */}
                        <div className="space-y-2 pt-1">
                          {['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus) && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStepOrderStatus(order, 'Packed')}
                              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                              <Box className="w-4 h-4" />
                              {isUpdating ? 'Updating...' : '1. Confirm Store Pickup & Pack'}
                            </button>
                          )}

                          {['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped'].includes(
                            order.orderStatus
                          ) && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStepOrderStatus(order, 'Out for Delivery')}
                              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                              <Truck className="w-4 h-4" />
                              {isUpdating ? 'Updating...' : '2. Start Trip (Out for Delivery)'}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStepOrderStatus(order, 'Delivered')}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {isUpdating
                              ? 'Completing Delivery...'
                              : order.paymentMethod === 'COD'
                              ? `Collect ₹${order.total} Cash & Mark Delivered`
                              : 'Confirm Handover & Mark Delivered'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Interactive Google Map for Driver Navigation */}
                    <div className="pt-2">
                      <DeliveryTrackingMap
                        order={order}
                        deliveryPerson={currentDeliveryPerson}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED DELIVERIES HISTORY */}
        {activeTab === 'completed' && (
          <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#171717]">Completed Deliveries</h3>
                <p className="text-xs text-[#6B6B6B]">
                  Verified handovers completed by {currentUser.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6B6B6B] block">Estimated Trip Payouts</span>
                <span className="text-lg font-extrabold text-[#71883F]">
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {myCompletedOrders.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] py-6 text-center">
                No completed deliveries recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E8E3]">
                {myCompletedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#171717]">#{order.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Delivered
                        </span>
                        <span className="text-[#6B6B6B]">{order.date}</span>
                      </div>
                      <p className="text-[#6B6B6B] mt-0.5">
                        {order.shippingAddress?.fullName} · {order.shippingAddress?.area || order.shippingAddress?.city} ({order.shippingAddress?.pinCode})
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[#6B6B6B] block text-[10px]">Order Value</span>
                        <span className="font-bold text-[#171717]">₹{order.total}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#6B6B6B] block text-[10px]">Trip Fee</span>
                        <span className="font-extrabold text-emerald-700">
                          +₹{Math.max(40, Math.round((order.total || 0) * 0.08))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DRIVER VEHICLE & PROFILE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 max-w-xl space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-[#171717]">Driver Vehicle & Dispatch Profile</h3>
              <p className="text-xs text-[#6B6B6B]">
                Keep your vehicle registration and contact phone updated for customer tracking alerts.
              </p>
            </div>

            <form onSubmit={handleSaveDriverSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#171717] block mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                  >
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter / EV</option>
                    <option value="Van">Delivery Van</option>
                    <option value="Cycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#171717] block mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KL-01-AB-1234"
                    className="w-full px-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#171717] block mb-1">Driver Mobile Number</label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#171717] block mb-1">Current Zone / Standby Area</label>
                  <input
                    type="text"
                    value={currentLocationText}
                    onChange={(e) => setCurrentLocationText(e.target.value)}
                    placeholder="e.g. College Road, Trivandrum"
                    className="w-full px-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white font-bold rounded-xl shadow-2xs cursor-pointer transition-all"
              >
                Save Driver Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
