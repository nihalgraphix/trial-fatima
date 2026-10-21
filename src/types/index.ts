export interface ProductOffer {
  active: boolean;
  type: 'discount' | 'bogo' | 'flat' | 'combo' | 'cashback' | 'custom';
  title: string;
  badgeText?: string;
  description?: string;
  discountPct?: number;
  flatDiscount?: number;
  couponCode?: string;
  validUntil?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  discount: number; // percentage e.g. 20
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  tags: string[];
  specs: Record<string, string>;
  createdAt: string;
  colorScheme?: string;
  badge?: string;
  showBadge?: boolean;
  showDiscountBadge?: boolean;
  offer?: ProductOffer;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  image: string;
  iconName: string;
  color: string;
  featured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  house: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentMethod =
  | 'COD'
  | 'Online'
  | 'UPI - Google Pay'
  | 'UPI - PhonePe'
  | 'UPI - Paytm'
  | 'UPI - QR'
  | 'Card'
  | 'NetBanking'
  | string;
export type PaymentStatus = 'Pending' | 'Paid' | 'Partial' | 'Failed' | 'Refunded';

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  utrNumber?: string;
  gatewayName?: string;
  payerInfo?: string;
  autoVerified?: boolean;
  recordedBy: string;
  type: 'advance' | 'installment' | 'final' | 'refund';
  notes?: string;
}

export interface OnlinePaymentDetails {
  transactionId: string;
  utrNumber: string;
  gatewayName: string;
  method: PaymentMethod;
  payerInfo?: string;
  paidAt: string;
  autoVerified: boolean;
}

export interface DeliveryTimelineStep {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  mrp?: number;
  discountPrice?: number;
  quantity: number;
  image: string;
  brand?: string;
  sku?: string;
  product?: Product;
}

export interface Order {
  id: string;
  userId?: string;
  date: string;
  createdAt?: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: ShippingAddress;
  deliveryMethod: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  prepaidDiscount?: number;
  codFee?: number;
  couponCode?: string;
  deliveryCharge: number;
  total: number;
  finalTotal?: number;
  totalAmount?: number;
  BalanceAmount?: number;
  estimatedDelivery: string;
  trackingNumber: string;
  courierName?: string;
  paidAmount?: number;
  outstandingBalance?: number;
  transactionId?: string;
  utrNumber?: string;
  paymentGateway?: string;
  paymentRecords?: PaymentRecord[];
  deliveryTimeline?: DeliveryTimelineStep[];
  returnRequested?: boolean;
  returnReason?: string;
  returnStatus?: 'None' | 'Requested' | 'Approved' | 'Rejected' | 'Refunded';
  paymentVerified?: boolean;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  isArchived?: boolean;
  assignedDeliveryId?: string;
  assignedDeliveryName?: string;
  assignedDeliveryPhone?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    address?: string;
    updatedAt?: string;
  };
  deliveryNotes?: string;
  priority?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Rent' | 'Marketing' | 'Packaging & Shipping' | 'Supplier / Inventory' | 'Payment Gateway Fees' | 'Utilities' | 'Salaries' | 'Other';
  amount: number;
  date: string;
  description?: string;
  reference?: string;
  receiptUrl?: string;
  recordedBy?: string;
}

export interface SupportMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'support';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface SupportThread {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  orderId?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  assignedTo?: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  changeQty: number;
  previousStock: number;
  newStock: number;
  reason: 'Supplier Inward' | 'Damaged / Expired' | 'Physical Count Audit' | 'Order Cancellation Restock' | 'Manual Correction';
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'delivery';
  isDriver?: boolean;
  addresses: ShippingAddress[];
  createdAt: string;
  avatar?: string;
  photoURL?: string;
  
