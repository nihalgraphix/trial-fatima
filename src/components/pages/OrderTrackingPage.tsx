import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, DeliveryAssignment } from '../../types';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Share2,
  Navigation,
  Radio,
  Clock,
  UserCheck,
} from 'lucide-react';
import { ProductImage } from '../common/ProductImage';

export const OrderTrackingPage: React.FC = () => {
  const { orders, products, deliveryAssignments, deliveryPersonnel, setActivePage, addToCart, showToast } = useStore();

  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchEmailOrPhone, setSearchEmailOrPhone] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Find assignment for active order if dispatched
  const activeAssignment: DeliveryAssignment | undefined = activeOrder
    ? deliveryAssignments.find((da) => da.orderId === activeOrder.id)
    : undefined;

  const assignedWorker = activeAssignment
    ? deliveryPersonnel.find((dp) => dp.id === activeAssignment.deliveryPersonId)
    : undefined;

  // Default to first order on load
  useEffect(() => {
    if (orders && orders.length > 0) {
      setActiveOrder(orders[0]);
      setSearchOrderId(orders[0].id);
    }
  }, [orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchOrderId.trim().toLowerCase();
    if (!query) {
      showToast('Please enter a valid Order ID (e.g. ORD-98214)', 'error');
      return;
    }

    setHasSearched(true);
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        o.id.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.shippingAddress?.phone.includes(query) ||
        (searchEmailOrPhone && o.email.toLowerCase() === searchEmailOrPhone.trim().toLowerCase())
    );

    if (found) {
      setActiveOrder(found);
      showToast(`Found details for Order #${found.id}`, 'success');
    } else {
      setActiveOrder(null);
      showToast(`No order found matching "${searchOrderId}". Check your order ID.`, 'error');
    }
  };

  const handleSelectSampleOrder = (orderToSelect: Order) => {
    setSearchOrderId(orderToSelect.id);
    setActiveOrder(orderToSelect);
    setHasSearched(true);
    showToast(`Loaded details for Order #${orderToSelect.id}`);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      const match = products.find((p) => p.id === item.productId);
      if (match) {
        addToCart(match, item.quantity);
      }
    });
    showToast(`Added ${order.items.length} items to your shopping cart!`, 'success');
    setActivePage('cart');
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    showToast('Tracking number copied to clipboard!');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Determine progress step index
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
      case 'Processing':
        return 1;
      case 'Shipped':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = activeOrder ? getStepIndex(activeOrder.orderStatus) : 0;

  const trackingSteps = [
    { title: 'Order Confirmed', desc: 'Order details verified & payment authorized' },
    { title: 'Packed & Inspected', desc: 'Quality checked & packed at Trivandrum Hub' },
    { title: 'In Transit', desc: 'Handed over to Fathima Express Courier' },
    { title: 'Out for Delivery', desc: 'Assigned to delivery agent for final leg' },
    { title: 'Delivered', desc: 'Delivered & signed by customer' },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-[88vh] py-10 sm:py-14 text-left">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#145A38] text-white flex items-center justify-center mx-auto shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202320] tracking-tight">
            Real-Time Order & Delivery Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#77766F]">
            Track your stationery shipment live on Google Maps with real-time delivery partner coordinates
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white border border-[#E9E5DE] rounded-3xl p-5 sm:p-7 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <label className="text-xs font-bold text-[#202320] block mb-1.5">
                  Order ID / Reference Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    placeholder="e.g. ORD-98214 or 98214"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#E9E5DE] rounded-xl text-xs sm:text-sm text-[#202320] outline-none focus:border-[#145A38] transition-all font-mono"
                  />
                  <Search className="w-4 h-4 text-[#145A38] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="sm:col-span-4">
                <button
                  type="submit"
                  className="w-full py-3 px-5 bg-[#145A38] hover:bg-[#0E4228] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </button>
              </div>
            </div>

            {/* Quick Select Recent Orders */}
            {orders && orders.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs text-[#77766F]">
                <span className="font-semibold text-[11px] text-[#202320]">Quick Select Recent Orders:</span>
                {orders.slice(0, 4).map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelectSampleOrder(ord)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                      activeOrder?.id === ord.id
                        ? 'bg-[#EFF4E6] border-[#145A38] text-[#145A38] font-bold'
                        : 'bg-white border-[#E9E5DE] text-[#202320] hover:border-[#145A38]'
                    }`}
                  >
                    #{ord.id} ({ord.orderStatus})
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Active Order Results View */}
        {activeOrder ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Status Banner Card */}
            <div className="bg-white border border-[#E9E5DE] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E9E5DE]">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-xs font-mono font-bold text-[#77766F] uppercase">Order Reference</span>
                    <span className="text-xs font-mono font-bold text-[#202320] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E9E5DE]">
                      #{activeOrder.id}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#145A38]/10 text-[#145A38] border border-[#145A38]/30 uppercase tracking-wider">
                      {activeOrder.orderStatus}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#202320] tracking-tight">
                    Estimated Delivery: {activeOrder.orderStatus === 'Delivered' ? 'Delivered Successfully' : activeOrder.estimatedDelivery || 'Today by 5:00 PM'}
                  </h2>
                  <p className="text-xs text-[#77766F] mt-1">
                    Placed on {activeOrder.date ? new Date(activeOrder.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recent'} • Payment: {activeOrder.paymentMethod} ({activeOrder.paymentStatus})
                  </p>
                </div>

                {/* Logistics Partner Info */}
                <div className="bg-[#FAF7F2] border border-[#E9E5DE] p-4 rounded-2xl space-y-1.5 text-xs shrink-0 min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#77766F] font-semibold text-[11px]">Courier Partner</span>
                    <span className="font-bold text-[#145A38]">{activeOrder.courierName || 'Fathima Express'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#77766F] font-semibold text-[11px]">Tracking No.</span>
                    <span className="font-mono font-bold text-[#202320]">{activeOrder.trackingNumber || `FE-${activeOrder.id.replace(/[^0-9]/g, '') || '98214'}`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(activeOrder.trackingNumber || `FE-${activeOrder.id.replace(/[^0-9]/g, '') || '98214'}`)}
                    className="w-full mt-1 py-1 px-2 bg-white border border-[#E9E5DE] hover:border-[#145A38] text-[10px] font-bold text-[#202320] rounded-lg text-center flex items-center justify-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3 h-3 text-[#145A38]" />
                    <span>{copiedTracking ? 'Copied!' : 'Copy Tracking Number'}</span>
                  </button>
                </div>
              </div>

              {/* LIVE GOOGLE MAPS DELIVERY BOY TRACKER */}
              {(activeOrder.orderStatus === 'Out for Delivery' || activeOrder.orderStatus === 'Shipped' || activeAssignment) && (
                <div className="mt-6 pt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <h3 className="text-xs font-bold text-[#202320] uppercase tracking-wider">
                        Live Delivery Partner Map Tracking
                      </h3>
                    </div>
                    {assignedWorker && (
                      <span className="text-xs font-bold text-[#145A38] bg-[#EFF4E6] px-3 py-1 rounded-full border border-[#145A38]/20 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        Agent: {assignedWorker.name} ({assignedWorker.vehicleType} • {assignedWorker.vehicleNumber})
                      </span>
                    )}
                  </div>

                  {/* Simulated Google Map Route Container */}
                  <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden border border-[#E9E5DE] bg-[#E5E9E0] shadow-inner flex items-center justify-center select-none">
                    
                    {/* Map Grid Vector Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#C8D2C0_1px,transparent_1px),linear-gradient(to_bottom,#C8D2C0_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
                    
                    {/* Simulated Route Polyline Vector */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <path d="M 80 180 Q 220 80 420 150 T 750 120" fill="none" stroke="#FFFFFF" strokeWidth="12" />
                      <path d="M 80 180 Q 220 80 420 150 T 750 120" fill="none" stroke="#145A38" strokeWidth="6" strokeDasharray="8 4" className="animate-pulse" />
                    </svg>

                    {/* Store Hub Marker */}
                    <div className="absolute left-8 bottom-12 z-10 flex flex-col items-center">
                      <div className="px-2 py-0.5 bg-white text-[#202320] border border-[#145A38] rounded-md text-[9px] font-bold shadow-xs mb-1">
                        Hub: Trivandrum Central
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#145A38] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                        H
                      </div>
                    </div>

                    {/* Delivery Boy Live Moving Marker */}
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-pulse">
                      <div className="px-3 py-1 bg-[#145A38] text-white rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center gap-1.5 mb-1">
                        <Truck className="w-3.5 h-3.5 text-amber-300" />
                        <span>{assignedWorker?.name || 'Rahul (Express)'} is 1.8 km away</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-amber-400/30">
                        <Truck className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Customer Destination Marker */}
                    <div className="absolute right-12 top-16 z-10 flex flex-col items-center">
                      <div className="px-2 py-0.5 bg-[#171717] text-white rounded-md text-[9px] font-bold shadow-xs mb-1">
                        Destination: {activeOrder.shippingAddress?.city || 'Customer Home'}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Floating Contact Agent Button */}
                    <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-xs border border-[#E9E5DE] rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#145A38] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          <Radio className="w-4 h-4 animate-spin" />
                        </div>
                        <div>
                          <p className="font-extrabold text-[#202320]">Delivery Agent Active</p>
                          <p className="text-[11px] text-[#77766F]">
                            ETA ~12 mins • Distance: 1.8 km remaining
                          </p>
                        </div>
                      </div>

                      <a
                        href={`tel:${assignedWorker?.phone || '+919845012345'}`}
                        className="px-3.5 py-1.5 bg-[#145A38] hover:bg-[#0E4228] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Agent</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Steps Timeline */}
              <div className="pt-8">
                <h3 className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-6">
                  Delivery Progress Timeline
                </h3>

                <div className="relative">
                  {/* Connecting Line */}
                  <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-[#E9E5DE] z-0">
                    <div
                      className="h-full bg-[#145A38] transition-all duration-700"
                      style={{ width: `${(currentStep / (trackingSteps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Step Circles */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 relative z-10">
                    {trackingSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.title} className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4 sm:gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-[#145A38] text-white shadow-xs'
                                : 'bg-white border-2 border-[#E9E5DE] text-[#77766F]'
                            } ${isCurrent ? 'ring-4 ring-[#EFF4E6] scale-110' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                          </div>

                          <div>
                            <h4 className={`text-xs font-bold ${isCompleted ? 'text-[#202320]' : 'text-[#77766F]'}`}>
                              {step.title}
                            </h4>
                            <p className="text-[10px] text-[#77766F] mt-0.5 leading-snug">
                              {step.desc}
                            </p>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-[#145A38] bg-[#EFF4E6] px-2 py-0.5 rounded-md uppercase">
                                Current Status
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Grid 2 Columns: Purchased Items & Delivery Address */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Order Items */}
              <div className="lg:col-span-7 bg-white border border-[#E9E5DE] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DE]">
                  <h3 className="text-sm font-bold text-[#202320] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#145A38]" />
                    <span>Order Items ({activeOrder.items.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleReorder(activeOrder)}
                    className="text-xs font-bold text-[#145A38] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reorder All
                  </button>
                </div>

                <div className="divide-y divide-[#E9E5DE]">
                  {activeOrder.items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="py-3.5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl border border-[#E9E5DE] bg-[#FAF7F2] overflow-hidden shrink-0 p-1">
                        <ProductImage
                          imageKey={item.image}
                          name={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#202320] truncate">{item.name}</h4>
                        <p className="text-[11px] text-[#77766F]">
                          Qty: <span className="font-semibold text-[#202320]">{item.quantity}</span> • ₹{item.price} each
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#202320] tabular-nums">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Cost Breakdown */}
                <div className="pt-4 border-t border-[#E9E5DE] space-y-2 text-xs">
                  <div className="flex justify-between text-[#77766F]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">₹{activeOrder.subtotal || activeOrder.total}</span>
                  </div>
                  <div className="flex justify-between text-[#77766F]">
                    <span>Shipping Fee</span>
                    <span className="text-[#145A38] font-semibold">{activeOrder.deliveryCharge ? `₹${activeOrder.deliveryCharge}` : 'FREE Express'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#202320] pt-2 border-t border-[#E9E5DE]">
                    <span>Total Amount Paid</span>
                    <span className="tabular-nums text-[#145A38]">₹{activeOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Address & Support */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Delivery Address Card */}
                {activeOrder.shippingAddress && (
                  <div className="bg-white border border-[#E9E5DE] rounded-3xl p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-[#202320] flex items-center gap-2 pb-2 border-b border-[#E9E5DE]">
                      <MapPin className="w-4 h-4 text-[#145A38]" />
                      <span>Shipping Address</span>
                    </h3>

                    <div className="text-xs space-y-1 text-[#202320]">
                      <p className="font-bold text-sm">{activeOrder.shippingAddress.fullName}</p>
                      <p>{activeOrder.shippingAddress.house}, {activeOrder.shippingAddress.street}</p>
                      <p>{activeOrder.shippingAddress.area}, {activeOrder.shippingAddress.city}</p>
                      <p>{activeOrder.shippingAddress.state} - <span className="font-mono font-bold">{activeOrder.shippingAddress.pinCode}</span></p>
                      <p className="pt-2 text-[11px] text-[#77766F] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#145A38]" />
                        <span>{activeOrder.shippingAddress.phone}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Need Help Card */}
                <div className="bg-[#EFF4E6] border border-[#145A38]/30 rounded-3xl p-6 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-[#145A38] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Need Help with this Delivery?</span>
                  </div>
                  <p className="text-[#202320] leading-relaxed">
                    Have questions about delivery time, address change, or product verification? Our Trivandrum support team is here to assist.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePage('contact')}
                    className="w-full py-2.5 px-4 bg-[#145A38] hover:bg-[#0E4228] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Contact Customer Support</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : hasSearched ? (
          <div className="bg-white border border-[#E9E5DE] rounded-3xl p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-[#202320]">Order Not Found</h3>
            <p className="text-xs text-[#77766F] max-w-sm mx-auto">
              We couldn't find any order matching "<strong className="text-[#202320]">{searchOrderId}</strong>". Please check your confirmation email or log in to view your orders.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (orders && orders.length > 0) {
                    setActiveOrder(orders[0]);
                    setSearchOrderId(orders[0].id);
                  }
                }}
                className="px-4 py-2 bg-[#145A38] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                View Latest Order
              </button>
              <button
                type="button"
                onClick={() => setActivePage('account')}
                className="px-4 py-2 bg-white border border-[#E9E5DE] text-[#202320] rounded-xl text-xs font-bold hover:bg-[#FAF7F2] cursor-pointer"
              >
                Go to My Account
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};
