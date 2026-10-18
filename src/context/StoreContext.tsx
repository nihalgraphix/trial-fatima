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
  setDoc, 
  updateDoc, 
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
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteMultipleProducts: (ids: string[]) => void;
  duplicateProduct: (id: string) => void;
  quickUpdateStock: (id: string, newStock: number) => void;
  removeAllProductBadges: () => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  clearAllCategories: () => void;

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
  }) => Order;
  createDirectOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  recordOrderPayment: (
    orderId: string,
    amount: number,
    method: string,
    reference: string,
    type: 'advance' | 'installment' | 'final' | 'refund',
    notes?: string
  ) => void;
  updateOrderDeliveryStatus: (
    orderId: string,
    status: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    note?: string
  ) => void;
  requestOrderReturn: (orderId: string, reason: string) => void;
  processOrderReturn: (orderId: string, status: 'Approved' | 'Rejected' | 'Refunded') => void;

  // Expenses & Finance
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Customer Support Chat
  supportThreads: SupportThread[];
  createSupportThread: (subject: string, message: string, orderId?: string) => SupportThread;
  sendSupportMessage: (threadId: string, message: string, senderRole?: 'customer' | 'admin') => void;
  updateSupportThreadStatus: (threadId: string, status: 'open' | 'in_progress' | 'resolved') => void;
  isSupportChatOpen: boolean;
  setIsSupportChatOpen: (open: boolean) => void;

  // Inventory Adjustments
  inventoryAdjustments: InventoryAdjustment[];
  recordInventoryAdjustment: (adj: Omit<InventoryAdjustment, 'id' | 'date'>) => void;

  // Reviews
  reviews: Review[];
  addReview: (reviewData: {
    productId: string;
    productName: string;
    rating: number;
    comment: string;
    userName: string;
  }) => void;
  updateReviewStatus: (reviewId: string, status: 'approved' | 'hidden') => void;
  deleteReview: (reviewId: string) => void;

  // Banners
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;

  // Hero Slider
  heroSlides: HeroSlide[];
  addHeroSlide: (slide: Omit<HeroSlide, 'id'>) => void;
  updateHeroSlide: (id: string, updates: Partial<HeroSlide>) => void;
  deleteHeroSlide: (id: string) => void;
  reorderHeroSlides: (slides: HeroSlide[]) => void;

  // Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;

  // User & Auth
  currentUser: User | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  registerUser: (data: { name: string; email: string; phone?: string; password?: string; role?: 'customer' | 'admin' }) => boolean;
  loginUser: (email: string, password?: string, role?: 'customer' | 'admin') => boolean;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => void;
  switchRole: (role: 'customer' | 'admin') => void;
  updateUserProfile: (updates: Partial<User>) => void;
  addSavedAddress: (address: ShippingAddress) => void;
  deleteSavedAddress: (index: number) => void;
  setDefaultAddress: (index: number) => void;

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
  ) => void;
  assignDeliveryPerson: (orderId: string, deliveryPersonId: string) => void;

  // Customer Inbox Messages
  customerMessages: CustomerMessage[];
  addCustomerMessage: (msg: Omit<CustomerMessage, "id" | "createdAt" | "status">) => void;
  updateCustomerMessageStatus: (id: string, status: CustomerMessage["status"], replyNotes?: string) => void;
  deleteCustomerMessage: (id: string) => void;

  // Reset Demo Data & Backups
  resetToDefaultData: () => void;
  clearAllData: () => void;
  exportStoreData: () => string;
  importStoreData: (jsonStr: string) => boolean;
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

  // Persistent States with Clean Storage and guaranteed unique IDs
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      ['fs_products', 'fs_clean_products', 'fs_orders', 'fs_clean_orders', 'fs_reviews', 'fs_clean_reviews', 'fs_coupons', 'fs_clean_coupons'].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    const saved = localStorage.getItem('fs_v5_products');
    if (!saved) return [];
    try {
      const parsed: Product[] = JSON.parse(saved);
      const seenIds = new Set<string>();
      return parsed.map((p, idx) => {
        if (!p.id || seenIds.has(p.id)) {
          const uniqueId = createUniqueId(`fs-${idx}`);
          return { ...p, id: uniqueId };
        }
        seenIds.add(p.id);
        return p;
      });
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    // Ensure all categories are removed as requested by the user
    const cleared = localStorage.getItem('fs_v6_categories_cleared_user');
    if (!cleared) {
      localStorage.setItem('fs_v6_categories_cleared_user', 'true');
      localStorage.removeItem('fs_v5_categories');
      return [];
    }
    const saved = localStorage.getItem('fs_v5_categories');
    if (!saved) return [];
    try {
      const parsed: Category[] = JSON.parse(saved);
      const seenIds = new Set<string>();
      return parsed.map((cat, idx) => {
        if (!cat.id || seenIds.has(cat.id)) {
          const uniqueId = cat.slug || createUniqueId(`cat-${idx}`);
          return { ...cat, id: uniqueId };
        }
        seenIds.add(cat.id);
        return cat;
      });
    } catch {
      return [];
    }
  });

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

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fs_v5_orders');
    if (!saved) return [];
    try {
      const parsed: Order[] = JSON.parse(saved);
      const seenIds = new Set<string>();
      return parsed.map((o, idx) => {
        if (!o.id || seenIds.has(o.id)) {
          const uniqueId = `ORD-${Date.now().toString(36)}-${idx}-${Math.floor(1000 + Math.random() * 9000)}`;
          return { ...o, id: uniqueId };
        }
        seenIds.add(o.id);
        return o;
      });
    } catch {
      return [];
    }
  });

  // Coupons removed completely as requested
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('fs_v5_reviews');
    if (!saved) return [];
    try {
      const parsed: Review[] = JSON.parse(saved);
      const seenIds = new Set<string>();
      return parsed.map((r, idx) => {
        if (!r.id || seenIds.has(r.id)) {
          const uniqueId = createUniqueId(`rev-${idx}`);
          return { ...r, id: uniqueId };
        }
        seenIds.add(r.id);
        return r;
      });
    } catch {
      return [];
    }
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('fs_v5_banners');
    if (!saved) return [];
    try {
      const parsed: Banner[] = JSON.parse(saved);
      const seenIds = new Set<string>();
      return parsed.map((b, idx) => {
        if (!b.id || seenIds.has(b.id)) {
          const uniqueId = createUniqueId(`b-${idx}`);
          return { ...b, id: uniqueId };
        }
        seenIds.add(b.id);
        return b;
      });
    } catch {
      return [];
    }
  });

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

  // Sync Orders from Firestore
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    let q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.id),
      orderBy('date', 'desc')
    );

    // Admins can see all orders
    if (currentUser.role === 'admin') {
      q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Order[];
      setOrders(fetchedOrders);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('fs_v5_expenses');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [supportThreads, setSupportThreads] = useState<SupportThread[]>(() => {
    const saved = localStorage.getItem('fs_v5_support_threads');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>(() => {
    const saved = localStorage.getItem('fs_v5_inventory_adj');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fs_v5_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('fs_v5_support_threads', JSON.stringify(supportThreads));
  }, [supportThreads]);

  useEffect(() => {
    localStorage.setItem('fs_v5_inventory_adj', JSON.stringify(inventoryAdjustments));
  }, [inventoryAdjustments]);

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

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const defaultSettings: StoreSettings = {
      storeName: 'FATHIMA STORES',
      tagline: 'Quality Stationery & Everyday Office Essentials',
      logoType: 'text',
      logoUrl: '',
      logoHeight: 36,
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

      // Moving Hero Slides
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

      // Modern Minimalist Customization & Features
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
    };

    const saved = localStorage.getItem('fs_v5_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultSettings, ...parsed };
        if (!merged.heroSlides || merged.heroSlides.length === 0) {
          merged.heroSlides = DEFAULT_HERO_SLIDES;
        }
        merged.showAnnouncement = false;
        return merged;
      } catch {
        // ignore
      }
    }
    return defaultSettings;
  });

  // Customer Inbox Messages State
  const DEFAULT_CUSTOMER_MESSAGES: CustomerMessage[] = [];

  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>(() => {
    const saved = localStorage.getItem("fs_v5_customer_messages");
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMER_MESSAGES;
  });

  useEffect(() => {
    localStorage.setItem("fs_v5_customer_messages", JSON.stringify(customerMessages));
  }, [customerMessages]);

  const addCustomerMessage = (msgData: Omit<CustomerMessage, "id" | "createdAt" | "status">) => {
    const newMsg: CustomerMessage = {
      ...msgData,
      id: createUniqueId("msg"),
      createdAt: new Date().toISOString(),
      status: "unread",
    };
    setCustomerMessages((prev) => [newMsg, ...prev]);

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

  const updateCustomerMessageStatus = (
    id: string,
    status: CustomerMessage["status"],
    replyNotes?: string
  ) => {
    setCustomerMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status, ...(replyNotes !== undefined ? { replyNotes } : {}) }
          : m
      )
    );
  };

  const deleteCustomerMessage = (id: string) => {
    setCustomerMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Delivery Personnel State
  const DEFAULT_DELIVERY_PERSONNEL: DeliveryPersonnel[] = [];

  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>(() => {
    const saved = localStorage.getItem('fs_v5_delivery_personnel');
    return saved ? JSON.parse(saved) : DEFAULT_DELIVERY_PERSONNEL;
  });

  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>(() => {
    const saved = localStorage.getItem('fs_v5_delivery_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeStorageSet('fs_v5_delivery_personnel', deliveryPersonnel);
  }, [deliveryPersonnel]);

  useEffect(() => {
    safeStorageSet('fs_v5_delivery_assignments', deliveryAssignments);
  }, [deliveryAssignments]);

  const updateDeliveryAssignmentStatus = (
    assignmentId: string,
    status: DeliveryAssignment['status'],
    notesOrData?: string | Partial<DeliveryAssignment>,
    photoUrl?: string
  ) => {
    setDeliveryAssignments((prev) =>
      prev.map((a) => {
        if (a.id === assignmentId) {
          const extraData =
            typeof notesOrData === 'object'
              ? notesOrData
              : notesOrData
              ? { deliveryNotes: notesOrData }
              : {};
          const updated = {
            ...a,
            status,
            ...extraData,
            ...(photoUrl ? { proofPhotoUrl: photoUrl } : {}),
            ...(status === 'Delivered' ? { completedAt: new Date().toISOString() } : {}),
          };
          if (a.orderId) {
            let orderStatus: OrderStatus = 'Out for Delivery';
            if (status === 'Delivered') orderStatus = 'Delivered';
            if (status === 'Failed') orderStatus = 'Cancelled';
            updateOrderStatus(a.orderId, orderStatus);
          }
          return updated;
        }
        return a;
      })
    );
  };

  const assignDeliveryPerson = (orderId: string, deliveryPersonId: string) => {
    const worker = deliveryPersonnel.find((dp) => dp.id === deliveryPersonId);
    const order = orders.find((o) => o.id === orderId);
    if (!worker || !order) return;

    const newAssignment: DeliveryAssignment = {
      id: createUniqueId('da'),
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

    setDeliveryAssignments((prev) => [newAssignment, ...prev]);
    updateOrderStatus(orderId, 'Out for Delivery');
    showToast(`Order #${orderId.slice(-6)} assigned to ${worker.name}`, 'success');
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

  // Sync to localStorage safely with quota protection
  useEffect(() => {
    safeStorageSet('fs_v5_settings', storeSettings);
  }, [storeSettings]);

  useEffect(() => {
    safeStorageSet('fs_v5_products', products);
  }, [products]);

  useEffect(() => {
    safeStorageSet('fs_v5_categories', categories);
  }, [categories]);

  useEffect(() => {
    safeStorageSet('fs_v5_cart', cart);
  }, [cart]);

  useEffect(() => {
    safeStorageSet('fs_v5_wishlist', wishlist);
  }, [wishlist]);

  useEffect(() => {
    safeStorageSet('fs_v5_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeStorageSet('fs_v5_reviews', reviews);
  }, [reviews]);

  useEffect(() => {
    safeStorageSet('fs_v5_banners', banners);
  }, [banners]);

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
  const placeOrder = (orderData: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    deliveryMethod: string;
  }): Order => {
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

    // Save order to local state (optimistic) and Firestore
    setOrders((prev) => [newOrder, ...prev]);
    
    // Fire and forget Firestore save - the onSnapshot will update the list
    setDoc(doc(db, 'orders', newOrderId), {
      ...newOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(err => console.error("Error saving order to Firestore:", err));

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

  const createDirectOrder = (orderData: Partial<Order>): Order => {
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

    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Recorded order #${id} (₹${newOrder.total})`);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const timelineStep: DeliveryTimelineStep = {
          status,
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          note: `Order status updated to ${status}`,
        };
        return {
          ...o,
          orderStatus: status,
          deliveryTimeline: [timelineStep, ...(o.deliveryTimeline || [])],
        };
      })
    );
    showToast(`Order #${orderId} status set to "${status}"`);
  };

  const recordOrderPayment = (
    orderId: string,
    amount: number,
    method: string,
    reference: string,
    type: 'advance' | 'installment' | 'final' | 'refund',
    notes?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentPaid = o.paidAmount !== undefined ? o.paidAmount : (o.paymentStatus === 'Paid' ? o.total : 0);
        const newPaid = type === 'refund' ? Math.max(0, currentPaid - amount) : currentPaid + amount;
        const newOutstanding = Math.max(0, o.total - newPaid);
        const newStatus: PaymentStatus =
          newPaid >= o.total ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';

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

        return {
          ...o,
          paidAmount: newPaid,
          outstandingBalance: newOutstanding,
          paymentStatus: newStatus,
          paymentRecords: [record, ...(o.paymentRecords || [])],
        };
      })
    );
    showToast(`Payment of ₹${amount} recorded for order #${orderId}`);
  };

  const updateOrderDeliveryStatus = (
    orderId: string,
    status: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    note?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const step: DeliveryTimelineStep = {
          status,
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          note: note || `Order updated to ${status} via ${courierName || o.courierName || 'Courier'}`,
        };
        return {
          ...o,
          orderStatus: status,
          courierName: courierName || o.courierName || 'BlueDart / Delhivery',
          trackingNumber: trackingNumber || o.trackingNumber,
          deliveryTimeline: [step, ...(o.deliveryTimeline || [])],
        };
      })
    );
    showToast(`Order #${orderId} delivery status set to "${status}"`);
  };

  const requestOrderReturn = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              returnRequested: true,
              returnReason: reason,
              returnStatus: 'Requested',
            }
          : o
      )
    );
    showToast(`Return request submitted for Order #${orderId}`);
  };

  const processOrderReturn = (orderId: string, status: 'Approved' | 'Rejected' | 'Refunded') => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        // If refunded, restore stock
        if (status === 'Refunded') {
          o.items.forEach((item) => {
            quickUpdateStock(item.productId, 999); // restore item
          });
        }
        return {
          ...o,
          returnStatus: status,
          orderStatus: status === 'Refunded' ? 'Cancelled' : o.orderStatus,
        };
      })
    );
    showToast(`Return for Order #${orderId} marked as "${status}"`);
  };

  // Expenses CRUD
  const addExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: createUniqueId('exp'),
    };
    setExpenses((prev) => [created, ...prev]);
    showToast(`Recorded expense: ${created.title} (₹${created.amount})`);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    showToast('Expense record updated');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense removed', 'info');
  };

  // Customer Support Chat
  const createSupportThread = (subject: string, message: string, orderId?: string): SupportThread => {
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
    setSupportThreads((prev) => [newThread, ...prev]);
    showToast('Support conversation started. A store representative will reply shortly!');
    return newThread;
  };

  const sendSupportMessage = (threadId: string, message: string, senderRole: 'customer' | 'admin' = 'customer') => {
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
    setSupportThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              updatedAt: new Date().toISOString(),
              status: senderRole === 'admin' && t.status === 'open' ? 'in_progress' : t.status,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
  };

  const updateSupportThreadStatus = (threadId: string, status: 'open' | 'in_progress' | 'resolved') => {
    setSupportThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
    showToast(`Support ticket status updated to "${status}"`);
  };

  // Inventory Adjustments
  const recordInventoryAdjustment = (adj: Omit<InventoryAdjustment, 'id' | 'date'>) => {
    const created: InventoryAdjustment = {
      ...adj,
      id: createUniqueId('adj'),
      date: new Date().toISOString().split('T')[0],
    };
    setInventoryAdjustments((prev) => [created, ...prev]);
    quickUpdateStock(adj.productId, adj.newStock);
    showToast(`Stock for ${adj.productName} updated to ${adj.newStock}`);
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Order #${orderId} deleted`, 'info');
  };

  // Product CRUD
  const addProduct = (newProd: Omit<Product, 'id' | 'createdAt'>) => {
    const id = createUniqueId('fs');
    const created: Product = {
      ...newProd,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [created, ...prev]);
    showToast(`Added product "${created.name}"`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Product updated successfully');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.product.id !== id));
    setWishlist((prev) => prev.filter((pId) => pId !== id));
    showToast('Product removed from catalog', 'info');
  };

  const deleteMultipleProducts = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
    setCart((prev) => prev.filter((item) => !idSet.has(item.product.id)));
    setWishlist((prev) => prev.filter((pId) => !idSet.has(pId)));
    showToast(`Deleted ${ids.length} item${ids.length === 1 ? '' : 's'} from catalog`, 'info');
  };

  const duplicateProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const duplicated: Product = {
      ...prod,
      id: createUniqueId('fs'),
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [duplicated, ...prev]);
    showToast(`Duplicated "${prod.name}"`);
  };

  const quickUpdateStock = (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p))
    );
    showToast(`Stock updated to ${newStock}`);
  };

  const removeAllProductBadges = () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        badge: '',
        showBadge: false,
        showDiscountBadge: false,
      }))
    );
    showToast('Removed badges from all products in catalog');
  };

  // Category CRUD
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const id = cat.slug || createUniqueId('cat');
    const newCat: Category = { ...cat, id };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${cat.name}" added`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Category updated');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Category deleted', 'info');
  };

  const clearAllCategories = () => {
    setCategories([]);
    localStorage.removeItem('fs_v5_categories');
    showToast('All categories removed', 'info');
  };

  // Review Handlers
  const addReview = (reviewData: {
    productId: string;
    productName: string;
    rating: number;
    comment: string;
    userName: string;
  }) => {
    const newRev: Review = {
      id: createUniqueId('rev'),
      productId: reviewData.productId,
      productName: reviewData.productName,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true,
      status: 'approved',
    };
    setReviews((prev) => [newRev, ...prev]);

    // Recalculate product rating
    const prodReviews = [...reviews.filter((r) => r.productId === reviewData.productId), newRev];
    const avg =
      prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === reviewData.productId
          ? { ...p, rating: parseFloat(avg.toFixed(1)), reviewCount: prodReviews.length }
          : p
      )
    );

    showToast('Thank you! Your review has been submitted.');
  };

  const updateReviewStatus = (reviewId: string, status: 'approved' | 'hidden') => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
    );
    showToast(`Review marked as ${status}`);
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    showToast('Review deleted', 'info');
  };

  // Banner Handlers
  const addBanner = (banner: Omit<Banner, 'id'>) => {
    const newBanner: Banner = { ...banner, id: createUniqueId('b') };
    setBanners((prev) => [newBanner, ...prev]);
    showToast('Promotional banner added');
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    showToast('Promotional banner updated');
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast('Banner removed', 'info');
  };

  // Settings Handlers
  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...updates }));
    showToast('Store settings saved successfully');
  };

  // Hero Slides Handlers
  const heroSlides =
    storeSettings.heroSlides && storeSettings.heroSlides.length > 0
      ? storeSettings.heroSlides
      : DEFAULT_HERO_SLIDES;

  const addHeroSlide = (slide: Omit<HeroSlide, 'id'>) => {
    const newSlide: HeroSlide = {
      ...slide,
      id: createUniqueId('slide'),
      order: (storeSettings.heroSlides?.length || 0),
    };
    const updated = [...(storeSettings.heroSlides || DEFAULT_HERO_SLIDES), newSlide];
    updateStoreSettings({ heroSlides: updated });
    showToast('New hero slide added successfully!', 'success');
  };

  const updateHeroSlide = (id: string, updates: Partial<HeroSlide>) => {
    const current = storeSettings.heroSlides || DEFAULT_HERO_SLIDES;
    const updated = current.map((s) => (s.id === id ? { ...s, ...updates } : s));
    updateStoreSettings({ heroSlides: updated });
    showToast('Hero slide updated successfully!', 'success');
  };

  const deleteHeroSlide = (id: string) => {
    const current = storeSettings.heroSlides || DEFAULT_HERO_SLIDES;
    if (current.length <= 1) {
      showToast('You must have at least one hero slide active.', 'error');
      return;
    }
    const updated = current.filter((s) => s.id !== id);
    updateStoreSettings({ heroSlides: updated });
    showToast('Hero slide deleted', 'info');
  };

  const reorderHeroSlides = (slides: HeroSlide[]) => {
    updateStoreSettings({ heroSlides: slides });
    showToast('Hero slides reordered');
  };

  // Persistent User Accounts
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('fs_v5_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    safeStorageSet('fs_v5_accounts', registeredUsers);
  }, [registeredUsers]);

  // User & Auth Handlers
  const registerUser = (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: 'customer' | 'admin';
  }): boolean => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      showToast('An account with this email already exists. Please sign in.', 'error');
      return false;
    }

    const newUser = {
      id: createUniqueId('usr'),
      name: data.name.trim(),
      email: trimmedEmail,
      phone: data.phone?.trim() || '+91 98450 12345',
      password: data.password || 'password123',
      role: data.role || (trimmedEmail.includes('admin') ? 'admin' : 'customer'),
      createdAt: new Date().toISOString().split('T')[0],
      addresses: [],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      city: 'Trivandrum',
      state: 'Kerala',
      bio: 'Stationery and writing enthusiast',
    };

    setRegisteredUsers((prev) => [...prev, newUser]);

    const activeUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role as 'customer' | 'admin',
      addresses: newUser.addresses,
      createdAt: newUser.createdAt,
      avatar: newUser.avatar,
      bio: newUser.bio,
      city: newUser.city,
      state: newUser.state,
    };

    setCurrentUser(activeUser);
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

  const loginUser = (
    email: string,
    password?: string,
    role: 'customer' | 'admin' = 'customer'
  ): boolean => {
    const trimmedEmail = email.trim().toLowerCase();



    const found = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (found) {
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
    const newUserRecord = {
      id: createUniqueId('usr'),
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      phone: '+91 98450 12345',
      password: password || 'password123',
      role: role,
      createdAt: new Date().toISOString().split('T')[0],
      addresses: [],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    };

    setRegisteredUsers((prev) => [...prev, newUserRecord]);

    const activeUser: User = {
      id: newUserRecord.id,
      name: newUserRecord.name,
      email: newUserRecord.email,
      phone: newUserRecord.phone,
      role: newUserRecord.role as 'customer' | 'admin',
      addresses: [],
      createdAt: newUserRecord.createdAt,
      avatar: newUserRecord.avatar,
    };

    setCurrentUser(activeUser);
    showToast(`Welcome to Fathima Stores, ${newUserRecord.name}!`, 'success');
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

  const addSavedAddress = (address: ShippingAddress) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = address.isDefault
      ? [...currentAddresses.map((a) => ({ ...a, isDefault: false })), address]
      : [...currentAddresses, address];
    updateUserProfile({ addresses: newAddresses });
    showToast('Delivery address saved to your profile!', 'success');
  };

  const deleteSavedAddress = (index: number) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = currentAddresses.filter((_, i) => i !== index);
    updateUserProfile({ addresses: newAddresses });
    showToast('Address removed from profile', 'info');
  };

  const setDefaultAddress = (index: number) => {
    if (!currentUser) return;
    const currentAddresses = currentUser.addresses || [];
    const newAddresses = currentAddresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    updateUserProfile({ addresses: newAddresses });
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
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setCoupons(INITIAL_COUPONS);
    setReviews(INITIAL_REVIEWS);
    setBanners(INITIAL_BANNERS);
    setCurrentUser(INITIAL_USER);
    setCart([]);
    setWishlist([]);
    showToast('Demo store data restored to defaults');
  };

  // Complete wipe of all store data
  const clearAllData = () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setCoupons([]);
    setReviews([]);
    setBanners([]);
    setExpenses([]);
    setSupportThreads([]);
    setInventoryAdjustments([]);
    setCart([]);
    setWishlist([]);
    setNotifications([]);

    try {
      localStorage.removeItem('fs_v5_products');
      localStorage.removeItem('fs_v5_categories');
      localStorage.removeItem('fs_v5_orders');
      localStorage.removeItem('fs_v5_cart');
      localStorage.removeItem('fs_v5_wishlist');
      localStorage.removeItem('fs_v5_coupons');
      localStorage.removeItem('fs_v5_reviews');
      localStorage.removeItem('fs_v5_banners');
      localStorage.removeItem('fs_v5_expenses');
      localStorage.removeItem('fs_v5_support_threads');
      localStorage.removeItem('fs_v5_inventory_adj');
    } catch {
      // ignore
    }

    showToast('All store catalog and transaction data wiped clean!', 'info');
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