  bio?: string;
  city?: string;
  state?: string;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: string;
  bgTone?: string;
  overlay?: 'light' | 'dark' | 'gradient' | 'none';
  overlayOpacity?: number;
  active: boolean;
  order: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  productName: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  reviewTitle?: string;
  tags?: string[];
  pros?: string;
  recommend?: boolean;
  helpfulCount?: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'hidden';
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10% or 50 for ₹50
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  description: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  discountText: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  active: boolean;
  bgTone: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'stock' | 'customer' | 'review';
  read: boolean;
  userId?: string;
  userEmail?: string;
  orderId?: string;
  target?: 'all' | 'user' | 'admin' | 'customer';
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  storeHubName?: string;
  storeLandmark?: string;
  storePincode?: string;
  storeLat?: number;
  storeLng?: number;
  storeCity?: string;
  storeState?: string;
  storePinCode?: string;
  deliveryRadiusKm?: number;
  maxDeliveryRadiusKm?: number;
  googleMapsLink?: string;
  whatsappNumber?: string;
  currency: string;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  gstNumber: string;
  upiId: string;
  upiMerchantName: string;
  enableOnlinePayments?: boolean;
  enableOnlinePayment?: boolean;
  enableUpiPayment?: boolean;
  enableCardPayment?: boolean;
  enableNetBankingPayment?: boolean;
  enableCodPayment?: boolean;
  enableGPay: boolean;
  enablePhonePe: boolean;
  enablePaytm: boolean;
  enableUpiQr?: boolean;
  enableCards?: boolean;
  enableNetBanking?: boolean;
  enableCOD: boolean;
  autoVerifyOnlinePayments?: boolean;
  autoVerifyOnlinePayment?: boolean;
  autoConfirmPaidOrders?: boolean;
  autoSendPaymentReceipt?: boolean;
  autoGeneratePaymentReceipt?: boolean;
  autoRefundOnCancel?: boolean;
  prepaidDiscountPct?: number;
  onlinePaymentDiscountPercent?: number;
  codHandlingFee?: number;
  codExtraFee?: number;
  paymentGatewayProvider?: 'Razorpay' | 'PhonePe PG' | 'Paytm PG' | 'Cashfree' | 'Direct NPCI UPI' | 'PayU' | 'Stripe India';
  paymentGatewayMode?: 'live' | 'test' | 'live_auto' | 'test_sandbox';
  razorpayKeyId?: string;
  merchantBankName?: string;
  merchantAccountLast4?: string;

  // Announcement Bar Customization
  showAnnouncement: boolean;
  announcementText: string;

  // Hero Section Customization
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroButtonText: string;
  heroButtonTarget: string;
  heroTrustText: string;

  // Home Section Visibility & Headings
  showHeroSection: boolean;
  showCategoryCircles: boolean;
  showHomeFilters: boolean;
  showBestSellers: boolean;
  bestSellersTitle: string;
  bestSellersSubtitle: string;
  showPromoBanner: boolean;
  promoTitle: string;
  promoSubtitle: string;
  promoBadge: string;
  promoButtonText: string;
  promoBgImage?: string;
  promoBgTone?: string;
  promoBgOverlay?: 'light' | 'dark' | 'gradient' | 'none';
  promoBgOpacity?: number;
  showNewArrivals: boolean;
  newArrivalsTitle: string;
  newArrivalsSubtitle: string;
  showBenefits: boolean;
  showReviews: boolean;
  showProductBadges: boolean;

  // Accent Colors Customization
  accentColor: string;
  accentColorHover?: string;
  accentColorLight?: string;

  // Home Landing Page Background Customization
  homeBgType?: 'default' | 'color' | 'image' | 'gradient' | 'pattern';
  homeBgImage?: string;
  homeBgColor?: string;
  homeBgOverlay?: 'light' | 'dark' | 'gradient' | 'none';
  homeBgOpacity?: number;

  // Hero Section Background Customization
  heroBgType?: 'default' | 'color' | 'image' | 'gradient';
  heroBgImage?: string;
  heroBgColor?: string;
  heroBgOverlay?: 'light' | 'dark' | 'gradient' | 'none';
  heroBgOpacity?: number;

  // Modern Minimal Customization & Features
  fontFamily?: 'Plus Jakarta Sans' | 'Inter' | 'Space Grotesk' | 'Playfair Display';
  borderRadiusMode?: 'sharp' | 'rounded' | 'soft';
  storeThemeMode?: 'white' | 'cream' | 'linen' | 'dark';
  enableWhatsAppSupport?: boolean;
  whatsAppNumber?: string;
  whatsAppGreeting?: string;
  showQuickView?: boolean;
  showLowStockAlert?: boolean;
  lowStockThreshold?: number;
  socialInstagram?: string;
  socialFacebook?: string;
  socialWhatsApp?: string;

  // Hero Slider Customization
  heroSlides?: HeroSlide[];
  heroSliderAutoplay?: boolean;
  heroSliderInterval?: number;

  // Logo & Branding Customization
  logoType?: 'text' | 'image' | 'both';
  logoUrl?: string;
  logoHeight?: number;
  faviconUrl?: string;

