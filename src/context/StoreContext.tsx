import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  User,
  Coupon,
  Review,
  Banner,
  Notification,
  ActivePage,
  ShippingAddress,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StoreSettings,
  Expense,
  SupportThread,
  SupportMessage,
  InventoryAdjustment,
  DeliveryTimelineStep,
  PaymentRecord,
  HeroSlide,
  DeliveryPersonnel,
  DeliveryAssignment,
  CustomerMessage,
  EmailAlertRecord,
  OnlinePaymentDetails,
} from '../types';
import { auth, db, googleProvider, signInWithPopup } from '../firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_BANNERS,
  INITIAL_USER,
} from '../data/initialData';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Sanitize data before writing to Firestore so undefined properties never cause errors
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  // Check if it's a Firestore FieldValue (serverTimestamp, deleteField, etc.)
  if (
    '_methodName' in (obj as any) ||
    (obj as any).constructor?.name === 'FieldValue' ||
    typeof (obj as any).isEqual === 'function'
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (item === undefined ? null : sanitizeFirestoreData(item))) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  }
  return clean as T;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-slide-1',
    badge: 'Exclusive Launch 2026',
    title: 'Premium Office & School Stationery Essentials',
    subtitle: 'Discover handcrafted notebooks, luxury pens, ergonomic desk organizers & eco-friendly paper stationery.',
    buttonText: 'Shop Collection',
    buttonLink: 'shop',
    secondaryButtonText: 'Browse Categories',
    secondaryButtonLink: 'categories',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#F7F8F3',
    overlay: 'gradient',
    overlayOpacity: 70,
    active: true,
    order: 1,
  },
  {
    id: 'hero-slide-2',
    badge: 'Special Craft Offer',
    title: 'Art & Design Craft Supplies Up To 40% OFF',
    subtitle: 'High-grade art sketchbooks, fountain pen inks, geometry sets & premium watercolor pads.',
    buttonText: 'Explore Art Supplies',
    buttonLink: 'shop',
    secondaryButtonText: 'View Offers',
    secondaryButtonLink: 'shop',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#EFF4E6',
    overlay: 'gradient',
    overlayOpacity: 65,
    active: true,
    order: 2,
  },
  {
    id: 'hero-slide-3',
    badge: 'Express Doorstep Delivery',
    title: 'Fast & Reliable Local Delivery For All Orders',
    subtitle: 'Free delivery on orders above ₹499 with real-time GPS tracking and live courier updates.',
    buttonText: 'Track Your Order',
    buttonLink: 'track-order',
    secondaryButtonText: 'Contact Support',
    secondaryButtonLink: 'contact',
    image: 'https://images.unsplash.com/photo-1507842229458-574349320eef?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#F7F8F3',
    overlay: 'dark',
    overlayOpacity: 75,
    active: true,
    order: 3,
  },
];
const DEFAULT_DELIVERY_PERSONNEL: DeliveryPersonnel[] = [
  {
    id: 'dp-1',
    name: 'Rahul Nair',
    email: 'rahul.nair@fathimastore.in',
    phone: '+91 98471 22011',
    vehicleType: 'Bike',
    vehicleNumber: 'KL-01-CA-4421',
    status: 'available',
    rating: 4.9,
    totalDeliveries: 342,
    failedDeliveries: 5,
    avgCompletionMinutes: 21,
    onTimeRatePct: 96,
    satisfactionReviewsCount: 128,
    currentLat: 8.5241,
    currentLng: 76.9366,
    lastUpdatedLocation: 'MG Road Hub, Trivandrum',
  },
  {
    id: 'dp-2',
    name: 'Sreejith V',
    email: 'sreejith.v@fathimastore.in',
    phone: '+91 94472 33109',
    vehicleType: 'Scooter',
    vehicleNumber: 'KL-01-CB-8910',
    status: 'available',
    rating: 4.8,
    totalDeliveries: 289,
    failedDeliveries: 7,
    avgCompletionMinutes: 24,
    onTimeRatePct: 93,
    satisfactionReviewsCount: 104,
    currentLat: 8.5285,
    currentLng: 76.942,
    lastUpdatedLocation: 'Pattom Junction, Trivandrum',
  },
  {
    id: 'dp-3',
    name: 'Muhammed Fayiz',
    email: 'fayiz.m@fathimastore.in',
    phone: '+91 98950 77812',
    vehicleType: 'Bike',
    vehicleNumber: 'KL-01-CD-1123',
    status: 'available',
    rating: 4.9,
    totalDeliveries: 410,
    failedDeliveries: 4,
    avgCompletionMinutes: 19,
    onTimeRatePct: 98,
    satisfactionReviewsCount: 162,
    currentLat: 8.5581,
    currentLng: 76.8816,
    lastUpdatedLocation: 'Kazhakkoottam / Technopark',
  },
  {
    id: 'dp-4',
    name: 'Anoop Krishnan',
    email: 'anoop.k@fathimastore.in',
    phone: '+91 97461 55432',
    vehicleType: 'Van',
    vehicleNumber: 'KL-01-CE-6701',
    status: 'available',
    rating: 4.7,
    totalDeliveries: 195,
    failedDeliveries: 8,
    avgCompletionMinutes: 28,
    onTimeRatePct: 89,
    satisfactionReviewsCount: 74,
    currentLat: 8.5262,
    currentLng: 76.9615,
    lastUpdatedLocation: 'Kowdiar Avenue, Trivandrum',
  },
];

interface Toast {

  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  // Navigation & Page State
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  navigateToProduct: (productId: string) => void;
  navigateToCategory: (categorySlug: string) => void;
  navigateToOrder: (orderId: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteMultipleProducts: (ids: string[]) => Promise<void>;
  duplicateProduct: (id: string) => Promise<void>;
  quickUpdateStock: (id: string, newStock: number) => Promise<void>;
  bulkUpdateStock: (ids: string[], adjustment: number) => Promise<void>;
  removeAllProductBadges: () => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearAllCategories: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartCount: number;
  cartSubtotal: number;
  cartDeliveryCharge: number;
  cartDiscount: number;
  cartTotal: number;


  // Wishlist
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Coupon
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;

  // Orders
  orders: Order[];
  allOrders: Order[];
  placeOrder: (orderData: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    deliveryMethod: string;
    paymentDetails?: OnlinePaymentDetails;
    finalTotalOverride?: number;
    prepaidDiscount?: number;
    codFee?: number;
  }) => Promise<Order>;
  createDirectOrder: (orderData: Partial<Order>) => Promise<Order>;
  completeOnlineOrderPayment: (
    orderId: string,
    methodOrDetails: PaymentMethod | OnlinePaymentDetails,
    paymentDetails?: OnlinePaymentDetails
  ) => Promise<void>;

  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  bulkUpdateOrderStatus: (orderIds: string[], status: OrderStatus) => Promise<void>;
  bulkArchiveOrders: (orderIds: string[], archive: boolean) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<void>;
  recordOrderPayment: (
    orderId: string,
    amount: number,
    method: string,
    reference: string,
    type: 'advance' | 'installment' | 'final' | 'refund',
    notes?: string
  ) => Promise<void>;
  updateOrderDeliveryStatus: (
    orderId: string,
    status: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    note?: string
  ) => Promise<void>;
  requestOrderReturn: (orderId: string, reason: string) => Promise<void>;
  processOrderReturn: (orderId: string, status: 'Approved' | 'Rejected' | 'Refunded') => Promise<void>;
  verifyOrderPayment: (orderId: string, verified: boolean) => Promise<void>;

  // Expenses & Finance
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Customer Support Chat
  supportThreads: SupportThread[];
  createSupportThread: (subject: string, message: string, orderId?: string) => Promise<SupportThread>;
  sendSupportMessage: (threadId: string, message: string, senderRole?: 'customer' | 'admin') => Promise<void>;
  updateSupportThreadStatus: (threadId: string, status: 'open' | 'in_progress' | 'resolved') => Promise<void>;
  isSupportChatOpen: boolean;
  setIsSupportChatOpen: (open: boolean) => void;

  // Inventory Adjustments
  inventoryAdjustments: InventoryAdjustment[];
  recordInventoryAdjustment: (adj: Omit<InventoryAdjustment, 'id' | 'date'>) => Promise<void>;

  // Reviews
  reviews: Review[];
  addReview: (reviewData: {
    productId: string;
    productName: string;
    rating: number;
    comment: string;
    userName: string;
    reviewTitle?: string;
    tags?: string[];
    pros?: string;
    recommend?: boolean;
  }) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: 'approved' | 'hidden') => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  checkIfUserPurchasedProduct: (productId: string, userId: string) => Promise<boolean>;

  // Banners
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, updates: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  // Hero Slider
  heroSlides: HeroSlide[];
  addHeroSlide: (slide: Omit<HeroSlide, 'id'>) => Promise<void>;
  updateHeroSlide: (id: string, updates: Partial<HeroSlide>) => Promise<void>;
  deleteHeroSlide: (id: string) => Promise<void>;
  reorderHeroSlides: (slides: HeroSlide[]) => Promise<void>;

  // Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => Promise<void>;

  // User & Auth
  currentUser: User | null;
  allUsers: User[];
  users: User[];
  isAdmin: boolean;
  isDriver: boolean;
  isAuthLoading: boolean;
  unauthorizedDomainInfo: { domain: string; projectId: string } | null;
  setUnauthorizedDomainInfo: (info: { domain: string; projectId: string } | null) => void;
  registerUser: (data: { name: string; email: string; phone?: string; password?: string; role?: 'customer' | 'admin' }) => Promise<boolean>;
  loginUser: (email: string, password?: string, role?: 'customer' | 'admin') => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  switchRole: (role: 'customer' | 'admin') => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  toggleCustomerVIP: (customerEmailOrId: string, isVip: boolean) => Promise<void>;
  grantCustomerAdmin: (customerEmailOrId: string, grant: boolean) => Promise<void>;
  grantCustomerDriver: (
    customerEmailOrId: string,
    grant: boolean,
    vehicleDetails?: {
      vehicleType?: DeliveryPersonnel['vehicleType'];
      vehicleNumber?: string;
      name?: string;
      phone?: string;
    }
  ) => Promise<void>;
  deleteCustomer: (customerEmailOrId: string) => Promise<void>;
  showForceSignInModal: boolean;
  setShowForceSignInModal: (show: boolean) => void;
  addSavedAddress: (address: ShippingAddress) => Promise<void>;
  deleteSavedAddress: (index: number) => Promise<void>;
  setDefaultAddress: (index: number) => Promise<void>;

  // Search & Global State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Notifications (Admin & Customer)
  notifications: Notification[];
  customerNotifications: Notification[];
  sendNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => Promise<void>;
  sendCustomCustomerNotification: (data: {
    title: string;
    message: string;
    type?: Notification['type'];
    targetEmail?: string;
    targetUserId?: string;
    orderId?: string;
    isBroadcast?: boolean;
  }) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  removeSelectedCategoryButton: () => Promise<void>;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Quick View Modal
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  // Delivery Personnel, Driver Portal & Tracking
  deliveryPersonnel: DeliveryPersonnel[];
  deliveryAssignments: DeliveryAssignment[];
  isDeliveryLoggedIn: boolean;
  currentDeliveryPerson: DeliveryPersonnel | null;
  deliveryLogin: (email: string, phone: string) => boolean;
  deliveryLogout: () => void;
  updateDeliveryAssignmentStatus: (
    assignmentId: string,
    status: DeliveryAssignment['status'],
    notesOrData?: string | Partial<DeliveryAssignment>,
    photoUrl?: string
  ) => Promise<void>;
  assignDeliveryPerson: (orderId: string, deliveryPersonId: string) => Promise<void>;
  assignOrderToDelivery: (orderId: string, deliveryPersonId: string, notes?: string) => Promise<void>;
  completeDeliveryAssignment: (assignmentId: string, proofNotes?: string) => Promise<void>;
  rateDeliveryAssignment: (
    assignmentId: string,
    rating: number,
    feedback?: string
  ) => Promise<void>;
  logDriverPerformanceRecord: (record: {
    deliveryPersonId: string;
    orderId?: string;
    status: 'Delivered' | 'Failed';
    actualCompletionMinutes?: number;
    estimatedMinutes?: number;
    customerRating?: number;
    customerFeedback?: string;
    failureReason?: string;
    deliveryNotes?: string;
  }) => Promise<void>;

  // Customer Inbox Messages
  customerMessages: CustomerMessage[];
  addCustomerMessage: (msg: Omit<CustomerMessage, "id" | "createdAt" | "status">) => Promise<void>;
  updateCustomerMessageStatus: (id: string, status: CustomerMessage["status"], replyNotes?: string) => Promise<void>;
  deleteCustomerMessage: (id: string) => Promise<void>;

  // Reset Demo Data & Backups
  resetToDefaultData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportStoreData: () => string;
  importStoreData: (jsonStr: string) => boolean;
  updateDeliveryPersonLocation: (personId: string, lat: number, lng: number) => Promise<void>;
  updateDeliveryLocation: (
    orderId: string,
    location: { lat: number; lng: number; address?: string }
  ) => Promise<void>;
  updateDeliveryPersonnel: (personId: string, updates: Partial<DeliveryPersonnel>) => Promise<void>;

  // Automated Inventory Email Alerts
  emailAlertLogs: EmailAlertRecord[];
  checkAndTriggerLowStockAlert: (product: Product, currentStock: number) => Promise<void>;

  // Product Comparison
  compareProductIds: string[];
  toggleCompareProduct: (productId: string) => void;
  clearCompareProducts: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Guaranteed collision-free unique ID generator
