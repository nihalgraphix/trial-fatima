import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CreditCard,
  Banknote,
  Lock,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { ShippingAddress, PaymentMethod } from '../../types';
import { IndianPaymentGatewayModal } from './IndianPaymentGatewayModal';
import { GoogleMapAddressPicker } from './GoogleMapAddressPicker';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartDeliveryCharge,
    cartTotal,
    placeOrder,
    setActivePage,
    setSelectedOrderId,
    currentUser,
    showToast,
  } = useStore();

  // Pre-fill from current user if available
  const defaultAddress = currentUser?.addresses[0];

  const [fullName, setFullName] = useState(currentUser?.name || defaultAddress?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || defaultAddress?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || defaultAddress?.phone || '');
  const [house, setHouse] = useState(defaultAddress?.house || '');
  const [street, setStreet] = useState(defaultAddress?.street || '');
  const [area, setArea] = useState(defaultAddress?.area || '');
  const [city, setCity] = useState(defaultAddress?.city || 'Bengaluru');
  const [district, setDistrict] = useState(defaultAddress?.district || 'Bengaluru Urban');
  const [state, setState] = useState(defaultAddress?.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(defaultAddress?.pinCode || '560001');

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !fullName) setFullName(currentUser.name);
      if (currentUser.email && !email) setEmail(currentUser.email);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
      if (currentUser.addresses[0]) {
        const addr = currentUser.addresses[0];
        setHouse(addr.house || '');
        setStreet(addr.street || '');
        setArea(addr.area || '');
        setCity(addr.city || 'Bengaluru');
        setDistrict(addr.district || 'Bengaluru Urban');
        setState(addr.state || 'Karnataka');
        setPinCode(addr.pinCode || '560001');
      }
    }
  }, [currentUser]);

  const [deliveryMethod, setDeliveryMethod] = useState<string>('Standard Delivery (2-4 Days)');
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-[#171717]">No items to checkout</h2>
        <p className="text-xs text-[#6B6B6B] mt-1">Please add stationery items to your cart first.</p>
        <button
          onClick={() => setActivePage('shop')}
          className="mt-4 px-5 py-2 text-xs font-semibold text-white bg-[#71883F] rounded-lg cursor-pointer"
        >
          Browse Shop
        </button>
      </div>
    );
  }

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim() || !house.trim() || !pinCode.trim()) {
      showToast('Please complete all required shipping address fields.', 'error');
      return;
    }

    setShowPaymentModal(true);
  };

  const executeOrderPlacement = async (chosenPayment: PaymentMethod) => {
    setIsProcessing(true);

    const shippingAddress: ShippingAddress = {
      fullName,
      phone,
      email,
      house,
      street,
      area,
      city,
      district,
      state,
      pinCode,
      isDefault: true,
    };

    try {
      const order = await placeOrder({
        customerName: fullName,
        email,
        phone,
        shippingAddress,
        paymentMethod: chosenPayment,
        deliveryMethod,
      });

      setIsProcessing(false);
      setShowPaymentModal(false);
      setSelectedOrderId(order.id);
      setActivePage('order-success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error placing order:", error);
      setIsProcessing(false);
      showToast("Failed to place order. Please try again.", "error");
    }
  };


  return (
    <div className="bg-[#F7F8F3] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight text-left">
            Checkout & Shipping
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1 text-left">
            Complete your order with secure doorstep delivery.
          </p>
        </div>

        <form onSubmit={handlePlaceOrderSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 Cols: Form Sections */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Section 1: Customer Contact Information */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs text-left">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center text-xs font-bold">1</span>
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Amina Fathima"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. amina@example.com"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-[#171717] block mb-1">
                      Phone Number (for SMS & Delivery Courier) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 94471 88990"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Address & Google Maps Selection */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4 text-left">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center text-xs font-bold">2</span>
                  Delivery Address
                </h3>

                <GoogleMapAddressPicker
                  initialAddress={{
                    fullName,
                    phone,
                    email,
                    house,
                    street,
                    area,
                    city,
                    district,
                    state,
                    pinCode,
                  }}
                  onAddressSelect={(addr) => {
                    if (addr.house) setHouse(addr.house);
                    if (addr.street) setStreet(addr.street);
                    if (addr.area) setArea(addr.area);
                    if (addr.city) setCity(addr.city);
                    if (addr.district) setDistrict(addr.district);
                    if (addr.state) setState(addr.state);
                    if (addr.pinCode) setPinCode(addr.pinCode);
                    if (addr.fullName && !fullName) setFullName(addr.fullName);
                    if (addr.phone && !phone) setPhone(addr.phone);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-[#171717] block mb-1">
                      Flat / House No. / Building Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={house}
                      onChange={(e) => setHouse(e.target.value)}
                      placeholder="e.g. Flat 302, Green Meadows"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      Street / Road
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 5th Main Road"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      Area / Locality / Landmark
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Near St. Mary's School"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#171717] block mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="6 digits PIN"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Delivery Options */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs text-left">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center text-xs font-bold">3</span>
                  Shipping Method
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-colors border-[#71883F] bg-[#EFF4E6]/40">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod.includes('Standard')}
                        onChange={() => setDeliveryMethod('Standard Delivery (2-4 Days)')}
                        className="accent-[#71883F]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#171717]">Standard Delivery</p>
                        <p className="text-[11px] text-[#6B6B6B]">Estimated 2 to 4 business days</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#71883F]">
                      {cartDeliveryCharge === 0 ? 'FREE' : `₹${cartDeliveryCharge}`}
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 4: Payment Method */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs text-left">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center text-xs font-bold">4</span>
                  Payment Method
                </h3>

                <div className="space-y-3">
                  {/* Online Payment */}
                  <label
                    className={`flex items-start justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'Online'
                        ? 'border-[#71883F] bg-[#EFF4E6]/40'
                        : 'border-[#E8E8E3] hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'Online'}
                        onChange={() => setPaymentMethod('Online')}
                        className="accent-[#71883F] mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#171717]">Online Payment (UPI, Cards, NetBanking)</p>
                          <span className="text-[10px] bg-[#EFF4E6] text-[#71883F] px-1.5 py-0.5 rounded font-semibold">Recommended</span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                          Pay instantly via UPI, RuPay, Visa, Mastercard, or Net Banking.
                        </p>
                      </div>
                    </div>
                    <CreditCard className="w-4 h-4 text-[#71883F] shrink-0" />
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-start justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'COD'
                        ? 'border-[#71883F] bg-[#EFF4E6]/40'
                        : 'border-[#E8E8E3] hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="accent-[#71883F] mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#171717]">Cash on Delivery (COD)</p>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                          Pay by cash or UPI QR code when courier arrives at your doorstep.
                        </p>
                      </div>
                    </div>
                    <Banknote className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                  </label>
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Order Summary & Place Order */}
            <div className="lg:col-span-4 space-y-4 sticky top-24 text-left">
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider pb-3 border-b border-[#E8E8E3]">
                  Order Items ({cart.length})
                </h3>

                {/* Compact item list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-[#E8E8E3]">
                  {cart.map((item, idx) => (
                    <div key={`${item.product.id}-${idx}`} className="pt-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-[#171717] truncate">{item.product.name}</p>
                        <p className="text-[11px] text-[#6B6B6B]">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-[#171717] tabular-nums shrink-0">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-3 border-t border-[#E8E8E3] text-xs text-[#6B6B6B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#171717] tabular-nums">₹{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-[#171717] tabular-nums">
                      {cartDeliveryCharge === 0 ? (
                        <span className="text-[#71883F]">FREE</span>
                      ) : (
                        `₹${cartDeliveryCharge}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#171717] pt-2 border-t border-[#E8E8E3]">
                    <span>Total Payable</span>
                    <span className="text-[#71883F] tabular-nums">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#71883F] hover:bg-[#5F7334] rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    'Processing Order...'
                  ) : paymentMethod === 'Online' ? (
                    <>
                      Pay ₹{cartTotal} Online <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Confirm Order (Cash on Delivery) <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B6B6B] pt-1">
                  <Lock className="w-3 h-3 text-[#71883F]" />
                  <span>Encrypted 256-Bit SSL Checkout</span>
                </div>
              </div>
            </div>

          </div>
        </form>

        <IndianPaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={cartTotal}
          customerName={fullName}
          customerPhone={phone}
          customerEmail={email}
          onPaymentSuccess={(chosenMethod) => {
            executeOrderPlacement(chosenMethod);
          }}
        />

      </div>
    </div>
  );
};