  // Text & Copy Customization for Entire Store
  brandTagline?: string;
  searchPlaceholder?: string;
  footerAboutText?: string;
  footerCopyrightText?: string;
  storeAddress?: string;
  storeWorkingHours?: string;
  benefit1Title?: string;
  benefit1Desc?: string;
  benefit2Title?: string;
  benefit2Desc?: string;
  benefit3Title?: string;
  benefit3Desc?: string;
  benefit4Title?: string;
  benefit4Desc?: string;
  categorySectionTitle?: string;
  categorySectionSubtitle?: string;
  newArrivalsSectionTitle?: string;
  newArrivalsSectionSubtitle?: string;
  whyChooseTitle?: string;
  whyChooseSubtitle?: string;
  reviewsSectionTitle?: string;
  reviewsSectionSubtitle?: string;
  liveSupportTitle?: string;
  liveSupportGreeting?: string;

  // Admin customer overrides & removals
  customVipEmails?: string[];
  customAdminEmails?: string[];
  customDriverEmails?: string[];
  customDriverIds?: string[];
  removedDriverEmails?: string[];
  removedDriverIds?: string[];
  removedCustomerEmails?: string[];
  removedCustomerIds?: string[];
  removedCategoryIds?: string[];
  removeFirstCategoryButton?: boolean;

  // Automated Inventory Email Alerts Settings
  enableStockEmailAlerts?: boolean;
  adminStockAlertEmail?: string;
  isDemoDataSeeded?: boolean;
}

export interface EmailAlertRecord {
  id: string;
  type: 'low_stock_email' | 'out_of_stock_email' | 'order_confirmation' | 'order_status_update';
  recipientEmail: string;
  productId?: string;
  productName?: string;
  sku?: string;
  currentStock?: number;
  threshold?: number;
  orderId?: string;
  orderStatus?: string;
  subject: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
  addressFormatted?: string;
  placeId?: string;
}

export interface DeliveryPersonnel {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'Bike' | 'Scooter' | 'E-Bike' | 'Van' | 'Cycle';
  vehicleNumber: string;
  status: 'available' | 'busy' | 'offline' | 'Available' | 'On Delivery' | 'Offline';
  rating: number;
  totalDeliveries: number;
  failedDeliveries?: number;
  avgCompletionMinutes?: number;
  onTimeRatePct?: number;
  satisfactionReviewsCount?: number;
  completedOrdersCount?: number;
  currentLat?: number;
  currentLng?: number;
  lat?: number;
  lng?: number;
  currentLocation?: string;
  area?: string;
  lastUpdatedLocation?: string;
  avatar?: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  assignedAt: string;
  status: 'Assigned' | 'Accepted' | 'Arrived_at_Pickup' | 'Picked_Up' | 'Picked Up' | 'In Transit' | 'Out_for_Delivery' | 'Delivered' | 'Failed';
  pickupAddress: string;
  dropAddress: ShippingAddress;
  deliveryNotes?: string;
  otpCode?: string;
  proofPhotoUrl?: string;
  signatureName?: string;
  completedAt?: string;
  failureReason?: string;
  currentLocation?: GeoCoordinates;
  estimatedMinutes?: number;
  actualCompletionMinutes?: number;
  onTimeStatus?: 'on_time' | 'delayed' | 'early';
  customerRating?: number;
  customerFeedback?: string;
  ratedAt?: string;
}

export interface LoyaltyAccount {
  userId: string;
  pointsBalance: number;
  totalEarned: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  referralCode: string;
  referralsCount: number;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId?: string;
  points: number;
  type: 'earned' | 'redeemed' | 'bonus' | 'referral';
  description: string;
  date: string;
}

export interface HomepageSectionConfig {
  id: string;
  type: 'hero' | 'benefits' | 'categories' | 'best_sellers' | 'promo_banner' | 'new_arrivals' | 'why_us' | 'reviews';
  title: string;
  enabled: boolean;
  order: number;
}

export type ActivePage =
  | 'home'
  | 'shop'
  | 'categories'
  | 'product-details'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'account'
  | 'wishlist'
  | 'contact'
  | 'about'
  | 'login'
  | 'register'
  | 'profile'
  | 'order-tracking'
  | 'admin'
  | 'admin-login'
  | 'delivery'
  | 'delivery-portal'
  | 'delivery-login';


export interface CustomerMessage {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "unread" | "read" | "replied" | "archived";
  replyNotes?: string;
}
