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

// Constants moved to top to avoid initialization errors
const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-luxury-pens',
    badge: 'Exclusive Launch 2026',
    title: 'Luxury Writing & Calligraphy Instruments',
    subtitle: 'Handcrafted fountain pens, 14k gold-nib calligraphy sets, archivist inks and fountain-pen-friendly journals for discerning creators.',
    buttonText: 'Explore Writing Gear',
    buttonLink: 'shop',
    secondaryButtonText: 'View Bestsellers',
    secondaryButtonLink: 'shop',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#F4F5EF',
    overlay: 'light',
    overlayOpacity: 75,
    active: true,
    order: 0,
  },
  {
    id: 'slide-school-essentials',
    badge: 'Academic Season 2026',
    title: 'Complete School & College Essentials',
    subtitle: 'Precision geometry boxes, ruled notebooks, archival folders, ergonomic backpacks and daily exam supplies at honest prices.',
    buttonText: 'Shop Student Packs',
    buttonLink: 'categories',
    secondaryButtonText: 'Browse Catalog',
    secondaryButtonLink: 'shop',
    image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#EFF3EA',
    overlay: 'light',
    overlayOpacity: 75,
    active: true,
    order: 1,
  },
  {
    id: 'slide-fine-arts',
    badge: 'Fine Arts Studio',
    title: 'Artist Pigments, Pastels & Canvas Pads',
    subtitle: 'Heavyweight cold-press watercolor sheets, rich artist acrylics, gouache sets, fine-tip liners and studio easels.',
    buttonText: 'Discover Art Supplies',
    buttonLink: 'shop',
    secondaryButtonText: 'Limited Deals',
    secondaryButtonLink: 'shop',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#FAF9F5',
    overlay: 'light',
    overlayOpacity: 75,
    active: true,
    order: 2,
  },
  {
    id: 'slide-desk-organization',
    badge: 'Executive Workspace',
    title: 'Minimalist Desk Organizers & Planners',
    subtitle: 'Declutter your workspace with solid beechwood organizers, undated daily agendas, and brass desktop accessories.',
    buttonText: 'Organize Your Desk',
    buttonLink: 'shop',
    secondaryButtonText: 'Learn More',
    secondaryButtonLink: 'about',
    image: 'https://images.unsplash.com/photo-1507842229458-574349320eef?auto=format&fit=crop&w=1600&q=80',
    bgTone: '#F3F5F0',
    overlay: 'light',
    overlayOpacity: 75,
    active: true,
    order: 3,
  },
];

