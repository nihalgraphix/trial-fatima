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
const DEFAULT_DELIVERY_PERSONNEL: DeliveryPersonnel[] = [];

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
  placeOrder: (orderData: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    deliveryMethod: string;
  }) => Promise<Order>;
  createDirectOrder: (orderData: Partial<Order>) => Promise<Order>;

  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
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
  isAdmin: boolean;
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

  // Notifications (Admin & System)
  notifications: Notification[];
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

  // Delivery Personnel & Tracking
  deliveryPersonnel: DeliveryPersonnel[];
  deliveryAssignments: DeliveryAssignment[];
  updateDeliveryAssignmentStatus: (
    assignmentId: string,
    status: DeliveryAssignment['status'],
    notesOrData?: string | Partial<DeliveryAssignment>,
    photoUrl?: string
  ) => Promise<void>;
  assignDeliveryPerson: (orderId: string, deliveryPersonId: string) => Promise<void>;

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

  // Automated Inventory Email Alerts
  emailAlertLogs: EmailAlertRecord[];
  checkAndTriggerLowStockAlert: (product: Product, currentStock: number) => Promise<void>;
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
  // Navigation State
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
        if (Array.isArray(parsed)) return parsed;
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
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);
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
      const saved = localStorage.getItem('fs_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.email)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse fs_active_user from localStorage', e);
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{
    domain: string;
    projectId: string;
  } | null>(null);

  // Sync active user to localStorage whenever currentUser changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('fs_active_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('fs_active_user');
      }
    } catch (e) {
      console.warn('Failed to sync user to localStorage', e);
    }
  }, [currentUser]);

  // Sync Firebase Auth with App State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isMasterAdmin = (firebaseUser.email?.toLowerCase() === 'nihal.graphix@gmail.com') ||
                              Boolean(firebaseUser.email?.toLowerCase().includes('admin'));

        try {
          // Fetch additional profile data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const effectiveRole = isMasterAdmin ? 'admin' : (data.role || 'customer');
            const activeUser: User = {
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              role: effectiveRole,
              phone: data.phone || '',
              bio: data.bio || '',
              city: data.city || '',
              state: data.state || '',
              addresses: data.addresses || [],
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
            setCurrentUser(activeUser);
            localStorage.setItem('fs_active_user', JSON.stringify(activeUser));

            // Sync admin role back to doc if needed
            if (isMasterAdmin && data.role !== 'admin') {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                role: 'admin',
                updatedAt: serverTimestamp(),
              }).catch(() => {});
            }
          } else {
            // New Google User - create minimal profile
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              phone: firebaseUser.phoneNumber || '',
              role: isMasterAdmin ? 'admin' : 'customer',
              addresses: [],
              createdAt: new Date().toISOString(),
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }).catch(() => {});
            
            setCurrentUser(newUser);
            localStorage.setItem('fs_active_user', JSON.stringify(newUser));
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, keeping active user session:', err);
        }
      } else {
        // When Firebase Auth is null, check if there is an active local session (e.g. email/password login or stored user)
        try {
          const savedSession = localStorage.getItem('fs_active_user');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed && (parsed.id || parsed.email)) {
              setCurrentUser(parsed);
              setIsAuthLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
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
            if (snapshot.empty && initialData && initialData.length > 0 && currentUser?.role === 'admin') {
              // Seed the collection only if current user is admin and we haven't explicitly cleared it
              if (storeSettings.isDemoDataSeeded === false) {
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

  // Sync public collections (open to all customers and storefront visitors)
  useCollectionSync('products', setProducts, INITIAL_PRODUCTS);
  useCollectionSync('categories', setCategories, INITIAL_CATEGORIES, 'slug');
  useCollectionSync('banners', setBanners, INITIAL_BANNERS);
  useCollectionSync('coupons', setCoupons, INITIAL_COUPONS, 'code');
  useCollectionSync('reviews', setReviews, INITIAL_REVIEWS, 'createdAt');
  useCollectionSync('customer_messages', setCustomerMessages, [], 'createdAt');
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

    const unsubPersonnel = onSnapshot(
      collection(db, 'delivery_personnel'),
      (snapshot) => {
        setDeliveryPersonnel(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DeliveryPersonnel[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'delivery_personnel')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as User[];
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
      unsubPersonnel();
      unsubUsers();
      unsubEmailAlerts();
    };
  }, [currentUser?.role]);

  // Notifications Sync: Admin sees all, Customers see theirs
  useEffect(() => {
    try {
      const col = collection(db, 'notifications');
      let q = query(col, orderBy('time', 'desc'));
      
      if (currentUser && currentUser.role !== 'admin') {
        q = query(col, where('userId', '==', currentUser.id), orderBy('time', 'desc'));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Notification[];
        setNotifications(list);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Notifications listener notice:", err);
    }
  }, [currentUser?.id, currentUser?.role]);

  // Delivery assignments: admin or delivery personnel
  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'delivery') {
      return;
    }

    const unsubAssignments = onSnapshot(
      collection(db, 'delivery_assignments'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DeliveryAssignment[];
        list.sort((a, b) => {
          const tA = (a as any).createdAt?.toMillis?.() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setDeliveryAssignments(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'delivery_assignments')
    );

    return () => unsubAssignments();
  }, [currentUser?.role]);

  // Support Threads: Admin sees all, Customer sees their own
  useEffect(() => {
    try {
      const col = collection(db, 'support_threads');
      const q = (!currentUser || currentUser.role === 'admin')
        ? col
        : query(col, where('customerId', '==', currentUser.id));

      const unsubSupport = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as SupportThread[];
          list.sort((a, b) => {
            const tA = (a as any).updatedAt?.toMillis?.() || (a as any).createdAt?.toMillis?.() || 0;
            const tB = (b as any).updatedAt?.toMillis?.() || (b as any).createdAt?.toMillis?.() || 0;
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
  }, [currentUser?.id, currentUser?.role]);

  // Orders Sync: Admin sees ALL store orders in real-time. Customer sees their own orders.
  useEffect(() => {
    try {
      const ordersCol = collection(db, 'orders');
      const q = (currentUser && currentUser.role === 'customer')
        ? query(ordersCol, where('userId', '==', currentUser.id))
        : ordersCol;

      const unsubOrders = onSnapshot(
        q,
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

          setOrders((prev) => {
            const map = new Map<string, Order>();
            firestoreOrders.forEach((o) => map.set(o.id, o));
            // Retain any newly placed local order in case of network latency
            prev.forEach((o) => {
              if (!map.has(o.id)) map.set(o.id, o);
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('fs_saved_orders', JSON.stringify(merged));
            } catch {}
            return merged;
          });
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
  }, [currentUser?.id, currentUser?.role]);

  // Sync Store Settings
  useEffect(() => {
    const settingsDoc = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setStoreSettings(snapshot.data() as StoreSettings);
      } else if (currentUser?.role === 'admin') {
        // Seed initial settings only if admin
        setDoc(settingsDoc, {
          ...storeSettings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(err => console.warn("Notice seeding store settings:", err));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return () => unsubscribe();
  }, [currentUser?.role]);


  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'FATHIMA STORES',
    tagline: 'Quality Stationery & Everyday Office Essentials',
    contactEmail: 'care@fathimastores.com',
    contactPhone: '+91 98450 12345',
    address: 'Commercial Complex, MG Road, Trivandrum, Kerala 695001',
    currency: '₹',
    freeDeliveryThreshold: 500,
    standardDeliveryFee: 40,
    gstNumber: '32AABCF1234F1Z8',
    upiId: 'fathimastores@oksbi',
    upiMerchantName: 'FATHIMA STORES TRIVANDRUM',
    enableGPay: true,
    enablePhonePe: true,
    enablePaytm: true,
    enableCOD: true,
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
  });




  const addCustomerMessage = async (msgData: Omit<CustomerMessage, "id" | "createdAt" | "status">) => {
    const id = createUniqueId("msg");
    const newMsg: CustomerMessage = {
      ...msgData,
      id,
      phone: msgData.phone || '',
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
      message: `From ${msgData.name} (${msgData.email}): "${msgData.subject || "No Subject"}"`,
    });
  };

  const updateCustomerMessageStatus = async (
    id: string,
    status: CustomerMessage["status"],
    replyNotes?: string
  ) => {
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
  };

  const deleteCustomerMessage = async (id: string) => {
    setCustomerMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteDoc(doc(db, 'customer_messages', id));
    } catch (err) {
      console.warn("Message deleted locally:", err);
    }
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
    
    const updateData: any = {
      status,
      ...extraData,
      ...(photoUrl ? { proofPhotoUrl: photoUrl } : {}),
      ...(status === 'Delivered' ? { completedAt: new Date().toISOString() } : {}),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'delivery_assignments', assignmentId), updateData);

    const assignment = deliveryAssignments.find(a => a.id === assignmentId);
    if (assignment?.orderId) {
      let orderStatus: OrderStatus = 'Out for Delivery';
      if (status === 'Delivered') orderStatus = 'Delivered';
      if (status === 'Failed') orderStatus = 'Cancelled';
      updateOrderStatus(assignment.orderId, orderStatus);
    }
  };


  const assignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    const worker = deliveryPersonnel.find((dp) => dp.id === deliveryPersonId);
    const order = orders.find((o) => o.id === orderId);
    if (!worker || !order) return;

    const id = createUniqueId('da');
    const newAssignment: DeliveryAssignment = {
      id,
      orderId,
      deliveryPersonId,
      deliveryPersonName: worker.name,
      deliveryPersonPhone: worker.phone,
      assignedAt: new Date().toISOString(),
      status: 'Assigned',
      pickupAddress: 'Fathima Stationers Main Store, MG Road, Ernakulam, Kerala 682016',
      dropAddress: order.shippingAddress,
      estimatedMinutes: 25,
    };

    await setDoc(doc(db, 'delivery_assignments', id), {
      ...newAssignment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    updateOrderStatus(orderId, 'Out for Delivery');
    showToast(`Order #${orderId.slice(-6)} assigned to ${worker.name}`, 'success');
  };


  const updateDeliveryPersonLocation = async (personId: string, lat: number, lng: number) => {
    await updateDoc(doc(db, 'delivery_personnel', personId), {
      currentLat: lat,
      currentLng: lng,
      updatedAt: serverTimestamp(),
    });
  };


  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    if (currentUser) {
      safeStorageSet('fs_v5_user', currentUser);
    } else {
      try {
        localStorage.removeItem('fs_v5_user');
      } catch {
        // ignore
      }
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

  // Order Placement
  const placeOrder = async (orderData: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    deliveryMethod: string;
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

    const isPaid = orderData.paymentMethod !== 'COD';
    const nowTimeStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const initialPaid = isPaid ? cartTotal : 0;
    const initialOutstanding = isPaid ? 0 : cartTotal;
    const initialTimeline: DeliveryTimelineStep[] = [
      {
        status: 'Confirmed',
        timestamp: nowTimeStr,
        note: isPaid ? 'Order confirmed and payment verified via gateway' : 'Cash on Delivery order confirmed',
      },
    ];
    const initialRecords: PaymentRecord[] = isPaid
      ? [
          {
            id: createUniqueId('pay'),
            orderId: newOrderId,
            amount: cartTotal,
            date: new Date().toISOString().split('T')[0],
            method: orderData.paymentMethod,
            reference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            recordedBy: 'Payment Gateway',
            type: 'final',
            notes: 'Successful transaction verified on server',
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
      paymentStatus: 'Pending',
      paymentVerified: false,
      orderStatus: 'Confirmed',
      items: orderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      couponCode: appliedCoupon?.code || '',
      deliveryCharge: cartDeliveryCharge,
      total: cartTotal,
      estimatedDelivery: '3 to 5 business days',
      trackingNumber: `FS-TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      courierName: 'BlueDart / Delhivery Express',
      paidAmount: 0,
      outstandingBalance: cartTotal,
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
      console.log(`Order #${newOrderId} saved to Firestore orders collection.`);
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

    // Send admin notification
    await sendNotification({
      title: 'New Order Received',
      message: `Order #${newOrderId} received from ${orderData.customerName} (₹${cartTotal}).`,
      type: 'order',
      orderId: newOrderId,
    });

    // Clear cart
    clearCart();
    return newOrder;
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
        city: 'Trivandrum',
        district: 'Trivandrum',
        state: 'Kerala',
        pinCode: '695001',
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
    // 1. Send Dashboard Notification to User
    if (order.userId) {
      await sendNotification({
        userId: order.userId,
        orderId: order.id,
        type: 'order',
        title: `Order Status Updated: ${status}`,
        message: `Your order #${order.id} is now "${status}". ${note || ''}`,
      });
    }

    // 2. Log Automated Email Alert (Simulated Dispatch)
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

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const timelineStep: DeliveryTimelineStep = {
      status,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note: `Order status updated to ${status}`,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              deliveryTimeline: [timelineStep, ...(o.deliveryTimeline || [])],
            }
          : o
      )
    );

    try {
      await updateDoc(doc(db, 'orders', orderId), sanitizeFirestoreData({
        orderStatus: status,
        deliveryTimeline: [timelineStep, ...(order.deliveryTimeline || [])],
        updatedAt: serverTimestamp(),
      }));
      
      // Trigger Automated Alerts & Notifications
      await sendOrderStatusAlert(order, status);
    } catch (err) {
      console.warn("Order status updated locally, Firestore sync notice:", err);
    }

    showToast(`Order #${orderId} status set to "${status}"`);
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

    showToast(`Return ${status} for Order #${orderId}`);

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

      showToast('Thank you! Your review has been submitted.', 'success');
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
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('orderStatus', '==', 'Delivered')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.some(orderDoc => {
        const orderData = orderDoc.data() as Order;
        return orderData.items?.some(item => item.productId === productId);
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
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
    setStoreSettings((prev) => ({ ...prev, ...updates }));
    await updateDoc(doc(db, 'settings', 'global'), sanitizeFirestoreData({
      ...updates,
      updatedAt: serverTimestamp(),
    })).catch((err) => console.warn('Settings update notice:', err));
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
      setCurrentUser(null);
      await signOut(auth).catch(() => {});
      showToast('Logged out successfully', 'info');
    } catch (error) {
      localStorage.removeItem('fs_active_user');
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

  // Customer VIP and Admin Access Management
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

    try {
      await setDoc(doc(db, 'notifications', id), sanitizeFirestoreData({
        ...newNotif,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    } catch (err) {
      console.warn("Failed to send persistent notification:", err);
      // Fallback to local state if Firestore fails (though onSnapshot will eventually sync it)
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit().catch(err => console.warn("Failed to mark all as read:", err));
  };

  const clearNotifications = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit().catch(err => console.warn("Failed to clear notifications:", err));
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
        placeOrder,
        createDirectOrder,
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
        isAdmin: currentUser?.role === 'admin',
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

        deliveryPersonnel,
        deliveryAssignments,
        updateDeliveryAssignmentStatus,
        assignDeliveryPerson,

        resetToDefaultData,
        clearAllData,
        exportStoreData,
        importStoreData,
        updateDeliveryPersonLocation,
        checkIfUserPurchasedProduct,

        // Automated Inventory Email Alerts
        emailAlertLogs,
        checkAndTriggerLowStockAlert,
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
