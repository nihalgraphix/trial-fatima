import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category, Coupon, Order, OrderStatus, Review, Banner, PaymentMethod, PaymentStatus, HeroSlide } from '../../types';
import {
  Mail,
  Receipt,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Users,
  Warehouse,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  ChevronDown,
  X,
  UploadCloud,
  FileImage,
  Palette,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { InvoiceModal } from '../checkout/InvoiceModal';
import { ProductImage } from '../common/ProductImage';
import { compressImageTo200KB, formatFileSize, CompressionResult } from '../../utils/imageCompressor';
import { LogoUploader } from './LogoUploader';
import { AdminInboxView } from './AdminInboxView';
import { AdminBillingPOS } from './AdminBillingPOS';
import { AdminDeliveryMap } from './AdminDeliveryMap';

type AdminTab =
  | 'overview'
  | 'billing'
  | 'inbox'
  | 'orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'reviews'
  | 'banners'
  | 'hero-slides'
  | 'reports'
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const {
    isAdmin,
    setActivePage,
    logoutUser,
    switchRole,
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
    orders,
    createDirectOrder,
    updateOrderStatus,
    deleteOrder,
    reviews,
    addReview,
    updateReviewStatus,
    deleteReview,
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    heroSlides,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    customerMessages,
    storeSettings,
    updateStoreSettings,
    notifications,
    markNotificationAsRead,
    showToast,
    resetToDefaultData,
    clearAllData,
    exportStoreData,
    importStoreData,
  } = useStore();

  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [adminSearch, setAdminSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Modals & View States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<{
    name: string;
    email: string;
    phone: string;
    totalSpent: number;
    ordersCount: number;
  } | null>(null);

  // In-App Deletion Modal States (Eliminates blocked browser window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showClearAllCategoriesModal, setShowClearAllCategoriesModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [showClearAllDataModal, setShowClearAllDataModal] = useState(false);
  const [showImportBackupModal, setShowImportBackupModal] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // Filter States
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodStockFilter, setProdStockFilter] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    fileName: string;
  } | null>(null);

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      showToast(`Compressing ${file.name} to under 200KB...`, 'info');
      const result = await compressImageTo200KB(file, 200 * 1024);
      setProdForm((prev) => ({ ...prev, imageKey: result.dataUrl }));
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        fileName: result.fileName,
      });
      showToast(
        `Image compressed to ${formatFileSize(result.compressedSize)} (strictly under 200KB)!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to compress image. Please try another file.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePromoBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    try {
      showToast('Optimizing & compressing promo image...', 'info');
      const res = await compressImageTo200KB(file, 150 * 1024);
      setSettingsForm((prev) => ({ ...prev, promoBgImage: res.dataUrl }));
      showToast(`Promo image compressed (${formatFileSize(res.compressedSize)}) & ready to save!`, 'success');
    } catch {
      showToast('Could not process image file', 'error');
    }
  };

  const handleHeroBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    try {
      showToast('Optimizing & compressing hero background...', 'info');
      const res = await compressImageTo200KB(file, 160 * 1024);
      setSettingsForm((prev) => ({ ...prev, heroBgImage: res.dataUrl }));
      showToast(`Hero background compressed (${formatFileSize(res.compressedSize)}) & ready to save!`, 'success');
    } catch {
      showToast('Could not process image file', 'error');
    }
  };

  const handleHomeBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    try {
      showToast('Optimizing & compressing landing wallpaper...', 'info');
      const res = await compressImageTo200KB(file, 160 * 1024);
      setSettingsForm((prev) => ({ ...prev, homeBgImage: res.dataUrl }));
      showToast(`Landing wallpaper compressed (${formatFileSize(res.compressedSize)}) & ready to save!`, 'success');
    } catch {
      showToast('Could not process image file', 'error');
    }
  };

  // Form states for Product Add/Edit
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    category: 'General',
    subcategory: '',
    sku: '',
    price: 100,
    mrp: 120,
    discount: 15,
    stock: 50,
    description: '',
    tags: '',
    featured: false,
    bestSeller: false,
    newArrival: false,
    badge: '',
    showBadge: false,
    showDiscountBadge: false,
    imageKey: 'classmate-spiral',
    // Product Offer fields
    hasOffer: false,
    offerType: 'bogo' as 'discount' | 'bogo' | 'flat' | 'combo' | 'cashback' | 'custom',
    offerTitle: '',
    offerBadge: 'SPECIAL DEAL',
    offerDescription: '',
    offerDiscountPct: 20,
    offerFlatDiscount: 50,
    offerValidUntil: 'Limited Period Deal',
  });

  // Category form state
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#EFF4E6',
    image: 'school-supplies',
    featured: true,
  });

  // Manual Order Form state
  const [manualOrderForm, setManualOrderForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    house: '',
    street: '',
    area: '',
    city: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695001',
    productId: '',
    quantity: 1,
    paymentMethod: 'UPI - Google Pay' as PaymentMethod,
    paymentStatus: 'Paid' as PaymentStatus,
  });

  // Review Form state
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    productName: '',
    userName: '',
    rating: 5,
    comment: '',
  });

  // Banner Form state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    badge: 'Special Offer',
    discountText: '30% OFF',
    buttonText: 'Shop Now →',
    buttonLink: '/shop',
    image: 'promo-banner',
    bgTone: '#F7F8F3',
    active: true,
  });

  // Hero Slide Form state
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const [slideForm, setSlideForm] = useState({
    badge: 'Exclusive Launch 2026',
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    buttonLink: 'shop',
    secondaryButtonText: 'Browse Catalog',
    secondaryButtonLink: 'shop',
    image: '',
    bgTone: '#F7F8F3',
    overlay: 'light' as 'light' | 'dark' | 'gradient' | 'none',
    overlayOpacity: 75,
    active: true,
  });

  // Settings local state
  const [settingsForm, setSettingsForm] = useState({
    storeName: storeSettings?.storeName || 'FATHIMA STORES',
    tagline: storeSettings?.tagline || 'Quality Stationery & Everyday Office Essentials',
    contactEmail: storeSettings?.contactEmail || 'care@fathimastores.com',
    contactPhone: storeSettings?.contactPhone || '+91 98450 12345',
    address: storeSettings?.address || 'Commercial Complex, MG Road, Trivandrum, Kerala 695001',
    currency: storeSettings?.currency || '₹',
    freeDeliveryThreshold: storeSettings?.freeDeliveryThreshold ?? 500,
    standardDeliveryFee: storeSettings?.standardDeliveryFee ?? 40,
    gstNumber: storeSettings?.gstNumber || '32AABCF1234F1Z8',
    upiId: storeSettings?.upiId || 'fathimastores@oksbi',
    upiMerchantName: storeSettings?.upiMerchantName || 'FATHIMA STORES TRIVANDRUM',
    enableGPay: storeSettings?.enableGPay ?? true,
    enablePhonePe: storeSettings?.enablePhonePe ?? true,
    enablePaytm: storeSettings?.enablePaytm ?? true,
    enableCOD: storeSettings?.enableCOD ?? true,

    showAnnouncement: storeSettings?.showAnnouncement ?? true,
    announcementText: storeSettings?.announcementText || 'Free shipping on orders above ₹500! • Fast delivery & genuine stationery',

    heroBadge: storeSettings?.heroBadge || 'STATIONERY & ESSENTIALS',
    heroHeadline: storeSettings?.heroHeadline || 'Everything You Need, All in One Place.',
    heroSubheadline: storeSettings?.heroSubheadline || 'Discover quality stationery, school supplies, office essentials, notebooks, pens, art materials and everyday products at honest prices.',
    heroButtonText: storeSettings?.heroButtonText || 'Shop Now',
    heroButtonTarget: storeSettings?.heroButtonTarget || 'shop',
    heroTrustText: storeSettings?.heroTrustText || '1,000+ Students & Professionals trust us for daily essentials',

    showHeroSection: storeSettings?.showHeroSection ?? true,
    showCategoryCircles: storeSettings?.showCategoryCircles ?? true,
    showHomeFilters: storeSettings?.showHomeFilters ?? true,
    showBestSellers: storeSettings?.showBestSellers ?? true,
    bestSellersTitle: storeSettings?.bestSellersTitle || 'Best Selling Products',
    bestSellersSubtitle: storeSettings?.bestSellersSubtitle || 'Customer favorites for school term and office requirements',
    showPromoBanner: storeSettings?.showPromoBanner ?? true,
    promoTitle: storeSettings?.promoTitle || 'Special Seasonal Discounts',
    promoSubtitle: storeSettings?.promoSubtitle || 'Limited time offers on selected notebooks, student backpacks, art supplies and exam packs.',
    promoBadge: storeSettings?.promoBadge || 'Special Offer',
    promoButtonText: storeSettings?.promoButtonText || 'Shop the Sale',
    promoBgImage: storeSettings?.promoBgImage || '',
    promoBgOverlay: storeSettings?.promoBgOverlay || 'light',
    promoBgOpacity: storeSettings?.promoBgOpacity ?? 85,
    showNewArrivals: storeSettings?.showNewArrivals ?? true,
    newArrivalsTitle: storeSettings?.newArrivalsTitle || 'New Arrivals & Fresh Stock',
    newArrivalsSubtitle: storeSettings?.newArrivalsSubtitle || 'Check out the latest tools, stationery gear, and additions to our catalog',
    showBenefits: storeSettings?.showBenefits ?? true,
    showReviews: storeSettings?.showReviews ?? true,
    showProductBadges: storeSettings?.showProductBadges ?? true,

    accentColor: storeSettings?.accentColor || '#71883F',
    homeBgType: storeSettings?.homeBgType || 'default',
    homeBgImage: storeSettings?.homeBgImage || '',
    homeBgColor: storeSettings?.homeBgColor || '#FFFFFF',
    homeBgOverlay: storeSettings?.homeBgOverlay || 'light',
    homeBgOpacity: storeSettings?.homeBgOpacity ?? 90,

    heroBgType: storeSettings?.heroBgType || 'default',
    heroBgImage: storeSettings?.heroBgImage || '',
    heroBgColor: storeSettings?.heroBgColor || '#F7F8F3',
    heroBgOverlay: storeSettings?.heroBgOverlay || 'light',
    heroBgOpacity: storeSettings?.heroBgOpacity ?? 85,

    fontFamily: storeSettings?.fontFamily || 'Plus Jakarta Sans',
    borderRadiusMode: storeSettings?.borderRadiusMode || 'rounded',
    storeThemeMode: storeSettings?.storeThemeMode || 'white',
    enableWhatsAppSupport: storeSettings?.enableWhatsAppSupport ?? true,
    whatsAppNumber: storeSettings?.whatsAppNumber || '+91 98450 12345',
    whatsAppGreeting: storeSettings?.whatsAppGreeting || 'Hello Fathima Stores, I would like to inquire about stationery products!',
    showQuickView: storeSettings?.showQuickView ?? true,
    showLowStockAlert: storeSettings?.showLowStockAlert ?? true,
    lowStockThreshold: storeSettings?.lowStockThreshold ?? 10,
    heroSliderAutoplay: storeSettings?.heroSliderAutoplay ?? true,
    heroSliderInterval: storeSettings?.heroSliderInterval ?? 3000,
    logoType: (storeSettings?.logoType || 'text') as 'text' | 'image' | 'both',
    logoUrl: storeSettings?.logoUrl || '',
    logoHeight: storeSettings?.logoHeight || 36,
  });

  // Keep settings form synced if storeSettings changes
  useEffect(() => {
    if (storeSettings) {
      setSettingsForm({
        storeName: storeSettings.storeName,
        tagline: storeSettings.tagline,
        contactEmail: storeSettings.contactEmail,
        contactPhone: storeSettings.contactPhone,
        address: storeSettings.address,
        currency: storeSettings.currency,
        freeDeliveryThreshold: storeSettings.freeDeliveryThreshold,
        standardDeliveryFee: storeSettings.standardDeliveryFee,
        gstNumber: storeSettings.gstNumber,
        upiId: storeSettings.upiId,
        upiMerchantName: storeSettings.upiMerchantName,
        enableGPay: storeSettings.enableGPay,
        enablePhonePe: storeSettings.enablePhonePe,
        enablePaytm: storeSettings.enablePaytm,
        enableCOD: storeSettings.enableCOD,

        showAnnouncement: storeSettings.showAnnouncement,
        announcementText: storeSettings.announcementText,

        heroBadge: storeSettings.heroBadge,
        heroHeadline: storeSettings.heroHeadline,
        heroSubheadline: storeSettings.heroSubheadline,
        heroButtonText: storeSettings.heroButtonText,
        heroButtonTarget: storeSettings.heroButtonTarget,
        heroTrustText: storeSettings.heroTrustText,

        showHeroSection: storeSettings.showHeroSection,
        showCategoryCircles: storeSettings.showCategoryCircles,
        showHomeFilters: storeSettings.showHomeFilters,
        showBestSellers: storeSettings.showBestSellers,
        bestSellersTitle: storeSettings.bestSellersTitle,
        bestSellersSubtitle: storeSettings.bestSellersSubtitle,
        showPromoBanner: storeSettings.showPromoBanner,
        promoTitle: storeSettings.promoTitle,
        promoSubtitle: storeSettings.promoSubtitle,
        promoBadge: storeSettings.promoBadge,
        promoButtonText: storeSettings.promoButtonText,

        promoBgImage: storeSettings.promoBgImage || '',
        promoBgOverlay: storeSettings.promoBgOverlay || 'light',
        promoBgOpacity: storeSettings.promoBgOpacity ?? 85,
        showNewArrivals: storeSettings.showNewArrivals,
        newArrivalsTitle: storeSettings.newArrivalsTitle,
        newArrivalsSubtitle: storeSettings.newArrivalsSubtitle,
        showBenefits: storeSettings.showBenefits,
        showReviews: storeSettings.showReviews,
        showProductBadges: storeSettings.showProductBadges,

        accentColor: storeSettings.accentColor || '#71883F',
        homeBgType: storeSettings.homeBgType || 'default',
        homeBgImage: storeSettings.homeBgImage || '',
        homeBgColor: storeSettings.homeBgColor || '#FFFFFF',
        homeBgOverlay: storeSettings.homeBgOverlay || 'light',
        homeBgOpacity: storeSettings.homeBgOpacity ?? 90,

        heroBgType: storeSettings.heroBgType || 'default',
        heroBgImage: storeSettings.heroBgImage || '',
        heroBgColor: storeSettings.heroBgColor || '#F7F8F3',
        heroBgOverlay: storeSettings.heroBgOverlay || 'light',
        heroBgOpacity: storeSettings.heroBgOpacity ?? 85,

        fontFamily: storeSettings.fontFamily || 'Plus Jakarta Sans',
        borderRadiusMode: storeSettings.borderRadiusMode || 'rounded',
        storeThemeMode: storeSettings.storeThemeMode || 'white',
        enableWhatsAppSupport: storeSettings.enableWhatsAppSupport ?? true,
        whatsAppNumber: storeSettings.whatsAppNumber || '+91 98450 12345',
        whatsAppGreeting: storeSettings.whatsAppGreeting || 'Hello Fathima Stores, I would like to inquire about stationery products!',
        showQuickView: storeSettings.showQuickView ?? true,
        showLowStockAlert: storeSettings.showLowStockAlert ?? true,
        lowStockThreshold: storeSettings.lowStockThreshold ?? 10,
        heroSliderAutoplay: storeSettings.heroSliderAutoplay ?? true,
        heroSliderInterval: storeSettings.heroSliderInterval ?? 3000,
        logoType: (storeSettings.logoType || 'text') as 'text' | 'image' | 'both',
        logoUrl: storeSettings.logoUrl || '',
        logoHeight: storeSettings.logoHeight || 36,
      });
    }
  }, [storeSettings]);

  // If not admin, restrict view
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-[#71883F] flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Administrator Access Required</h2>
        <p className="text-xs text-neutral-400 mt-2 max-w-sm">
          You must be logged in as an administrator to view the store management console.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setActivePage('admin-login')}
            className="px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white"
          >
            Go to Admin Login
          </button>

        </div>
      </div>
    );
  }

  // Dashboard KPI Computations
  const totalSales = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : o.total), 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
  const totalProductsCount = products.length;
  const lowStockCount = products.filter((p) => p.stock <= 15).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // Filtered Products for Catalog & Deletion Actions
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (prodCategoryFilter !== 'all' && p.category !== prodCategoryFilter) return false;
      if (prodStockFilter === 'in_stock' && p.stock <= 15) return false;
      if (prodStockFilter === 'low_stock' && (p.stock === 0 || p.stock > 15)) return false;
      if (prodStockFilter === 'out_of_stock' && p.stock > 0) return false;
      if (!adminSearch) return true;
      const q = adminSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, prodCategoryFilter, prodStockFilter, adminSearch]);

  // Customers unique list
  const customersList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; totalSpent: number; ordersCount: number }>();
    orders.forEach((o) => {
      const existing = map.get(o.email) || {
        name: o.customerName,
        email: o.email,
        phone: o.phone,
        totalSpent: 0,
        ordersCount: 0,
      };
      existing.totalSpent += o.total;
      existing.ordersCount += 1;
      map.set(o.email, existing);
    });
    return Array.from(map.values());
  }, [orders]);

  // Dynamic Weekly Sales Performance computed from actual orders data
  const weeklySalesStats = useMemo(() => {
    const daysData: {
      date: string;
      day: string;
      formattedDate: string;
      val: number;
      ordersCount: number;
      x: number;
    }[] = [];

    const now = new Date();
    // 7 days ending today (index 0 is 6 days ago, index 6 is today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Match orders on this date
      const matchedOrders = orders.filter((o) => {
        if (!o.date) return false;
        return o.date === dateStr || o.date.startsWith(dateStr);
      });

      const dayTotal = matchedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const xPos = 40 + (6 - i) * 80;

      daysData.push({
        date: dateStr,
        day: dayName,
        formattedDate,
        val: dayTotal,
        ordersCount: matchedOrders.length,
        x: xPos,
      });
    }

    const total7Days = daysData.reduce((sum, d) => sum + d.val, 0);
    const totalOrders7Days = daysData.reduce((sum, d) => sum + d.ordersCount, 0);
    const avgPerDay = Math.round(total7Days / 7);
    const maxVal = Math.max(500, ...daysData.map((d) => d.val));

    return {
      days: daysData,
      total7Days,
      totalOrders7Days,
      avgPerDay,
      maxVal,
    };
  }, [orders]);

  // Product Add / Edit Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setCompressionStats(null);
    setProdForm({
      name: '',
      brand: 'Classmate',
      category: categories[0]?.slug || 'General',
      subcategory: 'Stationery',
      sku: `FS-STN-${Math.floor(100 + Math.random() * 900)}`,
      price: 120,
      mrp: 150,
      discount: 20,
      stock: 45,
      description: 'High quality stationery product manufactured for students and office professionals.',
      tags: 'stationery, school, office',
      featured: false,
      bestSeller: false,
      newArrival: false,
      badge: '',
      showBadge: false,
      showDiscountBadge: false,
      imageKey: '',
      hasOffer: false,
      offerType: 'bogo',
      offerTitle: '',
      offerBadge: 'SPECIAL DEAL',
      offerDescription: '',
      offerDiscountPct: 20,
      offerFlatDiscount: 50,
      offerValidUntil: 'Limited Period Deal',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category || 'General',
      subcategory: prod.subcategory,
      sku: prod.sku,
      price: prod.price,
      mrp: prod.mrp,
      discount: prod.discount,
      stock: prod.stock,
      description: prod.description,
      tags: prod.tags.join(', '),
      featured: prod.featured,
      bestSeller: prod.bestSeller,
      newArrival: prod.newArrival,
      badge: prod.badge || '',
      showBadge: prod.showBadge !== false && (!!prod.badge || !!prod.offer?.active),
      showDiscountBadge: prod.showDiscountBadge ?? true,
      imageKey: prod.images[0] || 'classmate-spiral',
      hasOffer: !!prod.offer?.active,
      offerType: prod.offer?.type || 'bogo',
      offerTitle: prod.offer?.title || '',
      offerBadge: prod.offer?.badgeText || 'SPECIAL DEAL',
      offerDescription: prod.offer?.description || '',
      offerDiscountPct: prod.offer?.discountPct ?? 20,
      offerFlatDiscount: prod.offer?.flatDiscount ?? 50,
      offerValidUntil: prod.offer?.validUntil || 'Limited Period Deal',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = prodForm.tags.split(',').map((t) => t.trim()).filter(Boolean);

    const offerData = prodForm.hasOffer && prodForm.offerTitle.trim() ? {
      active: true,
      type: prodForm.offerType,
      title: prodForm.offerTitle.trim(),
      badgeText: prodForm.offerBadge.trim() || 'SPECIAL DEAL',
      description: prodForm.offerDescription.trim(),
      discountPct: Number(prodForm.offerDiscountPct) || 0,
      flatDiscount: Number(prodForm.offerFlatDiscount) || 0,
      validUntil: prodForm.offerValidUntil.trim(),
    } : undefined;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodForm.name,
        brand: prodForm.brand,
        category: prodForm.category || 'General',
        subcategory: prodForm.subcategory,
        sku: prodForm.sku,
        price: Number(prodForm.price),
        mrp: Number(prodForm.mrp),
        discount: Number(prodForm.discount),
        stock: Number(prodForm.stock),
        description: prodForm.description,
        tags: tagArray,
        featured: prodForm.featured,
        bestSeller: prodForm.bestSeller,
        newArrival: prodForm.newArrival,
        badge: prodForm.showBadge ? prodForm.badge.trim() : '',
        showBadge: prodForm.showBadge,
        showDiscountBadge: prodForm.showDiscountBadge,
        images: [prodForm.imageKey],
        offer: offerData,
      });
    } else {
      addProduct({
        name: prodForm.name,
        brand: prodForm.brand,
        category: prodForm.category || 'General',
        subcategory: prodForm.subcategory,
        sku: prodForm.sku,
        price: Number(prodForm.price),
        mrp: Number(prodForm.mrp),
        discount: Number(prodForm.discount),
        stock: Number(prodForm.stock),
        description: prodForm.description,
        tags: tagArray,
        featured: prodForm.featured,
        bestSeller: prodForm.bestSeller,
        newArrival: prodForm.newArrival,
        badge: prodForm.showBadge ? prodForm.badge.trim() : '',
        showBadge: prodForm.showBadge,
        showDiscountBadge: prodForm.showDiscountBadge,
        images: [prodForm.imageKey],
        rating: 4.8,
        reviewCount: 1,
        offer: offerData,
        specs: {
          Brand: prodForm.brand,
          Category: prodForm.category || 'General',
        },
      });
    }

    setProductModalOpen(false);
  };

  // Category Save Handler
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = catForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`;
    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catForm.name,
        slug,
        description: catForm.description,
        color: catForm.color,
        image: catForm.image,
        featured: catForm.featured,
      });
    } else {
      addCategory({
        name: catForm.name,
        slug,
        description: catForm.description,
        color: catForm.color,
        image: catForm.image,
        featured: catForm.featured,
        itemCount: 0,
        iconName: 'Package',
      });
    }
    setCategoryModalOpen(false);
  };

  // Manual Order Creation Handler
  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === manualOrderForm.productId) || products[0];
    const qty = Math.max(1, Number(manualOrderForm.quantity) || 1);
    const itemPrice = selProd ? selProd.price : 250;
    const subtotal = itemPrice * qty;
    const deliveryCharge = subtotal >= (storeSettings?.freeDeliveryThreshold ?? 500) ? 0 : 40;
    const total = subtotal + deliveryCharge;

    createDirectOrder({
      customerName: manualOrderForm.customerName || 'Direct Customer',
      phone: manualOrderForm.phone || '+91 98450 12345',
      email: manualOrderForm.email || 'customer@fathimastores.com',
      shippingAddress: {
        fullName: manualOrderForm.customerName || 'Direct Customer',
        phone: manualOrderForm.phone || '+91 98450 12345',
        email: manualOrderForm.email || 'customer@fathimastores.com',
        house: manualOrderForm.house || 'Shop Walk-in',
        street: manualOrderForm.street || 'Main Road',
        area: manualOrderForm.area || 'Central Market',
        city: manualOrderForm.city || 'Trivandrum',
        district: 'Trivandrum',
        state: manualOrderForm.state || 'Kerala',
        pinCode: manualOrderForm.pinCode || '695001',
        isDefault: true,
      },
      paymentMethod: manualOrderForm.paymentMethod,
      paymentStatus: manualOrderForm.paymentStatus,
      orderStatus: 'Confirmed',
      items: selProd
        ? [
            {
              productId: selProd.id,
              name: selProd.name,
              price: selProd.price,
              mrp: selProd.mrp,
              quantity: qty,
              image: selProd.images[0] || 'classmate-spiral',
              sku: selProd.sku,
            },
          ]
        : [
            {
              productId: 'fs-gen',
              name: 'Stationery Assorted Pack',
              price: 250,
              mrp: 300,
              quantity: qty,
              image: 'school-supplies',
              sku: 'FS-GEN',
            },
          ],
      subtotal,
      deliveryCharge,
      total,
    });

    setCreateOrderModalOpen(false);
  };

  // Review Save Handler
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === reviewForm.productId) || products[0];
    addReview({
      productId: selProd ? selProd.id : 'fs-general',
      productName: selProd ? selProd.name : reviewForm.productName || 'Stationery Item',
      rating: Number(reviewForm.rating) || 5,
      comment: reviewForm.comment,
      userName: reviewForm.userName || 'Verified Customer',
    });
    setReviewModalOpen(false);
  };

  // Banner Save Handler
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateBanner(editingBanner.id, {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        badge: bannerForm.badge,
        discountText: bannerForm.discountText,
        buttonText: bannerForm.buttonText,
        buttonLink: bannerForm.buttonLink,
        image: bannerForm.image,
        bgTone: bannerForm.bgTone,
        active: bannerForm.active,
      });
    } else {
      addBanner({
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        badge: bannerForm.badge,
        discountText: bannerForm.discountText,
        buttonText: bannerForm.buttonText,
        buttonLink: bannerForm.buttonLink,
        image: bannerForm.image,
        bgTone: bannerForm.bgTone,
        active: bannerForm.active,
      });
    }
    setBannerModalOpen(false);
  };

  // Hero Slide Handlers
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    try {
      showToast('Compressing slide image...', 'info');
      const res = await compressImageTo200KB(file, 160 * 1024);
      setSlideForm((prev) => ({ ...prev, image: res.dataUrl }));
      showToast(`Slide image compressed (${formatFileSize(res.compressedSize)}) & ready!`, 'success');
    } catch {
      showToast('Could not process slide image file', 'error');
    }
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim()) {
      showToast('Slide headline is required', 'error');
      return;
    }
    if (editingSlide) {
      updateHeroSlide(editingSlide.id, {
        badge: slideForm.badge,
        title: slideForm.title,
        subtitle: slideForm.subtitle,
        buttonText: slideForm.buttonText,
        buttonLink: slideForm.buttonLink,
        secondaryButtonText: slideForm.secondaryButtonText,
        secondaryButtonLink: slideForm.secondaryButtonLink,
        image: slideForm.image,
        bgTone: slideForm.bgTone,
        overlay: slideForm.overlay,
        overlayOpacity: slideForm.overlayOpacity,
        active: slideForm.active,
      });
    } else {
      addHeroSlide({
        badge: slideForm.badge,
        title: slideForm.title,
        subtitle: slideForm.subtitle,
        buttonText: slideForm.buttonText,
        buttonLink: slideForm.buttonLink,
        secondaryButtonText: slideForm.secondaryButtonText,
        secondaryButtonLink: slideForm.secondaryButtonLink,
        image: slideForm.image,
        bgTone: slideForm.bgTone,
        overlay: slideForm.overlay,
        overlayOpacity: slideForm.overlayOpacity,
        active: slideForm.active,
        order: heroSlides.length,
      });
    }
    setSlideModalOpen(false);
  };

  // Settings Save Handler with feedback & timestamp
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      updateStoreSettings(settingsForm);
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('All store customizations and settings saved successfully!', 'success');
    } catch (err) {
      console.error('Save settings error:', err);
      showToast('Could not save settings. Please check fields.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Export complete catalog and store state as JSON file
  const handleExportBackup = () => {
    try {
      const dataStr = exportStoreData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fathima-stores-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Store backup JSON file downloaded!', 'success');
    } catch (err) {
      showToast('Failed to export store backup', 'error');
    }
  };

  // Import store backup from file
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importStoreData(content);
        if (ok) setShowImportBackupModal(false);
      }
    };
    reader.readAsText(file);
  };

  // Seed sample products if catalog is empty
  const handleSeedSampleProducts = () => {
    const samples: Omit<Product, 'id' | 'createdAt'>[] = [
      {
        name: 'Classmate Pulse 6-Subject Spiral Notebook (300 Pages)',
        brand: 'Classmate',
        category: 'notebooks',
        subcategory: 'Spiral Notebooks',
        sku: 'FS-NB-01',
        price: 180,
        mrp: 220,
        discount: 18,
        stock: 65,
        description: 'Premium ozone-treated elemental chlorine-free paper notebook with stylish poly cover and micro-perforated pages.',
        tags: ['notebook', 'spiral', 'classmate', 'college'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        badge: 'Best Seller',
        images: ['classmate-spiral'],
        rating: 4.9,
        reviewCount: 38,
        specs: { Brand: 'Classmate', Pages: '300', Ruling: 'Single Line' },
      },
      {
        name: 'Cello Butterflow Classic Blue Ball Pen (Pack of 10)',
        brand: 'Cello',
        category: 'writing',
        subcategory: 'Ballpoint Pens',
        sku: 'FS-PEN-02',
        price: 100,
        mrp: 120,
        discount: 16,
        stock: 120,
        description: 'Super smooth writing with Swiss metal tip and comfortable elastomeric rubber grip.',
        tags: ['pens', 'ballpoint', 'cello', 'office'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        badge: 'Popular',
        images: ['cello-butterflow'],
        rating: 4.8,
        reviewCount: 52,
        specs: { Brand: 'Cello', Tip: '0.7mm', Ink: 'Blue' },
      },
      {
        name: 'Camlin Exam Geometry & Mathematical Drawing Instrument Box',
        brand: 'Camlin',
        category: 'school-supplies',
        subcategory: 'Geometry Sets',
        sku: 'FS-GEO-03',
        price: 150,
        mrp: 180,
        discount: 16,
        stock: 35,
        description: 'Self-centering compass, divider, protractor, set squares, sharpener and eraser in sturdy tin box.',
        tags: ['geometry', 'camlin', 'school', 'maths'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        badge: 'Essential',
        images: ['camlin-geometry'],
        rating: 4.7,
        reviewCount: 19,
        specs: { Brand: 'Camlin Kokuyo', Contents: '9 Instruments' },
      },
      {
        name: 'Faber-Castell Triangular Bi-Colour Pencils (Pack of 12 / 24 Shades)',
        brand: 'Faber-Castell',
        category: 'art-craft',
        subcategory: 'Coloring',
        sku: 'FS-ART-04',
        price: 160,
        mrp: 200,
        discount: 20,
        stock: 40,
        description: 'Ergonomic triangular shape for fatigue-free drawing. Smooth color laydown and break-resistant bonded lead.',
        tags: ['colors', 'art', 'faber-castell', 'drawing'],
        featured: true,
        bestSeller: false,
        newArrival: true,
        badge: 'New',
        images: ['faber-colors'],
        rating: 4.9,
        reviewCount: 27,
        specs: { Brand: 'Faber-Castell', Shades: '24 Colors' },
      },
    ];

    samples.forEach((s) => addProduct(s));
    showToast('Added 4 sample stationery items to catalog!', 'success');
  };

  // CSV Export utility
  const handleExportCSV = (type: 'orders' | 'products' | 'customers') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `fathima_stores_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'orders') {
      csvContent += 'Order ID,Date,Customer,Email,Phone,Items Count,Total,Payment Method,Payment Status,Order Status\n';
      orders.forEach((o) => {
        csvContent += `"${o.id}","${o.date}","${o.customerName}","${o.email}","${o.phone}",${o.items.length},${o.total},"${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}"\n`;
      });
    } else if (type === 'products') {
      csvContent += 'Product ID,Name,Brand,Category,SKU,Price,MRP,Stock,Rating,Reviews\n';
      products.forEach((p) => {
        csvContent += `"${p.id}","${p.name}","${p.brand}","${p.category}","${p.sku}",${p.price},${p.mrp},${p.stock},${p.rating},${p.reviewCount}\n`;
      });
    } else {
      csvContent += 'Customer Name,Email,Phone,Total Spent,Orders Count\n';
      customersList.forEach((c) => {
        csvContent += `"${c.name}","${c.email}","${c.phone}",${c.totalSpent},${c.ordersCount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${type} to CSV.`);
  };

  const unreadMessagesCount = useMemo(() => (customerMessages || []).filter((m) => m.status === "unread").length, [customerMessages]);

  const navMenuItems = [
    { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing' as const, label: 'Outlet Billing (POS)', icon: Receipt },
    { id: 'inbox' as const, label: 'Inbox', icon: Mail, count: unreadMessagesCount, alert: unreadMessagesCount > 0 },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'products' as const, label: 'Products', icon: Package, count: products.length },
    { id: 'categories' as const, label: 'Categories', icon: Layers },
    { id: 'inventory' as const, label: 'Inventory', icon: Warehouse, alert: lowStockCount > 0 },
    { id: 'customers' as const, label: 'Customers', icon: Users },
    { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
    { id: 'banners' as const, label: 'Banners', icon: ImageIcon },
    { id: 'hero-slides' as const, label: 'Hero Slider', icon: Sliders, count: heroSlides.length },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#F7F8F3] flex flex-col md:flex-row text-left antialiased">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E8E8E3] shrink-0 md:h-full md:overflow-y-auto z-40 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {storeSettings?.logoUrl && (storeSettings.logoType === "image" || storeSettings.logoType === "both") ? (
                <img
                  src={storeSettings.logoUrl}
                  alt={storeSettings.storeName || "Logo"}
                  className="h-8 w-auto max-w-[100px] object-contain rounded-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {storeSettings?.storeName?.substring(0, 2).toUpperCase() || "FS"}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#171717] tracking-tight truncate">{storeSettings?.storeName || "FATHIMA STORES"}</h2>
                <span className="text-[10px] text-[#71883F] font-semibold uppercase tracking-wider block">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EFF4E6] text-[#71883F]'
                      : 'text-[#171717] hover:bg-[#F7F8F3]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 stroke-[1.8]" />
                    {item.label}
                  </span>

                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                  {item.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8E8E3] text-[#171717] font-semibold tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Storefront Link & Signout */}
        <div className="p-3 border-t border-[#E8E8E3] space-y-1">
          <button
            onClick={() => setActivePage('home')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#171717] hover:bg-[#F7F8F3] flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#71883F]" /> View Storefront
          </button>
          <button
            onClick={() => {
              switchRole('customer');
              setActivePage('home');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-full md:overflow-y-auto">
        
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E8E8E3] px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search orders, products, SKUs, customers..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
              />
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#171717] hover:bg-[#F7F8F3] rounded-lg relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.read) && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E3]">
                    <span className="text-xs font-bold text-[#171717]">Store Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-[#6B6B6B]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.type === "customer") {
                            setCurrentTab("inbox");
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          n.read ? 'bg-white opacity-70' : 'bg-[#F7F8F3] font-semibold'
                        }`}
                      >
                        <p className="text-[#171717]">{n.title}</p>
                        <p className="text-[11px] text-[#6B6B6B] font-normal">{n.message}</p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>



            {/* Admin Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#E8E8E3]">
              <div className="w-8 h-8 rounded-full bg-[#EFF4E6] text-[#71883F] font-bold text-xs flex items-center justify-center">
                FS
              </div>
              <div className="hidden sm:block text-xs">
                <span className="font-bold text-[#171717] block leading-none">Store Manager</span>
                <span className="text-[10px] text-[#6B6B6B]">admin@fathimastores.com</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-8">
          
          {/* OUTLET BILLING POS TAB */}
          {currentTab === "billing" && <AdminBillingPOS />}

          {/* INBOX MESSAGES TAB */}
          {currentTab === "inbox" && <AdminInboxView />}

          {/* 1. OVERVIEW TAB */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Dashboard Overview
                </h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Real-time sales, order fulfillment, and stationery inventory analytics.
                </p>
              </div>

              {/* 4 Primary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span>Total Sales</span>
                    <span className="text-[#71883F] font-semibold bg-[#EFF4E6] px-1.5 py-0.5 rounded text-[10px]">
                      +14% this month
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#171717] mt-2 tabular-nums">
                    ₹{totalSales.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">₹3,420 generated today</p>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span>Total Orders</span>
                    <span className="text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                      {pendingOrdersCount} pending
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#171717] mt-2 tabular-nums">
                    {totalOrdersCount}
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">All fulfillment active</p>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span>Catalog Products</span>
                    <span className="text-neutral-700 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                      {categories.length} Categories
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#171717] mt-2 tabular-nums">
                    {totalProductsCount}
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">
                    {products.filter((p) => p.bestSeller).length} Best Sellers
                  </p>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span>Inventory Status</span>
                    {lowStockCount > 0 ? (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                        {lowStockCount} Low
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        Healthy
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-[#171717] mt-2 tabular-nums">
                    {lowStockCount} Items Low
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">{outOfStockCount} Out of stock</p>
                </div>
              </div>

              {/* Minimal SVG Sales & Orders Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sales Trend Chart */}
                <div className="lg:col-span-8 bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#171717]">Weekly Sales Performance</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF4E6] text-[#71883F] font-bold">
                          Live Data
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">
                        Calculated from {weeklySalesStats.totalOrders7Days} actual orders over the past 7 days (₹)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-[#71883F] bg-[#EFF4E6] px-2.5 py-1 rounded-lg block">
                          Avg ₹{weeklySalesStats.avgPerDay.toLocaleString('en-IN')}/day
                        </span>
                        <span className="text-[10px] text-[#6B6B6B] block mt-0.5">
                          7-Day Total: ₹{weeklySalesStats.total7Days.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          createDirectOrder({
                            total: 450,
                            customerName: 'Walk-in Student',
                            items: [
                              {
                                productId: 'fs-sample',
                                name: 'Stationery Study Pack',
                                price: 450,
                                mrp: 500,
                                quantity: 1,
                                image: 'school-supplies',
                                sku: 'FS-TEST',
                              },
                            ],
                          });
                        }}
                        title="Simulate placing a new order today to test chart updates"
                        className="px-2.5 py-1 bg-white hover:bg-[#F7F8F3] border border-[#E8E8E3] hover:border-[#71883F] text-[11px] font-semibold text-[#71883F] rounded-lg transition-colors shadow-2xs shrink-0"
                      >
                        + Test Sale (₹450)
                      </button>
                    </div>
                  </div>

                  {/* Clean SVG Bar Chart with Real Data */}
                  <div className="h-56 w-full pt-4">
                    <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                      {/* Grid lines */}
                      <line x1="0" y1="175" x2="600" y2="175" stroke="#E8E8E3" strokeWidth="1" />
                      <line x1="0" y1="115" x2="600" y2="115" stroke="#F0F0EC" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="0" y1="55" x2="600" y2="55" stroke="#F0F0EC" strokeWidth="1" strokeDasharray="3,3" />

                      {/* Dynamic Bars for past 7 days */}
                      {weeklySalesStats.days.map((bar) => {
                        const barHeight = bar.val > 0
                          ? Math.max(16, Math.round((bar.val / weeklySalesStats.maxVal) * 125))
                          : 4;
                        const isToday = bar.x === 520;
                        return (
                          <g key={bar.date} className="group cursor-pointer">
                            <title>{`${bar.formattedDate} (${bar.day}): ₹${bar.val} from ${bar.ordersCount} orders`}</title>
                            <rect
                              x={bar.x}
                              y={175 - barHeight}
                              width="42"
                              height={barHeight}
                              rx="6"
                              fill={bar.val > 0 ? '#71883F' : '#E8E8E3'}
                              className={bar.val > 0 ? 'hover:fill-[#5F7334] transition-colors' : ''}
                            />
                            {bar.val > 0 ? (
                              <text
                                x={bar.x + 21}
                                y={165 - barHeight}
                                fontSize="10"
                                fontWeight="bold"
                                fill="#171717"
                                textAnchor="middle"
                              >
                                ₹{bar.val}
                              </text>
                            ) : (
                              <text
                                x={bar.x + 21}
                                y="166"
                                fontSize="9"
                                fill="#A3A3A3"
                                textAnchor="middle"
                              >
                                ₹0
                              </text>
                            )}
                            <text
                              x={bar.x + 21}
                              y="192"
                              fontSize="11"
                              fontWeight={isToday ? 'bold' : 'normal'}
                              fill={isToday ? '#71883F' : '#6B6B6B'}
                              textAnchor="middle"
                            >
                              {bar.day}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Top Selling Products List */}
                <div className="lg:col-span-4 bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                  <h4 className="text-sm font-bold text-[#171717]">Top Selling Items</h4>
                  <div className="space-y-3">
                    {products.slice(0, 5).map((p, idx) => (
                      <div key={`${p.id}-${idx}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-md bg-[#F7F8F3] text-[#71883F] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-[#171717] truncate">{p.name}</span>
                        </div>
                        <span className="font-bold text-[#71883F] tabular-nums shrink-0">
                          ₹{p.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Recent Orders table */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#171717]">Recent Customer Orders</h4>
                    <p className="text-xs text-[#6B6B6B]">Latest orders pending shipment and delivery</p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('orders')}
                    className="text-xs font-semibold text-[#71883F] hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order ID</th>
                        <th className="py-3 px-4 font-semibold">Customer</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E3]">
                      {orders.slice(0, 5).map((order, idx) => (
                        <tr key={`${order.id}-${idx}`} className="hover:bg-[#F7F8F3]/50">
                          <td className="py-3 px-4 font-bold text-[#171717]">{order.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-[#171717] block">{order.customerName}</span>
                            <span className="text-[11px] text-[#6B6B6B]">{order.phone}</span>
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">{order.date}</td>
                          <td className="py-3 px-4 font-bold text-[#171717] tabular-nums">
                            ₹{order.total}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF4E6] text-[#71883F]">
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderForInvoice(order)}
                              className="px-2.5 py-1 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-[11px] font-semibold text-[#171717]"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORDERS MANAGEMENT TAB */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Order Management ({orders.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    View customer shipping addresses, update fulfillment status & generate tax invoices.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setManualOrderForm({
                        customerName: '',
                        phone: '+91 ',
                        email: '',
                        house: '',
                        street: '',
                        area: '',
                        city: 'Trivandrum',
                        state: 'Kerala',
                        pinCode: '695001',
                        productId: products[0]?.id || '',
                        quantity: 1,
                        paymentMethod: 'UPI - Google Pay',
                        paymentStatus: 'Paid',
                      });
                      setCreateOrderModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Manual Order
                  </button>



                  <button
                    onClick={() => handleExportCSV('orders')}
                    className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Confirmed', label: 'Confirmed' },
                  { id: 'Processing', label: 'Processing' },
                  { id: 'Shipped', label: 'Shipped' },
                  { id: 'Out for Delivery', label: 'Out for Delivery' },
                  { id: 'Delivered', label: 'Delivered' },
                  { id: 'Cancelled', label: 'Cancelled' },
                ].map((tab) => {
                  const isSel = orderStatusFilter === tab.id;
                  const count =
                    tab.id === 'all'
                      ? orders.length
                      : orders.filter((o) => o.orderStatus === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setOrderStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#71883F] text-white shadow-2xs'
                          : 'bg-white text-[#171717] border border-[#E8E8E3] hover:bg-[#F7F8F3]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                          isSel ? 'bg-white/20 text-white' : 'bg-[#E8E8E3] text-[#6B6B6B]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                {orders.filter((o) => {
                  if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                  if (!adminSearch) return true;
                  const q = adminSearch.toLowerCase();
                  return (
                    o.id.toLowerCase().includes(q) ||
                    o.customerName.toLowerCase().includes(q) ||
                    o.phone.includes(q) ||
                    o.email.toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#171717]">No Orders Found</h3>
                    <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                      {orders.length === 0
                        ? 'There are currently 0 customer orders in the system. Use the buttons below to create manual or test orders.'
                        : 'No orders match your selected status or search filter.'}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setManualOrderForm({
                            customerName: 'Direct Customer',
                            phone: '+91 98450 12345',
                            email: 'customer@fathimastores.com',
                            house: 'Walk-in',
                            street: 'Main Road',
                            area: 'City Center',
                            city: 'Trivandrum',
                            state: 'Kerala',
                            pinCode: '695001',
                            productId: products[0]?.id || '',
                            quantity: 1,
                            paymentMethod: 'UPI - Google Pay',
                            paymentStatus: 'Paid',
                          });
                          setCreateOrderModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold"
                      >
                        + Create Manual Order
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Order</th>
                          <th className="py-3 px-4 font-semibold">Customer Details</th>
                          <th className="py-3 px-4 font-semibold">Items</th>
                          <th className="py-3 px-4 font-semibold">Total</th>
                          <th className="py-3 px-4 font-semibold">Payment</th>
                          <th className="py-3 px-4 font-semibold">Status Update</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E3]">
                        {orders
                          .filter((o) => {
                            if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter)
                              return false;
                            if (!adminSearch) return true;
                            const q = adminSearch.toLowerCase();
                            return (
                              o.id.toLowerCase().includes(q) ||
                              o.customerName.toLowerCase().includes(q) ||
                              o.phone.includes(q) ||
                              o.email.toLowerCase().includes(q)
                            );
                          })
                          .map((order, idx) => (
                            <tr key={`${order.id}-${idx}`} className="hover:bg-[#F7F8F3]/50">
                              <td className="py-3 px-4 font-bold text-[#171717]">
                                <button
                                  onClick={() => setViewingOrder(order)}
                                  className="hover:text-[#71883F] hover:underline block text-left"
                                >
                                  {order.id}
                                </button>
                                <span className="block text-[10px] text-[#6B6B6B] font-normal">
                                  {order.date}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#171717] block">
                                  {order.customerName}
                                </span>
                                <span className="text-[11px] text-[#6B6B6B] block">
                                  {order.phone}
                                </span>
                                <span className="text-[10px] text-[#6B6B6B] truncate max-w-xs block">
                                  {order.shippingAddress?.city}, {order.shippingAddress?.pinCode}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#171717]">
                                  {order.items.length} items
                                </span>
                                <span className="text-[11px] text-[#6B6B6B] block truncate max-w-[140px]">
                                  {order.items.map((i) => i.name).join(', ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-[#171717] tabular-nums">
                                ₹{order.total}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[11px] font-semibold text-[#171717]">
                                  {order.paymentMethod}
                                </span>
                                <span
                                  className={`block text-[10px] font-bold ${
                                    order.paymentStatus === 'Paid'
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) =>
                                    updateOrderStatus(order.id, e.target.value as OrderStatus)
                                  }
                                  className="text-xs bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg px-2 py-1 font-semibold text-[#171717] outline-none focus:border-[#71883F]"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setViewingOrder(order)}
                                    className="p-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-neutral-600 hover:text-[#71883F]"
                                    title="View Order Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedOrderForInvoice(order)}
                                    className="p-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-neutral-600 hover:text-[#71883F]"
                                    title="Invoice"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete order ${order.id}?`)) {
                                        deleteOrder(order.id);
                                      }
                                    }}
                                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. PRODUCTS MANAGEMENT TAB */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Product Catalog ({products.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Add new stationery items with &le;200KB image compression, edit pricing & manage inventory.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {products.length === 0 && (
                    <button
                      onClick={handleSeedSampleProducts}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Load 4 Sample Items
                    </button>
                  )}

                  <button
                    onClick={() => handleExportCSV('products')}
                    className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export CSV
                  </button>

                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>

              {/* Category & Stock Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B6B6B] font-semibold">Category:</span>
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg font-semibold text-[#171717] outline-none focus:border-[#71883F]"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({products.filter((p) => p.category === c.slug).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B6B6B] font-semibold">Stock:</span>
                  <select
                    value={prodStockFilter}
                    onChange={(e) => setProdStockFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg font-semibold text-[#171717] outline-none focus:border-[#71883F]"
                  >
                    <option value="all">All Stock Statuses</option>
                    <option value="in_stock">In Stock (&gt;15)</option>
                    <option value="low_stock">Low Stock (&le;15)</option>
                    <option value="out_of_stock">Out of Stock (0)</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedProductIds.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-rose-900">
                      {selectedProductIds.length} item{selectedProductIds.length > 1 ? 's' : ''} selected
                    </span>
                    <span className="text-[11px] text-rose-700 hidden sm:inline">
                      Ready for batch removal from store catalog
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected ({selectedProductIds.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#171717]">No Products in Catalog</h3>
                    <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                      {products.length === 0
                        ? 'There are currently 0 products in your store. Add your first stationery item with ≤200KB image compression or load sample products.'
                        : 'No products match the selected category or filter.'}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={handleOpenAddProduct}
                        className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold"
                      >
                        + Add First Product
                      </button>
                      {products.length === 0 && (
                        <button
                          onClick={handleSeedSampleProducts}
                          className="px-4 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] text-[#171717] rounded-lg text-xs font-semibold"
                        >
                          + Load 4 Sample Stationery Products
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredProducts.length > 0 &&
                                filteredProducts.every((p) => selectedProductIds.includes(p.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds(
                                    Array.from(new Set([...selectedProductIds, ...filteredProducts.map((p) => p.id)]))
                                  );
                                } else {
                                  const visibleIds = new Set(filteredProducts.map((p) => p.id));
                                  setSelectedProductIds(selectedProductIds.filter((id) => !visibleIds.has(id)));
                                }
                              }}
                              className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                              title="Select all filtered products"
                            />
                          </th>
                          <th className="py-3 px-4 font-semibold">Item & SKU</th>
                          <th className="py-3 px-4 font-semibold">Brand / Category</th>
                          <th className="py-3 px-4 font-semibold">Price / MRP</th>
                          <th className="py-3 px-4 font-semibold">Stock</th>
                          <th className="py-3 px-4 font-semibold">Badges</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E3]">
                        {filteredProducts.map((p, idx) => (
                          <tr
                            key={`${p.id}-${idx}`}
                            className={`hover:bg-[#F7F8F3]/50 transition-colors ${
                              selectedProductIds.includes(p.id) ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, p.id]);
                                  } else {
                                    setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#F7F8F3] overflow-hidden shrink-0 border border-[#E8E8E3]">
                                  <ProductImage
                                    imageKey={p.images[0]}
                                    name={p.name}
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <span className="font-bold text-[#171717] truncate block">
                                    {p.name}
                                  </span>
                                  <span className="text-[11px] text-[#6B6B6B] font-mono">
                                    {p.sku}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#171717]">{p.brand}</span>
                              <span className="text-[11px] text-[#6B6B6B] block">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 tabular-nums">
                              <span className="font-bold text-[#171717]">₹{p.price}</span>
                              <span className="text-[10px] text-[#6B6B6B] line-through block">
                                ₹{p.mrp}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums ${
                                  p.stock === 0
                                    ? 'bg-rose-100 text-rose-700'
                                    : p.stock <= 15
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {p.stock} in stock
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 items-center">
                                {p.offer?.active && (
                                  <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                                    🔥 {p.offer.badgeText || p.offer.title}
                                  </span>
                                )}
                                {p.showBadge !== false && p.badge && (
                                  <span className="text-[9px] font-bold bg-white text-[#171717] border border-[#E8E8E3] px-1.5 py-0.5 rounded shadow-2xs">
                                    🏷️ {p.badge}
                                  </span>
                                )}
                                {p.showBadge === false && (
                                  <span className="text-[9px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 px-1.5 py-0.5 rounded">
                                    No Badge
                                  </span>
                                )}
                                {p.bestSeller && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Best Seller
                                  </span>
                                )}
                                {p.newArrival && (
                                  <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded">
                                    New
                                  </span>
                                )}
                                {p.featured && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Remove Badge / Add Badge button */}
                                {p.showBadge !== false && (p.badge || p.offer?.active || (p.discount > 0 && p.showDiscountBadge !== false)) ? (
                                  <button
                                    onClick={() => {
                                      updateProduct(p.id, {
                                        badge: '',
                                        showBadge: false,
                                        showDiscountBadge: false,
                                        offer: p.offer?.active ? undefined : p.offer,
                                      });
                                      showToast(`Badge removed from "${p.name}"`, 'info');
                                    }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                                    title="Remove corner badge span from this product"
                                  >
                                    <Tag className="w-2.5 h-2.5" /> Remove Badge
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      updateProduct(p.id, {
                                        badge: 'Special',
                                        showBadge: true,
                                        showDiscountBadge: true,
                                      });
                                      showToast(`Badge added to "${p.name}"`, 'success');
                                    }}
                                    className="px-2 py-1 bg-neutral-100 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-700 border border-neutral-200 rounded text-[10px] font-semibold transition-colors"
                                    title="Add badge to this product"
                                  >
                                    + Badge
                                  </button>
                                )}

                                {p.offer?.active ? (
                                  <button
                                    onClick={() => {
                                      updateProduct(p.id, { offer: undefined });
                                      showToast(`Turned off offer for "${p.name}"`, 'info');
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition-colors"
                                    title="Click to turn off special offer"
                                  >
                                    Turn Off Deal
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenEditProduct(p)}
                                    className="px-2 py-1 bg-neutral-100 hover:bg-amber-50 text-neutral-700 hover:text-amber-900 border border-neutral-200 rounded text-[10px] font-semibold transition-colors"
                                    title="Add special offer or BOGO to this item"
                                  >
                                    + Offer
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1.5 text-neutral-600 hover:text-[#71883F] hover:bg-white rounded transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => duplicateProduct(p.id)}
                                  className="p-1.5 text-neutral-600 hover:text-sky-600 hover:bg-white rounded transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProductToDelete(p)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Delete Product from Store"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. INVENTORY TAB */}
          {currentTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Inventory & Stock Levels
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Monitor warehouse counts, quickly update stocks, and avert out-of-stock scenarios.
                  </p>
                </div>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B6B6B]">Healthy Stock</span>
                    <h3 className="text-xl font-bold text-emerald-700">
                      {products.filter((p) => p.stock > 15).length} Items
                    </h3>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B6B6B]">Low Stock (≤15)</span>
                    <h3 className="text-xl font-bold text-amber-600">{lowStockCount} Items</h3>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B6B6B]">Out of Stock</span>
                    <h3 className="text-xl font-bold text-rose-600">{outOfStockCount} Items</h3>
                  </div>
                  <XCircle className="w-6 h-6 text-rose-500" />
                </div>
              </div>

              {/* Quick Update Stock Table */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Product Name</th>
                      <th className="py-3 px-4 font-semibold">SKU</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Current Count</th>
                      <th className="py-3 px-4 font-semibold text-right">Quick Stock Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E3]">
                    {products.map((p, idx) => (
                      <tr key={`${p.id}-${idx}`} className="hover:bg-[#F7F8F3]/50">
                        <td className="py-3 px-4 font-semibold text-[#171717]">{p.name}</td>
                        <td className="py-3 px-4 text-[#6B6B6B] font-mono">{p.sku}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.stock === 0
                                ? 'bg-rose-100 text-rose-700'
                                : p.stock <= 15
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock === 0 ? 'Out of Stock' : p.stock <= 15 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#171717] tabular-nums">
                          {p.stock} units
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => quickUpdateStock(p.id, Math.max(0, p.stock - 5))}
                              className="px-2 py-1 bg-[#F7F8F3] hover:bg-neutral-200 rounded border border-[#E8E8E3] text-xs font-semibold"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => quickUpdateStock(p.id, p.stock + 10)}
                              className="px-2 py-1 bg-[#EFF4E6] hover:bg-[#dfeacb] text-[#71883F] rounded border border-[#71883F]/30 text-xs font-semibold"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => quickUpdateStock(p.id, p.stock + 50)}
                              className="px-2 py-1 bg-[#EFF4E6] hover:bg-[#dfeacb] text-[#71883F] rounded border border-[#71883F]/30 text-xs font-semibold"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-1 cursor-pointer"
                              title="Delete Item from Inventory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CATEGORIES TAB */}
          {currentTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Categories ({categories.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Organize stationery sections, upload icons, and edit category slugs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {categories.length > 0 && (
                    <button
                      onClick={() => setShowClearAllCategoriesModal(true)}
                      className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove All Categories
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatForm({
                        name: '',
                        slug: '',
                        description: '',
                        color: '#EFF4E6',
                        image: 'school-supplies',
                        featured: true,
                      });
                      setCategoryModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                </div>
              </div>

              {categories.length === 0 ? (
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-12 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171717]">No Categories Configured</h3>
                  <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                    All categories have been removed. You can create new custom categories whenever needed, or continue organizing stationery products directly.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatForm({
                        name: '',
                        slug: '',
                        description: '',
                        color: '#EFF4E6',
                        image: 'school-supplies',
                        featured: true,
                      });
                      setCategoryModalOpen(true);
                    }}
                    className="mt-2 px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categories.map((cat, idx) => {
                    const count = products.filter((p) => p.category === cat.slug).length;
                    return (
                      <div
                        key={`${cat.id}-${idx}`}
                        className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className="w-12 h-12 rounded-full p-2 flex items-center justify-center border border-[#E8E8E3]"
                              style={{ backgroundColor: cat.color }}
                            >
                              <ProductImage imageKey={cat.image} name={cat.name} className="w-full h-full bg-transparent" />
                            </div>
                            <span className="text-xs font-semibold text-[#71883F] tabular-nums">
                              {count} Items
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-[#171717]">{cat.name}</h4>
                          <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">{cat.description}</p>
                          <span className="text-[10px] text-neutral-400 font-mono mt-2 block">
                            Slug: /{cat.slug}
                          </span>
                        </div>

                        <div className="pt-4 border-t border-[#E8E8E3] mt-4 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCatForm({
                                name: cat.name,
                                slug: cat.slug,
                                description: cat.description,
                                color: cat.color,
                                image: cat.image,
                                featured: cat.featured,
                              });
                              setCategoryModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs border border-[#E8E8E3] rounded hover:border-[#71883F] text-[#171717]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(cat)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. CUSTOMERS TAB */}
          {currentTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Customers ({customersList.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Customer contact records, order totals, and purchase history.
                  </p>
                </div>

                <button
                  onClick={() => handleExportCSV('customers')}
                  className="px-4 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export Customers CSV
                </button>
              </div>

              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                {customersList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#171717]">No Customer Records Yet</h3>
                    <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                      Customer profiles are created automatically whenever an order is placed in the store.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Customer</th>
                        <th className="py-3 px-4 font-semibold">Phone</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold">Orders</th>
                        <th className="py-3 px-4 font-semibold text-right">Total Spent</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E3]">
                      {customersList.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F8F3]/50">
                          <td className="py-3 px-4 font-semibold text-[#171717]">{cust.name}</td>
                          <td className="py-3 px-4 text-[#6B6B6B]">{cust.phone}</td>
                          <td className="py-3 px-4 text-[#6B6B6B]">{cust.email}</td>
                          <td className="py-3 px-4 tabular-nums">{cust.ordersCount} orders</td>
                          <td className="py-3 px-4 font-bold text-[#71883F] text-right tabular-nums">
                            ₹{cust.totalSpent}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setViewingCustomer(cust)}
                              className="px-2.5 py-1 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-[11px] font-semibold text-[#71883F]"
                            >
                              View Orders
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 7. REVIEWS MODERATION TAB */}
          {currentTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Customer Reviews ({reviews.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Approve, moderate or remove customer testimonials and product reviews.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReviewForm({
                      productId: products[0]?.id || '',
                      productName: products[0]?.name || '',
                      userName: '',
                      rating: 5,
                      comment: '',
                    });
                    setReviewModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" /> Add Review
                </button>
              </div>

              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs divide-y divide-[#E8E8E3]">
                {reviews.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#171717]">No Customer Reviews Yet</h3>
                    <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                      Customer ratings and testimonials will appear here. You can also add customer feedback manually.
                    </p>
                    <button
                      onClick={() => {
                        setReviewForm({
                          productId: products[0]?.id || '',
                          productName: products[0]?.name || '',
                          userName: 'Deepa Varma',
                          rating: 5,
                          comment: 'Exceptional stationery quality! Smooth notebook paper and speedy delivery.',
                        });
                        setReviewModalOpen(true);
                      }}
                      className="mt-2 px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold"
                    >
                      + Add Sample Review
                    </button>
                  </div>
                ) : (
                  reviews.map((rev, idx) => (
                    <div key={`${rev.id}-${idx}`} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#171717]">{rev.userName}</span>
                          <span className="text-[11px] text-[#6B6B6B]">on {rev.productName}</span>
                          <span className="text-[11px] text-amber-500 font-bold">★ {rev.rating}</span>
                        </div>
                        <p className="text-xs text-[#171717] leading-relaxed">"{rev.comment}"</p>
                        <span className="text-[10px] text-neutral-400 block">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReviewStatus(rev.id, rev.status === 'approved' ? 'hidden' : 'approved')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                            rev.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          {rev.status === 'approved' ? 'Approved' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => deleteReview(rev.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. BANNERS TAB */}
          {currentTab === 'banners' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Homepage Promotional Banners ({banners.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Update promotional campaign cards and discounts live on the storefront.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setBannerForm({
                      title: 'Flash Sale: 25% Off School Supplies',
                      subtitle: 'Save big on notebooks, geometry boxes, and pen packs this week.',
                      badge: 'Limited Time',
                      discountText: '25% OFF',
                      buttonText: 'Shop the Sale →',
                      buttonLink: '/shop',
                      image: 'promo-banner',
                      bgTone: '#F7F8F3',
                      active: true,
                    });
                    setBannerModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" /> Add Banner
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {banners.map((b, idx) => (
                  <div key={`${b.id}-${idx}`} className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#71883F] uppercase tracking-wider">{b.badge}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateBanner(b.id, { active: !b.active })}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {b.active ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingBanner(b);
                            setBannerForm({
                              title: b.title,
                              subtitle: b.subtitle,
                              badge: b.badge,
                              discountText: b.discountText,
                              buttonText: b.buttonText,
                              buttonLink: b.buttonLink,
                              image: b.image,
                              bgTone: b.bgTone,
                              active: b.active,
                            });
                            setBannerModalOpen(true);
                          }}
                          className="p-1 text-neutral-600 hover:text-[#71883F]"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBannerToDelete(b)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Card */}
                    <div
                      className="p-5 rounded-xl border border-[#E8E8E3] space-y-2 relative overflow-hidden"
                      style={{ backgroundColor: b.bgTone || '#F7F8F3' }}
                    >
                      <span className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider block">
                        {b.badge}
                      </span>
                      <h4 className="text-base font-extrabold text-[#171717]">{b.title}</h4>
                      <p className="text-xs text-[#6B6B6B]">{b.subtitle}</p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-[#71883F] text-white text-xs font-semibold rounded-lg">
                          {b.buttonText}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8.5 HERO SLIDES TAB */}
          {currentTab === 'hero-slides' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Hero Section Slides ({heroSlides.length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Customize rotating showcase slides, headlines, background visuals, CTAs and auto-play interval on the home hero.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingSlide(null);
                    setSlideForm({
                      badge: 'New Collection 2026',
                      title: '',
                      subtitle: '',
                      buttonText: 'Shop Now',
                      buttonLink: 'shop',
                      secondaryButtonText: 'Browse Catalog',
                      secondaryButtonLink: 'shop',
                      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
                      bgTone: '#F7F8F3',
                      overlay: 'light',
                      overlayOpacity: 75,
                      active: true,
                    });
                    setSlideModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#71883F] hover:bg-[#5F7334] rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Add New Slide
                </button>
              </div>

              {/* Slider Settings Bar */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={storeSettings.heroSliderAutoplay !== false}
                      onChange={(e) => updateStoreSettings({ heroSliderAutoplay: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>Auto-Play Moving Slides</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#6B6B6B] font-medium">Slide Interval:</span>
                  <select
                    value={storeSettings.heroSliderInterval || 5000}
                    onChange={(e) => updateStoreSettings({ heroSliderInterval: Number(e.target.value) })}
                    className="px-3 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg font-semibold text-[#171717] outline-none"
                  >
                    <option value={3000}>3 Seconds (Fast)</option>
                    <option value={5000}>5 Seconds (Recommended)</option>
                    <option value={7000}>7 Seconds (Gentle)</option>
                    <option value={10000}>10 Seconds (Slow)</option>
                  </select>
                </div>
              </div>

              {/* Slides Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {heroSlides.map((slide, idx) => (
                  <div key={slide.id} className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#EFF4E6] text-[#71883F] font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#71883F] uppercase tracking-wider">{slide.badge}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateHeroSlide(slide.id, { active: !slide.active })}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold cursor-pointer ${
                            slide.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {slide.active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingSlide(slide);
                            setSlideForm({
                              badge: slide.badge,
                              title: slide.title,
                              subtitle: slide.subtitle,
                              buttonText: slide.buttonText,
                              buttonLink: slide.buttonLink,
                              secondaryButtonText: slide.secondaryButtonText || '',
                              secondaryButtonLink: slide.secondaryButtonLink || '',
                              image: slide.image || '',
                              bgTone: slide.bgTone || '#F7F8F3',
                              overlay: slide.overlay || 'light',
                              overlayOpacity: slide.overlayOpacity ?? 75,
                              active: slide.active,
                            });
                            setSlideModalOpen(true);
                          }}
                          className="p-1 text-neutral-600 hover:text-[#71883F] cursor-pointer"
                          title="Edit Slide"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (heroSlides.length <= 1) {
                              showToast('Cannot delete the only slide.', 'error');
                              return;
                            }
                            setSlideToDelete(slide);
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Live Slide Preview Card */}
                    <div
                      className="p-5 rounded-xl border border-[#E8E8E3] space-y-2 relative overflow-hidden transition-all"
                      style={{
                        backgroundColor: slide.bgTone || '#F7F8F3',
                        backgroundImage: slide.image ? `url("${slide.image}")` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {slide.image && (
                        <div
                          className="absolute inset-0 bg-white"
                          style={{ opacity: (slide.overlayOpacity ?? 75) / 100 }}
                        />
                      )}
                      <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider block">
                          {slide.badge}
                        </span>
                        <h4 className="text-base font-extrabold text-[#171717]">{slide.title}</h4>
                        <p className="text-xs text-[#6B6B6B] line-clamp-2">{slide.subtitle}</p>
                        <div className="pt-2 flex items-center gap-2">
                          <span className="inline-block px-3 py-1 bg-[#71883F] text-white text-xs font-semibold rounded-lg">
                            {slide.buttonText}
                          </span>
                          {slide.secondaryButtonText && (
                            <span className="inline-block px-3 py-1 bg-white border border-[#E8E8E3] text-[#171717] text-xs font-semibold rounded-lg">
                              {slide.secondaryButtonText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-1">
                      <span>Target: <span className="font-mono text-[#171717]">{slide.buttonLink}</span></span>
                      {slide.image && <span className="text-emerald-700 font-semibold">Image Configured</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. REPORTS TAB */}
          {currentTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Business Reports & Financial Analytics
                </h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Export financial logs, customer accounts, and catalog stock for GST and accounting.
                </p>
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4">
                  <span className="text-xs text-[#6B6B6B]">Total Revenue</span>
                  <h4 className="text-xl font-bold text-[#171717] mt-1 tabular-nums">
                    ₹{totalSales.toLocaleString('en-IN')}
                  </h4>
                </div>
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4">
                  <span className="text-xs text-[#6B6B6B]">Total Orders</span>
                  <h4 className="text-xl font-bold text-[#171717] mt-1 tabular-nums">
                    {orders.length}
                  </h4>
                </div>
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4">
                  <span className="text-xs text-[#6B6B6B]">Average Order Value</span>
                  <h4 className="text-xl font-bold text-[#71883F] mt-1 tabular-nums">
                    ₹{orders.length > 0 ? Math.round(totalSales / orders.length) : 0}
                  </h4>
                </div>
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4">
                  <span className="text-xs text-[#6B6B6B]">Active Customers</span>
                  <h4 className="text-xl font-bold text-[#171717] mt-1 tabular-nums">
                    {customersList.length}
                  </h4>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                <h4 className="font-bold text-sm text-[#171717]">Catalog Distribution by Category</h4>
                <div className="space-y-3">
                  {categories.map((c) => {
                    const count = products.filter((p) => p.category === c.slug).length;
                    const pct = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
                    return (
                      <div key={c.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#171717]">{c.name}</span>
                          <span className="text-[#6B6B6B] tabular-nums">{count} items ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-[#F7F8F3] rounded-full overflow-hidden border border-[#E8E8E3]">
                          <div
                            className="h-full bg-[#71883F] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3 CSV Export Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-3">
                  <h4 className="font-bold text-sm text-[#171717]">Orders & Revenue</h4>
                  <p className="text-xs text-[#6B6B6B]">Download all customer orders, itemized lines and payment statuses.</p>
                  <button
                    onClick={() => handleExportCSV('orders')}
                    className="w-full py-2 px-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Orders CSV
                  </button>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-3">
                  <h4 className="font-bold text-sm text-[#171717]">Product Catalog & Stock</h4>
                  <p className="text-xs text-[#6B6B6B]">Export all current inventory counts, retail prices and manufacturer SKUs.</p>
                  <button
                    onClick={() => handleExportCSV('products')}
                    className="w-full py-2 px-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Products CSV
                  </button>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-3">
                  <h4 className="font-bold text-sm text-[#171717]">Customer Accounts</h4>
                  <p className="text-xs text-[#6B6B6B]">Customer lifetime spend, registration dates and contact numbers.</p>
                  <button
                    onClick={() => handleExportCSV('customers')}
                    className="w-full py-2 px-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Customers CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 10. SETTINGS TAB */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Store Settings & Configuration
                </h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Update business profile, free shipping limits, delivery charges, and UPI merchant accounts.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. ACCENT COLORS CUSTOMIZER */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-5 shadow-2xs text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E8E3] pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#71883F]" />
                        Store Accent Color & Theme Engine
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Change the primary accent color across all buttons, highlights, badges, pills, and active links throughout the entire storefront.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateStoreSettings({ accentColor: settingsForm.accentColor });
                        showToast(`Accent color updated to ${settingsForm.accentColor}! Applied live.`, 'success');
                      }}
                      className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" /> Apply Accent Live
                    </button>
                  </div>

                  {/* Preset Swatches */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#171717] block mb-2">
                      Choose from Curated Brand Palettes:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { name: 'Olive Green (Default)', hex: '#71883F' },
                        { name: 'Emerald Forest', hex: '#059669' },
                        { name: 'Royal Indigo', hex: '#4F46E5' },
                        { name: 'Ocean Sapphire', hex: '#2563EB' },
                        { name: 'Ruby Crimson', hex: '#E11D48' },
                        { name: 'Warm Amber', hex: '#D97706' },
                        { name: 'Vibrant Violet', hex: '#7C3AED' },
                        { name: 'Modern Charcoal', hex: '#18181B' },
                        { name: 'Teal Cyan', hex: '#0D9488' },
                        { name: 'Sunset Coral', hex: '#EA580C' },
                      ].map((preset) => {
                        const isSelected = (settingsForm.accentColor || '#71883F').toLowerCase() === preset.hex.toLowerCase();
                        return (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              setSettingsForm({ ...settingsForm, accentColor: preset.hex });
                              updateStoreSettings({ accentColor: preset.hex });
                              showToast(`Switched accent color to ${preset.name}!`, 'success');
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#171717] bg-[#F7F8F3] shadow-xs ring-1 ring-[#171717]'
                                : 'border-[#E8E8E3] hover:border-neutral-400 bg-white'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-black/10 flex items-center justify-center text-white"
                              style={{ backgroundColor: preset.hex }}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-[11px] font-semibold text-[#171717] truncate">
                              {preset.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="text-[11px] font-semibold text-[#171717] shrink-0">
                        Custom Hex Color:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settingsForm.accentColor || '#71883F'}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, accentColor: e.target.value });
                          }}
                          className="w-8 h-8 rounded-lg border border-[#E8E8E3] cursor-pointer p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={settingsForm.accentColor || '#71883F'}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, accentColor: e.target.value });
                          }}
                          placeholder="#71883F"
                          className="w-28 px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs font-mono font-bold text-[#171717] outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Live Preview Elements */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Live Preview:</span>
                      <span
                        className="px-2.5 py-1 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                        style={{ backgroundColor: settingsForm.accentColor || '#71883F' }}
                      >
                        Sample Button
                      </span>
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold rounded"
                        style={{
                          backgroundColor: `${settingsForm.accentColor || '#71883F'}20`,
                          color: settingsForm.accentColor || '#71883F',
                        }}
                      >
                        Sample Pill
                      </span>
                    </div>
                  </div>

                  {/* Theme Mode, Font Family & Border Radius Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E8E8E3]">
                    <div>
                      <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                        Store Theme Mode
                      </label>
                      <select
                        value={settingsForm.storeThemeMode || 'white'}
                        onChange={(e) => {
                          const mode = e.target.value as any;
                          setSettingsForm({ ...settingsForm, storeThemeMode: mode });
                          updateStoreSettings({ storeThemeMode: mode });
                          showToast(`Store theme set to ${mode}!`, 'success');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs font-medium"
                      >
                        <option value="white">Pure White (Clean Modern)</option>
                        <option value="cream">Warm Cream (Editorial & Cozy)</option>
                        <option value="linen">Textured Linen (Paper & Craft)</option>
                        <option value="dark">Dark Slate (Cinematic Night)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                        Font Family
                      </label>
                      <select
                        value={settingsForm.fontFamily || 'Plus Jakarta Sans'}
                        onChange={(e) => {
                          const font = e.target.value as any;
                          setSettingsForm({ ...settingsForm, fontFamily: font });
                          updateStoreSettings({ fontFamily: font });
                          showToast(`Font family changed to ${font}!`, 'success');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs font-medium"
                      >
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
                        <option value="Inter">Inter (Clean System UI)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech Minimal)</option>
                        <option value="Playfair Display">Playfair Display (Serif Luxury)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                        Corner Radius Style
                      </label>
                      <select
                        value={settingsForm.borderRadiusMode || 'rounded'}
                        onChange={(e) => {
                          const mode = e.target.value as any;
                          setSettingsForm({ ...settingsForm, borderRadiusMode: mode });
                          updateStoreSettings({ borderRadiusMode: mode });
                          showToast(`Border radius mode updated!`, 'success');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs font-medium"
                      >
                        <option value="rounded">Soft Rounded (Default)</option>
                        <option value="sharp">Sharp Edges (Architectural)</option>
                        <option value="soft">Extra Curved (Pill & Soft)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* HERO SLIDER TIMING & AUTOPLAY CONTROLS */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E8E3] pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#71883F]" />
                        Hero Banner Slider Auto-Play & Speed Settings
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Control automatic slide transitions, timing intervals, and manage hero carousel slides.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('hero-slides')}
                      className="px-3 py-1.5 bg-[#EFF4E6] text-[#71883F] hover:bg-[#71883F] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Manage All Hero Slides &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-[#F7F8F3] p-3 rounded-xl border border-[#E8E8E3]">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Auto-Play Slide Rotation</span>
                        <span className="text-[11px] text-[#6B6B6B]">Automatically advance banner slides</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.heroSliderAutoplay ?? true}
                        onChange={(e) => {
                          setSettingsForm({ ...settingsForm, heroSliderAutoplay: e.target.checked });
                          updateStoreSettings({ heroSliderAutoplay: e.target.checked });
                          showToast(`Hero slider auto-play ${e.target.checked ? 'enabled' : 'disabled'}!`, 'info');
                        }}
                        className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#171717]">
                          Slide Delay Speed: <span className="font-mono font-bold text-[#71883F]">{(settingsForm.heroSliderInterval || 3000) / 1000}s</span>
                        </label>
                        <span className="text-[10px] text-[#6B6B6B]">{(settingsForm.heroSliderInterval || 3000)}ms</span>
                      </div>
                      <input
                        type="range"
                        min="1500"
                        max="8000"
                        step="500"
                        value={settingsForm.heroSliderInterval || 3000}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSettingsForm({ ...settingsForm, heroSliderInterval: val });
                          updateStoreSettings({ heroSliderInterval: val });
                        }}
                        className="w-full accent-[#71883F] cursor-pointer mt-1"
                      />
                      <div className="flex justify-between text-[10px] text-[#6B6B6B] mt-1 font-mono">
                        <span>1.5s Fast</span>
                        <span>3s Default</span>
                        <span>5s Relaxed</span>
                        <span>8s Slow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. HOME LANDING PAGE BACKGROUND STUDIO */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-6 shadow-2xs text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E8E3] pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#71883F]" />
                        Landing Page Home Background Customizer
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Customize the background wallpaper for the landing page body and the Hero banner using file upload, presets, textures, or custom URLs.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateStoreSettings({
                          homeBgImage: settingsForm.homeBgImage,
                          homeBgColor: settingsForm.homeBgColor,
                          homeBgOverlay: settingsForm.homeBgOverlay,
                          homeBgOpacity: settingsForm.homeBgOpacity,
                          heroBgImage: settingsForm.heroBgImage,
                          heroBgColor: settingsForm.heroBgColor,
                          heroBgOverlay: settingsForm.heroBgOverlay,
                          heroBgOpacity: settingsForm.heroBgOpacity,
                        });
                        showToast('Landing page backgrounds applied live to storefront!', 'success');
                      }}
                      className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Backgrounds Live
                    </button>
                  </div>

                  {/* Section A: Full Page Background */}
                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                      <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#71883F]" />
                        A. Entire Home Page Background Wallpaper
                      </span>
                      {settingsForm.homeBgImage && (
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, homeBgImage: '' })}
                          className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Remove Wallpaper
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={homeFileInputRef}
                      accept="image/*"
                      onChange={handleHomeBgFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => homeFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#171717] border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-[#71883F]" />
                        Upload Device Wallpaper
                      </button>

                      <input
                        type="url"
                        value={settingsForm.homeBgImage || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, homeBgImage: e.target.value })}
                        placeholder="Or enter image URL (https://images.unsplash.com/...)"
                        className="flex-1 px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                      />
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#171717] block mb-1.5">
                        Wallpaper Presets:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Clean White (Default)', url: '' },
                          { label: 'Craft Studio Wood', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80' },
                          { label: 'Blueprint Paper Grid', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80' },
                          { label: 'Minimalist Stationery Flatlay', url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=1600&auto=format&fit=crop&q=80' },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, homeBgImage: p.url })}
                            className={`p-2 rounded-lg border text-left text-[11px] transition-colors cursor-pointer ${
                              settingsForm.homeBgImage === p.url
                                ? 'border-[#71883F] bg-white text-[#71883F] font-bold ring-1 ring-[#71883F]'
                                : 'border-[#E8E8E3] hover:border-neutral-400 bg-white text-[#171717]'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Overlay & Opacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Overlay Tint:
                        </label>
                        <select
                          value={settingsForm.homeBgOverlay || 'light'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, homeBgOverlay: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs"
                        >
                          <option value="light">Light Tint (Clean & High Contrast)</option>
                          <option value="gradient">Subtle Gradient Fade</option>
                          <option value="dark">Dark Cinematic Tint</option>
                          <option value="none">No Overlay (Raw Image)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Overlay Opacity ({settingsForm.homeBgOpacity ?? 90}%):
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settingsForm.homeBgOpacity ?? 90}
                          onChange={(e) => setSettingsForm({ ...settingsForm, homeBgOpacity: Number(e.target.value) })}
                          className="w-full accent-[#71883F] cursor-pointer mt-1.5"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Base Background Color:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settingsForm.homeBgColor || '#FFFFFF'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, homeBgColor: e.target.value })}
                            className="w-7 h-7 rounded border border-[#E8E8E3] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settingsForm.homeBgColor || '#FFFFFF'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, homeBgColor: e.target.value })}
                            className="flex-1 px-2 py-1 bg-white border border-[#E8E8E3] rounded text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Hero Banner Background */}
                  <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                      <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#71883F]" />
                        B. Hero Banner Background & Artwork
                      </span>
                      {settingsForm.heroBgImage && (
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, heroBgImage: '' })}
                          className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Remove Hero Image
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={heroFileInputRef}
                      accept="image/*"
                      onChange={handleHeroBgFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#171717] border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-[#71883F]" />
                        Upload Device Hero Image
                      </button>

                      <input
                        type="url"
                        value={settingsForm.heroBgImage || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroBgImage: e.target.value })}
                        placeholder="Or enter hero image URL (https://images.unsplash.com/...)"
                        className="flex-1 px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                      />
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#171717] block mb-1.5">
                        Hero Background Presets:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Soft Cream (Default)', url: '' },
                          { label: 'Creative Designer Workspace', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1600&auto=format&fit=crop&q=80' },
                          { label: 'Classic Library & Books', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80' },
                          { label: 'Color Art Stationery', url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=1600&auto=format&fit=crop&q=80' },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, heroBgImage: p.url })}
                            className={`p-2 rounded-lg border text-left text-[11px] transition-colors cursor-pointer ${
                              settingsForm.heroBgImage === p.url
                                ? 'border-[#71883F] bg-white text-[#71883F] font-bold ring-1 ring-[#71883F]'
                                : 'border-[#E8E8E3] hover:border-neutral-400 bg-white text-[#171717]'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Overlay & Opacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Hero Overlay Tint:
                        </label>
                        <select
                          value={settingsForm.heroBgOverlay || 'light'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroBgOverlay: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs"
                        >
                          <option value="light">Light Tint (Crisp Legibility)</option>
                          <option value="gradient">Gradient Horizontal Wash</option>
                          <option value="dark">Dark Dramatic Tint</option>
                          <option value="none">No Overlay</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Hero Overlay Opacity ({settingsForm.heroBgOpacity ?? 85}%):
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settingsForm.heroBgOpacity ?? 85}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroBgOpacity: Number(e.target.value) })}
                          className="w-full accent-[#71883F] cursor-pointer mt-1.5"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                          Hero Base Color:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settingsForm.heroBgColor || '#F7F8F3'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroBgColor: e.target.value })}
                            className="w-7 h-7 rounded border border-[#E8E8E3] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settingsForm.heroBgColor || '#F7F8F3'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroBgColor: e.target.value })}
                            className="flex-1 px-2 py-1 bg-white border border-[#E8E8E3] rounded text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Top Announcement Bar */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                        Top Announcement Bar
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Display important notices, delivery offers, or promo alerts at the very top of every page.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-[#F7F8F3] px-3 py-1.5 rounded-lg border border-[#E8E8E3]">
                      <input
                        type="checkbox"
                        checked={settingsForm.showAnnouncement}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, showAnnouncement: e.target.checked })
                        }
                        className="accent-[#71883F] w-4 h-4 rounded"
                      />
                      <span className="font-bold text-xs text-[#171717]">Show Bar</span>
                    </label>
                  </div>

                  {settingsForm.showAnnouncement && (
                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Announcement Message Text
                      </label>
                      <input
                        type="text"
                        value={settingsForm.announcementText}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                        }
                        placeholder="e.g. Free delivery on orders above ₹500! • Fast delivery & genuine stationery"
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Hero Section Customizer */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                        Home Hero Banner & Headline
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Customize the main hero title, pill badge, subheadline, and primary button.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-[#F7F8F3] px-3 py-1.5 rounded-lg border border-[#E8E8E3]">
                      <input
                        type="checkbox"
                        checked={settingsForm.showHeroSection}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, showHeroSection: e.target.checked })
                        }
                        className="accent-[#71883F] w-4 h-4 rounded"
                      />
                      <span className="font-bold text-xs text-[#171717]">Show Hero</span>
                    </label>
                  </div>

                  {settingsForm.showHeroSection && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="font-semibold text-[#171717] block mb-1">Pill Badge Tag</label>
                        <input
                          type="text"
                          value={settingsForm.heroBadge}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroBadge: e.target.value })
                          }
                          placeholder="e.g. STATIONERY & ESSENTIALS 2026"
                          className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#171717] block mb-1">Primary Button Text</label>
                        <input
                          type="text"
                          value={settingsForm.heroButtonText}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroButtonText: e.target.value })
                          }
                          placeholder="e.g. Shop Now"
                          className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-[#171717] block mb-1">Hero Main Headline</label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                          }
                          placeholder="e.g. Everything You Need, All in One Place."
                          className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-bold outline-none focus:border-[#71883F]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-[#171717] block mb-1">Hero Subheadline</label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubheadline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroSubheadline: e.target.value })
                          }
                          placeholder="Supporting message description..."
                          className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-[#171717] block mb-1">Trust Badge Subtitle</label>
                        <input
                          type="text"
                          value={settingsForm.heroTrustText}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroTrustText: e.target.value })
                          }
                          placeholder="e.g. 1,000+ Students & Professionals trust us"
                          className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Homepage Sections Visibility & Titles */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                    Homepage Sections & Layout Control
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Enable or disable sections, and customize their section headings and subheadings.
                  </p>

                  <div className="space-y-4 pt-2 divide-y divide-[#E8E8E3]">
                    {/* Filter Pills */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Interactive Home Filter Tabs</span>
                        <span className="text-[11px] text-[#6B6B6B]">Quick pills: All, Special Offers, Best Sellers, New Arrivals</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.showHomeFilters}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, showHomeFilters: e.target.checked })
                        }
                        className="accent-[#71883F] w-4 h-4 rounded"
                      />
                    </div>

                    {/* Best Sellers */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">Best Selling / Featured Products Section</span>
                        <input
                          type="checkbox"
                          checked={settingsForm.showBestSellers}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, showBestSellers: e.target.checked })
                          }
                          className="accent-[#71883F] w-4 h-4 rounded"
                        />
                      </div>
                      {settingsForm.showBestSellers && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                          <input
                            type="text"
                            value={settingsForm.bestSellersTitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, bestSellersTitle: e.target.value })
                            }
                            placeholder="Section Title"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={settingsForm.bestSellersSubtitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, bestSellersSubtitle: e.target.value })
                            }
                            placeholder="Section Subtitle"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Promo Banner */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">Middle Promotional Banner</span>
                        <input
                          type="checkbox"
                          checked={settingsForm.showPromoBanner}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, showPromoBanner: e.target.checked })
                          }
                          className="accent-[#71883F] w-4 h-4 rounded"
                        />
                      </div>
                      {settingsForm.showPromoBanner && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                          <input
                            type="text"
                            value={settingsForm.promoTitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, promoTitle: e.target.value })
                            }
                            placeholder="Promo Title (e.g. Up to 30% Off)"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={settingsForm.promoBadge}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, promoBadge: e.target.value })
                            }
                            placeholder="Badge (e.g. Special Offer)"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={settingsForm.promoSubtitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, promoSubtitle: e.target.value })
                            }
                            placeholder="Promo Description"
                            className="sm:col-span-2 px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />

                          {/* Promo Banner Background Image Studio */}
                          <div className="sm:col-span-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E8E3] pb-3">
                              <div>
                                <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-[#71883F]" />
                                  Middle Promo Banner Background Image Studio
                                </span>
                                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                                  Change the background image of the storefront promotional card using presets, direct file upload, or custom URL.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {settingsForm.promoBgImage && (
                                  <button
                                    type="button"
                                    onClick={() => setSettingsForm({ ...settingsForm, promoBgImage: '' })}
                                    className="px-2.5 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer"
                                  >
                                    Clear Background
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStoreSettings({
                                      promoBgImage: settingsForm.promoBgImage,
                                      promoBgOverlay: settingsForm.promoBgOverlay,
                                      promoBgOpacity: settingsForm.promoBgOpacity,
                                      promoTitle: settingsForm.promoTitle,
                                      promoSubtitle: settingsForm.promoSubtitle,
                                      promoBadge: settingsForm.promoBadge,
                                      promoButtonText: settingsForm.promoButtonText,
                                    });
                                    showToast('Banner background image and settings applied live to storefront!', 'success');
                                  }}
                                  className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Save Background Live
                                </button>
                              </div>
                            </div>

                            {/* Upload or URL Controls */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-semibold text-[#171717] block">
                                Choose Image Source:
                              </label>
                              
                              <input
                                type="file"
                                ref={promoFileInputRef}
                                accept="image/*"
                                onChange={handlePromoBgFileUpload}
                                className="hidden"
                              />

                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  onClick={() => promoFileInputRef.current?.click()}
                                  className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#171717] border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors shrink-0 cursor-pointer"
                                >
                                  <UploadCloud className="w-4 h-4 text-[#71883F]" />
                                  Upload from Device
                                </button>

                                <div className="flex-1 relative">
                                  <input
                                    type="url"
                                    value={settingsForm.promoBgImage || ''}
                                    onChange={(e) =>
                                      setSettingsForm({ ...settingsForm, promoBgImage: e.target.value })
                                    }
                                    placeholder="Or paste image URL (https://images.unsplash.com/...)"
                                    className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Visual Preset Thumbnails */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-semibold text-[#6B6B6B] block">Curated High-Res Presets:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  {
                                    label: 'Notebook Flatlay',
                                    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80',
                                    thumb: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80',
                                  },
                                  {
                                    label: 'Study & Pen',
                                    url: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1600&q=80',
                                    thumb: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80',
                                  },
                                  {
                                    label: 'Creative Studio',
                                    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1600&q=80',
                                    thumb: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80',
                                  },
                                  {
                                    label: 'Warm Wood',
                                    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
                                    thumb: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
                                  },
                                ].map((p) => {
                                  const isSelected = settingsForm.promoBgImage === p.url;
                                  return (
                                    <button
                                      key={p.label}
                                      type="button"
                                      onClick={() => setSettingsForm({ ...settingsForm, promoBgImage: p.url })}
                                      className={`p-1.5 rounded-xl border text-left transition-all group flex items-center gap-2 cursor-pointer ${
                                        isSelected
                                          ? 'border-[#71883F] bg-white ring-2 ring-[#71883F]/20'
                                          : 'border-[#E8E8E3] bg-white hover:border-[#71883F]'
                                      }`}
                                    >
                                      <img
                                        src={p.thumb}
                                        alt={p.label}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <span className="text-[11px] font-bold text-[#171717] block truncate">
                                          {p.label}
                                        </span>
                                        <span className="text-[10px] text-[#71883F]">
                                          {isSelected ? '✓ Active' : 'Select'}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Overlay Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8E8E3]">
                              <div>
                                <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                                  Overlay Readability Tint
                                </label>
                                <select
                                  value={settingsForm.promoBgOverlay || 'light'}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, promoBgOverlay: e.target.value as any })
                                  }
                                  className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-lg text-xs font-semibold"
                                >
                                  <option value="light">Frosted Light (Clean & Airy)</option>
                                  <option value="gradient">Gradient Fade (Smooth Left-to-Right)</option>
                                  <option value="dark">Dark Slate (High Contrast)</option>
                                  <option value="none">Minimal Tint (Full Image)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                                  Overlay Opacity ({settingsForm.promoBgOpacity ?? 85}%)
                                </label>
                                <input
                                  type="range"
                                  min="20"
                                  max="95"
                                  value={settingsForm.promoBgOpacity ?? 85}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, promoBgOpacity: Number(e.target.value) })
                                  }
                                  className="w-full accent-[#71883F] cursor-pointer mt-2"
                                />
                              </div>
                            </div>

                            {/* Live Card Preview in Admin Dashboard */}
                            <div className="space-y-1.5 pt-2 border-t border-[#E8E8E3]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-[#6B6B6B]">Live Storefront Card Preview:</span>
                                <button
                                  type="button"
                                  onClick={() => setActivePage('home')}
                                  className="text-[#71883F] font-bold hover:underline"
                                >
                                  View on Homepage &rarr;
                                </button>
                              </div>

                              <div className="relative rounded-xl overflow-hidden p-5 border border-[#E8E8E3] bg-[#F7F8F3] min-h-[120px] flex flex-col justify-center">
                                {settingsForm.promoBgImage ? (
                                  <>
                                    <img
                                      src={settingsForm.promoBgImage}
                                      alt="Preview"
                                      className="absolute inset-0 w-full h-full object-cover object-center z-0"
                                    />
                                    <div
                                      className={`absolute inset-0 z-1 ${
                                        settingsForm.promoBgOverlay === 'dark'
                                          ? 'bg-neutral-900'
                                          : settingsForm.promoBgOverlay === 'gradient'
                                          ? 'bg-gradient-to-r from-white via-white/80 to-transparent'
                                          : settingsForm.promoBgOverlay === 'none'
                                          ? 'bg-white/10'
                                          : 'bg-white'
                                      }`}
                                      style={{ opacity: (settingsForm.promoBgOpacity ?? 85) / 100 }}
                                    />
                                  </>
                                ) : (
                                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#71883F_0.75px,transparent_0.75px)] [background-size:16px_16px]" />
                                )}

                                <div className="relative z-10 space-y-1 max-w-sm">
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EFF4E6] text-[#71883F]">
                                    {settingsForm.promoBadge || 'Special Offer'}
                                  </span>
                                  <h5 className={`font-extrabold text-sm ${settingsForm.promoBgOverlay === 'dark' ? 'text-white' : 'text-[#171717]'}`}>
                                    {settingsForm.promoTitle || 'Special Seasonal Discounts'}
                                  </h5>
                                  <p className={`text-[11px] line-clamp-1 ${settingsForm.promoBgOverlay === 'dark' ? 'text-neutral-300' : 'text-[#6B6B6B]'}`}>
                                    {settingsForm.promoSubtitle || 'Limited time offers on selected notebooks & student gear.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* New Arrivals */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">New Arrivals Section</span>
                        <input
                          type="checkbox"
                          checked={settingsForm.showNewArrivals}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, showNewArrivals: e.target.checked })
                          }
                          className="accent-[#71883F] w-4 h-4 rounded"
                        />
                      </div>
                      {settingsForm.showNewArrivals && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                          <input
                            type="text"
                            value={settingsForm.newArrivalsTitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, newArrivalsTitle: e.target.value })
                            }
                            placeholder="Section Title"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={settingsForm.newArrivalsSubtitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, newArrivalsSubtitle: e.target.value })
                            }
                            placeholder="Section Subtitle"
                            className="px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Benefits & Value Props */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Store Benefits & Why Choose Us</span>
                        <span className="text-[11px] text-[#6B6B6B]">Free delivery, authentic products, fast dispatch badges</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.showBenefits}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, showBenefits: e.target.checked })
                        }
                        className="accent-[#71883F] w-4 h-4 rounded"
                      />
                    </div>

                    {/* Reviews */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Customer Testimonials & Reviews</span>
                        <span className="text-[11px] text-[#6B6B6B]">Display verified feedback cards on home page</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.showReviews}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, showReviews: e.target.checked })
                        }
                        className="accent-[#71883F] w-4 h-4 rounded"
                      />
                    </div>

                    {/* Product Corner Badges Toggle & Global Removal */}
                    <div className="pt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#171717] block">Product Corner Badges & Discount Tags (Global Control)</span>
                          <span className="text-[11px] text-[#6B6B6B]">
                            Toggle ON/OFF to instantly show or completely hide all top-left badges (% OFF, Special Offers, BOGO, New) across the entire store.
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${settingsForm.showProductBadges ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {settingsForm.showProductBadges ? 'Badges Displayed' : 'All Badges Hidden'}
                          </span>
                          <input
                            type="checkbox"
                            checked={settingsForm.showProductBadges}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, showProductBadges: e.target.checked })
                            }
                            className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-[#F7F8F3] p-2.5 rounded-xl border border-[#E8E8E3]">
                        <span className="text-[11px] text-[#6B6B6B]">
                          Want to clear all badges and tags from all product records directly?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove badges from all products?')) {
                              removeAllProductBadges();
                            }
                          }}
                          className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Badges from All Products
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.5. STORE LOGO & CUSTOM BRANDING UPLOADER */}
                <LogoUploader
                  logoUrl={settingsForm.logoUrl}
                  logoType={settingsForm.logoType}
                  logoHeight={settingsForm.logoHeight}
                  onUpdateSettings={(updated: any) =>
                    setSettingsForm((prev) => ({ ...prev, ...updated }))
                  }
                />

                {/* 4. Store Profile */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">Store Profile</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Store Name</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-semibold outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Tagline</label>
                      <input
                        type="text"
                        value={settingsForm.tagline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Support Email</label>
                      <input
                        type="email"
                        required
                        value={settingsForm.contactEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Support Phone</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.contactPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-semibold text-[#171717] block mb-1">Store Address</label>
                      <input
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">GSTIN / Tax ID</label>
                      <input
                        type="text"
                        value={settingsForm.gstNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, gstNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Thresholds */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                    Shipping & Delivery Thresholds
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Free Delivery Minimum Order (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={settingsForm.freeDeliveryThreshold}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            freeDeliveryThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                      <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                        Orders above this amount qualify for ₹0 shipping automatically.
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Standard Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={settingsForm.standardDeliveryFee}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            standardDeliveryFee: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                      <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                        Charged on orders below the free delivery minimum.
                      </span>
                    </div>
                  </div>
                </div>

                {/* UPI & Payment Settings */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider">
                    Indian UPI Payment Gateway Configuration
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Merchant UPI ID (VPA)</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.upiId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                        placeholder="e.g. fathimastores@oksbi"
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">Merchant Business Name</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.upiMerchantName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, upiMerchantName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={settingsForm.enableGPay}
                          onChange={(e) => setSettingsForm({ ...settingsForm, enableGPay: e.target.checked })}
                          className="accent-[#71883F]"
                        />
                        <span>Google Pay (GPay)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={settingsForm.enablePhonePe}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, enablePhonePe: e.target.checked })
                          }
                          className="accent-[#71883F]"
                        />
                        <span>PhonePe</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={settingsForm.enablePaytm}
                          onChange={(e) => setSettingsForm({ ...settingsForm, enablePaytm: e.target.checked })}
                          className="accent-[#71883F]"
                        />
                        <span>Paytm UPI</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={settingsForm.enableCOD}
                          onChange={(e) => setSettingsForm({ ...settingsForm, enableCOD: e.target.checked })}
                          className="accent-[#71883F]"
                        />
                        <span>Cash on Delivery (COD)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Support & Experience Controls */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-4 shadow-2xs text-xs">
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#71883F]" />
                    WhatsApp Live Support & Customer Experience
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 flex items-center justify-between bg-[#F7F8F3] p-3 rounded-xl border border-[#E8E8E3]">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Floating WhatsApp Help Button</span>
                        <span className="text-[11px] text-[#6B6B6B]">Displays a quick chat button on bottom right for instant customer queries</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.enableWhatsAppSupport ?? true}
                        onChange={(e) => setSettingsForm({ ...settingsForm, enableWhatsAppSupport: e.target.checked })}
                        className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {settingsForm.enableWhatsAppSupport && (
                      <>
                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">WhatsApp Support Number</label>
                          <input
                            type="text"
                            value={settingsForm.whatsAppNumber || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, whatsAppNumber: e.target.value })}
                            placeholder="+91 98450 12345"
                            className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">Default Chat Greeting Message</label>
                          <input
                            type="text"
                            value={settingsForm.whatsAppGreeting || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, whatsAppGreeting: e.target.value })}
                            placeholder="Hello Fathima Stores! I have a question about..."
                            className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between bg-[#F7F8F3] p-3 rounded-xl border border-[#E8E8E3]">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Show Quick View Product Modal</span>
                        <span className="text-[11px] text-[#6B6B6B]">Allow shoppers to view product specs without leaving product grid</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.showQuickView ?? true}
                        onChange={(e) => setSettingsForm({ ...settingsForm, showQuickView: e.target.checked })}
                        className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-[#F7F8F3] p-3 rounded-xl border border-[#E8E8E3]">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Low Stock Warning Threshold</span>
                        <span className="text-[11px] text-[#6B6B6B]">Highlight items in inventory with stock ≤ threshold</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settingsForm.lowStockThreshold || 10}
                        onChange={(e) => setSettingsForm({ ...settingsForm, lowStockThreshold: Number(e.target.value) })}
                        className="w-20 px-2 py-1 bg-white border border-[#E8E8E3] rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Settings Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#E8E8E3] rounded-2xl p-4 shadow-2xs">
                  <div>
                    {lastSavedTimestamp ? (
                      <span className="text-xs text-[#71883F] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Settings saved at {lastSavedTimestamp}
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B6B6B]">
                        Click save to persist all changes to storefront live.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save Store Settings'}</span>
                  </button>
                </div>
              </form>

              {/* Data & Catalog Management Suite */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-5 shadow-2xs text-xs">
                <div>
                  <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Data Management & Catalog Reset
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Clear all store data, wipe catalog items, reset orders, or re-populate with sample stationery products at any time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Wipe Everything */}
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                    <span className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Clear All Store Data (Clean Slate)
                    </span>
                    <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                      Wipes all products, categories, orders, reviews, banners, cart, and transactions completely clean for a fresh start.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowClearAllDataModal(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All Data Completely
                    </button>
                  </div>


                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">
                {editingProduct ? 'Edit Product' : 'Add New Stationery Item'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Category (Optional)</label>
                  {categories.length > 0 ? (
                    <select
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    >
                      <option value="General">General</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      placeholder="e.g. General, Writing, Notebooks (Optional)"
                      className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  )}
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={prodForm.subcategory}
                    onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    value={prodForm.mrp}
                    onChange={(e) => setProdForm({ ...prodForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                {/* Upload Product Image with ≤ 200KB Compression */}
                <div className="col-span-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#171717] text-xs flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-[#71883F]" />
                        Upload Product Image
                      </span>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Images are automatically compressed to <span className="font-semibold text-[#71883F]">strictly ≤ 200 KB</span> before saving.
                      </p>
                    </div>

                    {compressionStats && (
                      <span className="text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Under 200 KB
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* File Upload Box */}
                    <div className="sm:col-span-8">
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) processImageFile(file);
                        }}
                        className="border-2 border-dashed border-[#E8E8E3] hover:border-[#71883F] bg-white rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      >
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleImageFileUpload}
                          className="hidden"
                          disabled={isCompressing}
                        />
                        <UploadCloud className="w-6 h-6 text-[#71883F] group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-xs font-semibold text-[#171717]">
                          {isCompressing ? 'Compressing Image to ≤200KB...' : 'Click or Drag & Drop Product Image'}
                        </span>
                        <span className="text-[10px] text-[#6B6B6B] mt-0.5">
                          Supports JPG, PNG, WEBP (auto-compressed to strictly &lt;200KB)
                        </span>
                      </label>
                    </div>

                    {/* Image Preview & Compression Specs */}
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <div className="w-20 h-20 rounded-xl bg-white border border-[#E8E8E3] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
                        {prodForm.imageKey ? (
                          <ProductImage
                            imageKey={prodForm.imageKey}
                            name={prodForm.name || 'Preview'}
                            className="w-full h-full"
                          />
                        ) : (
                          <FileImage className="w-8 h-8 text-neutral-300" />
                        )}
                      </div>

                      {compressionStats ? (
                        <div className="text-[10px] space-y-0.5 text-[#6B6B6B] min-w-0">
                          <p className="font-semibold text-[#171717] truncate">{compressionStats.fileName}</p>
                          <p>Original: {formatFileSize(compressionStats.originalSize)}</p>
                          <p className="font-bold text-[#71883F]">
                            Compressed: {formatFileSize(compressionStats.compressedSize)}
                          </p>
                          <p className="text-emerald-700 font-semibold">
                            {Math.round((1 - compressionStats.compressedSize / compressionStats.originalSize) * 100)}% smaller
                          </p>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#6B6B6B]">
                          <span>No file uploaded yet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Or Manual URL Input */}
                  <div className="pt-2 border-t border-[#E8E8E3]">
                    <label className="text-[11px] text-[#6B6B6B] block mb-1">
                      Or specify image key / external URL:
                    </label>
                    <input
                      type="text"
                      value={prodForm.imageKey.startsWith('data:') ? 'Image uploaded and compressed (Base64)' : prodForm.imageKey}
                      onChange={(e) => {
                        if (!e.target.value.includes('Image uploaded')) {
                          setProdForm({ ...prodForm, imageKey: e.target.value });
                        }
                      }}
                      placeholder="e.g. classmate-spiral, cello-butterflow, https://..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={prodForm.tags}
                    onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                {/* SPECIAL PRODUCT OFFER & DEALS OPTION */}
                <div className="col-span-2 border border-amber-200 bg-amber-50/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#171717]">Special Offer / Promotional Deal</h4>
                        <p className="text-[11px] text-[#6B6B6B]">Add deals like BOGO, Flat Discount, or Bundles to this item</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={prodForm.hasOffer}
                        onChange={(e) => setProdForm({ ...prodForm, hasOffer: e.target.checked })}
                        className="w-4 h-4 accent-amber-600 rounded"
                      />
                      <span className="text-xs font-bold text-amber-900">Enable Offer</span>
                    </label>
                  </div>

                  {prodForm.hasOffer && (
                    <div className="space-y-3 pt-3 border-t border-amber-200/80">
                      {/* Presets */}
                      <div>
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1.5">
                          Quick Deal Presets (Click to apply)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                hasOffer: true,
                                offerType: 'bogo',
                                offerTitle: 'Buy 1 Get 1 Free (BOGO)',
                                offerBadge: 'BUY 1 GET 1',
                                offerDescription: 'Add 2 units to cart; second unit is 100% free!',
                                offerValidUntil: 'Limited Period Deal',
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900"
                          >
                            🎁 Buy 1 Get 1 Free
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                hasOffer: true,
                                offerType: 'discount',
                                offerTitle: 'Flat 25% Off Deal',
                                offerBadge: '25% OFF',
                                offerDescription: 'Extra 25% discount applied at checkout.',
                                offerDiscountPct: 25,
                                offerValidUntil: 'Special Offer',
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900"
                          >
                            🏷️ Flat 25% Off
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                hasOffer: true,
                                offerType: 'flat',
                                offerTitle: 'Save Flat ₹50 Instantly',
                                offerBadge: 'SAVE ₹50',
                                offerDescription: 'Flat ₹50 reduction on retail order total.',
                                offerFlatDiscount: 50,
                                offerValidUntil: 'First 50 Orders Only',
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900"
                          >
                            💰 Flat ₹50 Off
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                hasOffer: true,
                                offerType: 'combo',
                                offerTitle: 'Stationery Combo Bundle Deal',
                                offerBadge: 'COMBO PACK',
                                offerDescription: 'Includes free accessory pack with every purchase.',
                                offerValidUntil: 'Till Stocks Last',
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900"
                          >
                            📦 Combo Bundle
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">Offer Title / Headline *</label>
                          <input
                            type="text"
                            required={prodForm.hasOffer}
                            value={prodForm.offerTitle}
                            onChange={(e) => setProdForm({ ...prodForm, offerTitle: e.target.value })}
                            placeholder="e.g. Buy 1 Get 1 Free, Flat 25% Off"
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-600 text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">Badge Tag</label>
                          <input
                            type="text"
                            value={prodForm.offerBadge}
                            onChange={(e) => setProdForm({ ...prodForm, offerBadge: e.target.value })}
                            placeholder="e.g. BOGO, MEGA DEAL, 25% OFF"
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-600 text-xs uppercase"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">Offer Deal Type</label>
                          <select
                            value={prodForm.offerType}
                            onChange={(e) =>
                              setProdForm({
                                ...prodForm,
                                offerType: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-600 text-xs"
                          >
                            <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                            <option value="discount">Percentage Discount Deal</option>
                            <option value="flat">Flat Cash Discount (₹ Off)</option>
                            <option value="combo">Combo Bundle / Free Gift</option>
                            <option value="cashback">Instant UPI / Bank Cashback</option>
                            <option value="custom">Custom Promotional Offer</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-[#171717] block mb-1">Offer Validity / Tag</label>
                          <input
                            type="text"
                            value={prodForm.offerValidUntil}
                            onChange={(e) => setProdForm({ ...prodForm, offerValidUntil: e.target.value })}
                            placeholder="e.g. Limited Period Deal, Valid till Sunday"
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-600 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-semibold text-[#171717] block mb-1">Offer Details & Terms</label>
                          <input
                            type="text"
                            value={prodForm.offerDescription}
                            onChange={(e) => setProdForm({ ...prodForm, offerDescription: e.target.value })}
                            placeholder="e.g. Add 2 units to cart to claim free item at checkout."
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-600 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Badge Control (Removable Span) */}
                <div className="col-span-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-[#171717] block flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#71883F]" />
                        Product Corner Tag / Badge (Corner Span)
                      </span>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Display, customize, or completely remove the corner badge span on this product's card in Home and Shop.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E8E3] shadow-2xs text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={prodForm.showBadge}
                          onChange={(e) => setProdForm({ ...prodForm, showBadge: e.target.checked })}
                          className="accent-[#71883F] w-4 h-4 rounded"
                        />
                        <span>{prodForm.showBadge ? 'Badge Enabled' : 'Badge Disabled'}</span>
                      </label>

                      {(prodForm.showBadge || prodForm.badge) && (
                        <button
                          type="button"
                          onClick={() => {
                            setProdForm({
                              ...prodForm,
                              showBadge: false,
                              badge: '',
                              showDiscountBadge: false,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Click to remove all badges from this product"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Badge
                        </button>
                      )}
                    </div>
                  </div>

                  {prodForm.showBadge ? (
                    <div className="space-y-2 pt-2 border-t border-[#E8E8E3]">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-[#171717] block mb-1">
                            Custom Badge Text (e.g. Best Seller, New, Popular)
                          </label>
                          <input
                            type="text"
                            value={prodForm.badge}
                            onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                            placeholder="e.g. Best Seller, New, Popular"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="sm:self-end">
                          <span className="text-[10px] text-[#6B6B6B] block mb-1">Quick Presets:</span>
                          <div className="flex flex-wrap gap-1">
                            {['Best Seller', 'New Arrival', 'Popular', 'Limited'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setProdForm({ ...prodForm, showBadge: true, badge: preset })}
                                className="px-2 py-0.5 text-[10px] bg-white hover:bg-neutral-100 text-[#171717] border border-[#E8E8E3] rounded"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#6B6B6B]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodForm.showDiscountBadge}
                            onChange={(e) => setProdForm({ ...prodForm, showDiscountBadge: e.target.checked })}
                            className="accent-[#71883F] w-3.5 h-3.5 rounded"
                          />
                          <span>Also allow percentage discount tag ({prodForm.discount}% OFF) if no custom badge is set</span>
                        </label>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Preview: {prodForm.badge || (prodForm.showDiscountBadge && prodForm.discount > 0 ? `${prodForm.discount}% OFF` : 'Active')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#E8E8E3] flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Corner badge span is currently <strong>removed / disabled</strong> for this product.</span>
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, showBadge: true, badge: 'Special' })}
                        className="text-[#71883F] font-semibold hover:underline"
                      >
                        + Add Badge
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.featured}
                      onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>Featured</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.bestSeller}
                      onChange={(e) => setProdForm({ ...prodForm, bestSeller: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>Best Seller</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.newArrival}
                      onChange={(e) => setProdForm({ ...prodForm, newArrival: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between gap-2">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      const prodToDel = editingProduct;
                      setProductModalOpen(false);
                      setProductToDelete(prodToDel);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Product
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-lg text-xs font-semibold text-[#171717]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    {editingProduct ? 'Save Updates' : 'Add to Catalog'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          isOpen={!!selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* Category Add / Edit Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = editingCategory
                      ? catForm.slug
                      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setCatForm({ ...catForm, name, slug: autoSlug });
                  }}
                  placeholder="e.g. Art & Craft Supplies"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Category Slug *</label>
                <input
                  type="text"
                  required
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="e.g. art-craft-supplies"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg font-mono outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Brief description of this stationery section..."
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Theme Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-[#E8E8E3] p-0.5 cursor-pointer"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {['#EFF4E6', '#F4F5EE', '#EBF2DE', '#F9F5EC', '#EDF5EB', '#FCE7F3'].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCatForm({ ...catForm, color: preset })}
                          className="w-6 h-6 rounded-full border border-neutral-300"
                          style={{ backgroundColor: preset }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                  <input
                    type="checkbox"
                    checked={catForm.featured}
                    onChange={(e) => setCatForm({ ...catForm, featured: e.target.checked })}
                    className="accent-[#71883F]"
                  />
                  <span>Show as Featured Category on Homepage</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#171717]">Order #{viewingOrder.id}</h3>
                <span className="text-[11px] text-[#6B6B6B]">Placed on {viewingOrder.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedOrderForInvoice(viewingOrder);
                  }}
                  className="px-3 py-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#71883F]" /> Tax Invoice
                </button>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Order Info */}
                <div className="space-y-5">
                  {/* Status and Payment banner */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F8F3] rounded-xl border border-[#E8E8E3]">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">Fulfillment Status</span>
                      <select
                        value={viewingOrder.orderStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value as OrderStatus;
                          updateOrderStatus(viewingOrder.id, newStatus);
                          setViewingOrder({ ...viewingOrder, orderStatus: newStatus });
                        }}
                        className="mt-1 text-xs font-bold bg-white border border-[#E8E8E3] rounded-md px-2 py-1 outline-none w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">Payment Info</span>
                      <span className="text-xs font-bold text-[#171717] block mt-1">
                        {viewingOrder.paymentMethod} ({viewingOrder.paymentStatus})
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Tracking: {viewingOrder.trackingNumber}
                      </span>
                    </div>
                  </div>

                  {/* Customer and shipping details */}
                  <div className="space-y-1 p-3 bg-white border border-[#E8E8E3] rounded-xl">
                    <span className="font-bold text-[#171717] block mb-1">Customer & Delivery:</span>
                    <p className="font-semibold text-[#171717]">{viewingOrder.customerName}</p>
                    <p className="text-[#6B6B6B]">Phone: {viewingOrder.phone} · Email: {viewingOrder.email}</p>
                    <p className="text-[#6B6B6B]">
                      {viewingOrder.shippingAddress?.house}, {viewingOrder.shippingAddress?.street},{' '}
                      {viewingOrder.shippingAddress?.area}, {viewingOrder.shippingAddress?.city},{' '}
                      {viewingOrder.shippingAddress?.state} - {viewingOrder.shippingAddress?.pinCode}
                    </p>
                  </div>

                  {/* Ordered Items */}
                  <div className="border border-[#E8E8E3] rounded-xl overflow-hidden divide-y divide-[#E8E8E3]">
                    <div className="p-2.5 bg-[#F7F8F3] font-bold text-[#171717]">
                      Items Ordered ({viewingOrder.items.length})
                    </div>
                    {viewingOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#171717] block">{item.name}</span>
                          <span className="text-[11px] text-[#6B6B6B]">
                            SKU: {item.sku} · Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                        <span className="font-bold text-[#171717] tabular-nums">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price summary */}
                  <div className="space-y-1.5 pt-2 text-[#6B6B6B]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#171717] tabular-nums">₹{viewingOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className="font-semibold text-[#171717] tabular-nums">
                        {viewingOrder.deliveryCharge === 0 ? 'FREE' : `₹${viewingOrder.deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#171717] pt-2 border-t border-[#E8E8E3]">
                      <span>Total Amount</span>
                      <span className="text-[#71883F] tabular-nums">₹{viewingOrder.total}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Delivery Map */}
                <div className="space-y-4">
                  <AdminDeliveryMap 
                    order={viewingOrder} 
                    storeAddress={storeSettings.address} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {createOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">Create Manual Order</h3>
              <button
                onClick={() => setCreateOrderModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualOrderForm.customerName}
                    onChange={(e) =>
                      setManualOrderForm({ ...manualOrderForm, customerName: e.target.value })
                    }
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={manualOrderForm.phone}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={manualOrderForm.email}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Select Product *</label>
                  <select
                    value={manualOrderForm.productId}
                    onChange={(e) =>
                      setManualOrderForm({ ...manualOrderForm, productId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  >
                    {products.length === 0 ? (
                      <option value="">General Stationery Pack (₹250)</option>
                    ) : (
                      products.map((p, idx) => (
                        <option key={`${p.id}-${idx}`} value={p.id}>
                          {p.name} - ₹{p.price} ({p.stock} in stock)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={manualOrderForm.quantity}
                    onChange={(e) =>
                      setManualOrderForm({ ...manualOrderForm, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Payment Method</label>
                  <select
                    value={manualOrderForm.paymentMethod}
                    onChange={(e) =>
                      setManualOrderForm({
                        ...manualOrderForm,
                        paymentMethod: e.target.value as PaymentMethod,
                        paymentStatus: (e.target.value === 'COD' ? 'Pending' : 'Paid') as PaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  >
                    <option value="UPI - Google Pay">UPI - Google Pay</option>
                    <option value="UPI - PhonePe">UPI - PhonePe</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-[#171717] block mb-1">Delivery City</label>
                  <input
                    type="text"
                    value={manualOrderForm.city}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOrderModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                >
                  Create & Record Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Orders History Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#171717]">{viewingCustomer.name}</h3>
                <span className="text-[11px] text-[#6B6B6B]">{viewingCustomer.email} · {viewingCustomer.phone}</span>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-[#F7F8F3] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Lifetime Value</span>
                  <span className="text-base font-extrabold text-[#71883F] tabular-nums">
                    ₹{viewingCustomer.totalSpent}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Orders Placed</span>
                  <span className="text-base font-bold text-[#171717] tabular-nums">
                    {viewingCustomer.ordersCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#171717] block">Order History:</span>
                <div className="divide-y divide-[#E8E8E3] border border-[#E8E8E3] rounded-xl overflow-hidden">
                  {orders
                    .filter((o) => o.email === viewingCustomer.email)
                    .map((o, idx) => (
                      <div key={`${o.id}-${idx}`} className="p-3 flex items-center justify-between hover:bg-[#F7F8F3]/50">
                        <div>
                          <span className="font-bold text-[#171717] block">{o.id}</span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            {o.date} · {o.items.length} items · {o.orderStatus}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#71883F] block tabular-nums">₹{o.total}</span>
                          <button
                            onClick={() => {
                              setViewingOrder(o);
                              setViewingCustomer(null);
                            }}
                            className="text-[10px] text-[#71883F] hover:underline"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Add Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">Add Customer Review</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Product</label>
                <select
                  value={reviewForm.productId}
                  onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                >
                  {products.length === 0 ? (
                    <option value="fs-gen">General Stationery</option>
                  ) : (
                    products.map((p, idx) => (
                      <option key={`${p.id}-${idx}`} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={reviewForm.userName}
                  onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                  placeholder="e.g. Priya Nair"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Star Rating (1-5)</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                >
                  <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                  <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                  <option value={2}>★★☆☆☆ (2 Stars)</option>
                  <option value={1}>★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Customer Comment *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Customer feedback on product quality, shipping, packaging..."
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Add / Edit Modal */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">
                {editingBanner ? 'Edit Promotional Banner' : 'Add New Promotional Banner'}
              </h3>
              <button
                onClick={() => setBannerModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Back to School Mega Offer"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Flat 30% Off on Geometry Sets & Backpacks"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="e.g. Special Deal"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    placeholder="Shop Now →"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Background Tone Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerForm.bgTone}
                    onChange={(e) => setBannerForm({ ...bannerForm, bgTone: e.target.value })}
                    className="w-8 h-8 rounded border border-[#E8E8E3] p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bannerForm.bgTone}
                    onChange={(e) => setBannerForm({ ...bannerForm, bgTone: e.target.value })}
                    className="w-32 px-2 py-1 border border-[#E8E8E3] rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                  <input
                    type="checkbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                    className="accent-[#71883F]"
                  />
                  <span>Active & Visible on Storefront</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                >
                  {editingBanner ? 'Save Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Slide Add / Edit Modal */}
      {slideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">
                {editingSlide ? 'Edit Hero Section Slide' : 'Add New Hero Section Slide'}
              </h3>
              <button
                onClick={() => setSlideModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={slideForm.badge}
                  onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                  placeholder="e.g. Exclusive Launch 2026"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="e.g. Luxury Writing & Calligraphy Instruments"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  placeholder="Detailed description of the offer or collection..."
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Primary Button Text</label>
                  <input
                    type="text"
                    value={slideForm.buttonText}
                    onChange={(e) => setSlideForm({ ...slideForm, buttonText: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Target Page</label>
                  <select
                    value={slideForm.buttonLink}
                    onChange={(e) => setSlideForm({ ...slideForm, buttonLink: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  >
                    <option value="shop">Shop Catalog</option>
                    <option value="categories">Categories Page</option>
                    <option value="about">About Us</option>
                    <option value="contact">Contact Us</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Secondary Button Text</label>
                  <input
                    type="text"
                    value={slideForm.secondaryButtonText}
                    onChange={(e) => setSlideForm({ ...slideForm, secondaryButtonText: e.target.value })}
                    placeholder="e.g. Browse Catalog (Optional)"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Secondary Target</label>
                  <select
                    value={slideForm.secondaryButtonLink}
                    onChange={(e) => setSlideForm({ ...slideForm, secondaryButtonLink: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  >
                    <option value="shop">Shop Catalog</option>
                    <option value="categories">Categories Page</option>
                    <option value="about">About Us</option>
                    <option value="contact">Contact Us</option>
                  </select>
                </div>
              </div>

              {/* Background Image Upload & Presets */}
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Slide Visual Image (Compressed &lt;160KB)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slideForm.image}
                    onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                    placeholder="Paste Image URL or click Upload"
                    className="flex-1 px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                  <button
                    type="button"
                    onClick={() => slideFileInputRef.current?.click()}
                    className="px-3 py-2 bg-[#F7F8F3] border border-[#E8E8E3] hover:border-[#71883F] rounded-lg font-semibold cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                  <input
                    ref={slideFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSlideImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Preset image buttons */}
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-[#6B6B6B] shrink-0">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1600&q=80' })}
                    className="px-2 py-0.5 rounded border border-[#E8E8E3] bg-[#F7F8F3] hover:border-[#71883F] shrink-0"
                  >
                    Pens & Inks
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1600&q=80' })}
                    className="px-2 py-0.5 rounded border border-[#E8E8E3] bg-[#F7F8F3] hover:border-[#71883F] shrink-0"
                  >
                    Study Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=80' })}
                    className="px-2 py-0.5 rounded border border-[#E8E8E3] bg-[#F7F8F3] hover:border-[#71883F] shrink-0"
                  >
                    Art Supplies
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, image: 'https://images.unsplash.com/photo-1507842229458-574349320eef?auto=format&fit=crop&w=1600&q=80' })}
                    className="px-2 py-0.5 rounded border border-[#E8E8E3] bg-[#F7F8F3] hover:border-[#71883F] shrink-0"
                  >
                    Minimal Desk
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Tone Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={slideForm.bgTone}
                      onChange={(e) => setSlideForm({ ...slideForm, bgTone: e.target.value })}
                      className="w-7 h-7 rounded border border-[#E8E8E3] p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={slideForm.bgTone}
                      onChange={(e) => setSlideForm({ ...slideForm, bgTone: e.target.value })}
                      className="w-20 px-2 py-1 border border-[#E8E8E3] rounded font-mono text-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Overlay Style</label>
                  <select
                    value={slideForm.overlay}
                    onChange={(e) => setSlideForm({ ...slideForm, overlay: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-[#E8E8E3] rounded outline-none"
                  >
                    <option value="light">Light Tint</option>
                    <option value="dark">Dark Tint</option>
                    <option value="gradient">Gradient</option>
                    <option value="none">No Overlay</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">
                    Opacity ({slideForm.overlayOpacity}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={slideForm.overlayOpacity}
                    onChange={(e) => setSlideForm({ ...slideForm, overlayOpacity: Number(e.target.value) })}
                    className="w-full accent-[#71883F] mt-1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#171717]">
                  <input
                    type="checkbox"
                    checked={slideForm.active}
                    onChange={(e) => setSlideForm({ ...slideForm, active: e.target.checked })}
                    className="accent-[#71883F]"
                  />
                  <span>Active &amp; Visible in Carousel</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSlideModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E8E3] rounded-lg text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg font-semibold"
                >
                  {editingSlide ? 'Save Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Delete Confirmation Modal */}
      {slideToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete Hero Slide</h3>
                <p className="text-xs text-[#6B6B6B]">Are you sure you want to remove this slide from the hero slider?</p>
              </div>
            </div>

            <div className="p-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs space-y-1">
              <span className="font-bold text-[#71883F] text-[10px] uppercase">{slideToDelete.badge}</span>
              <h4 className="font-bold text-[#171717]">{slideToDelete.title}</h4>
              <p className="text-[#6B6B6B] line-clamp-2">{slideToDelete.subtitle}</p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] border border-[#E8E8E3] hover:bg-[#F7F8F3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteHeroSlide(slideToDelete.id);
                  setSlideToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SINGLE PRODUCT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete Product from Store</h3>
                <p className="text-xs text-[#6B6B6B]">This item will be permanently removed from the catalog.</p>
              </div>
            </div>

            {/* Product Summary Card */}
            <div className="p-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-[#E8E8E3]">
                <ProductImage imageKey={productToDelete.images[0]} name={productToDelete.name} className="w-full h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#171717] truncate">{productToDelete.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mt-0.5">
                  <span className="font-mono">{productToDelete.sku}</span>
                  <span>•</span>
                  <span className="font-bold text-[#171717]">₹{productToDelete.price}</span>
                  <span>•</span>
                  <span>{productToDelete.stock} in stock</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? Customers will no longer be able to find, browse, or purchase this product.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = productToDelete.id;
                  const nameToDelete = productToDelete.name;
                  deleteProduct(idToDelete);
                  setSelectedProductIds((prev) => prev.filter((id) => id !== idToDelete));
                  setProductToDelete(null);
                  showToast(`"${nameToDelete}" was deleted from the store`, 'info');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BULK PRODUCTS DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && selectedProductIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete Multiple Products</h3>
                <p className="text-xs text-[#6B6B6B]">
                  Batch removal of {selectedProductIds.length} selected item{selectedProductIds.length > 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <span className="font-bold block">Warning: Irreversible Action</span>
              <p className="leading-relaxed">
                You are about to delete <strong>{selectedProductIds.length}</strong> items from your stationery store. All selected products will be removed from your catalog and any active carts.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMultipleProducts(selectedProductIds);
                  setSelectedProductIds([]);
                  setShowBulkDeleteModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete All {selectedProductIds.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CATEGORY DELETE CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete Category</h3>
                <p className="text-xs text-[#6B6B6B]">Remove this category section from the store.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete category <strong>"{categoryToDelete.name}"</strong>? Products in this category will remain in the catalog under general stationery.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLEAR ALL CATEGORIES MODAL */}
      {showClearAllCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Remove All Categories</h3>
                <p className="text-xs text-[#6B6B6B]">Clear all category groupings from the catalog.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to remove ALL {categories.length} categories? Products will stay preserved and you can create fresh categories whenever needed.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearAllCategoriesModal(false)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllCategories();
                  setShowClearAllCategoriesModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove All Categories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. BANNER DELETE CONFIRMATION MODAL */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete Promotional Banner</h3>
                <p className="text-xs text-[#6B6B6B]">Remove this campaign card from the storefront.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete banner <strong>"{bannerToDelete.title}"</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBanner(bannerToDelete.id);
                  setBannerToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CLEAR ALL STORE DATA CONFIRMATION MODAL */}
      {showClearAllDataModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-900">Clear All Store Data?</h3>
                <p className="text-xs text-[#6B6B6B]">Complete store database wipe / fresh blank slate</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold">This will permanently clear:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-700">
                <li>All products catalog ({products.length} items)</li>
                <li>All category definitions ({categories.length} categories)</li>
                <li>All customer orders & transactions ({orders.length} orders)</li>
                <li>All shopping carts, customer reviews, and promo banners</li>
              </ul>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              You can start completely fresh with zero data, or restore official sample products at any time from the Settings tab.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearAllDataModal(false)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setShowClearAllDataModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
