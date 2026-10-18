import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  CreditCard,
  QrCode,
  Building,
  Banknote,
  ArrowRight,
  Lock,
  Timer,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod } from '../../types';

interface IndianPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onPaymentSuccess: (method: PaymentMethod) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'cod';
type UpiSubOption = 'gpay' | 'phonepe' | 'paytm' | 'vpa' | 'qr';

export const IndianPaymentGatewayModal: React.FC<IndianPaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName,
  customerPhone,
  customerEmail,
  onPaymentSuccess,
}) => {
  const { storeSettings, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiSubOption, setUpiSubOption] = useState<UpiSubOption>('gpay');

  // Automated UPI Payment State
  const [isProcessingUpi, setIsProcessingUpi] = useState(false);
  const [upiProcessingStep, setUpiProcessingStep] = useState<string>('');
  const [upiCountdown, setUpiCountdown] = useState(180); // 3 minutes timer like Flipkart
  const [customVpa, setCustomVpa] = useState('');
  const [vpaVerified, setVpaVerified] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('684129');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessingNetBanking, setIsProcessingNetBanking] = useState(false);

  // COD Captcha
  const [codCaptcha, setCodCaptcha] = useState(() => Math.floor(100 + Math.random() * 900).toString());
  const [codInput, setCodInput] = useState('');

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setIsProcessingUpi(false);
      setUpiProcessingStep('');
      setShowOtpModal(false);
      setCustomVpa('');
      setVpaVerified(false);
      setCodCaptcha(Math.floor(100 + Math.random() * 900).toString());
      setCodInput('');
    }
  }, [isOpen]);

  // Countdown timer for pending UPI request
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessingUpi && upiCountdown > 0) {
      timer = setInterval(() => {
        setUpiCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessingUpi, upiCountdown]);

  if (!isOpen) return null;

  const upiId = storeSettings?.upiId || 'fathimastores@oksbi';
  const merchantName = storeSettings?.upiMerchantName || 'FATHIMA STORES';

  // Format Countdown
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Card brand detector
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^(60|65|81|82)/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Card';
  };

  const formatCardInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  // Automated UPI Payment Flow (Flipkart/Amazon style)
  const triggerAutomatedUpiFlow = (appName: string, method: PaymentMethod) => {
    setIsProcessingUpi(true);
    setUpiCountdown(180);
    setUpiProcessingStep(`Requesting payment authorization from ${appName}...`);

    // Step 1: Initiated
    setTimeout(() => {
      setUpiProcessingStep(`Approve payment of ₹${amount} on your ${appName} app`);
    }, 1200);

    // Step 2: Auto-detect bank approval simulation (Flipkart/Amazon real-time polling)
    setTimeout(() => {
      setUpiProcessingStep('Payment approved by issuing bank! Placing order automatically...');
    }, 3200);

    // Step 3: Complete & place order automatically
    setTimeout(() => {
      showToast(`Payment of ₹${amount} verified via ${appName}!`, 'success');
      onPaymentSuccess(method);
    }, 4500);
  };

  const handleInstantUpiApproval = (method: PaymentMethod) => {
    setUpiProcessingStep('Payment verified! Placing your order...');
    setTimeout(() => {
      onPaymentSuccess(method);
    }, 600);
  };

  const handleVerifyCustomVpa = () => {
    if (!customVpa.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g., name@okhdfcbank)', 'error');
      return;
    }
    setVpaVerified(true);
    showToast(`Verified UPI VPA: ${customVpa}`, 'success');
  };

  // Card Submit -> Opens 3D Secure Bank OTP Modal
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      showToast('Please enter a valid 16-digit card number', 'error');
      return;
    }
    if (cardExpiry.length < 5) {
      showToast('Please enter card expiry in MM/YY format', 'error');
      return;
    }
    if (cardCvv.length < 3) {
      showToast('Please enter a valid 3-digit CVV', 'error');
      return;
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpValue('');
    setShowOtpModal(true);
  };

  // Submit Bank OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue !== generatedOtp && otpValue !== '123456') {
      showToast('Invalid OTP entered. Use the auto-fill button for simulation.', 'error');
      return;
    }

    setIsSubmittingOtp(true);
    setTimeout(() => {
      setIsSubmittingOtp(false);
      setShowOtpModal(false);
      showToast(`Payment of ₹${amount} confirmed by Bank!`, 'success');
      onPaymentSuccess('Card');
    }, 1200);
  };

  // NetBanking Submit
  const handleNetBankingPay = () => {
    setIsProcessingNetBanking(true);
    setTimeout(() => {
      setIsProcessingNetBanking(false);
      showToast(`Authenticated with ${selectedBank}! Order placed.`, 'success');
      onPaymentSuccess('NetBanking');
    }, 1500);
  };

  // COD Submit
  const handleCodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codInput.trim() !== codCaptcha) {
      showToast('Incorrect security verification code. Please check.', 'error');
      return;
    }
    onPaymentSuccess('COD');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Trust Badges */}
        <div className="px-6 py-4 bg-[#F7F8F3] border-b border-[#E8E8E3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#71883F] text-white flex items-center justify-center font-black text-sm shadow-xs">
              FS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#171717]">{merchantName}</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B6B]">UPI & Card Instant Checkout (Flipkart & Amazon Engine)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">Total Payable</span>
              <span className="text-base font-extrabold text-[#71883F] tabular-nums">₹{amount}</span>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessingUpi || isSubmittingOtp}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-[#E8E8E3]/60 transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Automated UPI Payment Waiting Screen */}
        {isProcessingUpi ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#EFF4E6] flex items-center justify-center text-[#71883F] animate-pulse">
                <Smartphone className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#71883F] text-white flex items-center justify-center text-xs shadow-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
            </div>

            <div className="space-y-1 max-w-md">
              <span className="text-xs font-bold text-[#71883F] uppercase tracking-wider">
                Automated Payment In Progress
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#171717] leading-tight">
                {upiProcessingStep}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Do not close or refresh this window. We will automatically place your order once payment is received.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs">
              <Timer className="w-4 h-4 text-amber-600" />
              <span className="text-[#6B6B6B]">Authorization Window:</span>
              <span className="font-mono font-bold text-[#171717] tabular-nums">
                {formatTimer(upiCountdown)}
              </span>
            </div>

            {/* Simulated instant confirmation buttons for easy testing */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={() =>
                  handleInstantUpiApproval(
                    upiSubOption === 'gpay'
                      ? 'UPI - Google Pay'
                      : upiSubOption === 'phonepe'
                      ? 'UPI - PhonePe'
                      : upiSubOption === 'paytm'
                      ? 'UPI - Paytm'
                      : 'UPI - QR'
                  )
                }
                className="w-full py-2.5 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Simulate Immediate Approval (Instant)
              </button>

              <button
                type="button"
                onClick={() => setIsProcessingUpi(false)}
                className="w-full py-2.5 px-4 bg-white border border-[#E8E8E3] hover:border-neutral-400 text-[#171717] rounded-xl text-xs font-semibold"
              >
                Change Payment Method
              </button>
            </div>
          </div>
        ) : (
          /* Normal Payment Selection Layout */
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Left Tabs (UPI, Cards, NetBanking, COD) */}
            <div className="w-full sm:w-56 bg-[#F7F8F3] border-b sm:border-b-0 sm:border-r border-[#E8E8E3] p-2 sm:p-3 space-y-1.5 shrink-0 overflow-x-auto sm:overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'upi'
                    ? 'bg-white text-[#71883F] shadow-xs border border-[#E8E8E3]'
                    : 'text-[#171717] hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#71883F]" />
                  <span>UPI / QR</span>
                </span>
                <span className="text-[9px] bg-[#EFF4E6] text-[#71883F] px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Fastest
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'card'
                    ? 'bg-white text-[#71883F] shadow-xs border border-[#E8E8E3]'
                    : 'text-[#171717] hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <span>Cards</span>
                </span>
                <span className="text-[10px] text-[#6B6B6B] font-mono">RuPay/Visa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'netbanking'
                    ? 'bg-white text-[#71883F] shadow-xs border border-[#E8E8E3]'
                    : 'text-[#171717] hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>Net Banking</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cod')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'cod'
                    ? 'bg-white text-[#71883F] shadow-xs border border-[#E8E8E3]'
                    : 'text-[#171717] hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Cash on Delivery</span>
                </span>
              </button>
            </div>

            {/* Right Content Body */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
              
              {/* TAB 1: UPI / GPAY / PHONEPE / QR */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#171717] flex items-center justify-between">
                      <span>UPI Instant Payment</span>
                      <span className="text-[11px] text-[#71883F] font-semibold">Zero Transaction Fee</span>
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Select your preferred UPI app for automated 1-click order placement.
                    </p>
                  </div>

                  {/* UPI Sub-Options Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setUpiSubOption('gpay')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        upiSubOption === 'gpay'
                          ? 'border-[#71883F] bg-[#EFF4E6]/40 ring-1 ring-[#71883F]'
                          : 'border-[#E8E8E3] hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-white shadow-2xs flex items-center justify-center font-bold text-xs text-sky-600 border border-[#E8E8E3]">
                        G
                      </div>
                      <span className="text-xs font-bold text-[#171717] block">Google Pay</span>
                      <span className="text-[9px] text-[#71883F] font-semibold">1-Tap Intent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpiSubOption('phonepe')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        upiSubOption === 'phonepe'
                          ? 'border-[#71883F] bg-[#EFF4E6]/40 ring-1 ring-[#71883F]'
                          : 'border-[#E8E8E3] hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        पे
                      </div>
                      <span className="text-xs font-bold text-[#171717] block">PhonePe</span>
                      <span className="text-[9px] text-purple-700 font-semibold">Direct UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpiSubOption('qr')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        upiSubOption === 'qr'
                          ? 'border-[#71883F] bg-[#EFF4E6]/40 ring-1 ring-[#71883F]'
                          : 'border-[#E8E8E3] hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#171717] block">Scan QR</span>
                      <span className="text-[9px] text-[#6B6B6B]">Any UPI App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpiSubOption('vpa')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        upiSubOption === 'vpa'
                          ? 'border-[#71883F] bg-[#EFF4E6]/40 ring-1 ring-[#71883F]'
                          : 'border-[#E8E8E3] hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 font-mono text-xs">
                        @
                      </div>
                      <span className="text-xs font-bold text-[#171717] block">UPI ID</span>
                      <span className="text-[9px] text-[#6B6B6B]">Enter VPA</span>
                    </button>
                  </div>

                  {/* Sub-Option Details */}
                  {upiSubOption === 'gpay' && (
                    <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center shadow-2xs font-black text-sky-600 text-lg">
                          G
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#171717]">Google Pay One-Tap Auto Placement</h5>
                          <p className="text-[11px] text-[#6B6B6B]">
                            Instant intent request sent to Google Pay. Order auto-places on verification.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B]">Linked Account:</span>
                        <span className="font-semibold text-[#171717]">{customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerAutomatedUpiFlow('Google Pay', 'UPI - Google Pay')}
                        className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                      >
                        <span className="w-4 h-4 rounded-full bg-white text-[#1a73e8] font-bold text-[10px] flex items-center justify-center">G</span>
                        Pay ₹{amount} with Google Pay
                      </button>
                    </div>
                  )}

                  {upiSubOption === 'phonepe' && (
                    <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#5f259f] text-white flex items-center justify-center shadow-2xs font-bold text-lg">
                          पे
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#171717]">PhonePe Direct UPI Checkout</h5>
                          <p className="text-[11px] text-[#6B6B6B]">
                            Authorizes directly through PhonePe application with automated webhook response.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#E8E8E3] rounded-xl flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B]">Customer Mobile:</span>
                        <span className="font-semibold text-[#171717]">{customerPhone || '+91 98450 12345'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerAutomatedUpiFlow('PhonePe', 'UPI - PhonePe')}
                        className="w-full py-3 bg-[#5f259f] hover:bg-[#4d1e82] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                      >
                        Pay ₹{amount} via PhonePe
                      </button>
                    </div>
                  )}

                  {upiSubOption === 'qr' && (
                    <div className="p-5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                      {/* Realistic dynamic UPI QR SVG */}
                      <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-[#E8E8E3] shadow-xs flex flex-col items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Corner Squares */}
                          <rect x="5" y="5" width="28" height="28" fill="#171717" rx="3" />
                          <rect x="11" y="11" width="16" height="16" fill="white" rx="1" />
                          <rect x="15" y="15" width="8" height="8" fill="#171717" rx="1" />

                          <rect x="67" y="5" width="28" height="28" fill="#171717" rx="3" />
                          <rect x="73" y="11" width="16" height="16" fill="white" rx="1" />
                          <rect x="77" y="15" width="8" height="8" fill="#171717" rx="1" />

                          <rect x="5" y="67" width="28" height="28" fill="#171717" rx="3" />
                          <rect x="11" y="73" width="16" height="16" fill="white" rx="1" />
                          <rect x="15" y="77" width="8" height="8" fill="#171717" rx="1" />

                          {/* Pattern Blocks */}
                          <rect x="38" y="8" width="6" height="12" fill="#171717" />
                          <rect x="48" y="12" width="14" height="6" fill="#171717" />
                          <rect x="40" y="24" width="8" height="14" fill="#71883F" />
                          <rect x="52" y="24" width="10" height="8" fill="#171717" />
                          <rect x="8" y="38" width="14" height="6" fill="#171717" />
                          <rect x="26" y="38" width="8" height="12" fill="#171717" />
                          <rect x="38" y="44" width="24" height="12" fill="#171717" />
                          <rect x="66" y="38" width="12" height="6" fill="#171717" />
                          <rect x="82" y="44" width="10" height="14" fill="#171717" />
                          <rect x="38" y="62" width="12" height="10" fill="#171717" />
                          <rect x="54" y="62" width="8" height="20" fill="#71883F" />
                          <rect x="66" y="58" width="14" height="12" fill="#171717" />
                          <rect x="84" y="62" width="8" height="12" fill="#171717" />
                          <rect x="38" y="78" width="12" height="14" fill="#171717" />
                          <rect x="68" y="76" width="24" height="16" fill="#171717" />
                        </svg>
                        <span className="text-[9px] font-bold text-[#71883F] mt-1 tracking-tight">SCAN & PAY ₹{amount}</span>
                      </div>

                      <div className="space-y-2 text-left flex-1 min-w-0">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block">
                          Active Dynamic QR Code
                        </span>
                        <h5 className="text-xs font-bold text-[#171717]">Scan with any Indian UPI App</h5>
                        <p className="text-[11px] text-[#6B6B6B]">
                          Open Google Pay, PhonePe, Paytm, or BHIM. Scan QR to authorize payment.
                        </p>
                        
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(upiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                              showToast('UPI ID copied to clipboard');
                            }}
                            className="px-2.5 py-1 bg-white border border-[#E8E8E3] rounded-lg text-[11px] font-mono text-[#171717] flex items-center gap-1.5 hover:border-[#71883F]"
                          >
                            <span>{upiId}</span>
                            {copiedUpi ? <Check className="w-3 h-3 text-[#71883F]" /> : <Copy className="w-3 h-3 text-[#6B6B6B]" />}
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => triggerAutomatedUpiFlow('UPI QR Scan', 'UPI - QR')}
                            className="w-full py-2.5 px-4 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Simulate Scan & Auto Place Order
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {upiSubOption === 'vpa' && (
                    <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-3">
                      <label className="text-xs font-semibold text-[#171717] block">
                        Enter any UPI ID / VPA
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customVpa}
                          onChange={(e) => {
                            setCustomVpa(e.target.value);
                            setVpaVerified(false);
                          }}
                          placeholder="e.g. mobile@paytm or yourname@oksbi"
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCustomVpa}
                          className="px-4 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] text-xs font-semibold rounded-xl text-[#171717]"
                        >
                          Verify
                        </button>
                      </div>

                      {/* Quick handle pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-[#6B6B6B]">Quick handles:</span>
                        {['@okhdfcbank', '@oksbi', '@ybl', '@paytm'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              const prefix = customVpa.split('@')[0] || (customerPhone ? customerPhone.slice(-10) : '9845012345');
                              setCustomVpa(`${prefix}${handle}`);
                              setVpaVerified(true);
                            }}
                            className="px-2 py-0.5 bg-white border border-[#E8E8E3] rounded-md text-[#171717] hover:border-[#71883F]"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerAutomatedUpiFlow(`UPI (${customVpa || 'VPA'})`, 'Online')}
                        className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        Verify & Pay ₹{amount}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: CREDIT / DEBIT CARDS */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">Credit / Debit Card</h4>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Supports RuPay, Visa, MasterCard, Maestro and American Express cards.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#171717]">Card Number</label>
                        <span className="text-[10px] font-bold text-[#71883F] bg-white px-2 py-0.5 rounded border border-[#E8E8E3]">
                          {getCardBrand(cardNumber)}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                          placeholder="4532 8901 2345 6789"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-mono tracking-wider"
                        />
                        <CreditCard className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#171717] block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                          placeholder="12/28"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-mono text-center"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#171717] block mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-mono text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#171717] block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                      />
                    </div>

                    {/* Quick Demo Fill Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('4532 8901 2345 6789');
                          setCardExpiry('12/28');
                          setCardCvv('789');
                          setCardHolder(customerName || 'Test Cardholder');
                        }}
                        className="text-[11px] text-[#71883F] font-semibold hover:underline"
                      >
                        ⚡ Autofill Sample RuPay/Visa Card
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" /> Proceed to Bank OTP Verification (₹{amount})
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: NETBANKING */}
              {activeTab === 'netbanking' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">Net Banking</h4>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Select your Indian retail banking portal for automated debit clearance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: 'State Bank of India', code: 'SBI' },
                      { name: 'HDFC Bank', code: 'HDFC' },
                      { name: 'ICICI Bank', code: 'ICICI' },
                      { name: 'Axis Bank', code: 'AXIS' },
                      { name: 'Kotak Mahindra', code: 'KOTAK' },
                      { name: 'Punjab National Bank', code: 'PNB' },
                    ].map((bank) => (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedBank === bank.name
                            ? 'border-[#71883F] bg-[#EFF4E6]/50 ring-1 ring-[#71883F]'
                            : 'border-[#E8E8E3] hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#F7F8F3] border border-[#E8E8E3] text-[#171717] font-bold text-[10px] flex items-center justify-center mx-auto mb-1">
                          {bank.code}
                        </span>
                        <span className="text-xs font-semibold text-[#171717] block truncate">
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingNetBanking}
                    onClick={handleNetBankingPay}
                    className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isProcessingNetBanking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing with {selectedBank}...
                      </>
                    ) : (
                      <>
                        Pay ₹{amount} via {selectedBank} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 4: CASH ON DELIVERY */}
              {activeTab === 'cod' && (
                <form onSubmit={handleCodSubmit} className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">Cash on Delivery (Doorstep Verification)</h4>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Pay cash or scan courier UPI QR when your order arrives.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <span className="font-bold">Flipkart-Style Confirmation:</span>
                        <p className="text-[11px] mt-0.5">
                          Please enter the 3-digit security captcha below to confirm your delivery address and book dispatch.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2.5 bg-neutral-900 text-white font-mono text-base font-bold tracking-widest rounded-xl select-none">
                        {codCaptcha}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          maxLength={3}
                          value={codInput}
                          onChange={(e) => setCodInput(e.target.value)}
                          placeholder="Type code here"
                          className="w-full px-3 py-2.5 text-xs bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] font-mono tracking-widest text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setCodCaptcha(Math.floor(100 + Math.random() * 900).toString())}
                        className="p-2.5 bg-white border border-[#E8E8E3] rounded-xl hover:border-[#71883F]"
                        title="Change Captcha"
                      >
                        <RefreshCw className="w-4 h-4 text-[#6B6B6B]" />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      Confirm Order with Cash on Delivery (₹{amount})
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

        {/* Footer Security Badges */}
        <div className="px-6 py-3 bg-[#F7F8F3] border-t border-[#E8E8E3] flex flex-wrap items-center justify-between text-[11px] text-[#6B6B6B]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#71883F]" /> 256-Bit SSL Encryption
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#71883F]" /> NPCI & RBI Compliant
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">Powered by Razorpay / Indian Payment Gateway</span>
        </div>

      </div>

      {/* 3D SECURE BANK OTP MODAL (Realistic Simulator) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden p-6 space-y-4 animate-in zoom-in-95 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
              <div>
                <h4 className="font-bold text-xs text-[#171717]">State Bank of India / HDFC 3D Secure</h4>
                <p className="text-[10px] text-[#6B6B6B]">Verified by VISA / RuPay SecureCode</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-xs text-[#6B6B6B] hover:text-[#171717]"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[#171717]">
                A One-Time Password (OTP) has been sent to your registered mobile number{' '}
                <span className="font-bold text-[#171717]">{customerPhone ? `******${customerPhone.slice(-4)}` : '******8912'}</span>.
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                Merchant: <span className="font-semibold text-[#171717]">{merchantName}</span> · Amount:{' '}
                <span className="font-bold text-[#71883F]">₹{amount}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#171717]">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setOtpValue(generatedOtp)}
                    className="text-[10px] font-bold text-[#71883F] hover:underline"
                  >
                    ⚡ Auto-fill OTP ({generatedOtp})
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 684129"
                  className="w-full px-3 py-2.5 text-center font-mono text-base tracking-widest bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOtp}
                className="w-full py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isSubmittingOtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying with Issuing Bank...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit OTP & Complete Order
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