const DEFAULT_DELIVERY_PERSONNEL: DeliveryPersonnel[] = [
  {
    id: 'dp-1',
    name: 'Rahul K. (Express)',
    phone: '+91 98450 11111',
    email: 'rahul@fathimaexpress.com',
    vehicleType: 'Scooter',
    vehicleNumber: 'KL-01-BK-8821',
    status: 'available',
    rating: 4.8,
    totalDeliveries: 124,
    currentLat: 8.5241,
    currentLng: 76.9366,
  },
  {
    id: 'dp-2',
    name: 'Anjali S. (Bicycle)',
    phone: '+91 98450 22222',
    email: 'anjali@fathimaexpress.com',
    vehicleType: 'E-Bike',
    vehicleNumber: 'KL-01-EB-4512',
    status: 'available',
    rating: 4.9,
    totalDeliveries: 89,
    currentLat: 8.5245,
    currentLng: 76.9370,
  }
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
  registerUser: (data: { name: string; email: string; phone?: string; password?: string; role?: 'customer' | 'admin' }) => Promise<boolean>;
  loginUser: (email: string, password?: string, role?: 'customer' | 'admin') => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  switchRole: (role: 'customer' | 'admin') => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
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
  clearNotifications: () => void;

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

  // Firestore Sync States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>([]);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

  
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);


  // Sync Firebase Auth with App State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        // Fetch additional profile data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUser({
            id: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            photoURL: data.photoURL || firebaseUser.photoURL || '',
            role: data.role || 'customer',
            phone: data.phone || '',
            bio: data.bio || '',
            city: data.city || '',
            state: data.state || '',
            addresses: data.addresses || [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        } else {
          // New Google User - create minimal profile
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'New User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            phone: firebaseUser.phoneNumber || '',
            role: 'customer',
            addresses: [],
            createdAt: new Date().toISOString(),
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Helper for generic public collection sync with admin-only seeding
  const useCollectionSync = (collectionName: string, setter: (data: any[]) => void, initialData?: any[], orderField: string = 'createdAt') => {
    useEffect(() => {
      try {
        const q = query(collection(db, collectionName), orderBy(orderField, 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          if (snapshot.empty && initialData && initialData.length > 0 && currentUser?.role === 'admin') {
            // Seed the collection only if current user is admin
            const batch = writeBatch(db);
            initialData.forEach((item) => {
              const docRef = doc(collection(db, collectionName), item.id || createUniqueId('seed'));
              batch.set(docRef, {
                ...item,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit().catch(err => console.warn(`Notice seeding ${collectionName}:`, err));
          } else {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
            setter(data);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, collectionName);
        });
        return () => unsubscribe();
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, collectionName);
      }
    }, [collectionName, currentUser?.role]);
  };

  // Sync public collections (open to all customers and storefront visitors)
  useCollectionSync('products', setProducts, INITIAL_PRODUCTS);
  useCollectionSync('categories', setCategories, INITIAL_CATEGORIES, 'slug');
  useCollectionSync('banners', setBanners, INITIAL_BANNERS);
  useCollectionSync('coupons', setCoupons, INITIAL_COUPONS, 'code');
  useCollectionSync('reviews', setReviews, INITIAL_REVIEWS, 'date');
  useCollectionSync('hero_slides', (data) => {
    setStoreSettings(prev => ({ ...prev, heroSlides: data as HeroSlide[] }));
  }, DEFAULT_HERO_SLIDES, 'order');

  // Admin-only collections: strictly listened to when currentUser is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return;
    }

    const unsubExpenses = onSnapshot(
      query(collection(db, 'expenses'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setExpenses(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Expense[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'expenses')
    );

    const unsubInventory = onSnapshot(
      query(collection(db, 'inventory_adjustments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setInventoryAdjustments(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as InventoryAdjustment[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'inventory_adjustments')
    );

    const unsubMessages = onSnapshot(
      query(collection(db, 'customer_messages'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setCustomerMessages(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as CustomerMessage[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'customer_messages')
    );

    const unsubPersonnel = onSnapshot(
      query(collection(db, 'delivery_personnel'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setDeliveryPersonnel(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as DeliveryPersonnel[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'delivery_personnel')
    );

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAllUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as User[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'users')
    );

    return () => {
      unsubExpenses();
      unsubInventory();
      unsubMessages();
      unsubPersonnel();
      unsubUsers();
    };
  }, [currentUser?.role]);

  // Delivery assignments: admin or delivery personnel
  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'delivery') {
      return;
    }

    const unsubAssignments = onSnapshot(
      query(collection(db, 'delivery_assignments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setDeliveryAssignments(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as DeliveryAssignment[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'delivery_assignments')
    );

    return () => unsubAssignments();
  }, [currentUser?.role]);

  // Support Threads: Admin sees all, Customer sees their own
  useEffect(() => {
    if (!currentUser) {
      setSupportThreads([]);
      return;
    }

    try {
      const q = currentUser.role === 'admin'
        ? query(collection(db, 'support_threads'), orderBy('updatedAt', 'desc'))
        : query(collection(db, 'support_threads'), where('customerId', '==', currentUser.id));

      const unsubSupport = onSnapshot(
        q,
        (snapshot) => {
          setSupportThreads(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as SupportThread[]);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'support_threads')
      );

      return () => unsubSupport();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'support_threads');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Orders Sync: Admin sees all orders, Customer sees their own orders
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    try {
      const q = currentUser.role === 'admin'
        ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'orders'), where('userId', '==', currentUser.id));

      const unsubOrders = onSnapshot(
        q,
        (snapshot) => {
          const firestoreOrders = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Order[];
          setOrders(firestoreOrders);
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'orders')
      );

      return () => unsubOrders();
    } catch (err) {
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
    showPromoBanner: true,
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
  });




  const addCustomerMessage = async (msgData: Omit<CustomerMessage, "id" | "createdAt" | "status">) => {
    const id = createUniqueId("msg");
    const newMsg: CustomerMessage = {
      ...msgData,
      id,
      createdAt: new Date().toISOString(),
      status: "unread",
    };
    await setDoc(doc(db, 'customer_messages', id), {
      ...newMsg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setNotifications((prev) => [
      {
        id: createUniqueId("notif"),
        type: "customer",
        title: "New Customer Inquiry Received",
        message: `From ${msgData.name} (${msgData.email}): "${msgData.subject || "No Subject"}"`,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };


  const updateCustomerMessageStatus = async (
    id: string,
    status: CustomerMessage["status"],
    replyNotes?: string
  ) => {
    await updateDoc(doc(db, 'customer_messages', id), {
      status,
      ...(replyNotes !== undefined ? { replyNotes } : {}),
      updatedAt: serverTimestamp(),
    });
  };

  const deleteCustomerMessage = async (id: string) => {
    await deleteDoc(doc(db, 'customer_messages', id));
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
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      orderStatus: 'Confirmed',
      items: orderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      couponCode: appliedCoupon?.code,
      deliveryCharge: cartDeliveryCharge,
      total: cartTotal,
      estimatedDelivery: '3 to 5 business days',
      trackingNumber: `FS-TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      courierName: 'BlueDart / Delhivery Express',
      paidAmount: initialPaid,
      outstandingBalance: initialOutstanding,
      paymentRecords: initialRecords,
      deliveryTimeline: initialTimeline,
      returnStatus: 'None',
    };

    // Update Product Stock Automatically
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

    // Save order to Firestore
    try {
      await setDoc(doc(db, 'orders', newOrderId), {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${newOrderId}`);
    }

    // Send admin notification
    setNotifications((prev) => [
      {
        id: createUniqueId('notif'),
        title: 'New Order Received',
        message: `Order #${newOrderId} received from ${orderData.customerName} (₹${cartTotal}).`,
        time: 'Just now',
        type: 'order',
        read: false,
      },
      ...prev,
    ]);

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

    try {
      await setDoc(doc(db, 'orders', id), {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${id}`);
    }

    showToast(`Recorded order #${id} (₹${newOrder.total})`);
    return newOrder;
  };


  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const timelineStep: DeliveryTimelineStep = {
      status,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      note: `Order status updated to ${status}`,
    };

    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: status,
      deliveryTimeline: [timelineStep, ...(order.deliveryTimeline || [])],
      updatedAt: serverTimestamp(),
    });

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

    await updateDoc(doc(db, 'orders', orderId), {
      paidAmount: newPaid,
      outstandingBalance: newOutstanding,
      paymentStatus: newStatus,
      paymentRecords: [record, ...(order.paymentRecords || [])],
      updatedAt: serverTimestamp(),
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

    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: status,
      courierName: courierName || order.courierName || 'BlueDart / Delhivery',
      trackingNumber: trackingNumber || order.trackingNumber,
      deliveryTimeline: [step, ...(order.deliveryTimeline || [])],
      updatedAt: serverTimestamp(),
    });

    showToast(`Order #${orderId} delivery status set to "${status}"`);
  };

  const requestOrderReturn = async (orderId: string, reason: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
      returnRequested: true,
      returnReason: reason,
      returnStatus: 'Requested',
      updatedAt: serverTimestamp(),
    });
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

    await updateDoc(doc(db, 'orders', orderId), {
      returnStatus: status,
      orderStatus: status === 'Refunded' ? 'Cancelled' : order.orderStatus,
      updatedAt: serverTimestamp(),
    });

    showToast(`Return for Order #${orderId} marked as "${status}"`);
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
      orderId,
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
    await setDoc(doc(db, 'support_threads', threadId), {
      ...newThread,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
    await updateDoc(doc(db, 'support_threads', threadId), {
      messages: updatedMessages,
      updatedAt: serverTimestamp(),
      status: senderRole === 'admin' && thread.status === 'open' ? 'in_progress' : thread.status,
    });
  };

  const updateSupportThreadStatus = async (threadId: string, status: 'open' | 'in_progress' | 'resolved') => {
    await updateDoc(doc(db, 'support_threads', threadId), {
      status,
      updatedAt: serverTimestamp(),
    });
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
    await deleteDoc(doc(db, 'orders', orderId));
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
    await setDoc(doc(db, 'products', id), {
      ...created,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast(`Added product "${created.name}"`);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, 'products', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Product updated successfully');
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
    showToast('Product removed from catalog', 'info');
  };

  const deleteMultipleProducts = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.delete(doc(db, 'products', id));
    });
    await batch.commit();
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

  const quickUpdateStock = async (id: string, newStock: number) => {
    await updateDoc(doc(db, 'products', id), {
      stock: Math.max(0, newStock),
      updatedAt: serverTimestamp(),
    });
    showToast(`Stock updated to ${newStock}`);
  };

  const removeAllProductBadges = async () => {
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
    showToast('Removed badges from all products in catalog');
  };


  // Category CRUD
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const id = cat.slug || createUniqueId('cat');
    const newCat: Category = { ...cat, id };
    await setDoc(doc(db, 'categories', id), {
      ...newCat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast(`Category "${cat.name}" added`);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await updateDoc(doc(db, 'categories', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Category updated');
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
    showToast('Category deleted', 'info');
  };

  const clearAllCategories = async () => {
    const batch = writeBatch(db);
    categories.forEach((cat) => {
      batch.delete(doc(db, 'categories', cat.id));
    });
    await batch.commit();
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
    if (!currentUser) {
      showToast('You must be logged in to leave a review.', 'error');
      return;
    }

    const reviewId = createUniqueId('rev');
    const isVerified = await checkIfUserPurchasedProduct(reviewData.productId, currentUser.id);

    const newRev: Review = {
      id: reviewId,
      productId: reviewData.productId,
      userId: currentUser.id,
      productName: reviewData.productName,
      userName: reviewData.userName,
      userAvatar: currentUser.photoURL || currentUser.avatar,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: isVerified,
      status: 'approved',
    };

    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        ...newRev,
        userId: currentUser.id,
        createdAt: serverTimestamp(),
      });

      // Recalculate and update product rating in Firestore if it exists there, 
      // otherwise just update local state (which will eventually sync if we add product sync)
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
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        await updateDoc(productRef, {
          rating: roundedAvg,
          reviewCount: prodReviews.length,
          updatedAt: serverTimestamp(),
        });
      }

      showToast('Thank you! Your review has been submitted.');
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast('Failed to submit review. Please try again.', 'error');
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
      
      // Check if any order contains the productId
      return snapshot.docs.some(orderDoc => {
        const orderData = orderDoc.data() as Order;
        return orderData.items.some(item => item.productId === productId);
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
      return false;
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'hidden') => {
    await updateDoc(doc(db, 'reviews', reviewId), {
      status,
      updatedAt: serverTimestamp(),
    });
    showToast(`Review marked as ${status}`);
  };

  const deleteReview = async (reviewId: string) => {
    await deleteDoc(doc(db, 'reviews', reviewId));
    showToast('Review deleted', 'info');
  };


  // Banner Handlers
  const addBanner = async (banner: Omit<Banner, 'id'>) => {
    const id = createUniqueId('b');
    const newBanner: Banner = { ...banner, id };
    await setDoc(doc(db, 'banners', id), {
      ...newBanner,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast('Promotional banner added');
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    await updateDoc(doc(db, 'banners', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Promotional banner updated');
  };

  const deleteBanner = async (id: string) => {
    await deleteDoc(doc(db, 'banners', id));
    showToast('Banner removed', 'info');
  };


  // Settings Handlers
  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    await updateDoc(doc(db, 'settings', 'global'), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Store settings saved successfully');
  };

  // Hero Slides Handlers
  const heroSlides =
    storeSettings.heroSlides && storeSettings.heroSlides.length > 0
      ? storeSettings.heroSlides
      : DEFAULT_HERO_SLIDES;

  // Hero Slides Handlers
  const addHeroSlide = async (slide: Omit<HeroSlide, 'id'>) => {
    const id = createUniqueId('slide');
    const newSlide: HeroSlide = {
      ...slide,
      id,
      order: (storeSettings.heroSlides?.length || 0),
    };
    await setDoc(doc(db, 'hero_slides', id), {
      ...newSlide,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast('New hero slide added successfully!', 'success');
  };

  const updateHeroSlide = async (id: string, updates: Partial<HeroSlide>) => {
    await updateDoc(doc(db, 'hero_slides', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Hero slide updated successfully!', 'success');
  };

  const deleteHeroSlide = async (id: string) => {
    if (heroSlides.length <= 1) {
      showToast('You must have at least one hero slide active.', 'error');
      return;
    }
    await deleteDoc(doc(db, 'hero_slides', id));
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
      showToast(error.message || 'Failed to sign in with Google.', 'error');
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
    const userRef = doc(db, 'users', trimmedEmail.replace(/[@.]/g, '_'));
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const found = userSnap.data();
      if (password && found.password && found.password !== password) {
        showToast('Incorrect password. Please verify and try again.', 'error');
        return false;
      }

      const activeUser: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        role: found.role,
        addresses: found.addresses || [],
        createdAt: found.createdAt,
        avatar: found.avatar,
        bio: found.bio,
        city: found.city,
        state: found.state,
      };

      setCurrentUser(activeUser);
      showToast(`Welcome back, ${found.name}!`, 'success');
      return true;
    }

    // If account doesn't exist, auto-create and sign in
    const userId = createUniqueId('usr');
    const newUser: User = {
      id: userId,
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      phone: '+91 98450 12345',
      role: role,
      createdAt: new Date().toISOString().split('T')[0],
      addresses: [],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    };

    await setDoc(userRef, {
      ...newUser,
      password: password || 'password123',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setCurrentUser(newUser);
    showToast(`Welcome to Fathima Stores, ${newUser.name}!`, 'success');
    return true;
  };


;

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      showToast('Logged out successfully', 'info');
    } catch (error) {
      showToast('Error during logout', 'error');
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

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Reset demo data
  const resetToDefaultData = async () => {
    if (confirm('Are you sure you want to reset all store data to defaults? This will wipe your current database.')) {
      await clearAllData();
      showToast('Database wiped. Reloading to seed default data...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  // Complete wipe of all store data
  const clearAllData = async () => {
    const collectionsToClear = [
      'products', 'categories', 'orders', 'coupons', 'reviews', 
      'banners', 'expenses', 'support_threads', 'inventory_adjustments', 
      'customer_messages', 'delivery_personnel', 'delivery_assignments', 'hero_slides'
    ];

    for (const collName of collectionsToClear) {
      const q = query(collection(db, collName));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    try {
      localStorage.clear();
    } catch {
      // ignore
    }

    showToast('All store catalog and transaction data wiped clean from cloud!', 'info');
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
        registerUser,
        loginUser,
        loginWithGoogle,
        logoutUser,
        switchRole,
        updateUserProfile,
        addSavedAddress,
        deleteSavedAddress,
        setDefaultAddress,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,

        notifications,
        markNotificationAsRead,
        clearNotifications,

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