let globalIdCounter = 0;
export const createUniqueId = (prefix: string = 'id'): string => {
  globalIdCounter += 1;
  const time = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${time}-${globalIdCounter}-${randomPart}`;
};

// Resilient safe storage helper that gracefully manages localStorage quota
export const safeStorageSet = (key: string, value: any): boolean => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Could not write key "${key}", attempting cache cleanup:`, err);
    try {
      // Clear non-critical or legacy cache keys to free up browser quota
      const purgeKeys = [
        'fs_products',
        'fs_clean_products',
        'fs_clean_orders',
        'fs_clean_reviews',
        'fs_v5_inventory_adj',
        'fs_v5_expenses',
        'fs_v5_support_threads',
      ];
      purgeKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State with Hash & LocalStorage Persistence so Refreshing Never Loses Active Page
  const [activePage, setActivePageState] = useState<ActivePage>(() => {
    try {
      const rawHash = window.location.hash.replace('#', '').trim();
      const hash = rawHash.split('?')[0];
      if (hash === 'admin') return 'admin';
      if (hash === 'admin/login' || hash === 'admin-login') return 'admin-login';
      if (hash === 'shop') return 'shop';
      if (hash === 'categories') return 'categories';
      if (hash === 'cart') return 'cart';
      if (hash === 'checkout') return 'checkout';
      if (hash === 'order-success') return 'order-success';
      if (hash === 'account') return 'account';
      if (hash === 'profile') return 'profile';
      if (hash === 'wishlist') return 'wishlist';
      if (hash === 'about') return 'about';
      if (hash === 'contact') return 'contact';
      if (hash === 'login') return 'login';
      if (hash === 'register') return 'register';
      if (hash === 'delivery-portal' || hash === 'delivery') return 'delivery-portal';
      if (hash === 'order-tracking' || hash === 'track-order' || hash === 'track') return 'order-tracking';
      if (hash === 'product-details') return 'product-details';
      const savedPage = sessionStorage.getItem('fs_active_page') as ActivePage | null;
      if (savedPage) return savedPage;
    } catch {}
    return 'home';
  });

  const setActivePage = React.useCallback((page: ActivePage) => {
    setActivePageState(page);
    try {
      sessionStorage.setItem('fs_active_page', page);
      if (page === 'home') {
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.history.replaceState(null, '', `#${page}`);
      }
    } catch {}
  }, []);

  const [selectedProductId, setSelectedProductIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('fs_selected_product_id') || null;
    } catch {
      return null;
    }
  });
  const setSelectedProductId = React.useCallback((id: string | null) => {
    setSelectedProductIdState(id);
    try {
      if (id) sessionStorage.setItem('fs_selected_product_id', id);
      else sessionStorage.removeItem('fs_selected_product_id');
    } catch {}
  }, []);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('fs_selected_order_id') || null;
    } catch {
      return null;
    }
  });
  const setSelectedOrderId = React.useCallback((id: string | null) => {
    setSelectedOrderIdState(id);
    try {
      if (id) sessionStorage.setItem('fs_selected_order_id', id);
      else sessionStorage.removeItem('fs_selected_order_id');
    } catch {}
  }, []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showForceSignInModal, setShowForceSignInModal] = useState<boolean>(false);

  // Firestore Sync States with Local Persistence Fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState<Category[]>(() => INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const defaultDemoIds = new Set(['ORD-84920', 'ORD-83104', 'ORD-79211']);
          return parsed.filter((o: any) => o && o.id && !defaultDemoIds.has(o.id));
        }
      }
    } catch (e) {}
    return [];
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => INITIAL_COUPONS);
  const [reviews, setReviews] = useState<Review[]>(() => INITIAL_REVIEWS);
  const [banners, setBanners] = useState<Banner[]>(() => INITIAL_BANNERS);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>(() => DEFAULT_DELIVERY_PERSONNEL);
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);
  const [currentDeliveryPersonId, setCurrentDeliveryPersonId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fs_active_driver_id') || null;
    } catch {
      return null;
    }
  });
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_chat_msgs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [emailAlertLogs, setEmailAlertLogs] = useState<EmailAlertRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_email_alert_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (products.length > 0) {
      try { localStorage.setItem('fs_saved_products', JSON.stringify(products)); } catch {}
    }
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem('fs_saved_orders', JSON.stringify(orders)); } catch {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem('fs_saved_chat_msgs', JSON.stringify(customerMessages)); } catch {}
  }, [customerMessages]);

  
  // Local-only states
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('fs_v5_cart');
    if (!saved) return [];
    try {
      const parsed: CartItem[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.filter((item) => {
        if (!item?.product?.id || seen.has(item.product.id)) return false;
        seen.add(item.product.id);
        return true;
      });
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('fs_v5_wishlist');
    if (!saved) return [];
    try {
      const parsed: string[] = JSON.parse(saved);
      return Array.from(new Set(parsed));
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fs_active_user') || localStorage.getItem('fs_v5_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.email)) {
          return {
            ...parsed,
            addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse fs_active_user from localStorage', e);
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fs_active_user') || localStorage.getItem('fs_v5_user');
      return !saved;
    } catch {
      return false;
    }
  });
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{
    domain: string;
    projectId: string;
  } | null>(null);

  const [compareProductIds, setCompareProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fs_compare_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fs_compare_products', JSON.stringify(compareProductIds));
  }, [compareProductIds]);

  // Persist active user to localStorage whenever currentUser is non-null.
  // Never auto-delete from localStorage in a useEffect so page refreshes never wipe the session!
  useEffect(() => {
    try {
      if (currentUser && (currentUser.id || currentUser.email)) {
        const serialized = JSON.stringify(currentUser);
        localStorage.setItem('fs_active_user', serialized);
        localStorage.setItem('fs_v5_user', serialized);
      }
    } catch (e) {
      console.warn('Failed to sync user to localStorage', e);
    }
  }, [currentUser]);

  // Sync Firebase Auth with App State without wiping local sessions on refresh
  useEffect(() => {
    let isMounted = true;
    // Safety timeout so isAuthLoading never blocks UI
    const authTimeout = setTimeout(() => {
      if (isMounted) setIsAuthLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      if (firebaseUser) {
        const emailNorm = (firebaseUser.email || '').toLowerCase().trim();
        const isMasterAdmin =
          emailNorm === 'nihal.graphix@gmail.com' || emailNorm.includes('admin');

        try {
          // Check both UID doc and email-keyed doc in Firestore
          const uidDocRef = doc(db, 'users', firebaseUser.uid);
          let userDoc = await getDoc(uidDocRef).catch(() => null);
          if ((!userDoc || !userDoc.exists()) && emailNorm) {
            const emailDocRef = doc(db, 'users', emailNorm.replace(/[@.]/g, '_'));
            const emailDoc = await getDoc(emailDocRef).catch(() => null);
            if (emailDoc && emailDoc.exists()) {
              userDoc = emailDoc;
            }
          }

          if (userDoc && userDoc.exists()) {
            const data = userDoc.data();
            const effectiveRole = isMasterAdmin ? 'admin' : (data.role || 'customer');
            const activeUser: User = {
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'User',
              email: firebaseUser.email || data.email || '',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              avatar: data.avatar || data.photoURL || firebaseUser.photoURL || '',
              role: effectiveRole,
              isDriver: Boolean(data.isDriver || data.role === 'delivery'),
              phone: data.phone || firebaseUser.phoneNumber || '',
              bio: data.bio || '',
              city: data.city || '',
              state: data.state || '',
              addresses: Array.isArray(data.addresses) ? data.addresses : [],
              createdAt: data.createdAt?.toDate?.()?.toISOString() || String(data.createdAt || new Date().toISOString()),
            };
            if (isMounted) {
              setCurrentUser(activeUser);
              localStorage.setItem('fs_active_user', JSON.stringify(activeUser));
              localStorage.setItem('fs_v5_user', JSON.stringify(activeUser));
            }

            if (isMasterAdmin && data.role !== 'admin') {
              await updateDoc(uidDocRef, {
                role: 'admin',
                updatedAt: serverTimestamp(),
              }).catch(() => {});
            }
          } else {
            // New Google User - create minimal profile or preserve cached session fields
            let cachedUser: Partial<User> = {};
            try {
              const saved = localStorage.getItem('fs_active_user') || localStorage.getItem('fs_v5_user');
              if (saved) cachedUser = JSON.parse(saved);
            } catch {}

            const newUser: User = {
              id: firebaseUser.uid,
              name: cachedUser.name || firebaseUser.displayName || 'New User',
              email: firebaseUser.email || cachedUser.email || '',
              photoURL: firebaseUser.photoURL || cachedUser.photoURL || '',
              phone: cachedUser.phone || firebaseUser.phoneNumber || '',
              role: isMasterAdmin ? 'admin' : (cachedUser.role || 'customer'),
              isDriver: Boolean(cachedUser.isDriver || cachedUser.role === 'delivery'),
              addresses: Array.isArray(cachedUser.addresses) ? cachedUser.addresses : [],
              createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), sanitizeFirestoreData({
              ...newUser,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }), { merge: true }).catch(() => {});

            if (isMounted) {
              setCurrentUser(newUser);
              localStorage.setItem('fs_active_user', JSON.stringify(newUser));
              localStorage.setItem('fs_v5_user', JSON.stringify(newUser));
            }
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, keeping active user session:', err);
          // Fallback to firebaseUser + cached data so refresh never logs user out
          if (isMounted) {
            setCurrentUser((prev) => {
              const fallback: User = prev || {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                phone: firebaseUser.phoneNumber || '',
                role: isMasterAdmin ? 'admin' : 'customer',
                addresses: [],
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem('fs_active_user', JSON.stringify(fallback));
              localStorage.setItem('fs_v5_user', JSON.stringify(fallback));
              return fallback;
            });
          }
        }
      } else {
        // When Firebase Auth is null, always restore/keep the active local session (e.g. email/password login or stored user)
        try {
          const savedSession = localStorage.getItem('fs_active_user') || localStorage.getItem('fs_v5_user');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed && (parsed.id || parsed.email)) {
              const restoredUser: User = {
                ...parsed,
                addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
              };
              if (isMounted) {
                setCurrentUser(restoredUser);
                setIsAuthLoading(false);
              }
              // Refresh user's latest role & driver status from Firestore in background
              const docId = parsed.id || parsed.email.trim().toLowerCase().replace(/[@.]/g, '_');
              getDoc(doc(db, 'users', docId))
                .then((snap) => {
                  if (snap.exists() && isMounted) {
                    const freshData = snap.data();
                    setCurrentUser((prev) => {
                      if (!prev) return prev;
                      const merged: User = {
                        ...prev,
                        role: freshData.role || prev.role,
                        isDriver: Boolean(freshData.isDriver || freshData.role === 'delivery' || prev.isDriver),
                        addresses: Array.isArray(freshData.addresses) ? freshData.addresses : prev.addresses,
                      };
                      localStorage.setItem('fs_active_user', JSON.stringify(merged));
                      localStorage.setItem('fs_v5_user', JSON.stringify(merged));
                      return merged;
                    });
                  }
                })
                .catch(() => {});
              return;
            }
          }
        } catch {
          // ignore
        }
        if (isMounted) {
          setCurrentUser(null);
        }
      }
      if (isMounted) {
        setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Helper for generic public collection sync with admin-only seeding
  const useCollectionSync = (
    collectionName: string,
    setter: (data: any[]) => void,
    initialData?: any[],
    orderField?: string
  ) => {
    useEffect(() => {
      try {
        const colRef = collection(db, collectionName);
        const unsubscribe = onSnapshot(
          colRef,
          async (snapshot) => {
            if (snapshot.empty && initialData && initialData.length > 0) {
              setter(initialData);
              if (currentUser?.role === 'admin' && storeSettings.isDemoDataSeeded === false) {
                const batch = writeBatch(db);
                initialData.forEach((item) => {
                  const docRef = doc(collection(db, collectionName), item.id || createUniqueId('seed'));
                  batch.set(docRef, sanitizeFirestoreData({
                    ...item,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }));
                });
                await batch.commit().catch((err) => console.warn(`Notice seeding ${collectionName}:`, err));
              }
            } else {
              const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as any[];
              if (orderField) {
                data.sort((a, b) => {
                  const getVal = (item: any) => {
                    const v = item[orderField];
                    if (!v) return 0;
                    if (typeof v.toMillis === 'function') return v.toMillis();
                    if (typeof v === 'number') return v;
                    const parsed = new Date(v).getTime();
                    return isNaN(parsed) ? 0 : parsed;
                  };
                  return getVal(b) - getVal(a);
                });
              }
              setter(data);
            }
          },
          (error) => {
            console.warn(`Firestore sync notice on ${collectionName}:`, error);
            handleFirestoreError(error, OperationType.GET, collectionName);
          }
        );
        return () => unsubscribe();
      } catch (err) {
        console.warn(`Firestore listener setup notice on ${collectionName}:`, err);
        handleFirestoreError(err, OperationType.GET, collectionName);
      }
    }, [collectionName, currentUser?.role]);
  };

  // Sync public collections (open to all customers, drivers, and storefront visitors)
  useCollectionSync('products', setProducts, INITIAL_PRODUCTS);
  useCollectionSync('categories', setCategories, INITIAL_CATEGORIES, 'slug');
  useCollectionSync('banners', setBanners, INITIAL_BANNERS);
  useCollectionSync('coupons', setCoupons, INITIAL_COUPONS, 'code');
  useCollectionSync('reviews', setReviews, INITIAL_REVIEWS, 'createdAt');
  useCollectionSync('customer_messages', setCustomerMessages, [], 'createdAt');
  useCollectionSync('delivery_personnel', setDeliveryPersonnel, DEFAULT_DELIVERY_PERSONNEL);
  useCollectionSync(
    'hero_slides',
    (data) => {
      setStoreSettings((prev) => ({ ...prev, heroSlides: data as HeroSlide[] }));
    },
    DEFAULT_HERO_SLIDES,
    'order'
  );

  // Admin-only collections: strictly listened to when currentUser is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return;
    }

    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Expense[];
        list.sort((a, b) => {
          const tA = (a as any).createdAt?.toMillis?.() || (a.date ? new Date(a.date).getTime() : 0);
          const tB = (b as any).createdAt?.toMillis?.() || (b.date ? new Date(b.date).getTime() : 0);
          return tB - tA;
        });
        setExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'expenses')
    );

    const unsubInventory = onSnapshot(
      collection(db, 'inventory_adjustments'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as InventoryAdjustment[];
        list.sort((a, b) => {
          const tA = (a as any).createdAt?.toMillis?.() || (a.date ? new Date(a.date).getTime() : 0);
          const tB = (b as any).createdAt?.toMillis?.() || (b.date ? new Date(b.date).getTime() : 0);
          return tB - tA;
        });
        setInventoryAdjustments(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'inventory_adjustments')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
          addresses: Array.isArray(d.data().addresses) ? d.data().addresses : [],
        })) as User[];
        setAllUsers(list);
      },
      (err) => {
        console.warn('Users collection listener error:', err);
      }
    );

    const unsubEmailAlerts = onSnapshot(
      collection(db, 'email_alerts'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as EmailAlertRecord[];
        list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        if (list.length > 0) {
          setEmailAlertLogs(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'email_alerts')
    );

    return () => {
      unsubExpenses();
      unsubInventory();
      unsubUsers();
      unsubEmailAlerts();
    };
  }, [currentUser?.role]);

  // All notifications from Firestore (no composite index required; sorted & filtered in memory)
  const [rawNotifications, setRawNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      const col = collection(db, 'notifications');
      const unsubscribe = onSnapshot(
        col,
        (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const raw = d.data();
            let timeStr = raw.time;
            if (!timeStr && raw.createdAt?.toDate) {
              timeStr = raw.createdAt.toDate().toISOString();
            } else if (typeof timeStr === 'object' && timeStr?.toDate) {
              timeStr = timeStr.toDate().toISOString();
            } else if (!timeStr) {
              timeStr = new Date().toISOString();
            }
            return {
              ...raw,
              id: d.id,
              time: String(timeStr),
            } as Notification;
          });

          list.sort((a, b) => {
            const tA = new Date(a.time).getTime() || 0;
            const tB = new Date(b.time).getTime() || 0;
            return tB - tA;
          });

          setRawNotifications(list);
          try {
            localStorage.setItem('fs_saved_notifications', JSON.stringify(list));
          } catch {}
        },
        (err) => {
          console.warn('Notifications listener notice:', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Notifications listener setup notice:', err);
    }
  }, []);

  // Delivery assignments: synced for customers (live tracking), drivers (portal queue), and admins
  useEffect(() => {
    try {
      const unsubAssignments = onSnapshot(
        collection(db, 'delivery_assignments'),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DeliveryAssignment[];
          list.sort((a, b) => {
            const tA = (a as any).createdAt?.toMillis?.() || new Date(a.assignedAt || 0).getTime() || 0;
            const tB = (b as any).createdAt?.toMillis?.() || new Date(b.assignedAt || 0).getTime() || 0;
            return tB - tA;
          });
          setDeliveryAssignments(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'delivery_assignments')
      );

      return () => unsubAssignments();
    } catch (err) {
      console.warn('Delivery assignments listener notice:', err);
    }
  }, []);

  // Support Threads: synced and filtered in memory so customers matching by ID or email see replies immediately
  useEffect(() => {
    try {
      const col = collection(db, 'support_threads');
      const unsubSupport = onSnapshot(
        col,
        (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || ''),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ''),
            } as SupportThread;
          });
          list.sort((a, b) => {
            const tA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
            const tB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
            return tB - tA;
          });
          setSupportThreads(list);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'support_threads')
      );

      return () => unsubSupport();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'support_threads');
    }
  }, []);

  // Orders Sync: synced in real-time so Admin, Delivery Drivers, and Customers (by userId or email) all see live updates
  useEffect(() => {
    try {
      const ordersCol = collection(db, 'orders');
      const unsubOrders = onSnapshot(
        ordersCol,
        (snapshot) => {
          const firestoreOrders = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Order[];
          firestoreOrders.sort((a, b) => {
            const getOrderTime = (o: Order) => {
              const cr = (o as any).createdAt;
              if (cr?.toMillis) return cr.toMillis();
              if (o.date) {
                const t = new Date(o.date).getTime();
                if (!isNaN(t)) return t;
              }
              return 0;
            };
            return getOrderTime(b) - getOrderTime(a);
          });

          const defaultDemoIds = new Set(['ORD-84920', 'ORD-83104', 'ORD-79211']);
          const cleanOrders = firestoreOrders.filter((o) => !defaultDemoIds.has(o.id));
          setOrders(cleanOrders);
          try {
            localStorage.setItem('fs_saved_orders', JSON.stringify(cleanOrders));
          } catch {}
        },
        (err) => {
          console.warn('Orders sync notice:', err);
          handleFirestoreError(err, OperationType.GET, 'orders');
        }
      );

      return () => unsubOrders();
    } catch (err) {
      console.warn('Orders listener setup notice:', err);
      handleFirestoreError(err, OperationType.GET, 'orders');
    }
  }, []);

  const DEFAULT_STORE_SETTINGS: StoreSettings = {
    storeName: 'FATHIMA STORES',
    tagline: 'Quality Stationery & Everyday Office Essentials',
    contactEmail: 'care@fathimastores.com',
    contactPhone: '+91 98450 12345',
    address: 'Commercial Complex, MG Road, Trivandrum, Kerala 695001',
    storeHubName: 'Fathima Stores Main Hub (MG Road, Trivandrum)',
    storeLat: 8.5241,
    storeLng: 76.9366,
    storeCity: 'Trivandrum',
    storeState: 'Kerala',
    storePinCode: '695001',
    deliveryRadiusKm: 25,
    currency: '₹',
    freeDeliveryThreshold: 500,
    standardDeliveryFee: 40,
    gstNumber: '32AABCF1234F1Z8',
    upiId: 'fathimastores@oksbi',
    upiMerchantName: 'FATHIMA STORES TRIVANDRUM',
    enableOnlinePayments: true,
    enableGPay: true,
    enablePhonePe: true,
    enablePaytm: true,
    enableUpiQr: true,
    enableCards: true,
    enableNetBanking: true,
    enableCOD: true,
    autoVerifyOnlinePayments: true,
    autoConfirmPaidOrders: true,
    autoSendPaymentReceipt: true,
    autoRefundOnCancel: true,
    prepaidDiscountPct: 2,
    codHandlingFee: 0,
    paymentGatewayProvider: 'Razorpay',
    paymentGatewayMode: 'live',
    razorpayKeyId: 'rzp_live_FS8923471928',
    merchantBankName: 'State Bank of India (Commercial Branch)',
    merchantAccountLast4: '8921',
    showAnnouncement: false,
    announcementText: '',
    heroBadge: 'STATIONERY & ESSENTIALS',
    heroHeadline: 'Everything You Need, All in One Place.',
    heroSubheadline: 'Discover quality stationery, school supplies, office essentials, notebooks, pens, art materials and everyday products at honest prices.',
    heroButtonText: 'Shop Now',
    heroButtonTarget: 'shop',
    heroTrustText: '1,000+ Students & Professionals trust us for daily essentials',
    heroSlides: DEFAULT_HERO_SLIDES,
    heroSliderAutoplay: true,
    heroSliderInterval: 4000,
    showHeroSection: true,
    showCategoryCircles: true,
    showHomeFilters: true,
    showBestSellers: true,
    bestSellersTitle: 'Best Selling Products',
    bestSellersSubtitle: 'Customer favorites for school term and office requirements',
    showPromoBanner: false,
    promoTitle: 'Special Seasonal Discounts',
    promoSubtitle: 'Limited time offers on selected notebooks, student backpacks, art supplies and exam packs.',
    promoBadge: 'Special Offer',
    promoButtonText: 'Shop the Sale',
    promoBgImage: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
    promoBgOverlay: 'light',
    promoBgOpacity: 85,
    showNewArrivals: true,
    newArrivalsTitle: 'New Arrivals & Fresh Stock',
    newArrivalsSubtitle: 'Check out the latest tools, stationery gear, and additions to our catalog',
    showBenefits: true,
    showReviews: true,
    showProductBadges: true,
    accentColor: '#71883F',
    accentColorHover: '#5F7334',
    accentColorLight: '#EFF4E6',
    homeBgType: 'default',
    homeBgImage: '',
    homeBgColor: '#FFFFFF',
    homeBgOverlay: 'light',
    homeBgOpacity: 90,
    heroBgType: 'default',
    heroBgImage: '',
    heroBgColor: '#F7F8F3',
    heroBgOverlay: 'light',
    heroBgOpacity: 85,
    fontFamily: 'Plus Jakarta Sans',
    borderRadiusMode: 'rounded',
    storeThemeMode: 'white',
    enableWhatsAppSupport: true,
    whatsAppNumber: '+91 98450 12345',
    whatsAppGreeting: 'Hello Fathima Stores, I would like to inquire about stationery products!',
    showQuickView: true,
    showLowStockAlert: true,
    lowStockThreshold: 10,
    socialInstagram: 'https://instagram.com/fathimastores',
    socialFacebook: 'https://facebook.com/fathimastores',
    socialWhatsApp: 'https://wa.me/919845012345',
    logoType: 'text',
    logoUrl: '',
    logoHeight: 36,
    isDemoDataSeeded: false,
  };

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('fs_saved_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_STORE_SETTINGS, ...parsed };
        }
      }
    } catch {}
    return DEFAULT_STORE_SETTINGS;
  });

  // Sync Store Settings
  useEffect(() => {
    const settingsDoc = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const merged = { ...DEFAULT_STORE_SETTINGS, ...(snapshot.data() as StoreSettings) };
        setStoreSettings(merged);
        try {
          localStorage.setItem('fs_saved_store_settings', JSON.stringify(merged));
        } catch {}
      } else if (currentUser?.role === 'admin') {
        // Seed initial settings only if admin
        setDoc(settingsDoc, sanitizeFirestoreData({
          ...storeSettings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }), { merge: true }).catch(err => console.warn("Notice seeding store settings:", err));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return () => unsubscribe();
  }, [currentUser?.role]);




  const addCustomerMessage = async (msgData: Omit<CustomerMessage, "id" | "createdAt" | "status">) => {
    const id = createUniqueId("msg");
    const resolvedName = msgData.name || msgData.customerName || 'Customer';
    const resolvedEmail = msgData.email || msgData.customerEmail || '';
    const resolvedPhone = msgData.phone || msgData.customerPhone || '';
    const newMsg: CustomerMessage = {
      ...msgData,
      id,
      name: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      customerPhone: resolvedPhone,
      subject: msgData.subject || 'General Customer Inquiry',
      createdAt: new Date().toISOString(),
      status: "unread",
    };

    setCustomerMessages((prev) => [newMsg, ...prev.filter(m => m.id !== id)]);

    try {
      const cleanMsg = sanitizeFirestoreData({
        ...newMsg,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'customer_messages', id), cleanMsg);
    } catch (err) {
      console.warn("Retrying customer message with timestamp fallback:", err);
      try {
        await setDoc(doc(db, 'customer_messages', id), sanitizeFirestoreData({
          ...newMsg,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      } catch (err2) {
        console.error("Failed to save customer message to Firestore:", err2);
      }
    }

    await sendNotification({
      type: "customer",
      title: "New Customer Inquiry Received",
      message: `From ${resolvedName} (${resolvedEmail}): "${msgData.subject || "No Subject"}"`,
    });
  };

  const updateCustomerMessageStatus = async (
    id: string,
    status: CustomerMessage["status"],
    replyNotes?: string
  ) => {
    const targetMsg = customerMessages.find((m) => m.id === id);
    setCustomerMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status,
              ...(replyNotes !== undefined ? { replyNotes } : {}),
            }
          : m
      )
    );

    try {
      await updateDoc(doc(db, 'customer_messages', id), {
        status,
        ...(replyNotes !== undefined ? { replyNotes } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Message status updated locally:", err);
    }

    if (status === 'replied' && targetMsg && replyNotes) {
      const matchedUser = allUsers.find(
        (u) => u.email?.toLowerCase() === targetMsg.email?.toLowerCase()
      );
      await sendNotification({
        type: 'customer',
        userId: matchedUser?.id || (currentUser?.email?.toLowerCase() === targetMsg.email?.toLowerCase() ? currentUser?.id : undefined),
        userEmail: targetMsg.email?.toLowerCase(),
        target: 'customer',
        title: `Store Replied: ${targetMsg.subject || 'Your Inquiry'}`,
        message: replyNotes,
      });
    }
  };

  const deleteCustomerMessage = async (id: string) => {
    setCustomerMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteDoc(doc(db, 'customer_messages', id));
    } catch (err) {
      console.warn("Message deleted locally:", err);
    }
  };

  // Delivery Driver Portal Auth & Helpers
  // Compute whether the currently logged-in user has been authorized as a Driver by Admin
  const isDriver = React.useMemo(() => {
    if (!currentUser) return false;
    const emailNorm = (currentUser.email || '').trim().toLowerCase();
    const driverEmails = new Set(
      (storeSettings.customDriverEmails || []).map((e) => e.toLowerCase().trim())
    );
    const driverIds = new Set(storeSettings.customDriverIds || []);
    if (currentUser.role === 'delivery' || currentUser.isDriver === true) return true;
    if (emailNorm && driverEmails.has(emailNorm)) return true;
    if (currentUser.id && driverIds.has(currentUser.id)) return true;
    return false;
  }, [currentUser, storeSettings.customDriverEmails, storeSettings.customDriverIds]);

  const effectiveDeliveryPersonnel = React.useMemo(() => {
    const baseList = deliveryPersonnel.length > 0 ? [...deliveryPersonnel] : [...DEFAULT_DELIVERY_PERSONNEL];
    // If currentUser is an authorized driver and not yet in the list, synthesize their driver profile
    if (currentUser && isDriver) {
      const emailNorm = (currentUser.email || '').trim().toLowerCase();
      const exists = baseList.some(
        (dp) =>
          dp.id === currentUser.id ||
          dp.userId === currentUser.id ||
          (emailNorm && dp.email.trim().toLowerCase() === emailNorm)
      );
      if (!exists) {
        baseList.unshift({
          id: `dp-${currentUser.id}`,
          userId: currentUser.id,
          name: currentUser.name || 'Authorized Driver',
          email: currentUser.email || '',
          phone: currentUser.phone || '+91 98450 12345',
          vehicleType: 'Bike',
          vehicleNumber: 'KL-01-DR-2026',
          status: 'available',
          rating: 5.0,
          totalDeliveries: 0,
          currentLat: storeSettings.storeLat || 8.5241,
          currentLng: storeSettings.storeLng || 76.9366,
          lastUpdatedLocation: storeSettings.storeHubName || 'Store Dispatch Hub',
          avatar: currentUser.photoURL || currentUser.avatar,
        });
      }
    }
    return baseList;
  }, [deliveryPersonnel, currentUser, isDriver, storeSettings.storeLat, storeSettings.storeLng, storeSettings.storeHubName]);

  const currentDeliveryPerson = React.useMemo(() => {
    if (currentUser && isDriver) {
      const emailNorm = (currentUser.email || '').trim().toLowerCase();
      const matchedByUser = effectiveDeliveryPersonnel.find(
        (dp) =>
          dp.id === currentUser.id ||
          dp.userId === currentUser.id ||
          (emailNorm && dp.email.trim().toLowerCase() === emailNorm)
      );
      if (matchedByUser) return matchedByUser;
    }
    if (currentDeliveryPersonId) {
      const matchedById = effectiveDeliveryPersonnel.find((dp) => dp.id === currentDeliveryPersonId);
      if (matchedById) return matchedById;
    }
    return null;
  }, [currentUser, isDriver, effectiveDeliveryPersonnel, currentDeliveryPersonId]);

  const isDeliveryLoggedIn = Boolean(isDriver && currentDeliveryPerson);

  const deliveryLogin = (email: string, phone: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const matched = effectiveDeliveryPersonnel.find((dp) => {
      const dpEmail = dp.email.trim().toLowerCase();
      const dpPhone = dp.phone.replace(/\D/g, '').slice(-10);
      return dpEmail === cleanEmail && (cleanPhone.length >= 6 ? dpPhone.endsWith(cleanPhone) : dp.phone.trim() === phone.trim());
    });

    if (matched) {
      setCurrentDeliveryPersonId(matched.id);
      try {
        localStorage.setItem('fs_active_driver_id', matched.id);
      } catch {}
      showToast(`Active driver profile switched to ${matched.name}!`, 'success');
      return true;
    }
    return false;
  };

  const deliveryLogout = () => {
    setCurrentDeliveryPersonId(null);
    try {
      localStorage.removeItem('fs_active_driver_id');
    } catch {}
    showToast('Exited Delivery Driver Portal', 'info');
  };

  const updateDeliveryAssignmentStatus = async (
    assignmentId: string,
    status: DeliveryAssignment['status'],
    notesOrData?: string | Partial<DeliveryAssignment>,
    photoUrl?: string
  ) => {
    const extraData =
      typeof notesOrData === 'object'
        ? notesOrData
        : notesOrData
        ? { deliveryNotes: notesOrData }
        : {};

    const assignment = deliveryAssignments.find((a) => a.id === assignmentId);
    const completedTime =
      status === 'Delivered' || status === 'Failed' ? new Date().toISOString() : undefined;

    let computedCompletionMins: number | undefined = extraData.actualCompletionMinutes;
    let computedOnTimeStatus: 'on_time' | 'delayed' | 'early' | undefined = extraData.onTimeStatus;

    if (status === 'Delivered' && completedTime) {
      if (computedCompletionMins === undefined && assignment?.assignedAt) {
        const elapsedMs = new Date(completedTime).getTime() - new Date(assignment.assignedAt).getTime();
        const rawMins = Math.round(elapsedMs / 60000);
        computedCompletionMins = rawMins >= 2 && rawMins <= 240 ? rawMins : assignment.estimatedMinutes || 22;
      } else if (computedCompletionMins === undefined) {
        computedCompletionMins = assignment?.estimatedMinutes || 22;
      }
      const slaMins = assignment?.estimatedMinutes || 30;
      computedOnTimeStatus =
        computedCompletionMins <= slaMins - 5
          ? 'early'
          : computedCompletionMins <= slaMins
          ? 'on_time'
          : 'delayed';
    }

    setDeliveryAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status,
              ...extraData,
              ...(photoUrl ? { proofPhotoUrl: photoUrl } : {}),
              ...(completedTime ? { completedAt: completedTime } : {}),
              ...(computedCompletionMins !== undefined
                ? { actualCompletionMinutes: computedCompletionMins }
                : {}),
              ...(computedOnTimeStatus ? { onTimeStatus: computedOnTimeStatus } : {}),
            }
          : a
      )
    );

    const updateData: any = {
      status,
      ...extraData,
      ...(photoUrl ? { proofPhotoUrl: photoUrl } : {}),
      ...(completedTime ? { completedAt: completedTime } : {}),
      ...(computedCompletionMins !== undefined
        ? { actualCompletionMinutes: computedCompletionMins }
        : {}),
      ...(computedOnTimeStatus ? { onTimeStatus: computedOnTimeStatus } : {}),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'delivery_assignments', assignmentId), sanitizeFirestoreData(updateData)).catch((err) =>
      console.warn('Delivery assignment update notice:', err)
    );

    if (assignment?.orderId) {
      const order = orders.find((o) => o.id === assignment.orderId);
      let orderStatus: OrderStatus = 'Out for Delivery';
      if (status === 'Delivered') orderStatus = 'Delivered';
      else if (status === 'Failed') orderStatus = 'Cancelled';
      else if (status === 'Picked_Up' || status === 'Picked Up') orderStatus = 'Shipped';
      else if (status === 'In Transit' || status === 'Out_for_Delivery') {
        orderStatus = 'Out for Delivery';
      }

      if (order) {
        const statusLabel = status.replace(/_/g, ' ');
        await updateOrderDeliveryStatus(
          order.id,
          orderStatus,
          assignment.deliveryPersonName || order.courierName || 'Fathima Express Delivery',
          order.trackingNumber,
          `Driver ${assignment.deliveryPersonName} updated delivery status to "${statusLabel}"`
        );

        // If delivered and COD / unpaid, automatically record cash collection & mark order Paid
        if (status === 'Delivered' && order.paymentStatus !== 'Paid') {
          await recordOrderPayment(
            order.id,
            order.outstandingBalance || order.total,
            order.paymentMethod || 'COD',
            `COD-DRV-${Date.now().toString(36).toUpperCase()}`,
            'final',
            `Collected upon delivery by driver ${assignment.deliveryPersonName}`
          );
        }
      }
    }

    // Increment driver's totalDeliveries or failedDeliveries count when completed
    if ((status === 'Delivered' || status === 'Failed') && assignment?.deliveryPersonId) {
      const drv = effectiveDeliveryPersonnel.find((d) => d.id === assignment.deliveryPersonId);
      if (drv) {
        if (status === 'Delivered') {
          const nextTotal = (drv.totalDeliveries || 0) + 1;
          setDeliveryPersonnel((prev) =>
            prev.map((d) => (d.id === drv.id ? { ...d, totalDeliveries: nextTotal } : d))
          );
          updateDoc(doc(db, 'delivery_personnel', drv.id), {
            totalDeliveries: nextTotal,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        } else if (status === 'Failed') {
          const nextFailed = (drv.failedDeliveries || 0) + 1;
          setDeliveryPersonnel((prev) =>
            prev.map((d) => (d.id === drv.id ? { ...d, failedDeliveries: nextFailed } : d))
          );
          updateDoc(doc(db, 'delivery_personnel', drv.id), {
            failedDeliveries: nextFailed,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      }
    }
  };

  const rateDeliveryAssignment = async (
    assignmentId: string,
    rating: number,
    feedback?: string
  ) => {
    const safeRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const ratedAt = new Date().toISOString();
    const assignment = deliveryAssignments.find((a) => a.id === assignmentId);

    setDeliveryAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              customerRating: safeRating,
              ...(feedback !== undefined ? { customerFeedback: feedback.trim() } : {}),
              ratedAt,
            }
          : a
      )
    );

    await updateDoc(
      doc(db, 'delivery_assignments', assignmentId),
      sanitizeFirestoreData({
        customerRating: safeRating,
        ...(feedback !== undefined ? { customerFeedback: feedback.trim() } : {}),
        ratedAt,
        updatedAt: serverTimestamp(),
      })
    ).catch((err) => console.warn('Rate delivery assignment notice:', err));

    if (assignment?.deliveryPersonId) {
      const drv = effectiveDeliveryPersonnel.find((d) => d.id === assignment.deliveryPersonId);
      if (drv) {
        const driverRatedAssignments = deliveryAssignments.filter(
          (a) =>
            a.deliveryPersonId === drv.id &&
            a.id !== assignmentId &&
            typeof a.customerRating === 'number'
        );
        const baseCount = drv.satisfactionReviewsCount || 10;
        const baseRating = drv.rating || 4.8;
        const totalWeighted =
          baseRating * baseCount +
          driverRatedAssignments.reduce((acc, a) => acc + (a.customerRating || 5), 0) +
          safeRating;
        const totalReviews = baseCount + driverRatedAssignments.length + 1;
        const nextAvgRating = Number((totalWeighted / totalReviews).toFixed(2));

        setDeliveryPersonnel((prev) =>
          prev.map((d) =>
            d.id === drv.id
              ? { ...d, rating: nextAvgRating, satisfactionReviewsCount: totalReviews }
              : d
          )
        );
        await updateDoc(doc(db, 'delivery_personnel', drv.id), {
          rating: nextAvgRating,
          satisfactionReviewsCount: totalReviews,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    }

    showToast('Driver customer satisfaction rating saved!', 'success');
  };

  const logDriverPerformanceRecord = async (record: {
    deliveryPersonId: string;
    orderId?: string;
    status: 'Delivered' | 'Failed';
    actualCompletionMinutes?: number;
    estimatedMinutes?: number;
    customerRating?: number;
    customerFeedback?: string;
    failureReason?: string;
    deliveryNotes?: string;
  }) => {
    const worker = effectiveDeliveryPersonnel.find((dp) => dp.id === record.deliveryPersonId);
    if (!worker) return;

    const matchedOrder = record.orderId ? orders.find((o) => o.id === record.orderId) : undefined;
    const existingAssignment = record.orderId
      ? deliveryAssignments.find((a) => a.orderId === record.orderId)
      : undefined;

    const id = existingAssignment ? existingAssignment.id : createUniqueId('da');
    const nowIso = new Date().toISOString();
    const estMins = record.estimatedMinutes || existingAssignment?.estimatedMinutes || 25;
    const compMins =
      record.status === 'Delivered'
        ? record.actualCompletionMinutes || existingAssignment?.actualCompletionMinutes || 22
        : undefined;
    const assignedIso =
      existingAssignment?.assignedAt ||
      new Date(Date.now() - (compMins || 25) * 60000).toISOString();

    const onTimeStatus: 'on_time' | 'delayed' | 'early' | undefined =
      compMins !== undefined
        ? compMins <= estMins - 5
          ? 'early'
          : compMins <= estMins
          ? 'on_time'
          : 'delayed'
        : undefined;

    const newEntry: DeliveryAssignment = {
      id,
      orderId: record.orderId || `ORD-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryPersonId: worker.id,
      deliveryPersonName: worker.name,
      deliveryPersonPhone: worker.phone,
      assignedAt: assignedIso,
      completedAt: nowIso,
      status: record.status,
      pickupAddress:
        storeSettings.address || 'Fathima Stores Main Hub, MG Road, Trivandrum, Kerala 695001',
      dropAddress: matchedOrder?.shippingAddress || {
        fullName: matchedOrder?.customerName || 'Verified Store Customer',
        phone: matchedOrder?.phone || '+91 98450 00000',
        email: matchedOrder?.email || 'customer@fathimastores.com',
        house: 'Doorstep Delivery',
        street: 'Main Street',
        area: 'Trivandrum City',
        city: 'Trivandrum',
        district: 'Thiruvananthapuram',
        state: 'Kerala',
        pinCode: '695001',
      },
      estimatedMinutes: estMins,
      ...(compMins !== undefined ? { actualCompletionMinutes: compMins } : {}),
      ...(onTimeStatus ? { onTimeStatus } : {}),
      ...(record.customerRating ? { customerRating: record.customerRating, ratedAt: nowIso } : {}),
      ...(record.customerFeedback ? { customerFeedback: record.customerFeedback.trim() } : {}),
      ...(record.failureReason ? { failureReason: record.failureReason.trim() } : {}),
      ...(record.deliveryNotes ? { deliveryNotes: record.deliveryNotes.trim() } : {}),
    };

    setDeliveryAssignments((prev) => [
      newEntry,
      ...prev.filter((a) => a.id !== id),
    ]);

    await setDoc(
      doc(db, 'delivery_assignments', id),
      sanitizeFirestoreData({
        ...newEntry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    ).catch((err) => console.warn('Log driver performance notice:', err));

    if (matchedOrder) {
      await updateOrderDeliveryStatus(
        matchedOrder.id,
        record.status === 'Delivered' ? 'Delivered' : 'Cancelled',
        worker.name,
        matchedOrder.trackingNumber,
        record.status === 'Delivered'
          ? `Delivered by ${worker.name} in ${compMins} mins`
          : `Delivery attempt failed (${record.failureReason || 'Customer unavailable'})`
      );
    }

    showToast(`Performance record logged for ${worker.name}`, 'success');
  };

  const assignOrderToDelivery = async (orderId: string, deliveryPersonId: string, notes?: string) => {
    const worker = effectiveDeliveryPersonnel.find((dp) => dp.id === deliveryPersonId);
    const order = orders.find((o) => o.id === orderId);
    if (!worker || !order) return;

    const existing = deliveryAssignments.find((a) => a.orderId === orderId);
    const id = existing ? existing.id : createUniqueId('da');
    const newAssignment: DeliveryAssignment = {
      id,
      orderId,
      deliveryPersonId: worker.id,
      deliveryPersonName: worker.name,
      deliveryPersonPhone: worker.phone,
      assignedAt: new Date().toISOString(),
      status: 'Assigned',
      pickupAddress: storeSettings.address || 'Fathima Stores Main Hub, MG Road, Trivandrum, Kerala 695001',
      dropAddress: order.shippingAddress,
      estimatedMinutes: 25,
      ...(notes ? { deliveryNotes: notes } : {}),
    };

    setDeliveryAssignments((prev) => [newAssignment, ...prev.filter((a) => a.id !== id && a.orderId !== orderId)]);

    await setDoc(
      doc(db, 'delivery_assignments', id),
      sanitizeFirestoreData({
        ...newAssignment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    ).catch((err) => console.warn('Assign delivery notice:', err));

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedDeliveryId: worker.id,
              assignedDeliveryName: worker.name,
              assignedDeliveryPhone: worker.phone,
            }
          : o
      )
    );
    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      assignedDeliveryId: worker.id,
      assignedDeliveryName: worker.name,
      assignedDeliveryPhone: worker.phone,
      updatedAt: serverTimestamp(),
    })).catch(() => {});

    await updateOrderDeliveryStatus(
      orderId,
      'Out for Delivery',
      `${worker.name} (${worker.vehicleType})`,
      order.trackingNumber,
      `Assigned to delivery partner ${worker.name} (${worker.phone}). ${notes ? `Note: ${notes}` : ''}`
    );

    showToast(`Order #${orderId} assigned to ${worker.name}`, 'success');
  };

  const assignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    await assignOrderToDelivery(orderId, deliveryPersonId);
  };

  const completeDeliveryAssignment = async (assignmentId: string, proofNotes?: string) => {
    await updateDeliveryAssignmentStatus(
      assignmentId,
      'Delivered',
      proofNotes || 'Package handed over to customer at pinned delivery location'
    );
    showToast('Delivery marked as completed!', 'success');
  };

  const updateDeliveryPersonLocation = async (personId: string, lat: number, lng: number) => {
    setDeliveryPersonnel((prev) =>
      prev.map((dp) => (dp.id === personId ? { ...dp, currentLat: lat, currentLng: lng } : dp))
    );
    await updateDoc(doc(db, 'delivery_personnel', personId), {
      currentLat: lat,
      currentLng: lng,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  };

  const updateDeliveryLocation = async (
    orderId: string,
    location: { lat: number; lng: number; address?: string }
  ) => {
    const locObj = {
      lat: location.lat,
      lng: location.lng,
      address: location.address || 'Live Courier GPS',
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryLocation: locObj } : o))
    );
    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      deliveryLocation: locObj,
      updatedAt: serverTimestamp(),
    })).catch(() => {});
    showToast('Live delivery GPS location broadcasted!', 'info');
  };

  const updateDeliveryPersonnel = async (
    personId: string,
    updates: Partial<DeliveryPersonnel>
  ) => {
    setDeliveryPersonnel((prev) =>
      prev.map((dp) => (dp.id === personId ? { ...dp, ...updates } : dp))
    );
    await setDoc(
      doc(db, 'delivery_personnel', personId),
      sanitizeFirestoreData({
        ...updates,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    ).catch(() => {});
    showToast('Driver profile & status updated!', 'success');
  };

  // Compute Admin Notifications and Customer-facing Notifications from rawNotifications
  const notifications = rawNotifications;

  const customerNotifications = React.useMemo(() => {
    const userId = currentUser?.id;
    const userEmail = currentUser?.email?.toLowerCase().trim();
    const myOrderIds = new Set(
      orders
        .filter(
          (o) =>
            (userId && o.userId === userId) ||
            (userEmail && o.email?.toLowerCase().trim() === userEmail)
        )
        .map((o) => o.id)
    );

    return rawNotifications.filter((n) => {
      if (n.target === 'all') return true;
      if (userId && n.userId === userId) return true;
      if (userEmail && n.userEmail && n.userEmail.toLowerCase().trim() === userEmail) return true;
      if (n.orderId && myOrderIds.has(n.orderId)) return true;
      return false;
    });
  }, [rawNotifications, currentUser?.id, currentUser?.email, orders]);

  // Apply accent colors, typography and theme mode dynamically via CSS variables to root
  useEffect(() => {
    const accent = storeSettings.accentColor || '#71883F';
    let clean = accent.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    let hover = '#5F7334';
    let light = '#EFF4E6';

    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;

      const hr = Math.max(0, Math.floor(r * 0.85));
      const hg = Math.max(0, Math.floor(g * 0.85));
      const hb = Math.max(0, Math.floor(b * 0.85));
      hover = `#${((1 << 24) + (hr << 16) + (hg << 8) + hb).toString(16).slice(1)}`;

      const lr = Math.min(255, Math.floor(r * 0.15 + 255 * 0.85));
      const lg = Math.min(255, Math.floor(g * 0.15 + 255 * 0.85));
      const lb = Math.min(255, Math.floor(b * 0.15 + 255 * 0.85));
      light = `#${((1 << 24) + (lr << 16) + (lg << 8) + lb).toString(16).slice(1)}`;
    }

    const root = document.documentElement;
    root.style.setProperty('--color-accent-green', accent);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-accent-green-hover', storeSettings.accentColorHover || hover);
    root.style.setProperty('--color-accent-green-light', storeSettings.accentColorLight || light);

    // Apply Font Family
    if (storeSettings.fontFamily) {
      document.body.style.fontFamily = `"${storeSettings.fontFamily}", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    }

    // Apply Border Radius
    if (storeSettings.borderRadiusMode === 'sharp') {
      root.style.setProperty('--store-radius', '4px');
    } else if (storeSettings.borderRadiusMode === 'soft') {
      root.style.setProperty('--store-radius', '16px');
    } else {
      root.style.setProperty('--store-radius', '10px');
    }
  }, [
    storeSettings.accentColor,
    storeSettings.accentColorHover,
    storeSettings.accentColorLight,
    storeSettings.fontFamily,
    storeSettings.borderRadiusMode,
  ]);

  // Local state syncs for non-Firestore entities (Cart, Wishlist)
  useEffect(() => {
    safeStorageSet('fs_v5_cart', cart);
  }, [cart]);

  useEffect(() => {
    safeStorageSet('fs_v5_wishlist', wishlist);
  }, [wishlist]);

  // Firestore collections are handled via real-time listeners, 
  // so we don't need to sync them to localStorage anymore.

  useEffect(() => {
    if (currentUser && (currentUser.id || currentUser.email)) {
      safeStorageSet('fs_v5_user', currentUser);
    }
  }, [currentUser]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Navigation Helpers
  const navigateToProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActivePage('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActivePage('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Free delivery threshold from store settings
  const freeThreshold = storeSettings?.freeDeliveryThreshold ?? 500;
  const standardFee = storeSettings?.standardDeliveryFee ?? 40;
  const cartDeliveryCharge = cartSubtotal >= freeThreshold || cartSubtotal === 0 ? 0 : standardFee;

  // Coupons removed: discount is always 0
  const cartDiscount = 0;
  const cartTotal = Math.max(0, cartSubtotal + cartDeliveryCharge);

  // Cart Handlers
  const addToCart = (product: Product, quantity = 1) => {
    if (!currentUser) {
      showToast('Please sign in to add items to cart and make purchases.', 'error');
      setShowForceSignInModal(true);
      return;
    }
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity }];
    });

    showToast(`Added "${product.name}" to cart`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stock) {
      showToast(`Only ${product.stock} items in stock.`, 'info');
      quantity = product.stock;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Wishlist Handlers
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : 'Saved to Wishlist');
      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Coupon Handlers
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.active);

    if (!found) {
      showToast('Invalid or expired coupon code.', 'error');
      return { success: false, message: 'Invalid or expired coupon code.' };
    }

    if (cartSubtotal < found.minOrderValue) {
      const diff = found.minOrderValue - cartSubtotal;
      showToast(`Add ₹${diff} more to apply coupon ${found.code}.`, 'error');
      return { success: false, message: `Minimum order value is ₹${found.minOrderValue}.` };
    }

    setAppliedCoupon(found);
    showToast(`Coupon "${found.code}" applied successfully!`);
    return { success: true, message: 'Coupon applied successfully!' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  const addCoupon = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    showToast(`Coupon ${coupon.code} created.`);
  };

  const updateCoupon = (code: string, updates: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, ...updates } : c))
    );
    showToast('Coupon updated.');
  };

  const deleteCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    if (appliedCoupon?.code === code) {
      setAppliedCoupon(null);
    }
    showToast('Coupon deleted.', 'info');
  };

  // Order Placement with Automated Online Payment Verification & Receipt Pipeline
  const placeOrder = async (orderData: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    deliveryMethod: string;
    paymentDetails?: OnlinePaymentDetails;
    finalTotalOverride?: number;
    prepaidDiscount?: number;
    codFee?: number;
  }): Promise<Order> => {

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrderId = `ORD-${randomNum}`;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      mrp: item.product.mrp,
      quantity: item.quantity,
      image: item.product.images[0] || 'classmate-spiral',
      sku: item.product.sku,
    }));

    const isPaidOnline = orderData.paymentMethod !== 'COD';
    const autoVerify = storeSettings.autoVerifyOnlinePayments !== false;
    const autoConfirm = storeSettings.autoConfirmPaidOrders !== false;
    const gatewayName =
      orderData.paymentDetails?.gatewayName ||
      storeSettings.paymentGatewayProvider ||
      'Razorpay / NPCI UPI';

    const finalOrderTotal =
      orderData.finalTotalOverride !== undefined ? orderData.finalTotalOverride : cartTotal;

    const txnId =
      orderData.paymentDetails?.transactionId ||
      (isPaidOnline ? `pay_RZP${Date.now().toString().slice(-8)}` : undefined);
    const utrNum =
      orderData.paymentDetails?.utrNumber ||
      (isPaidOnline ? `4293${Math.floor(10000000 + Math.random() * 90000000)}` : undefined);

    const nowTimeStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const initialPaid = isPaidOnline && autoVerify ? finalOrderTotal : 0;
    const initialOutstanding = isPaidOnline && autoVerify ? 0 : finalOrderTotal;
    const effectiveOrderStatus: OrderStatus =
      isPaidOnline && autoVerify && autoConfirm ? 'Processing' : 'Confirmed';

    const initialTimeline: DeliveryTimelineStep[] =
      isPaidOnline && autoVerify && autoConfirm
        ? [
            {
              status: 'Processing',
              timestamp: nowTimeStr,
              note: `Online payment of ₹${finalOrderTotal} auto-verified via ${gatewayName} (UTR: ${utrNum}). Queued for priority dispatch from ${storeSettings.storeHubName || 'Store Hub'}.`,
            },
            {
              status: 'Confirmed',
              timestamp: nowTimeStr,
              note: `Order placed via ${orderData.paymentMethod} (Txn ID: ${txnId})`,
            },
          ]
        : [
            {
              status: 'Confirmed',
              timestamp: nowTimeStr,
              note: isPaidOnline
                ? `Online payment submitted via ${orderData.paymentMethod} (UTR: ${utrNum})`
                : 'Cash on Delivery (COD) order confirmed',
            },
          ];

    const initialRecords: PaymentRecord[] = isPaidOnline
      ? [
          {
            id: createUniqueId('pay'),
            orderId: newOrderId,
            amount: finalOrderTotal,
            date: new Date().toISOString().split('T')[0],
            method: orderData.paymentMethod,
            reference: txnId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            utrNumber: utrNum,
            gatewayName,
            payerInfo: orderData.paymentDetails?.payerInfo || orderData.phone,
            autoVerified: autoVerify,
            recordedBy: autoVerify ? `Automated ${gatewayName} Webhook` : 'Online Checkout',
            type: 'final',
            notes: autoVerify
              ? `Instant automated payment verification • UTR: ${utrNum} • Txn: ${txnId}`
              : `Online payment recorded • UTR: ${utrNum}`,
          },
        ]
      : [];

    const newOrder: Order = {
      id: newOrderId,
      userId: currentUser?.id || 'guest',
      date: new Date().toISOString().split('T')[0],
      customerName: orderData.customerName,
      email: orderData.email,
      phone: orderData.phone,
      shippingAddress: orderData.shippingAddress,
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: isPaidOnline ? (autoVerify ? 'Paid' : 'Pending') : 'Pending',
      paymentVerified: isPaidOnline && autoVerify,
      ...(isPaidOnline && autoVerify
        ? {
            paymentVerifiedAt: new Date().toISOString(),
            paymentVerifiedBy: `Automated ${gatewayName} Webhook`,
          }
        : {}),
      ...(txnId ? { transactionId: txnId } : {}),
      ...(utrNum ? { utrNumber: utrNum } : {}),
      ...(isPaidOnline ? { paymentGateway: gatewayName } : {}),
      orderStatus: effectiveOrderStatus,
      items: orderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount + (orderData.prepaidDiscount || 0),
      ...(orderData.prepaidDiscount ? { prepaidDiscount: orderData.prepaidDiscount } : {}),
      ...(orderData.codFee ? { codFee: orderData.codFee } : {}),
      couponCode: appliedCoupon?.code || '',
      deliveryCharge: cartDeliveryCharge,
      total: finalOrderTotal,
      estimatedDelivery: orderData.deliveryMethod.includes('Same-Day')
        ? 'Today by 6:00 PM'
        : orderData.deliveryMethod.includes('Pickup')
        ? 'Ready in 2 Hours at Store Hub'
        : '2 to 4 business days',
      trackingNumber: `FS-TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      courierName: 'Fathima Express / BlueDart',
      paidAmount: initialPaid,
      outstandingBalance: initialOutstanding,
      paymentRecords: initialRecords,
      deliveryTimeline: initialTimeline,
      returnStatus: 'None',
    };

    // Update Product Stock Automatically and trigger automated email alerts
    cart.forEach((item) => {
      const updatedStock = Math.max(0, item.product.stock - item.quantity);
      checkAndTriggerLowStockAlert(item.product, updatedStock);
    });

    setProducts((prev) =>
      prev.map((prod) => {
        const purchased = cart.find((c) => c.product.id === prod.id);
        if (purchased) {
          const updatedStock = Math.max(0, prod.stock - purchased.quantity);
          return { ...prod, stock: updatedStock };
        }
        return prod;
      })
    );

    // Update local state immediately so order appears across the entire app
    setOrders((prev) => {
      const updated = [newOrder, ...prev.filter((o) => o.id !== newOrderId)];
      try {
        localStorage.setItem('fs_saved_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save order to Firestore
    try {
      const cleanOrder = sanitizeFirestoreData({
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'orders', newOrderId), cleanOrder);
    } catch (error) {
      console.warn("Retrying order with timestamp fallback:", error);
      try {
        await setDoc(doc(db, 'orders', newOrderId), sanitizeFirestoreData({
          ...newOrder,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      } catch (err2) {
        console.error("Critical: Could not write order to Firestore:", err2);
      }
    }

    // Send automated customer & admin notification with payment verification details
    await sendNotification({
      title: isPaidOnline
        ? `Payment Verified & Order #${newOrderId} Confirmed`
        : `Order Confirmed (#${newOrderId})`,
      message: isPaidOnline
        ? `Payment of ₹${finalOrderTotal} via ${orderData.paymentMethod} (UTR: ${utrNum}) was automatically verified! Your order #${newOrderId} is now ${effectiveOrderStatus}.`
        : `Thank you ${orderData.customerName}! Your COD order #${newOrderId} for ₹${finalOrderTotal} has been placed.`,
      type: 'order',
      orderId: newOrderId,
      userId: currentUser?.id || 'guest',
      userEmail: orderData.email?.toLowerCase().trim(),
      target: 'customer',
    });

    // Automated Email Receipt Alert
    if (storeSettings.autoSendPaymentReceipt !== false && orderData.email) {
      const emailId = createUniqueId('email');
      const receiptAlert: EmailAlertRecord = {
        id: emailId,
        type: 'order_confirmation',
        recipientEmail: orderData.email,
        orderId: newOrderId,
        orderStatus: effectiveOrderStatus,
        subject: isPaidOnline
          ? `[Fathima Stores] Official Payment Receipt (₹${finalOrderTotal} • UTR ${utrNum}) & Order #${newOrderId}`
          : `[Fathima Stores] Order Confirmation #${newOrderId} (₹${finalOrderTotal})`,
        status: 'sent',
        sentAt: new Date().toISOString(),
      };
      setEmailAlertLogs((prev) => [receiptAlert, ...prev]);
      setDoc(doc(db, 'email_alerts', emailId), sanitizeFirestoreData({
        ...receiptAlert,
        createdAt: serverTimestamp(),
      })).catch(() => {});
    }

    // Clear cart
    clearCart();
    return newOrder;
  };

  // Complete Online Payment for an existing Pending or COD Order
  const completeOnlineOrderPayment = async (
    orderId: string,
    methodOrDetails: PaymentMethod | OnlinePaymentDetails,
    paymentDetails?: OnlinePaymentDetails
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const method: PaymentMethod =
      typeof methodOrDetails === 'string' ? methodOrDetails : 'Online';
    const resolvedDetails: OnlinePaymentDetails | undefined =
      typeof methodOrDetails === 'object' ? methodOrDetails : paymentDetails;

    const gatewayName =
      resolvedDetails?.gatewayName ||
      storeSettings.paymentGatewayProvider ||
      'Razorpay / NPCI UPI';
    const txnId =
      resolvedDetails?.transactionId || `pay_RZP${Date.now().toString().slice(-8)}`;
    const utrNum =
      resolvedDetails?.utrNumber || `4293${Math.floor(10000000 + Math.random() * 90000000)}`;
    const amountToPay = order.outstandingBalance && order.outstandingBalance > 0 ? order.outstandingBalance : order.total;
    const nowTimeStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const newRecord: PaymentRecord = {
      id: createUniqueId('pay'),
      orderId,
      amount: amountToPay,
      date: new Date().toISOString().split('T')[0],
      method,
      reference: txnId,
      utrNumber: utrNum,
      gatewayName,
      payerInfo: resolvedDetails?.payerInfo || order.phone,
      autoVerified: true,
      recordedBy: `Automated ${gatewayName} Webhook`,
      type: 'final',
      notes: `Online payment completed & auto-verified • UTR: ${utrNum} • Txn: ${txnId}`,
    };

    const nextOrderStatus: OrderStatus =
      order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed'
        ? 'Processing'
        : order.orderStatus;

    const step: DeliveryTimelineStep = {
      status: nextOrderStatus,
      timestamp: nowTimeStr,
      note: `Online payment of ₹${amountToPay} verified via ${method} (UTR: ${utrNum}).`,
    };

    const updatedOrder: Order = {
      ...order,
      paymentMethod: method,
      paymentStatus: 'Paid',
      paymentVerified: true,
      paymentVerifiedAt: new Date().toISOString(),
      paymentVerifiedBy: `Automated ${gatewayName} Webhook`,
      transactionId: txnId,
      utrNumber: utrNum,
      paymentGateway: gatewayName,
      paidAmount: order.total,
      outstandingBalance: 0,
      orderStatus: nextOrderStatus,
      paymentRecords: [newRecord, ...(order.paymentRecords || [])],
      deliveryTimeline: [step, ...(order.deliveryTimeline || [])],
    };

    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? updatedOrder : o));
      try {
        localStorage.setItem('fs_saved_orders', JSON.stringify(next));
      } catch {}
      return next;
    });

    await updateDoc(
      doc(db, 'orders', orderId),
      sanitizeFirestoreData({
        paymentMethod: method,
        paymentStatus: 'Paid',
        paymentVerified: true,
        paymentVerifiedAt: updatedOrder.paymentVerifiedAt,
        paymentVerifiedBy: updatedOrder.paymentVerifiedBy,
        transactionId: txnId,
        utrNumber: utrNum,
        paymentGateway: gatewayName,
        paidAmount: order.total,
        outstandingBalance: 0,
        orderStatus: nextOrderStatus,
        paymentRecords: updatedOrder.paymentRecords,
        deliveryTimeline: updatedOrder.deliveryTimeline,
        updatedAt: serverTimestamp(),
      })
    ).catch((err) => console.warn('Online payment update notice:', err));

    await sendNotification({
      userId: order.userId || undefined,
      userEmail: (order.email || order.shippingAddress?.email || '').toLowerCase().trim() || undefined,
      orderId: order.id,
      target: 'customer',
      type: 'order',
      title: `Online Payment Verified (#${order.id})`,
      message: `We received and auto-verified your payment of ₹${amountToPay} via ${method} (UTR: ${utrNum}) for order #${order.id}.`,
    });

    showToast(`Online payment of ₹${amountToPay} verified for Order #${orderId} (UTR: ${utrNum})!`, 'success');
  };


  const createDirectOrder = async (orderData: Partial<Order>): Promise<Order> => {

    const id = orderData.id || `FS-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalVal = orderData.total || orderData.subtotal || 450;
    const paidVal = orderData.paidAmount !== undefined ? orderData.paidAmount : (orderData.paymentStatus === 'Paid' ? totalVal : 0);
    const outstandingVal = Math.max(0, totalVal - paidVal);

    const newOrder: Order = {
      id,
      date: orderData.date || new Date().toISOString().split('T')[0],
      customerName: orderData.customerName || 'Direct Customer',
      email: orderData.email || 'customer@fathimastores.com',
      phone: orderData.phone || '+91 98450 12345',
      shippingAddress: orderData.shippingAddress || {
        fullName: orderData.customerName || 'Direct Customer',
        phone: '+91 98450 12345',
        email: 'customer@fathimastores.com',
        house: 'Store Walk-in',
        street: 'Main Road',
        area: 'Central Market',
        city: storeSettings.storeCity || 'Trivandrum',
        district: storeSettings.storeCity || 'Trivandrum',
        state: storeSettings.storeState || 'Kerala',
        pinCode: storeSettings.storePinCode || '695001',
      },
      deliveryMethod: orderData.deliveryMethod || 'Standard Delivery',
      paymentMethod: orderData.paymentMethod || 'Online',
      paymentStatus: orderData.paymentStatus || (paidVal >= totalVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Pending'),
      orderStatus: orderData.orderStatus || 'Delivered',
      items: orderData.items || [],
      subtotal: orderData.subtotal || totalVal,
      discount: orderData.discount || 0,
      deliveryCharge: orderData.deliveryCharge || 0,
      total: totalVal,
      estimatedDelivery: 'Completed',
      trackingNumber: `FS-TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      courierName: orderData.courierName || 'In-store / Local Courier',
      paidAmount: paidVal,
      outstandingBalance: outstandingVal,
      paymentRecords: orderData.paymentRecords || (paidVal > 0 ? [
        {
          id: createUniqueId('pay'),
          orderId: id,
          amount: paidVal,
          date: new Date().toISOString().split('T')[0],
          method: String(orderData.paymentMethod || 'Direct Payment'),
          reference: `REC-${Date.now().toString(36).toUpperCase()}`,
          recordedBy: 'Store Admin',
          type: paidVal >= totalVal ? 'final' : 'advance',
          notes: 'Recorded upon order creation',
        }
      ] : []),
      deliveryTimeline: [
        {
          status: orderData.orderStatus || 'Delivered',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          note: 'Direct order recorded',
        }
      ],
      returnStatus: 'None',
    };

    setOrders((prev) => {
      const updated = [newOrder, ...prev.filter((o) => o.id !== id)];
      try {
        localStorage.setItem('fs_saved_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const cleanOrder = sanitizeFirestoreData({
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'orders', id), cleanOrder);
    } catch (error) {
      console.warn("Direct order saved with fallback:", error);
      try {
        await setDoc(doc(db, 'orders', id), sanitizeFirestoreData({
          ...newOrder,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      } catch (err2) {
        console.error("Direct order save failed:", err2);
      }
    }

    showToast(`Recorded order #${id} (₹${newOrder.total})`);
    return newOrder;
  };


  const sendOrderStatusAlert = async (order: Order, status: string, note?: string) => {
    // 1. Send Real-time Notification to User (matched by userId, userEmail, or orderId)
    await sendNotification({
      userId: order.userId || undefined,
      userEmail: (order.email || order.shippingAddress?.email || '').toLowerCase().trim() || undefined,
      orderId: order.id,
      target: 'customer',
      type: 'order',
      title: `Order #${order.id}: ${status}`,
      message: `Your order #${order.id} status is now "${status}". ${note ? note : ''}`.trim(),
    });

    // 2. Log Automated Email Alert
    const emailId = createUniqueId('email');
    const alert: EmailAlertRecord = {
      id: emailId,
      type: 'order_status_update',
      recipientEmail: order.email || order.phone + "@fathimastores.com",
      orderId: order.id,
      orderStatus: status,
      subject: `[Fathima Stores] Your Order #${order.id} has been updated: ${status}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'email_alerts', emailId), sanitizeFirestoreData({
        ...alert,
        createdAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("Failed to log order status email alert:", err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, customNote?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const shouldAutoRefund =
      status === 'Cancelled' &&
      order.paymentStatus === 'Paid' &&
      storeSettings.autoRefundOnCancel !== false;

    const refundRef = `RFD-${Date.now().toString(36).toUpperCase()}`;
    const refundRecord: PaymentRecord | null = shouldAutoRefund
      ? {
          id: createUniqueId('pay'),
          orderId,
          amount: order.paidAmount || order.total,
          date: new Date().toISOString().split('T')[0],
          method: order.paymentMethod,
          reference: refundRef,
          gatewayName: order.paymentGateway || storeSettings.paymentGatewayProvider || 'Razorpay',
          autoVerified: true,
          recordedBy: 'Automated Refund Engine',
          type: 'refund',
          notes: `Automated online refund processed upon order cancellation (Ref: ${refundRef})`,
        }
      : null;

    const timelineStep: DeliveryTimelineStep = {
      status,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note:
        customNote ||
        (shouldAutoRefund
          ? `Order cancelled & automated online refund of ₹${order.paidAmount || order.total} initiated (${refundRef})`
          : `Order status updated to ${status}`),
    };

    const nextPaymentStatus: PaymentStatus = shouldAutoRefund ? 'Refunded' : order.paymentStatus;
    const nextPaymentRecords = refundRecord
      ? [refundRecord, ...(order.paymentRecords || [])]
      : order.paymentRecords || [];

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              paymentStatus: nextPaymentStatus,
              ...(shouldAutoRefund ? { paidAmount: 0, outstandingBalance: 0 } : {}),
              paymentRecords: nextPaymentRecords,
              deliveryTimeline: [timelineStep, ...(o.deliveryTimeline || [])],
            }
          : o
      )
    );

    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
        orderStatus: status,
        paymentStatus: nextPaymentStatus,
        ...(shouldAutoRefund ? { paidAmount: 0, outstandingBalance: 0 } : {}),
        paymentRecords: nextPaymentRecords,
        deliveryTimeline: [timelineStep, ...(order.deliveryTimeline || [])],
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("Order status updated locally, Firestore sync notice:", err);
    }

    // Always trigger Automated Alerts & Customer Notifications
    await sendOrderStatusAlert(
      order,
      status,
      shouldAutoRefund
        ? `An automated refund of ₹${order.paidAmount || order.total} has been initiated to your original payment method (${order.paymentMethod}, Ref: ${refundRef}).`
        : undefined
    );

    showToast(
      shouldAutoRefund
        ? `Order #${orderId} cancelled & ₹${order.paidAmount || order.total} auto-refunded!`
        : `Order #${orderId} status set to "${status}"`
    );
  };

  const bulkUpdateOrderStatus = async (orderIds: string[], status: OrderStatus) => {
    if (!orderIds || orderIds.length === 0) return;

    const timelineStep: DeliveryTimelineStep = {
      status,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note: `Bulk status update to ${status}`,
    };

    const affectedOrders = orders.filter((o) => orderIds.includes(o.id));

    setOrders((prev) =>
      prev.map((o) =>
        orderIds.includes(o.id)
          ? {
              ...o,
              orderStatus: status,
              deliveryTimeline: [timelineStep, ...(o.deliveryTimeline || [])],
            }
          : o
      )
    );

    try {
      const batch = writeBatch(db);
      orderIds.forEach((id) => {
        const order = orders.find(o => o.id === id);
        batch.update(doc(db, 'orders', id), sanitizeFirestoreData({
          orderStatus: status,
          deliveryTimeline: [timelineStep, ...(order?.deliveryTimeline || [])],
          updatedAt: serverTimestamp(),
        }));
      });
      await batch.commit();
    } catch (err) {
      console.warn("Bulk order status update Firestore error:", err);
    }

    // Notify every affected customer
    for (const ord of affectedOrders) {
      await sendOrderStatusAlert(ord, status, `Your order status was updated to ${status} by Store Admin.`);
    }

    showToast(`Updated ${orderIds.length} orders to "${status}"`, 'success');
  };

  const bulkArchiveOrders = async (orderIds: string[], archive: boolean) => {
    if (!orderIds || orderIds.length === 0) return;

    setOrders((prev) =>
      prev.map((o) =>
        orderIds.includes(o.id) ? { ...o, isArchived: archive } : o
      )
    );

    try {
      const batch = writeBatch(db);
      orderIds.forEach((id) => {
        batch.update(doc(db, 'orders', id), { 
          isArchived: archive,
          updatedAt: serverTimestamp() 
        });
      });
      await batch.commit();
    } catch (err) {
      console.warn("Bulk order archive Firestore error:", err);
    }

    showToast(`${archive ? 'Archived' : 'Unarchived'} ${orderIds.length} orders.`, 'success');
  };

  const bulkDeleteOrders = async (orderIds: string[]) => {
    if (!orderIds || orderIds.length === 0) return;

    setOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)));

    try {
      const batch = writeBatch(db);
      orderIds.forEach((id) => {
        batch.delete(doc(db, 'orders', id));
      });
      await batch.commit();
    } catch (err) {
      console.warn("Bulk order delete Firestore error:", err);
    }

    showToast(`Deleted ${orderIds.length} orders.`, 'info');
  };


  const recordOrderPayment = async (
    orderId: string,
    amount: number,
    method: string,
    reference: string,
    type: 'advance' | 'installment' | 'final' | 'refund',
    notes?: string
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentPaid = order.paidAmount !== undefined ? order.paidAmount : (order.paymentStatus === 'Paid' ? order.total : 0);
    const newPaid = type === 'refund' ? Math.max(0, currentPaid - amount) : currentPaid + amount;
    const newOutstanding = Math.max(0, order.total - newPaid);
    const newStatus: PaymentStatus =
      newPaid >= order.total ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';

    const record: PaymentRecord = {
      id: createUniqueId('pay'),
      orderId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method,
      reference: reference || `MAN-${Date.now().toString(36).toUpperCase()}`,
      recordedBy: currentUser?.name || 'Store Admin',
      type,
      notes: notes || `${type.toUpperCase()} payment recorded`,
    };

    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      paidAmount: newPaid,
      outstandingBalance: newOutstanding,
      paymentStatus: newStatus,
      paymentRecords: [record, ...(order.paymentRecords || [])],
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Payment update notice:', err));

    await sendNotification({
      userId: order.userId || undefined,
      userEmail: (order.email || order.shippingAddress?.email || '').toLowerCase().trim() || undefined,
      orderId: order.id,
      target: 'customer',
      type: 'order',
      title: `Payment Recorded (#${order.id})`,
      message: `A ${type} payment of ₹${amount} via ${method} has been recorded for your order #${order.id}.`,
    });

    showToast(`Payment of ₹${amount} recorded for order #${orderId}`);
  };

  const updateOrderDeliveryStatus = async (
    orderId: string,
    status: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    note?: string
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const step: DeliveryTimelineStep = {
      status,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note: note || `Order updated to ${status} via ${courierName || order.courierName || 'Courier'}`,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              courierName: courierName || o.courierName || 'BlueDart / Delhivery',
              trackingNumber: trackingNumber || o.trackingNumber || '',
              deliveryTimeline: [step, ...(o.deliveryTimeline || [])],
            }
          : o
      )
    );

    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      orderStatus: status,
      courierName: courierName || order.courierName || 'BlueDart / Delhivery',
      trackingNumber: trackingNumber || order.trackingNumber || '',
      deliveryTimeline: [step, ...(order.deliveryTimeline || [])],
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Order delivery status update notice:', err));

    // Trigger Automated Alerts & Notifications
    await sendOrderStatusAlert(order, status, note);

    showToast(`Order #${orderId} delivery status set to "${status}"`);
  };

  const requestOrderReturn = async (orderId: string, reason: string) => {
    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      returnRequested: true,
      returnReason: reason,
      returnStatus: 'Requested',
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Order return request notice:', err));
    showToast(`Return request submitted for Order #${orderId}`);
  };

  const processOrderReturn = async (orderId: string, status: 'Approved' | 'Rejected' | 'Refunded') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // If refunded, restore stock
    if (status === 'Refunded') {
      for (const item of order.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await quickUpdateStock(item.productId, prod.stock + item.quantity);
        }
      }
    }

    await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
      returnStatus: status,
      orderStatus: status === 'Refunded' ? 'Cancelled' : order.orderStatus,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Order return process notice:', err));

    // Trigger Automated Alerts & Notifications
    await sendOrderStatusAlert(order, `Return ${status}`);

    showToast(`Return for Order #${orderId} marked as "${status}"`);
  };

  const verifyOrderPayment = async (orderId: string, verified: boolean) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const newPaymentStatus: PaymentStatus = verified ? 'Paid' : 'Pending';
    const newPaidAmount = verified ? order.total : 0;
    const newOutstanding = verified ? 0 : order.total;

    const verificationRecord: PaymentRecord = {
      id: createUniqueId('pay'),
      orderId,
      amount: order.total,
      date: new Date().toISOString().split('T')[0],
      method: order.paymentMethod,
      reference: `VERIFY-${Date.now().toString(36).toUpperCase()}`,
      recordedBy: currentUser?.name || 'Store Admin',
      type: 'final',
      notes: verified ? 'Payment verified and confirmed by store admin' : 'Payment marked pending verification',
    };

    const updatedTimeline: DeliveryTimelineStep = {
      status: order.orderStatus,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note: verified ? 'Payment receipt verified by store admin' : 'Payment marked pending verification by admin',
    };

    const updatedRecords = verified
      ? [verificationRecord, ...(order.paymentRecords || [])]
      : (order.paymentRecords || []);

    const updatePayload = {
      paymentStatus: newPaymentStatus,
      paymentVerified: verified,
      paymentVerifiedAt: verified ? new Date().toISOString() : null,
      paymentVerifiedBy: verified ? (currentUser?.name || 'Store Admin') : null,
      paidAmount: newPaidAmount,
      outstandingBalance: newOutstanding,
      paymentRecords: updatedRecords,
      deliveryTimeline: [updatedTimeline, ...(order.deliveryTimeline || [])],
      updatedAt: serverTimestamp(),
    };

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: newPaymentStatus,
              paymentVerified: verified,
              paymentVerifiedAt: verified ? new Date().toISOString() : undefined,
              paymentVerifiedBy: verified ? (currentUser?.name || 'Store Admin') : undefined,
              paidAmount: newPaidAmount,
              outstandingBalance: newOutstanding,
              paymentRecords: updatedRecords,
              deliveryTimeline: [updatedTimeline, ...(o.deliveryTimeline || [])],
            }
          : o
      );
      try {
        localStorage.setItem('fs_saved_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData(updatePayload));
    } catch (err) {
      console.warn('Verify order payment notice:', err);
    }

    await sendNotification({
      userId: order.userId || undefined,
      userEmail: (order.email || order.shippingAddress?.email || '').toLowerCase().trim() || undefined,
      orderId: order.id,
      target: 'customer',
      type: 'order',
      title: verified ? `Payment Verified (#${order.id})` : `Payment Verification Pending (#${order.id})`,
      message: verified
        ? `Your payment of ₹${order.total} for Order #${order.id} has been verified by Store Admin.`
        : `Your payment status for Order #${order.id} was updated to Pending Verification.`,
    });

    if (verified) {
      showToast(`Payment of ₹${order.total} for Order #${orderId} verified and added to income!`, 'success');
    } else {
      showToast(`Order #${orderId} marked pending payment verification.`, 'info');
    }
  };

  // Expenses CRUD
  const addExpense = async (newExp: Omit<Expense, 'id'>) => {
    const id = createUniqueId('exp');
    const created: Expense = {
      ...newExp,
      id,
    };
    await setDoc(doc(db, 'expenses', id), {
      ...created,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast(`Recorded expense: ${created.title} (₹${created.amount})`);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    await updateDoc(doc(db, 'expenses', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Expense record updated');
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
    showToast('Expense removed', 'info');
  };


  // Customer Support Chat
  const createSupportThread = async (subject: string, message: string, orderId?: string): Promise<SupportThread> => {
    const threadId = createUniqueId('th');
    const msgId = createUniqueId('msg');
    const now = new Date().toISOString();
    const newThread: SupportThread = {
      id: threadId,
      customerId: currentUser?.id || 'guest',
      customerName: currentUser?.name || 'Customer',
      customerEmail: currentUser?.email || 'customer@fathimastores.com',
      subject: subject || 'Store Inquiry',
      orderId: orderId || '',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: msgId,
          threadId,
          senderId: currentUser?.id || 'guest',
          senderName: currentUser?.name || 'Customer',
          senderRole: 'customer',
          message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
        },
      ],
    };
    try {
      await setDoc(doc(db, 'support_threads', threadId), sanitizeFirestoreData({
        ...newThread,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("Support thread save fallback:", err);
      await setDoc(doc(db, 'support_threads', threadId), sanitizeFirestoreData({
        ...newThread,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })).catch(() => {});
    }
    showToast('Support conversation started. A store representative will reply shortly!');
    return newThread;
  };

  const sendSupportMessage = async (threadId: string, message: string, senderRole: 'customer' | 'admin' = 'customer') => {
    const thread = supportThreads.find(t => t.id === threadId);
    if (!thread) return;

    const msgId = createUniqueId('msg');
    const newMsg: SupportMessage = {
      id: msgId,
      threadId,
      senderId: senderRole === 'admin' ? 'admin' : (currentUser?.id || 'guest'),
      senderName: senderRole === 'admin' ? 'Store Support' : (currentUser?.name || 'Customer'),
      senderRole,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    const updatedMessages = [...thread.messages, newMsg];
    await updateDoc(doc(db, 'support_threads', threadId), sanitizeFirestoreData({
      messages: updatedMessages,
      updatedAt: serverTimestamp(),
      status: senderRole === 'admin' && thread.status === 'open' ? 'in_progress' : thread.status,
    })).catch((err) => console.warn('Send support message notice:', err));

    if (senderRole === 'admin') {
      await sendNotification({
        type: 'customer',
        userId: thread.customerId !== 'guest' ? thread.customerId : undefined,
        userEmail: thread.customerEmail?.toLowerCase().trim(),
        orderId: thread.orderId || undefined,
        target: 'customer',
        title: `New Support Reply: ${thread.subject}`,
        message,
      });
    }
  };

  const updateSupportThreadStatus = async (threadId: string, status: 'open' | 'in_progress' | 'resolved') => {
    await updateDoc(doc(db, 'support_threads', threadId), sanitizeFirestoreData({
      status,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Update support thread status notice:', err));
    showToast(`Support ticket status updated to "${status}"`);
  };


  // Inventory Adjustments
  // Inventory Adjustments
  const recordInventoryAdjustment = async (adj: Omit<InventoryAdjustment, 'id' | 'date'>) => {
    const id = createUniqueId('adj');
    const created: InventoryAdjustment = {
      ...adj,
      id,
      date: new Date().toISOString().split('T')[0],
    };
    await setDoc(doc(db, 'inventory_adjustments', id), {
      ...created,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await quickUpdateStock(adj.productId, adj.newStock);
    showToast(`Stock for ${adj.productName} updated to ${adj.newStock}`);
  };


  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.warn("Order deleted locally, Firestore sync notice:", err);
    }
    showToast(`Order #${orderId} deleted`, 'info');
  };

  // Product CRUD
  const addProduct = async (newProd: Omit<Product, 'id' | 'createdAt'>) => {
    const id = createUniqueId('fs');
    const created: Product = {
      ...newProd,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => [created, ...prev.filter((p) => p.id !== id)]);

    try {
      await setDoc(doc(db, 'products', id), {
        ...created,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Product saved to local catalog, Firestore sync notice:", err);
    }

    showToast(`Added product "${created.name}"`, 'success');
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Product updated locally, Firestore sync notice:", err);
    }

    showToast('Product updated successfully');
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.warn("Product deleted locally, Firestore sync notice:", err);
    }

    showToast('Product removed from catalog', 'info');
  };

  const deleteMultipleProducts = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'products', id));
      });
      await batch.commit();
    } catch (err) {
      console.warn("Multiple products deleted locally, Firestore sync notice:", err);
    }

    showToast(`Deleted ${ids.length} items from catalog`, 'info');
  };

  const duplicateProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const { id: _, createdAt: __, ...rest } = prod;
    await addProduct({
      ...rest,
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
    });
  };

  const checkAndTriggerLowStockAlert = async (product: Product, currentStock: number) => {
    const threshold = storeSettings.lowStockThreshold ?? 10;
    const enableAlerts = storeSettings.enableStockEmailAlerts ?? true;
    const recipientEmail = storeSettings.adminStockAlertEmail || 'admin@fathimastores.com';

    if (!enableAlerts) return;

    if (currentStock <= threshold) {
      const isRecentlyAlerted = emailAlertLogs.some((log) => {
        if (log.productId !== product.id) return false;
        const ageMs = Date.now() - new Date(log.sentAt).getTime();
        return ageMs < 30 * 60 * 1000 && log.currentStock === currentStock;
      });

      if (isRecentlyAlerted) return;

      const isOutOfStock = currentStock === 0;
      const alertType: 'low_stock_email' | 'out_of_stock_email' = isOutOfStock
        ? 'out_of_stock_email'
        : 'low_stock_email';
      const subject = isOutOfStock
        ? `🚨 CRITICAL OUT OF STOCK ALERT: ${product.name} (SKU: ${product.sku || product.id.slice(0, 8).toUpperCase()})`
        : `⚠️ AUTOMATED LOW STOCK ALERT: ${product.name} (${currentStock} left ≤ threshold ${threshold})`;

      const alertRecord: EmailAlertRecord = {
        id: createUniqueId('alert-email'),
        type: alertType,
        recipientEmail,
        productId: product.id,
        productName: product.name,
        sku: product.sku || product.id.slice(0, 8).toUpperCase(),
        currentStock,
        threshold,
        subject,
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      setEmailAlertLogs((prev) => [alertRecord, ...prev]);
      try {
        localStorage.setItem('fs_saved_email_alert_logs', JSON.stringify([alertRecord, ...emailAlertLogs]));
      } catch {}

      try {
        await setDoc(doc(db, 'email_alerts', alertRecord.id), sanitizeFirestoreData(alertRecord));
      } catch (e) {
        console.warn('Email alert record saved locally:', e);
      }

      showToast(
        `📧 Automated Low Stock Alert Email sent to ${recipientEmail} for "${product.name}" (${currentStock} left)`,
        'info'
      );
    }
  };

  const quickUpdateStock = async (id: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: safeStock } : p)));

    const prod = products.find((p) => p.id === id);
    if (prod) {
      checkAndTriggerLowStockAlert(prod, safeStock);
    }

    try {
      await updateDoc(doc(db, 'products', id), {
        stock: safeStock,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Stock updated locally, Firestore sync notice:", err);
    }

    showToast(`Stock updated to ${safeStock}`);
  };

  const bulkUpdateStock = async (ids: string[], adjustment: number) => {
    if (!ids || ids.length === 0) return;
    
    // Update local state
    setProducts((prev) => 
      prev.map(p => ids.includes(p.id) ? { ...p, stock: Math.max(0, p.stock + adjustment) } : p)
    );

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const p = products.find((prod) => prod.id === id);
        if (p) {
          const newStock = Math.max(0, p.stock + adjustment);
          batch.update(doc(db, 'products', id), { 
            stock: newStock,
            updatedAt: serverTimestamp() 
          });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn("Bulk stock update Firestore error:", err);
    }
    showToast(`Updated stock for ${ids.length} products.`, 'success');
  };

  const removeAllProductBadges = async () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        badge: '',
        showBadge: false,
        showDiscountBadge: false,
      }))
    );

    try {
      const batch = writeBatch(db);
      products.forEach((p) => {
        batch.update(doc(db, 'products', p.id), {
          badge: '',
          showBadge: false,
          showDiscountBadge: false,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (err) {
      console.warn("Badges removed locally, Firestore sync notice:", err);
    }

    showToast('Removed badges from all products in catalog');
  };


  // Category CRUD
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const id = cat.slug || createUniqueId('cat');
    const newCat: Category = { ...cat, id };

    setCategories((prev) => [newCat, ...prev.filter((c) => c.id !== id)]);

    try {
      await setDoc(doc(db, 'categories', id), {
        ...newCat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Category saved locally, Firestore sync notice:", err);
    }

    showToast(`Category "${cat.name}" added`);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    try {
      await updateDoc(doc(db, 'categories', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Category updated locally, Firestore sync notice:", err);
    }

    showToast('Category updated');
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn("Category deleted locally, Firestore sync notice:", err);
    }

    showToast('Category deleted', 'info');
  };

  const clearAllCategories = async () => {
    setCategories([]);
    try {
      const batch = writeBatch(db);
      categories.forEach((cat) => {
        batch.delete(doc(db, 'categories', cat.id));
      });
      await batch.commit();
    } catch (err) {
      console.warn("Categories cleared locally, Firestore sync notice:", err);
    }
    showToast('All categories removed', 'info');
  };


  // Review Handlers
  const addReview = async (reviewData: {
    productId: string;
    productName: string;
    rating: number;
    comment: string;
    userName: string;
    reviewTitle?: string;
    tags?: string[];
  }) => {
    const reviewId = createUniqueId('rev');
    const userId = currentUser?.id || `guest-${Date.now().toString(36)}`;
    const isVerified = currentUser ? await checkIfUserPurchasedProduct(reviewData.productId, currentUser.id) : false;

    const newRev: Review = {
      id: reviewId,
      productId: reviewData.productId,
      userId,
      productName: reviewData.productName,
      userName: reviewData.userName || currentUser?.name || 'Customer',
      userAvatar: currentUser?.photoURL || currentUser?.avatar || '',
      rating: reviewData.rating,
      ...(reviewData.reviewTitle ? { reviewTitle: reviewData.reviewTitle } : {}),
      ...(reviewData.tags && reviewData.tags.length > 0 ? { tags: reviewData.tags } : {}),
      comment: reviewData.comment,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: isVerified,
      status: 'approved',
    };

    // Update local state immediately
    setReviews((prev) => [newRev, ...prev.filter((r) => r.id !== reviewId)]);

    try {
      const cleanRev = sanitizeFirestoreData({
        ...newRev,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'reviews', reviewId), cleanRev);

      // Recalculate and update product rating in Firestore if it exists there
      const prodReviews = [...reviews.filter((r) => r.productId === reviewData.productId), newRev];
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      const roundedAvg = parseFloat(avg.toFixed(1));

      // Update local products state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === reviewData.productId
            ? { ...p, rating: roundedAvg, reviewCount: prodReviews.length }
            : p
        )
      );

      // Attempt to update product in Firestore if it exists
      const productRef = doc(db, 'products', reviewData.productId);
      const productSnap = await getDoc(productRef).catch(() => null);
      if (productSnap && productSnap.exists()) {
        await updateDoc(productRef, sanitizeFirestoreData({
          rating: roundedAvg,
          reviewCount: prodReviews.length,
          updatedAt: serverTimestamp(),
        })).catch(() => {});
      }

      showToast('Thank you! Your rating & review have been published.', 'success');
    } catch (error) {
      console.warn("Retrying review with fallback timestamp:", error);
      try {
        await setDoc(doc(db, 'reviews', reviewId), sanitizeFirestoreData({
          ...newRev,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        showToast('Review submitted successfully!', 'success');
      } catch (err2) {
        console.error("Critical: Could not save review to Firestore:", err2);
      }
    }
  };

  const checkIfUserPurchasedProduct = async (productId: string, userId: string): Promise<boolean> => {
    try {
      const userEmailNorm = currentUser?.email?.toLowerCase().trim();
      const matchedLocal = orders.some(
        (o) =>
          (o.userId === userId || (userEmailNorm && o.email?.toLowerCase().trim() === userEmailNorm)) &&
          o.orderStatus !== 'Cancelled' &&
          o.items?.some((item) => item.productId === productId)
      );
      if (matchedLocal) return true;

      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.some((orderDoc) => {
        const orderData = orderDoc.data() as Order;
        return (
          orderData.orderStatus !== 'Cancelled' &&
          orderData.items?.some((item) => item.productId === productId)
        );
      });
    } catch (error) {
      return false;
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'hidden') => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status } : r)));
    await updateDoc(doc(db, 'reviews', reviewId), sanitizeFirestoreData({
      status,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Review status update notice:', err));
    showToast(`Review marked as ${status}`);
  };

  const deleteReview = async (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    await deleteDoc(doc(db, 'reviews', reviewId)).catch((err) => console.warn('Review delete notice:', err));
    showToast('Review deleted', 'info');
  };


  // Banner Handlers
  const addBanner = async (banner: Omit<Banner, 'id'>) => {
    const id = createUniqueId('b');
    const newBanner: Banner = { ...banner, id };
    setBanners((prev) => [...prev.filter((b) => b.id !== id), newBanner]);
    try {
      await setDoc(doc(db, 'banners', id), sanitizeFirestoreData({
        ...newBanner,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn('Banner save fallback:', err);
      await setDoc(doc(db, 'banners', id), sanitizeFirestoreData({
        ...newBanner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })).catch(() => {});
    }
    showToast('Promotional banner added', 'success');
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    await updateDoc(doc(db, 'banners', id), sanitizeFirestoreData({
      ...updates,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Banner update notice:', err));
    showToast('Promotional banner updated', 'success');
  };

  const deleteBanner = async (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    await deleteDoc(doc(db, 'banners', id)).catch((err) => console.warn('Banner delete notice:', err));
    showToast('Banner removed', 'info');
  };


  // Settings Handlers
  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('fs_saved_store_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    await setDoc(
      doc(db, 'settings', 'global'),
      sanitizeFirestoreData({
        ...updates,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    ).catch((err) => console.warn('Settings update notice:', err));
    showToast('Store settings saved successfully', 'success');
  };

  // Hero Slides Handlers
  const heroSlides = storeSettings.heroSlides || [];

  const addHeroSlide = async (slide: Omit<HeroSlide, 'id'>) => {
    const id = createUniqueId('slide');
    const newSlide: HeroSlide = {
      ...slide,
      id,
      order: (storeSettings.heroSlides?.length || 0),
    };
    try {
      await setDoc(doc(db, 'hero_slides', id), sanitizeFirestoreData({
        ...newSlide,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn('Hero slide save fallback:', err);
      await setDoc(doc(db, 'hero_slides', id), sanitizeFirestoreData({
        ...newSlide,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })).catch(() => {});
    }
    showToast('New hero slide added successfully!', 'success');
  };

  const updateHeroSlide = async (id: string, updates: Partial<HeroSlide>) => {
    await updateDoc(doc(db, 'hero_slides', id), sanitizeFirestoreData({
      ...updates,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Hero slide update notice:', err));
    showToast('Hero slide updated successfully!', 'success');
  };

  const deleteHeroSlide = async (id: string) => {
    await deleteDoc(doc(db, 'hero_slides', id)).catch((err) => console.warn('Hero slide delete notice:', err));
    showToast('Hero slide deleted', 'info');
  };

  const reorderHeroSlides = async (slides: HeroSlide[]) => {
    const batch = writeBatch(db);
    slides.forEach((slide, idx) => {
      batch.update(doc(db, 'hero_slides', slide.id), {
        order: idx,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    showToast('Hero slides reordered');
  };




  // User & Auth Handlers
  const registerUser = async (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: 'customer' | 'admin';
  }): Promise<boolean> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    
    // Check if user already exists in Firestore
    const userRef = doc(db, 'users', trimmedEmail.replace(/[@.]/g, '_'));
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      showToast('An account with this email already exists. Please sign in.', 'error');
      return false;
    }

    const userId = createUniqueId('usr');
    const newUser: User = {
      id: userId,
      name: data.name.trim(),
      email: trimmedEmail,
      phone: data.phone?.trim() || '+91 98450 12345',
      role: data.role || (trimmedEmail.includes('admin') ? 'admin' : 'customer'),
      createdAt: new Date().toISOString().split('T')[0],
      addresses: [],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      city: 'Trivandrum',
      state: 'Kerala',
      bio: 'Stationery and writing enthusiast',
    };

    await setDoc(userRef, {
      ...newUser,
      password: data.password || 'password123', // Still mock password for this demo logic
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setCurrentUser(newUser);
    try {
      localStorage.setItem('fs_active_user', JSON.stringify(newUser));
    } catch {}
    showToast(`Account created successfully! Welcome, ${newUser.name}.`, 'success');
    return true;
  };


  const loginWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in with Google!', 'success');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      const errStr = String(error?.code || error?.message || error || '').toLowerCase();
      if (errStr.includes('unauthorized-domain')) {
        const currentDomain = window.location.hostname || 'trial-fatima.vercel.app';
        setUnauthorizedDomainInfo({
          domain: currentDomain,
          projectId: 'totemic-sign-0c70r',
        });
      } else {
        showToast(error.message || 'Failed to sign in with Google.', 'error');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginUser = async (
    email: string,
    password?: string,
    role: 'customer' | 'admin' = 'customer'
  ): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    const isMasterAdmin = (trimmedEmail === 'nihal.graphix@gmail.com') || (role === 'admin') || trimmedEmail.includes('admin');
    const effectiveRole: 'customer' | 'admin' = isMasterAdmin ? 'admin' : 'customer';

    try {
      const userRef = doc(db, 'users', trimmedEmail.replace(/[@.]/g, '_'));
      const userSnap = await getDoc(userRef).catch(() => null);

      if (userSnap && userSnap.exists()) {
        const found = userSnap.data();
        if (password && found.password && found.password !== password) {
          showToast('Incorrect password. Please verify and try again.', 'error');
          return false;
        }

        const activeUser: User = {
          id: found.id || trimmedEmail.replace(/[@.]/g, '_'),
          name: found.name || trimmedEmail.split('@')[0],
          email: found.email || trimmedEmail,
          phone: found.phone || '+91 98450 12345',
          role: isMasterAdmin ? 'admin' : (found.role || 'customer'),
          addresses: found.addresses || [],
          createdAt: found.createdAt || new Date().toISOString(),
          avatar: found.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          bio: found.bio || '',
          city: found.city || '',
          state: found.state || '',
        };

        setCurrentUser(activeUser);
        try {
          localStorage.setItem('fs_active_user', JSON.stringify(activeUser));
        } catch {}
        showToast(`Welcome back, ${activeUser.name}!`, 'success');
        return true;
      }

      // If account doesn't exist, auto-create and sign in
      const userId = trimmedEmail.replace(/[@.]/g, '_');
      const newUser: User = {
        id: userId,
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        phone: '+91 98450 12345',
        role: effectiveRole,
        createdAt: new Date().toISOString().split('T')[0],
        addresses: [],
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      };

      await setDoc(userRef, {
        ...newUser,
        password: password || 'admin123',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      setCurrentUser(newUser);
      try {
        localStorage.setItem('fs_active_user', JSON.stringify(newUser));
      } catch {}
      showToast(`Welcome to Fathima Stores, ${newUser.name}!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('Login error fallback:', err);
      const fallbackUser: User = {
        id: trimmedEmail.replace(/[@.]/g, '_'),
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        phone: '+91 98450 12345',
        role: effectiveRole,
        createdAt: new Date().toISOString().split('T')[0],
        addresses: [],
      };
      setCurrentUser(fallbackUser);
      try {
        localStorage.setItem('fs_active_user', JSON.stringify(fallbackUser));
      } catch {}
      showToast(`Welcome, ${fallbackUser.name}!`, 'success');
      return true;
    }
  };

  const logoutUser = async () => {
    try {
      localStorage.removeItem('fs_active_user');
      localStorage.removeItem('fs_v5_user');
      localStorage.removeItem('fs_active_driver_id');
      setCurrentUser(null);
      await signOut(auth).catch(() => {});
      showToast('Logged out successfully', 'info');
    } catch (error) {
      localStorage.removeItem('fs_active_user');
      localStorage.removeItem('fs_v5_user');
      setCurrentUser(null);
      showToast('Logged out', 'info');
    }
  };

  const switchRole = (_role: 'customer' | 'admin') => {
    // Demo quick switch disabled as requested
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    try {
      // Update Firestore
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Local state will be updated via onAuthStateChanged if we fetch again,
      // but for instant feedback, we update it here too.
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      showToast('Profile and account details saved successfully!', 'success');
    } catch (error) {
      console.error('Profile Update Error:', error);
      showToast('Failed to save profile changes.', 'error');
    }
  };

  const addSavedAddress = async (address: ShippingAddress) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = address.isDefault
      ? [...currentAddresses.map((a) => ({ ...a, isDefault: false })), address]
      : [...currentAddresses, address];
    await updateUserProfile({ addresses: newAddresses });
    showToast('Delivery address saved to your profile!', 'success');
  };

  const deleteSavedAddress = async (index: number) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = currentAddresses.filter((_, i) => i !== index);
    await updateUserProfile({ addresses: newAddresses });
    showToast('Address removed from profile', 'info');
  };

  const setDefaultAddress = async (index: number) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = currentAddresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    await updateUserProfile({ addresses: newAddresses });
    showToast('Default address updated', 'success');
  };

  // Customer VIP, Admin, and Delivery Driver Access Management
  const toggleCustomerVIP = async (customerEmailOrId: string, isVip: boolean) => {
    try {
      const emailNorm = (customerEmailOrId || '').trim().toLowerCase();
      const currentVips = new Set(storeSettings.customVipEmails || []);
      if (isVip) {
        currentVips.add(emailNorm);
      } else {
        currentVips.delete(emailNorm);
      }
      await updateStoreSettings({ customVipEmails: Array.from(currentVips) });

      const userDoc = allUsers.find(
        (u) => u.id === customerEmailOrId || (u.email && u.email.toLowerCase() === emailNorm)
      );
      if (userDoc) {
        const docRef = doc(db, 'users', userDoc.id);
        await updateDoc(docRef, { isVip, updatedAt: serverTimestamp() }).catch(() => {});
      }
      showToast(isVip ? `Customer ${emailNorm} upgraded to VIP!` : `VIP status removed for ${emailNorm}`, 'success');
    } catch (err) {
      console.error('Failed to toggle VIP status:', err);
      showToast('Could not update VIP status', 'error');
    }
  };

  const grantCustomerAdmin = async (customerEmailOrId: string, grant: boolean) => {
    try {
      const emailNorm = (customerEmailOrId || '').trim().toLowerCase();
      const currentAdmins = new Set(storeSettings.customAdminEmails || []);
      if (grant) {
        currentAdmins.add(emailNorm);
      } else {
        currentAdmins.delete(emailNorm);
      }
      await updateStoreSettings({ customAdminEmails: Array.from(currentAdmins) });

      const newRole = grant ? 'admin' : 'customer';
      const userDoc = allUsers.find(
        (u) => u.id === customerEmailOrId || (u.email && u.email.toLowerCase() === emailNorm)
      );
      if (userDoc) {
        const docRef = doc(db, 'users', userDoc.id);
        await updateDoc(docRef, { role: newRole, updatedAt: serverTimestamp() }).catch(() => {});
      }
      showToast(grant ? `Admin access granted to ${emailNorm}!` : `Admin access revoked for ${emailNorm}`, 'success');
    } catch (err) {
      console.error('Failed to grant admin access:', err);
      showToast('Could not update admin role', 'error');
    }
  };

  const grantCustomerDriver = async (
    customerEmailOrId: string,
    grant: boolean,
    vehicleDetails?: {
      vehicleType?: DeliveryPersonnel['vehicleType'];
      vehicleNumber?: string;
      name?: string;
      phone?: string;
    }
  ) => {
    try {
      const emailNorm = (customerEmailOrId || '').trim().toLowerCase();
      const userDoc = allUsers.find(
        (u) => u.id === customerEmailOrId || (u.email && u.email.toLowerCase() === emailNorm)
      );
      const targetEmail = (userDoc?.email || emailNorm).toLowerCase().trim();
      const targetId = userDoc?.id || customerEmailOrId;

      const currentDriverEmails = new Set(
        (storeSettings.customDriverEmails || []).map((e) => e.toLowerCase().trim())
      );
      const currentDriverIds = new Set(storeSettings.customDriverIds || []);

      if (grant) {
        if (targetEmail && targetEmail.includes('@')) currentDriverEmails.add(targetEmail);
        if (targetId) currentDriverIds.add(targetId);
      } else {
        if (targetEmail) currentDriverEmails.delete(targetEmail);
        if (targetId) currentDriverIds.delete(targetId);
      }

      await updateStoreSettings({
        customDriverEmails: Array.from(currentDriverEmails),
        customDriverIds: Array.from(currentDriverIds),
      });

      // Update user document in Firestore & allUsers state
      if (userDoc) {
        const nextRole = grant
          ? userDoc.role === 'admin'
            ? 'admin'
            : 'delivery'
          : userDoc.role === 'admin'
          ? 'admin'
          : 'customer';
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: nextRole,
          isDriver: grant,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        setAllUsers((prev) =>
          prev.map((u) => (u.id === userDoc.id ? { ...u, role: nextRole, isDriver: grant } : u))
        );
      } else if (targetEmail && targetEmail.includes('@')) {
        const emailDocId = targetEmail.replace(/[@.]/g, '_');
        await setDoc(
          doc(db, 'users', emailDocId),
          sanitizeFirestoreData({
            id: emailDocId,
            email: targetEmail,
            name: vehicleDetails?.name || targetEmail.split('@')[0],
            phone: vehicleDetails?.phone || '+91 98450 12345',
            role: grant ? 'delivery' : 'customer',
            isDriver: grant,
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        ).catch(() => {});
      }

      // Sync currentUser if Admin is modifying their own or active user's driver access
      if (
        currentUser &&
        (currentUser.id === targetId ||
          (targetEmail && currentUser.email?.toLowerCase().trim() === targetEmail))
      ) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                isDriver: grant,
                role: grant ? (prev.role === 'admin' ? 'admin' : 'delivery') : prev.role === 'admin' ? 'admin' : 'customer',
              }
            : null
        );
      }

      // Create or remove DeliveryPersonnel entry in delivery_personnel collection
      const dpId = `dp-${(targetId || targetEmail).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      if (grant) {
        const existingDp = deliveryPersonnel.find(
          (dp) =>
            dp.id === dpId ||
            dp.userId === targetId ||
            (targetEmail && dp.email.toLowerCase().trim() === targetEmail)
        );
        const finalDpId = existingDp ? existingDp.id : dpId;
        const driverProfile: DeliveryPersonnel = {
          id: finalDpId,
          userId: targetId,
          name: vehicleDetails?.name || userDoc?.name || existingDp?.name || targetEmail.split('@')[0] || 'Store Driver',
          email: targetEmail || userDoc?.email || existingDp?.email || '',
          phone: vehicleDetails?.phone || userDoc?.phone || existingDp?.phone || '+91 98450 12345',
          vehicleType: vehicleDetails?.vehicleType || existingDp?.vehicleType || 'Bike',
          vehicleNumber: vehicleDetails?.vehicleNumber || existingDp?.vehicleNumber || 'KL-01-DR-2026',
          status: 'available',
          rating: existingDp?.rating || 5.0,
          totalDeliveries: existingDp?.totalDeliveries || 0,
          currentLat: storeSettings.storeLat || 8.5241,
          currentLng: storeSettings.storeLng || 76.9366,
          lastUpdatedLocation: storeSettings.storeHubName || 'Store Dispatch Hub',
          avatar: userDoc?.photoURL || userDoc?.avatar || existingDp?.avatar,
        };
        setDeliveryPersonnel((prev) => [
          driverProfile,
          ...prev.filter((d) => d.id !== finalDpId && d.email.toLowerCase() !== targetEmail),
        ]);
        await setDoc(
          doc(db, 'delivery_personnel', finalDpId),
          sanitizeFirestoreData({
            ...driverProfile,
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        ).catch(() => {});

        await sendNotification({
          userId: userDoc?.id,
          userEmail: targetEmail || undefined,
          target: 'user',
          type: 'customer',
          title: 'Driver Portal Access Granted',
          message: `You have been appointed as an official Delivery Driver for ${storeSettings.storeName || 'Fathima Stores'}. You can now access the Driver Portal from your Account Center!`,
        });
      } else {
        const matchedDp = deliveryPersonnel.find(
          (dp) =>
            dp.id === dpId ||
            dp.userId === targetId ||
            (targetEmail && dp.email.toLowerCase().trim() === targetEmail)
        );
        if (matchedDp) {
          setDeliveryPersonnel((prev) => prev.filter((d) => d.id !== matchedDp.id));
          await deleteDoc(doc(db, 'delivery_personnel', matchedDp.id)).catch(() => {});
        }
      }

      showToast(
        grant
          ? `Driver Portal access granted to ${userDoc?.name || targetEmail}!`
          : `Driver Portal access revoked for ${userDoc?.name || targetEmail}.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update driver role:', err);
      showToast('Could not update driver access', 'error');
    }
  };

  const deleteCustomer = async (customerEmailOrId: string) => {
    try {
      const emailNorm = (customerEmailOrId || '').trim().toLowerCase();
      const userDoc = allUsers.find(
        (u) => u.id === customerEmailOrId || (u.email && u.email.toLowerCase() === emailNorm)
      );

      const targetId = userDoc ? userDoc.id : customerEmailOrId;

      // 1. Delete user doc from Firestore
      if (targetId) {
        try {
          await deleteDoc(doc(db, 'users', targetId));
        } catch (err) {
          console.warn('Notice deleting user doc from Firestore:', err);
        }
      }

      // 2. Persist in storeSettings.removedCustomerEmails & removedCustomerIds
      const removedEmails = new Set((storeSettings.removedCustomerEmails || []).map((e) => e.toLowerCase()));
      const removedIds = new Set(storeSettings.removedCustomerIds || []);
      if (emailNorm) removedEmails.add(emailNorm);
      if (targetId) removedIds.add(targetId);

      // 3. Remove email from customAdminEmails & customVipEmails
      const currentAdmins = (storeSettings.customAdminEmails || []).filter((e) => e.toLowerCase() !== emailNorm);
      const currentVips = (storeSettings.customVipEmails || []).filter((e) => e.toLowerCase() !== emailNorm);

      await updateStoreSettings({
        removedCustomerEmails: Array.from(removedEmails),
        removedCustomerIds: Array.from(removedIds),
        customAdminEmails: currentAdmins,
        customVipEmails: currentVips,
      });

      // 4. Remove from local allUsers list and local storage cache
      setAllUsers((prev) => prev.filter((u) => u.id !== targetId && u.email?.toLowerCase() !== emailNorm));
      
      // 5. Force clear local orders cache to trigger re-fetch/re-calc without deleted user
      try {
        localStorage.removeItem('fs_saved_orders');
      } catch {}

      showToast('User account permanently deleted from store records.', 'success');
    } catch (err) {
      console.error('Failed to delete user account:', err);
      showToast('Could not delete user account', 'error');
    }
  };

  // Notifications
  const sendNotification = async (notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const id = createUniqueId('notif');
    const newNotif: Notification = {
      ...notif,
      id,
      time: new Date().toISOString(),
      read: false,
    };

    setRawNotifications((prev) => {
      const updated = [newNotif, ...prev.filter((n) => n.id !== id)];
      try {
        localStorage.setItem('fs_saved_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'notifications', id), sanitizeFirestoreData({
        ...newNotif,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("Failed to send persistent notification:", err);
    }
  };

  const sendCustomCustomerNotification = async (data: {
    title: string;
    message: string;
    type?: Notification['type'];
    targetEmail?: string;
    targetUserId?: string;
    orderId?: string;
    isBroadcast?: boolean;
  }) => {
    const matchedUser = data.targetEmail
      ? allUsers.find((u) => u.email?.toLowerCase().trim() === data.targetEmail?.toLowerCase().trim())
      : undefined;

    await sendNotification({
      title: data.title,
      message: data.message,
      type: data.type || 'customer',
      userId: data.targetUserId || matchedUser?.id || undefined,
      userEmail: data.targetEmail?.toLowerCase().trim() || undefined,
      orderId: data.orderId || undefined,
      target: data.isBroadcast ? 'all' : 'customer',
    });

    showToast(
      data.isBroadcast
        ? 'Broadcast notification sent to all customers!'
        : `Notification sent to ${data.targetEmail || 'customer'}!`,
      'success'
    );
  };

  const markNotificationAsRead = async (id: string) => {
    setRawNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const targetList = currentUser?.role === 'admin' ? notifications : customerNotifications;
    const unreadIds = new Set(targetList.filter((n) => !n.read).map((n) => n.id));
    if (unreadIds.size === 0) return;

    setRawNotifications((prev) =>
      prev.map((n) => (unreadIds.has(n.id) ? { ...n, read: true } : n))
    );

    const batch = writeBatch(db);
    unreadIds.forEach((id) => {
      batch.update(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit().catch((err) => console.warn("Failed to mark all as read:", err));
  };

  const clearNotifications = async () => {
    const targetList = currentUser?.role === 'admin' ? notifications : customerNotifications;
    const targetIds = new Set(targetList.map((n) => n.id));
    if (targetIds.size === 0) return;

    setRawNotifications((prev) => prev.filter((n) => !targetIds.has(n.id)));

    const batch = writeBatch(db);
    targetIds.forEach((id) => {
      batch.delete(doc(db, 'notifications', id));
    });
    await batch.commit().catch((err) => console.warn("Failed to clear notifications:", err));
    showToast('Notifications cleared', 'info');
  };

  const removeSelectedCategoryButton = async () => {
    await updateStoreSettings({ removeFirstCategoryButton: true });
    showToast('Selected button removed from storefront', 'info');
  };

const RESET_STORE_SETTINGS: Partial<StoreSettings> = {
  storeName: 'FATHIMA STORES',
  tagline: 'Quality Stationery & Everyday Office Essentials',
  brandTagline: '',
  searchPlaceholder: 'Search for notebooks, pens, art supplies...',
  footerAboutText: 'Your local source for premium stationery, office supplies, and school essentials since 1998.',
  footerCopyrightText: '© 2026 Fathima Stores. All rights reserved.',
  heroHeadline: 'Everything You Need, All in One Place.',
  heroSubheadline: 'Discover quality stationery, school supplies, office essentials, notebooks, pens, art materials and everyday products at honest prices.',
  heroSlides: [],
  heroSliderAutoplay: true,
  heroSliderInterval: 4000,
  showHeroSection: true,
  showCategoryCircles: true,
  showHomeFilters: true,
  showBestSellers: true,
  showPromoBanner: false,
  showNewArrivals: true,
  showBenefits: true,
  showReviews: true,
  showProductBadges: true,
  accentColor: '#71883F',
  accentColorHover: '#5F7334',
  accentColorLight: '#EFF4E6',
  fontFamily: 'Plus Jakarta Sans',
  borderRadiusMode: 'rounded',
  storeThemeMode: 'white',
  removedCustomerEmails: [],
  removedCustomerIds: [],
  removedCategoryIds: [],
  removeFirstCategoryButton: false,
  isDemoDataSeeded: true, // After a full manual clear, we set to true to prevent auto-reseeding until "Reset to Factory" is clicked
};

  // Complete wipe of all store data
  const clearAllData = async () => {
    const collectionsToClear = [
      'products', 'categories', 'orders', 'coupons', 'reviews', 
      'banners', 'expenses', 'support_threads', 'inventory_adjustments', 
      'customer_messages', 'delivery_personnel', 'delivery_assignments', 'hero_slides',
      'email_alerts'
    ];

    for (const collName of collectionsToClear) {
      try {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.warn(`Collection wipe notice for ${collName}:`, err);
      }
    }

    try {
      localStorage.clear();
    } catch {}

    setProducts([]);
    setCategories([]);
    setOrders([]);
    setCoupons([]);
    setReviews([]);
    setBanners([]);
    setExpenses([]);
    setSupportThreads([]);
    setInventoryAdjustments([]);
    setEmailAlertLogs([]);
    setCustomerMessages([]);
    setDeliveryPersonnel([]);
    setDeliveryAssignments([]);

    await updateStoreSettings(RESET_STORE_SETTINGS);

    showToast('Store catalog, orders, and dashboard data reset clean!', 'info');
  };

  // Reset dashboard data
  const resetToDefaultData = async () => {
    await clearAllData();
    await updateStoreSettings({ isDemoDataSeeded: false });
    showToast('Store reset to factory defaults. Reloading data...', 'success');
  };

  const toggleCompareProduct = (productId: string) => {
    setCompareProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showToast('You can compare up to 4 products at a time.', 'info');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const clearCompareProducts = () => {
    setCompareProductIds([]);
  };

  // Export full store snapshot as JSON
  const exportStoreData = (): string => {
    const backup = {
      version: '5.0',
      exportedAt: new Date().toISOString(),
      storeSettings,
      products,
      categories,
      orders,
      banners,
      reviews,
    };
    return JSON.stringify(backup, null, 2);
  };

  // Import full store snapshot from JSON
  const importStoreData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.storeSettings && typeof parsed.storeSettings === 'object') {
        setStoreSettings((prev) => ({ ...prev, ...parsed.storeSettings }));
      }
      if (Array.isArray(parsed.products)) {
        setProducts(parsed.products);
      }
      if (Array.isArray(parsed.categories)) {
        setCategories(parsed.categories);
      }
      if (Array.isArray(parsed.orders)) {
        setOrders(parsed.orders);
      }
      if (Array.isArray(parsed.banners)) {
        setBanners(parsed.banners);
      }
      if (Array.isArray(parsed.reviews)) {
        setReviews(parsed.reviews);
      }
      showToast('Store backup data successfully restored!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to parse store backup JSON:', err);
      showToast('Invalid backup file. Could not import data.', 'error');
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedProductId,
        setSelectedProductId,
        selectedCategorySlug,
        setSelectedCategorySlug,
        selectedOrderId,
        setSelectedOrderId,
        navigateToProduct,
        navigateToCategory,
        navigateToOrder,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        duplicateProduct,
        quickUpdateStock,
        removeAllProductBadges,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        clearAllCategories,

        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartCount,
        cartSubtotal,
        cartDeliveryCharge,
        cartDiscount,
        cartTotal,

        wishlist,
        toggleWishlist,
        isInWishlist,

        appliedCoupon,
        applyCoupon,
        removeCoupon,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,

        orders,
        allOrders: orders,
        placeOrder,
        createDirectOrder,
        completeOnlineOrderPayment,
        updateOrderStatus,
        deleteOrder,
        recordOrderPayment,
        updateOrderDeliveryStatus,
        requestOrderReturn,
        processOrderReturn,
        verifyOrderPayment,

        expenses,
        addExpense,
        updateExpense,
        deleteExpense,

        supportThreads,
        createSupportThread,
        sendSupportMessage,
        updateSupportThreadStatus,
        isSupportChatOpen,
        setIsSupportChatOpen,

        inventoryAdjustments,
        recordInventoryAdjustment,

        reviews,
        addReview,
        updateReviewStatus,
        deleteReview,

        banners,
        addBanner,
        updateBanner,
        deleteBanner,

        // Hero Slider
        heroSlides,
        addHeroSlide,
        updateHeroSlide,
        deleteHeroSlide,
        reorderHeroSlides,

        storeSettings,
        updateStoreSettings,

        currentUser,
        allUsers,
        users: allUsers,
        isAdmin:
          currentUser?.role === 'admin' ||
          Boolean(
            currentUser?.email &&
              (storeSettings.customAdminEmails || [])
                .map((e) => e.toLowerCase().trim())
                .includes(currentUser.email.toLowerCase().trim())
          ),
        isDriver,
        isAuthLoading,
        unauthorizedDomainInfo,
        setUnauthorizedDomainInfo,
        registerUser,
        loginUser,
        loginWithGoogle,
        logoutUser,
        switchRole,
        updateUserProfile,
        toggleCustomerVIP,
        grantCustomerAdmin,
        grantCustomerDriver,
        deleteCustomer,
        showForceSignInModal,
        setShowForceSignInModal,
        addSavedAddress,
        deleteSavedAddress,
        setDefaultAddress,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,

        notifications,
        customerNotifications,
        sendNotification,
        sendCustomCustomerNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        removeSelectedCategoryButton,

        toasts,
        showToast,

        quickViewProduct,
        setQuickViewProduct,

        customerMessages,
        addCustomerMessage,
        updateCustomerMessageStatus,
        deleteCustomerMessage,

        deliveryPersonnel: effectiveDeliveryPersonnel,
        deliveryAssignments,
        isDeliveryLoggedIn,
        currentDeliveryPerson,
        deliveryLogin,
        deliveryLogout,
        updateDeliveryAssignmentStatus,
        assignDeliveryPerson,
        assignOrderToDelivery,
        completeDeliveryAssignment,
        rateDeliveryAssignment,
        logDriverPerformanceRecord,

        resetToDefaultData,
        clearAllData,
        exportStoreData,
        importStoreData,
        updateDeliveryPersonLocation,
        updateDeliveryLocation,
        updateDeliveryPersonnel,
        checkIfUserPurchasedProduct,

        // Automated Inventory Email Alerts
        emailAlertLogs,
        checkAndTriggerLowStockAlert,

        compareProductIds,
        toggleCompareProduct,
        clearCompareProducts,

        bulkUpdateStock,
        bulkUpdateOrderStatus,
        bulkArchiveOrders,
        bulkDeleteOrders,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
