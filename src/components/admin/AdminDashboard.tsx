import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, DEFAULT_HERO_SLIDES } from '../../context/StoreContext';
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
  Type,
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
  Truck,
  Crown,
  ShieldCheck,
  Star,
  MapPin,
} from 'lucide-react';
import { InvoiceModal } from '../checkout/InvoiceModal';
import { ProductImage } from '../common/ProductImage';
import { compressImageTo200KB, formatFileSize, CompressionResult } from '../../utils/imageCompressor';
import { LogoUploader } from './LogoUploader';
import { AdminInboxView } from './AdminInboxView';
import { AdminBillingPOS } from './AdminBillingPOS';
import { AdminDeliveryMap } from './AdminDeliveryMap';
import { AdminDeliveryManagement } from './AdminDeliveryManagement';
import { AdminCustomerModal, AdminCustomerRecord } from './AdminCustomerModal';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminTextEditorView } from './AdminTextEditorView';
import { StoreLocationConfigCard } from './StoreLocationConfigCard';

type AdminTab =
  | 'overview'
  | 'analytics'
  | 'text-editor'
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
  | 'deliveries'
  | 'delivery'
  | 'marketing'
  | 'reports'
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const {
    isAdmin,
    currentUser,
    allUsers,
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
    verifyOrderPayment,
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
    markAllNotificationsAsRead,
    clearNotifications,
    toggleCustomerVIP,
    grantCustomerAdmin,
    grantCustomerDriver,
    deleteCustomer,
    removeSelectedCategoryButton,
    showToast,
    resetToDefaultData,
    clearAllData,
    exportStoreData,
    importStoreData,
    emailAlertLogs,
    checkAndTriggerLowStockAlert,

    bulkUpdateStock,
    bulkUpdateOrderStatus,
    bulkArchiveOrders,
    bulkDeleteOrders,
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
  const [viewingCustomer, setViewingCustomer] = useState<AdminCustomerRecord | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'vip' | 'regular' | 'new' | 'registered' | 'orders' | 'drivers'>('all');

  // In-App Deletion Modal States (Eliminates blocked browser window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [bulkStockInput, setBulkStockInput] = useState<string>('10');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkOrderActionModal, setShowBulkOrderActionModal] = useState<{
    type: 'status' | 'archive' | 'delete';
    isOpen: boolean;
  }>({ type: 'status', isOpen: false });
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showClearAllCategoriesModal, setShowClearAllCategoriesModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomerRecord | null>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
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
    enableOnlinePayment: storeSettings?.enableOnlinePayment ?? true,
    enableUpiPayment: storeSettings?.enableUpiPayment ?? true,
    enableCardPayment: storeSettings?.enableCardPayment ?? true,
    enableNetBankingPayment: storeSettings?.enableNetBankingPayment ?? true,
    enableCodPayment: storeSettings?.enableCodPayment ?? true,
    autoVerifyOnlinePayment: storeSettings?.autoVerifyOnlinePayment ?? true,
    autoConfirmPaidOrders: storeSettings?.autoConfirmPaidOrders ?? true,
    autoGeneratePaymentReceipt: storeSettings?.autoGeneratePaymentReceipt ?? true,
    autoRefundOnCancel: storeSettings?.autoRefundOnCancel ?? true,
    paymentGatewayProvider: (storeSettings?.paymentGatewayProvider || 'Razorpay') as 'Razorpay' | 'Cashfree' | 'PayU' | 'Stripe India',
    paymentGatewayMode: (storeSettings?.paymentGatewayMode || 'live_auto') as 'live_auto' | 'test_sandbox',
    onlinePaymentDiscountPercent: storeSettings?.onlinePaymentDiscountPercent ?? 0,
    codExtraFee: storeSettings?.codExtraFee ?? 0,

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
    enableStockEmailAlerts: storeSettings?.enableStockEmailAlerts ?? true,
    adminStockAlertEmail: storeSettings?.adminStockAlertEmail || storeSettings?.contactEmail || 'admin@fathimastores.com',
    heroSliderAutoplay: storeSettings?.heroSliderAutoplay ?? true,
    heroSliderInterval: storeSettings?.heroSliderInterval ?? 3000,
    logoType: (storeSettings?.logoType || 'text') as 'text' | 'image' | 'both',
    logoUrl: storeSettings?.logoUrl || '',
    logoHeight: storeSettings?.logoHeight || 36,
  });

  // Keep settings form synced if storeSettings changes
  useEffect(() => {
    if (storeSettings) {
      setSettingsForm((prev) => ({
        ...prev,
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
        enableOnlinePayment: storeSettings.enableOnlinePayment ?? true,
        enableUpiPayment: storeSettings.enableUpiPayment ?? true,
        enableCardPayment: storeSettings.enableCardPayment ?? true,
        enableNetBankingPayment: storeSettings.enableNetBankingPayment ?? true,
        enableCodPayment: storeSettings.enableCodPayment ?? true,
        autoVerifyOnlinePayment: storeSettings.autoVerifyOnlinePayment ?? true,
        autoConfirmPaidOrders: storeSettings.autoConfirmPaidOrders ?? true,
        autoGeneratePaymentReceipt: storeSettings.autoGeneratePaymentReceipt ?? true,
        autoRefundOnCancel: storeSettings.autoRefundOnCancel ?? true,
        paymentGatewayProvider: (storeSettings.paymentGatewayProvider || 'Razorpay') as 'Razorpay' | 'Cashfree' | 'PayU' | 'Stripe India',
        paymentGatewayMode: (storeSettings.paymentGatewayMode || 'live_auto') as 'live_auto' | 'test_sandbox',
        onlinePaymentDiscountPercent: storeSettings.onlinePaymentDiscountPercent ?? 0,
        codExtraFee: storeSettings.codExtraFee ?? 0,

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
        enableStockEmailAlerts: storeSettings.enableStockEmailAlerts ?? true,
        adminStockAlertEmail: storeSettings.adminStockAlertEmail || storeSettings.contactEmail || 'admin@fathimastores.com',
        heroSliderAutoplay: storeSettings.heroSliderAutoplay ?? true,
        heroSliderInterval: storeSettings.heroSliderInterval ?? 3000,
        logoType: (storeSettings.logoType || 'text') as 'text' | 'image' | 'both',
        logoUrl: storeSettings.logoUrl || '',
        logoHeight: storeSettings.logoHeight || 36,
      }));
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

  // Dashboard KPI Computations - STRICT RULE: Only verified payments count as store income!
  const verifiedOrders = useMemo(
    () => orders.filter((o) => o.paymentVerified === true || o.paymentStatus === 'Paid'),
    [orders]
  );
  const totalSales = useMemo(
    () =>
      verifiedOrders.reduce(
        (sum, o) => sum + (o.paidAmount !== undefined && o.paidAmount > 0 ? o.paidAmount : o.total),
        0
      ),
    [verifiedOrders]
  );
  const pendingPaymentOrders = useMemo(
    () => orders.filter((o) => !o.paymentVerified && o.paymentStatus !== 'Paid'),
    [orders]
  );
  const pendingPaymentTotal = useMemo(
    () => pendingPaymentOrders.reduce((sum, o) => sum + (o.total - (o.paidAmount || 0)), 0),
    [pendingPaymentOrders]
  );
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
  const totalProductsCount = products.length;
  const currentThreshold = settingsForm.lowStockThreshold || storeSettings?.lowStockThreshold || 10;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= currentThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // Filtered Products for Catalog & Deletion Actions
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (prodCategoryFilter !== 'all' && p.category !== prodCategoryFilter) return false;
      if (prodStockFilter === 'in_stock' && p.stock <= currentThreshold) return false;
      if (prodStockFilter === 'low_stock' && (p.stock === 0 || p.stock > currentThreshold)) return false;
      if (prodStockFilter === 'out_of_stock' && p.stock > 0) return false;
      if (!adminSearch) return true;
      const q = adminSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, prodCategoryFilter, prodStockFilter, adminSearch, currentThreshold]);

  // Customers comprehensive list (Aggregates registered users from Firestore, current store manager, and orders)
  const customersList = useMemo<AdminCustomerRecord[]>(() => {
    const map = new Map<string, AdminCustomerRecord>();
    const removedEmails = new Set((storeSettings.removedCustomerEmails || []).map((e) => e.toLowerCase()));
    const removedIds = new Set(storeSettings.removedCustomerIds || []);

    // 1. Ensure logged-in Store Manager account is always present in Admin Panel unless deleted
    if (currentUser?.email) {
      const emailKey = currentUser.email.toLowerCase().trim();
      if (!removedEmails.has(emailKey) && (!currentUser.id || !removedIds.has(currentUser.id))) {
        const defAddr = currentUser.addresses?.find((a) => a.isDefault) || currentUser.addresses?.[0];
        map.set(emailKey, {
          id: currentUser.id,
          name: currentUser.name ? `${currentUser.name} (Store Manager)` : 'Store Manager Admin',
          email: currentUser.email,
          phone: currentUser.phone || defAddr?.phone || '+91 98450 12345',
          photoURL: currentUser.photoURL,
          role: 'admin',
          city: currentUser.city || defAddr?.city || 'Trivandrum',
          state: currentUser.state || defAddr?.state || 'Kerala',
          bio: currentUser.bio || 'Store Manager & Administrator',
          addresses: currentUser.addresses || [],
          defaultAddress: defAddr,
          createdAt: currentUser.createdAt || new Date().toISOString(),
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: undefined,
          orders: [],
          isRegistered: true,
          status: 'VIP',
        });
      }
    }

    // 2. Add registered users
    (allUsers || []).forEach((u) => {
      const emailKey = (u.email || '').toLowerCase().trim();
      if (!emailKey) return;
      if (removedEmails.has(emailKey) || (u.id && removedIds.has(u.id))) return;
      const defAddr = u.addresses?.find((a) => a.isDefault) || u.addresses?.[0];
      map.set(emailKey, {
        id: u.id,
        name: u.name || 'Registered Customer',
        email: u.email,
        phone: u.phone || defAddr?.phone || '',
        photoURL: u.photoURL,
        role: u.role || 'customer',
        isDriver: Boolean(u.isDriver || u.role === 'delivery'),
        city: u.city || defAddr?.city || '',
        state: u.state || defAddr?.state || '',
        bio: u.bio,
        addresses: u.addresses || [],
        defaultAddress: defAddr,
        createdAt: u.createdAt,
        totalSpent: 0,
        ordersCount: 0,
        lastOrderDate: undefined,
        orders: [],
        isRegistered: true,
        status: u.role === 'admin' ? 'VIP' : 'New',
      });
    });

    // 3. Associate / add customers from orders
    orders.forEach((o) => {
      const emailKey = (o.email || '').toLowerCase().trim();
      if (removedEmails.has(emailKey) || (o.userId && removedIds.has(o.userId))) return;
      const existing: AdminCustomerRecord = map.get(emailKey) || {
        id: o.userId || `cust-${Math.abs(emailKey.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
        name: o.customerName || 'Customer',
        email: o.email,
        phone: o.phone || '',
        city: o.shippingAddress?.city || '',
        state: o.shippingAddress?.state || '',
        addresses: o.shippingAddress ? [o.shippingAddress] : [],
        defaultAddress: o.shippingAddress,
        createdAt: o.date,
        totalSpent: 0,
        ordersCount: 0,
        orders: [],
        isRegistered: false,
        status: 'New',
      };

      existing.totalSpent += o.total;
      existing.ordersCount += 1;
      existing.orders.push(o);

      if (!existing.phone && o.phone) existing.phone = o.phone;
      if (!existing.city && o.shippingAddress?.city) existing.city = o.shippingAddress.city;
      if (!existing.state && o.shippingAddress?.state) existing.state = o.shippingAddress.state;
      if (o.shippingAddress && (!existing.addresses || existing.addresses.length === 0)) {
        existing.addresses = [o.shippingAddress];
        existing.defaultAddress = o.shippingAddress;
      }
      if (!existing.lastOrderDate || new Date(o.date) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.date;
      }

      if (existing.role === 'admin') {
        existing.status = 'VIP';
      } else if (existing.totalSpent >= 2500 || existing.ordersCount >= 3) {
        existing.status = 'VIP';
      } else if (existing.ordersCount >= 1) {
        existing.status = 'Regular';
      } else {
        existing.status = 'New';
      }

      map.set(emailKey, existing);
    });

    const vipSet = new Set((storeSettings.customVipEmails || []).map((e) => e.toLowerCase()));
    const adminSet = new Set((storeSettings.customAdminEmails || []).map((e) => e.toLowerCase()));
    const driverEmailSet = new Set((storeSettings.customDriverEmails || []).map((e) => e.toLowerCase().trim()));
    const driverIdSet = new Set(storeSettings.customDriverIds || []);

    map.forEach((cust, emailKey) => {
      if (adminSet.has(emailKey)) {
        cust.role = 'admin';
        cust.status = 'VIP';
      }
      if (vipSet.has(emailKey)) {
        cust.status = 'VIP';
      }
      if (driverEmailSet.has(emailKey) || driverIdSet.has(cust.id) || cust.role === 'delivery') {
        cust.isDriver = true;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return b.totalSpent - a.totalSpent || b.ordersCount - a.ordersCount;
    });
  }, [
    allUsers,
    orders,
    currentUser,
    storeSettings.customVipEmails,
    storeSettings.customAdminEmails,
    storeSettings.customDriverEmails,
    storeSettings.customDriverIds,
    storeSettings.removedCustomerEmails,
    storeSettings.removedCustomerIds,
  ]);

  // Filtered and searched customer list
  const filteredCustomersList = useMemo(() => {
    return customersList.filter((c) => {
      if (customerSearch.trim()) {
        const query = customerSearch.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesEmail = c.email.toLowerCase().includes(query);
        const matchesPhone = c.phone.toLowerCase().includes(query);
        const matchesCity = (c.city || '').toLowerCase().includes(query);
        const matchesState = (c.state || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCity && !matchesState) {
          return false;
        }
      }

      if (customerFilter === 'vip') return c.status === 'VIP';
      if (customerFilter === 'drivers') return Boolean(c.isDriver);
      if (customerFilter === 'regular') return c.status === 'Regular';
      if (customerFilter === 'new') return c.status === 'New';
      if (customerFilter === 'registered') return c.isRegistered;
      if (customerFilter === 'orders') return c.ordersCount > 0;

      return true;
    });
  }, [customersList, customerSearch, customerFilter]);

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

  const handleSaveProduct = async (e: React.FormEvent) => {
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
      await updateProduct(editingProduct.id, {
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
      await addProduct({
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
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = catForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`;
    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: catForm.name,
        slug,
        description: catForm.description,
        color: catForm.color,
        image: catForm.image,
        featured: catForm.featured,
      });
    } else {
      await addCategory({
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
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === manualOrderForm.productId) || products[0];
    const qty = Math.max(1, Number(manualOrderForm.quantity) || 1);
    const itemPrice = selProd ? selProd.price : 250;
    const subtotal = itemPrice * qty;
    const deliveryCharge = subtotal >= (storeSettings?.freeDeliveryThreshold ?? 500) ? 0 : 40;
    const total = subtotal + deliveryCharge;

    await createDirectOrder({
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
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === reviewForm.productId) || products[0];
    await addReview({
      productId: selProd ? selProd.id : 'fs-general',
      productName: selProd ? selProd.name : reviewForm.productName || 'Stationery Item',
      rating: Number(reviewForm.rating) || 5,
      comment: reviewForm.comment,
      userName: reviewForm.userName || 'Verified Customer',
    });
    setReviewModalOpen(false);
  };

  // Banner Save Handler
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      await updateBanner(editingBanner.id, {
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
      await addBanner({
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
    if (bannerForm.active && !storeSettings.showPromoBanner) {
      await updateStoreSettings({ showPromoBanner: true });
    }
    setBannerModalOpen(false);
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    try {
      const res = await compressImageTo200KB(file);
      setBannerForm((prev) => ({ ...prev, image: res.dataUrl }));
      showToast('Banner image uploaded & compressed!', 'success');
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBannerForm((prev) => ({ ...prev, image: reader.result as string }));
          showToast('Banner image uploaded!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
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

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim()) {
      showToast('Slide headline is required', 'error');
      return;
    }
    
    const slideData = {
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
    };

    if (editingSlide && !editingSlide.id.startsWith('hero-slide-')) {
      await updateHeroSlide(editingSlide.id, slideData);
    } else {
      // If editing a default or creating new, always add as new custom slide
      await addHeroSlide({
        ...slideData,
        order: heroSlides.length,
      });
    }
    setSlideModalOpen(false);
  };

  const seedHeroDefaults = async () => {
    try {
      for (let i = 0; i < DEFAULT_HERO_SLIDES.length; i++) {
        const { id: _, ...rest } = DEFAULT_HERO_SLIDES[i];
        await addHeroSlide({ ...rest, order: i });
      }
      showToast('Default stationery slides seeded successfully!', 'success');
    } catch (err) {
      showToast('Error seeding default slides', 'error');
    }
  };

  // Settings Save Handler with feedback & timestamp
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateStoreSettings(settingsForm);
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

  // Export utility for Records & Reporting
  const handleExportCSV = (type: 'orders' | 'products' | 'customers' | 'revenue') => {
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
    } else if (type === 'revenue') {
      csvContent += 'Revenue Analytics Report - Fathima Stores\n';
      csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;
      csvContent += 'Order ID,Date,Customer,Total Amount,Payment Status,Verified\n';
      orders.forEach((o) => {
        csvContent += `"${o.id}","${o.date}","${o.customerName}",${o.total},"${o.paymentStatus}","${o.paymentVerified ? 'YES' : 'NO'}"\n`;
      });
      csvContent += `\nTotal Orders,${orders.length}\n`;
      csvContent += `Total Revenue,₹${totalSales}\n`;
      csvContent += `Verified Income,₹${verifiedOrders.reduce((sum, o) => sum + (o.paidAmount || o.total), 0)}\n`;
    } else {
      csvContent += 'Customer ID,Customer Name,Email,Phone,City,State,Account Type,Status,Total Spent,Orders Count,Last Order Date\n';
      customersList.forEach((c) => {
        csvContent += `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city || ''}","${c.state || ''}","${c.isRegistered ? 'Registered' : 'Guest'}","${c.status}",${c.totalSpent},${c.ordersCount},"${c.lastOrderDate || ''}"\n`;
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

  const handleExportPDFReport = async () => {
    try {
      showToast('Generating PDF Sales & Revenue Report...', 'info');
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;
      const verifiedRev = verifiedOrders.reduce((sum, o) => sum + (o.paidAmount || o.total), 0);

      const container = document.createElement('div');
      container.style.padding = '28px';
      container.style.fontFamily = 'Plus Jakarta Sans, Arial, sans-serif';
      container.style.color = '#171717';
      container.style.background = '#FFFFFF';
      container.innerHTML = `
        <div style="border-bottom: 2px solid #71883F; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="margin: 0; font-size: 20px; color: #171717;">${storeSettings.storeName || 'FATHIMA STORES'} — SALES & REVENUE REPORT</h1>
            <p style="margin: 4px 0 0; font-size: 11px; color: #6B6B6B;">Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <div style="text-align: right; font-size: 11px; font-weight: bold; color: #71883F;">OFFICIAL RECORD</div>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 18px;">
          <div style="flex: 1; padding: 12px; border: 1px solid #E8E8E3; border-radius: 8px; background: #F7F8F3;">
            <div style="font-size: 10px; color: #6B6B6B; text-transform: uppercase;">Total Orders</div>
            <div style="font-size: 18px; font-weight: 800; color: #171717; margin-top: 4px;">${orders.length}</div>
          </div>
          <div style="flex: 1; padding: 12px; border: 1px solid #E8E8E3; border-radius: 8px; background: #F7F8F3;">
            <div style="font-size: 10px; color: #6B6B6B; text-transform: uppercase;">Verified Income</div>
            <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">₹${verifiedRev.toLocaleString('en-IN')}</div>
          </div>
          <div style="flex: 1; padding: 12px; border: 1px solid #E8E8E3; border-radius: 8px; background: #F7F8F3;">
            <div style="font-size: 10px; color: #6B6B6B; text-transform: uppercase;">Gross Bookings</div>
            <div style="font-size: 18px; font-weight: 800; color: #71883F; margin-top: 4px;">₹${orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #EFF4E6; color: #171717; text-align: left;">
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Order ID</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Date</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Customer</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Delivery Option</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Payment</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3;">Status</th>
              <th style="padding: 8px; border: 1px solid #E8E8E3; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (o) => `
              <tr>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3; font-weight: bold;">${o.id}</td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3;">${o.date}</td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3;">${o.customerName}<br/><span style="color:#6B6B6B;font-size:9px;">${o.shippingAddress?.city || ''}, ${o.shippingAddress?.pinCode || ''}</span></td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3;">${o.deliveryMethod || 'Standard'}</td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3;">${o.paymentMethod} (${o.paymentVerified || o.paymentStatus === 'Paid' ? 'Verified' : 'Pending'})</td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3;">${o.orderStatus}</td>
                <td style="padding: 7px 8px; border: 1px solid #E8E8E3; text-align: right; font-weight: bold;">₹${o.total.toLocaleString('en-IN')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;

      await html2pdf()
        .set({
          margin: 10,
          filename: `fathima_stores_sales_revenue_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();

      showToast('PDF Sales & Revenue Report downloaded!', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    }
  };

  const unreadMessagesCount = useMemo(() => (customerMessages || []).filter((m) => m.status === "unread").length, [customerMessages]);

  const navMenuItems = [
    { id: 'overview' as const, label: 'Store Overview', icon: LayoutDashboard },
    { id: 'orders' as const, label: 'Manage Orders', icon: ShoppingBag, count: orders.filter((o) => !o.isArchived).length, alert: pendingOrdersCount > 0 },
    { id: 'analytics' as const, label: 'Financial Analytics', icon: BarChart3, alert: pendingPaymentOrders.length > 0 },
    { id: 'hero-slides' as const, label: 'Hero Slides Manager', icon: FileImage, count: (heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES).length },
    { id: 'inventory' as const, label: 'Inventory & Stock Alerts', icon: Warehouse, count: lowStockCount, alert: lowStockCount > 0 },
    { id: 'banners' as const, label: 'Promo Banners', icon: ImageIcon, count: banners.length },
    { id: 'products' as const, label: 'Products & Catalog', icon: Package, count: products.length },
    { id: 'categories' as const, label: 'Categories', icon: Layers },
    { id: 'customers' as const, label: 'Customers & Users', icon: Users, count: customersList.length },
    { id: 'billing' as const, label: 'Outlet Billing (POS)', icon: Receipt },
    { id: 'inbox' as const, label: 'Inbox', icon: Mail, count: unreadMessagesCount, alert: unreadMessagesCount > 0 },
    { id: 'reports' as const, label: 'Business Reports', icon: BarChart3 },
    { id: 'delivery' as const, label: 'Delivery & Live Map', icon: Truck },
    { id: 'reviews' as const, label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'marketing' as const, label: 'Coupons & Discounts', icon: Tag },
    { id: 'text-editor' as const, label: 'Website Text Editor', icon: Type },
    { id: 'settings' as const, label: 'Store Settings', icon: Settings },
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
          <div className="m-3 p-3 bg-gradient-to-br from-[#F7F9F0] to-white border border-[#71883F]/30 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2.5">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name || 'Store Manager'}
                  className="w-9 h-9 rounded-full object-cover border border-[#71883F] shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#71883F] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'SM'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#171717] truncate block">
                    {currentUser?.name || 'Store Manager'}
                  </span>
                  <span className="text-[9px] bg-[#71883F] text-white px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-[#6B6B6B] truncate font-medium mt-0.5">
                  {currentUser?.email || 'nihal.graphix@gmail.com'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Store Manager Account</span>
                </div>
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

        {/* Sidebar Footer: Storefront Link, Driver Portal & Signout */}
        <div className="p-3 border-t border-[#E8E8E3] space-y-1">
          <button
            onClick={() => setActivePage('delivery-portal')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#71883F] bg-[#EFF4E6]/60 hover:bg-[#EFF4E6] flex items-center gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4 text-[#71883F]" /> Open Driver Portal
          </button>
          <button
            onClick={() => setActivePage('home')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#171717] hover:bg-[#F7F8F3] flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#71883F]" /> View Storefront
          </button>
          <button
            onClick={() => {
              switchRole('customer');
              setActivePage('home');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
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
            {/* Quick Driver Portal Button */}
            <button
              type="button"
              onClick={() => setActivePage('delivery-portal')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF4E6] hover:bg-[#71883F] text-[#71883F] hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Driver Portal</span>
            </button>

            {/* Notifications Panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#171717] hover:bg-[#F7F8F3] rounded-lg relative cursor-pointer active:scale-95"
                title="Notifications & Send Customer Alert"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some((n) => !n.read) && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />

                  <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white border border-[#E8E8E3] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E8E3]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171717]">Store Notifications & Alerts</span>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                            {notifications.filter((n) => !n.read).length} new
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        {notifications.length > 0 && (
                          <>
                            <button
                              onClick={() => markAllNotificationsAsRead()}
                              className="text-[#71883F] hover:underline font-semibold cursor-pointer"
                            >
                              Mark all read
                            </button>
                            <span className="text-neutral-300">•</span>
                            <button
                              onClick={() => clearNotifications()}
                              className="text-neutral-500 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-[#6B6B6B] hover:text-[#171717] rounded-lg cursor-pointer ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Send Direct or Broadcast Notification to Customers */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!notifTitle.trim() || !notifMessage.trim()) return;
                        await sendCustomCustomerNotification({
                          title: notifTitle.trim(),
                          message: notifMessage.trim(),
                          targetEmail: notifTargetEmail.trim() || undefined,
                          isBroadcast: !notifTargetEmail.trim(),
                        });
                        setNotifTitle('');
                        setNotifMessage('');
                      }}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E8E3] space-y-2"
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71883F] block">
                        Send Notification to Customer / All Users
                      </span>
                      <input
                        type="text"
                        value={notifTargetEmail}
                        onChange={(e) => setNotifTargetEmail(e.target.value)}
                        placeholder="Customer email (or leave blank to broadcast to all)"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-[11px] outline-none focus:border-[#71883F]"
                      />
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="Notification Title (e.g. Special Flash Offer / Order Update)"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-[11px] font-bold outline-none focus:border-[#71883F]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          placeholder="Message to customer..."
                          className="flex-1 px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-[11px] outline-none focus:border-[#71883F]"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 py-1 max-h-64 overflow-y-auto divide-y divide-[#E8E8E3]">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#6B6B6B] space-y-1">
                          <Bell className="w-6 h-6 text-neutral-300 mx-auto" />
                          <p className="font-bold text-[#171717]">All caught up!</p>
                          <p className="text-[11px]">New order alerts and customer inquiries will appear here.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.type === "customer" || n.title?.toLowerCase().includes("inquiry")) {
                                setCurrentTab("inbox");
                              } else {
                                setCurrentTab("orders");
                              }
                              setShowNotifications(false);
                            }}
                            className={`pt-2.5 pb-2.5 px-2 rounded-xl text-xs cursor-pointer transition-colors space-y-1 ${
                              n.read ? 'bg-white opacity-75 hover:bg-[#FAFBF7]' : 'bg-[#EFF4E6]/60 border-l-2 border-[#71883F] pl-3 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-[#171717] truncate">{n.title}</p>
                              <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                                {n.time ? new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>



            {/* Signed-in Store Manager Account Badge */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E8E8E3]">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name || 'Store Manager'}
                  className="w-8 h-8 rounded-full object-cover border border-[#71883F] shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EFF4E6] text-[#71883F] font-bold text-xs flex items-center justify-center border border-[#71883F]/30 shadow-2xs">
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'SM'}
                </div>
              )}
              <div className="hidden sm:block text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#171717] block leading-none">
                    {currentUser?.name || 'Store Manager'}
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-[#6B6B6B] block mt-0.5 truncate max-w-[180px]">
                  {currentUser?.email || 'nihal.graphix@gmail.com'}
                </span>
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

              {/* Alert Banner for Unverified Orders */}
              {pendingPaymentOrders.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        {pendingPaymentOrders.length} Order(s) Awaiting Payment Verification (₹{pendingPaymentTotal.toLocaleString('en-IN')})
                      </h4>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        These orders are strictly excluded from store income until you verify payment receipt.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('analytics')}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs shrink-0 cursor-pointer"
                  >
                    Review & Verify in Analytics →
                  </button>
                </div>
              )}

              {/* 5 Primary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-emerald-500/30 bg-emerald-500/[0.02] rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span className="font-bold text-emerald-900">Verified Income</span>
                    <span className="text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] uppercase">
                      Received
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[#171717] mt-2 tabular-nums">
                    ₹{totalSales.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                    {verifiedOrders.length} paid & verified orders
                  </p>
                </div>

                <div 
                  onClick={() => setCurrentTab('analytics')}
                  className="bg-white border border-amber-500/30 bg-amber-500/[0.02] rounded-2xl p-4 shadow-2xs cursor-pointer hover:border-amber-500/60 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                    <span className="font-bold text-amber-900">Pending Collection</span>
                    <span className="text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded text-[9px] uppercase">
                      Unverified
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-amber-900 mt-2 tabular-nums">
                    ₹{pendingPaymentTotal.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-amber-700 font-semibold mt-1 group-hover:underline">
                    {pendingPaymentOrders.length} unverified orders →
                  </p>
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 shadow-2xs">
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

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 shadow-2xs">
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

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 shadow-2xs">
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

              {/* RECENT ACTIVITY & SYSTEM ALERTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[#E8E8E3]">
                {/* Recent Reviews widget */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#171717] flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Recent Customer Reviews
                    </h4>
                    <button 
                      onClick={() => setCurrentTab('reviews')}
                      className="text-[10px] font-bold text-[#71883F] hover:underline uppercase tracking-tight"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reviews.slice(0, 3).length === 0 ? (
                      <p className="text-[10px] text-[#6B6B6B] italic py-2 text-center">No reviews yet.</p>
                    ) : (
                      reviews.slice(0, 3).map((rev) => (
                        <div key={rev.id} className="p-2.5 bg-[#F7F8F3] rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#171717]">{rev.userName}</span>
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? 'fill-current' : 'text-neutral-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* System Alerts widget */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#171717] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#71883F]" /> Recent Alerts
                    </h4>
                    <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-tight">System Status</span>
                  </div>
                  <div className="space-y-3">
                    {pendingPaymentOrders.length > 0 && (
                      <div className="flex items-start gap-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-900">Payment Verification Required</p>
                          <p className="text-[9px] text-amber-700">{pendingPaymentOrders.length} orders are awaiting your approval in Analytics.</p>
                        </div>
                      </div>
                    )}
                    {lowStockCount > 0 && (
                      <div className="flex items-start gap-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                        <Warehouse className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-rose-900">Low Stock Warning</p>
                          <p className="text-[9px] text-rose-700">{lowStockCount} products have dropped below threshold.</p>
                        </div>
                      </div>
                    )}
                    {unreadMessagesCount > 0 && (
                      <div className="flex items-start gap-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-900">New Customer Inquiries</p>
                          <p className="text-[9px] text-emerald-700">You have {unreadMessagesCount} unread messages in your inbox.</p>
                        </div>
                      </div>
                    )}
                    {pendingPaymentOrders.length === 0 && lowStockCount === 0 && unreadMessagesCount === 0 && (
                      <div className="py-6 text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-[#171717]">All Systems Clear</p>
                        <p className="text-[9px] text-[#6B6B6B]">No urgent actions required.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* FULL ORDER MANAGEMENT SECTION */}
              <div className="pt-6 border-t border-[#E8E8E3] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-[#171717] tracking-tight">
                      Store Order Management ({orders.length})
                    </h3>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Fulfill customer orders, verify payments, manage delivery status, and generate invoices.
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
                      className="px-3.5 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Manual Order
                    </button>

                    <button
                      onClick={() => handleExportCSV('orders')}
                      className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export Orders CSV
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
                        className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
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
                          ? 'There are currently 0 customer orders in the system. Use the Create Manual Order button above to record sales.'
                          : 'No orders match your selected status or search filter.'}
                      </p>
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
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-bold text-[#171717]">
                                        {order.paymentMethod}
                                      </span>
                                      {order.paymentVerified || order.paymentStatus === 'Paid' ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" /> Income Verified
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                          Unverified
                                        </span>
                                      )}
                                    </div>

                                    {!(order.paymentVerified || order.paymentStatus === 'Paid') ? (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          await verifyOrderPayment(order.id, true);
                                        }}
                                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer mt-1"
                                        title="Verify payment received to add this order into store income"
                                      >
                                        <Check className="w-3 h-3" /> Verify Payment (₹{order.total})
                                      </button>
                                    ) : (
                                      <span className="block text-[10px] text-emerald-700 font-medium">
                                        Counted in store income
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={order.orderStatus}
                                    onChange={async (e) => await updateOrderStatus(order.id, e.target.value as OrderStatus)}
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
                                      className="p-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-neutral-600 hover:text-[#71883F] cursor-pointer"
                                      title="View Order Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setSelectedOrderForInvoice(order)}
                                      className="p-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded text-neutral-600 hover:text-[#71883F] cursor-pointer"
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
                                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
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
                    type="button"
                    onClick={() => setCurrentTab('deliveries')}
                    className="px-3.5 py-2 bg-[#EFF4E6] border border-[#71883F]/30 hover:bg-[#71883F] text-[#71883F] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" /> Optimize Delivery Routes
                  </button>

                  <button
                    onClick={() => handleExportCSV('orders')}
                    className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export CSV
                  </button>

                  <button
                    onClick={handleExportPDFReport}
                    className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#71883F]" /> Export PDF
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Active Orders' },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Confirmed', label: 'Confirmed' },
                  { id: 'Processing', label: 'Processing' },
                  { id: 'Shipped', label: 'Shipped' },
                  { id: 'Out for Delivery', label: 'Out for Delivery' },
                  { id: 'Delivered', label: 'Delivered' },
                  { id: 'Cancelled', label: 'Cancelled' },
                  { id: 'Archived', label: 'Archived' },
                ].map((tab) => {
                  const isSel = orderStatusFilter === tab.id;
                  const count =
                    tab.id === 'Archived'
                      ? orders.filter((o) => o.isArchived).length
                      : tab.id === 'all'
                      ? orders.filter((o) => !o.isArchived).length
                      : orders.filter((o) => !o.isArchived && o.orderStatus === tab.id).length;
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
                  if (orderStatusFilter === 'Archived') {
                    if (!o.isArchived) return false;
                  } else {
                    if (o.isArchived) return false;
                    if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                  }
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
                  <div className="space-y-4">
                    {/* Bulk Actions Bar for Orders */}
                    {selectedOrderIds.length > 0 && (
                      <div className="bg-[#171717] text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{selectedOrderIds.length} Order{selectedOrderIds.length > 1 ? 's' : ''} Selected</p>
                            <p className="text-[10px] text-neutral-400">Apply batch updates to these records</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrderIds([])}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          
                          <div className="h-8 w-px bg-white/10 mx-1" />

                          <button
                            onClick={() => setShowBulkOrderActionModal({ type: 'status', isOpen: true })}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" /> Change Status
                          </button>

                          <button
                            onClick={() => setShowBulkOrderActionModal({ type: 'archive', isOpen: true })}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Package className="w-3 h-3" /> Archive
                          </button>

                          <button
                            onClick={() => setShowBulkOrderActionModal({ type: 'delete', isOpen: true })}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={orders.length > 0 && selectedOrderIds.length === orders.filter(o => {
                                  if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                                  if (!adminSearch) return true;
                                  const q = adminSearch.toLowerCase();
                                  return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
                                }).length}
                                onChange={(e) => {
                                  const visibleOrders = orders.filter(o => {
                                    if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                                    if (!adminSearch) return true;
                                    const q = adminSearch.toLowerCase();
                                    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
                                  });
                                  if (e.target.checked) {
                                    setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...visibleOrders.map(o => o.id)])));
                                  } else {
                                    const visibleIds = new Set(visibleOrders.map(o => o.id));
                                    setSelectedOrderIds(selectedOrderIds.filter(id => !visibleIds.has(id)));
                                  }
                                }}
                                className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                              />
                            </th>
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
                            if (orderStatusFilter === 'Archived') {
                              if (!o.isArchived) return false;
                            } else {
                              if (o.isArchived) return false;
                              if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter)
                                return false;
                            }
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
                            <tr key={`${order.id}-${idx}`} className={`hover:bg-[#F7F8F3]/50 ${selectedOrderIds.includes(order.id) ? 'bg-amber-50/40' : ''}`}>
                              <td className="py-3 px-3 w-10 text-center border-r border-[#E8E8E3]/50">
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.includes(order.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedOrderIds([...selectedOrderIds, order.id]);
                                    } else {
                                      setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                                    }
                                  }}
                                  className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                                />
                              </td>
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
                                {order.deliveryMethod && (
                                  <span className="inline-block mt-1 text-[9px] font-bold bg-[#EFF4E6] text-[#71883F] px-1.5 py-0.5 rounded">
                                    {order.deliveryMethod.split('(')[0].trim()}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#171717] block">
                                  {order.customerName}
                                </span>
                                <span className="text-[11px] text-[#6B6B6B] block">
                                  {order.phone}
                                </span>
                                <span className="text-[10px] text-[#6B6B6B] truncate max-w-xs block">
                                  {order.shippingAddress?.area ? `${order.shippingAddress.area}, ` : ''}{order.shippingAddress?.city}, {order.shippingAddress?.pinCode}
                                </span>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setViewingOrder(order)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#71883F] hover:underline cursor-pointer"
                                    title="Locate customer pin & route on Google Maps"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {order.shippingAddress?.lat && order.shippingAddress?.lng
                                      ? `Locate Pin (${order.shippingAddress.lat.toFixed(3)}, ${order.shippingAddress.lng.toFixed(3)})`
                                      : 'View Map'}
                                  </button>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                                      order.shippingAddress?.lat && order.shippingAddress?.lng
                                        ? `${order.shippingAddress.lat},${order.shippingAddress.lng}`
                                        : encodeURIComponent(
                                            `${order.shippingAddress?.house || ''}, ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || 'Trivandrum'} ${order.shippingAddress?.pinCode || ''}`
                                          )
                                    }&travelmode=driving`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] hover:bg-[#71883F] hover:text-white px-2 py-0.5 rounded transition-colors"
                                    title="Open Turn-by-Turn Driving Route in Google Maps"
                                  >
                                    <Truck className="w-2.5 h-2.5" />
                                    <span>Drive</span>
                                  </a>
                                </div>
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
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-bold text-[#171717]">
                                      {order.paymentMethod}
                                    </span>
                                    {order.paymentVerified || order.paymentStatus === 'Paid' ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" /> Income Verified
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                        Unverified
                                      </span>
                                    )}
                                  </div>

                                  {!(order.paymentVerified || order.paymentStatus === 'Paid') ? (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await verifyOrderPayment(order.id, true);
                                      }}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer mt-1"
                                      title="Verify payment received to add this order into store income"
                                    >
                                      <Check className="w-3 h-3" /> Verify Payment (₹{order.total})
                                    </button>
                                  ) : (
                                    <span className="block text-[10px] text-emerald-700 font-medium">
                                      Counted in store income
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={order.orderStatus}
                                  onChange={async (e) => await updateOrderStatus(order.id, e.target.value as OrderStatus)}
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
                </div>
              )}
              </div>
            </div>
          )}

          {/* 1.5. ANALYTICS & INCOME TAB */}
          {currentTab === 'analytics' && <AdminAnalyticsView />}

          {/* 1.6. WEBSITE TEXT EDITOR TAB */}
          {currentTab === 'text-editor' && <AdminTextEditorView />}

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
                    <option value="in_stock">In Stock (&gt;{currentThreshold})</option>
                    <option value="low_stock">Low Stock (&le;{currentThreshold})</option>
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

                    <button
                      type="button"
                      onClick={() => {
                        setBulkStockInput('10');
                        setShowBulkStockModal(true);
                      }}
                      className="px-4 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Warehouse className="w-3.5 h-3.5" />
                      Update Inventory ({selectedProductIds.length})
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
                                    : p.stock <= currentThreshold
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
                                    onClick={async () => {
                                      await updateProduct(p.id, {
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
                                    onClick={async () => {
                                      await updateProduct(p.id, {
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
                                    onClick={async () => {
                                      await updateProduct(p.id, { offer: undefined });
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
                                  onClick={async () => await duplicateProduct(p.id)}
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
                      {products.filter((p) => p.stock > currentThreshold).length} Items
                    </h3>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B6B6B]">Low Stock (&le;{currentThreshold})</span>
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
                                : p.stock <= currentThreshold
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock === 0 ? 'Out of Stock' : p.stock <= currentThreshold ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#171717] tabular-nums">
                          {p.stock} units
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={async () => await quickUpdateStock(p.id, Math.max(0, p.stock - 5))}
                              className="px-2 py-1 bg-[#F7F8F3] hover:bg-neutral-200 rounded border border-[#E8E8E3] text-xs font-semibold"
                            >
                              -5
                            </button>
                            <button
                              onClick={async () => await quickUpdateStock(p.id, p.stock + 10)}
                              className="px-2 py-1 bg-[#EFF4E6] hover:bg-[#dfeacb] text-[#71883F] rounded border border-[#71883F]/30 text-xs font-semibold"
                            >
                              +10
                            </button>
                            <button
                              onClick={async () => await quickUpdateStock(p.id, p.stock + 50)}
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

              {/* Automated Low Stock Email Alerts & Dispatch Log Section */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#EFF4E6] text-[#71883F] rounded-xl">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
                        Automated System Email Alert Dispatch Logs
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                          Active System
                        </span>
                      </h3>
                      <p className="text-xs text-[#6B6B6B]">
                        Real-time logs for automated stock warnings, out-of-stock alerts, and customer order status email dispatches.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const lowOrFirst = products.find((p) => p.stock <= (settingsForm.lowStockThreshold || 10)) || products[0];
                        if (lowOrFirst) {
                          checkAndTriggerLowStockAlert(lowOrFirst, Math.min(lowOrFirst.stock, settingsForm.lowStockThreshold || 10));
                        } else {
                          showToast('No products available to test dispatch alert.', 'error');
                        }
                      }}
                      className="px-3.5 py-2 bg-[#71883F] hover:bg-[#5e7233] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Trigger Test Alert Dispatch
                    </button>
                  </div>
                </div>

                {emailAlertLogs.length === 0 ? (
                  <div className="text-center py-6 bg-[#F7F8F3] rounded-xl border border-dashed border-[#E8E8E3]">
                    <ShieldCheck className="w-8 h-8 text-[#71883F] mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-[#171717]">No Low Stock Email Alerts Triggered Yet</p>
                    <p className="text-[11px] text-[#6B6B6B] max-w-md mx-auto mt-0.5">
                      When customer purchases or stock updates push an item's count &le; {settingsForm.lowStockThreshold || 10} units, an automated email record will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#E8E8E3] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Subject & Event</th>
                          <th className="py-2.5 px-3 font-semibold">Product & SKU</th>
                          <th className="py-2.5 px-3 font-semibold">Stock vs Threshold</th>
                          <th className="py-2.5 px-3 font-semibold">Recipient Email</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Sent Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E3]">
                        {emailAlertLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-[#F7F8F3]/50">
                            <td className="py-2.5 px-3 font-medium text-[#171717]">
                              <span className="flex items-center gap-1.5">
                                {log.type === 'out_of_stock_email' ? (
                                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                                ) : log.type === 'order_status_update' ? (
                                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                )}
                                {log.subject}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#171717] font-semibold">
                              {log.type === 'order_status_update' ? (
                                <span className="font-mono text-[10px]">Order #{log.orderId}</span>
                              ) : (
                                <>
                                  {log.productName} <span className="text-[#6B6B6B] font-mono font-normal">({log.sku})</span>
                                </>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#171717]">
                              {log.type === 'order_status_update' ? (
                                <span className="text-sky-600 uppercase tracking-tighter text-[10px]">{log.orderStatus}</span>
                              ) : (
                                <>
                                  <span className={log.currentStock === 0 ? 'text-rose-600 font-extrabold' : 'text-amber-600'}>
                                    {log.currentStock} units
                                  </span>{' '}
                                  <span className="text-[#6B6B6B] font-normal text-[10px]">(Threshold: {log.threshold})</span>
                                </>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-[#6B6B6B] font-mono">{log.recipientEmail}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#6B6B6B] text-[11px]">
                              {new Date(log.sentAt).toLocaleString()}
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
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight flex items-center gap-2">
                    Customers Directory
                    <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/20">
                      {customersList.length}
                    </span>
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Registered users, store clients, order records, lifetime value, and customer profiles. Click any customer to view full profile.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCSV('customers')}
                    className="px-4 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-semibold text-[#171717] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAFBF7] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#71883F]" /> Export CSV
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B6B6B]">Total Customers</span>
                    <div className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#171717] tabular-nums">
                    {customersList.length}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    {customersList.filter(c => c.isRegistered).length} registered accounts
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B6B6B]">Total Customer Spend</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#71883F] tabular-nums">
                    ₹{customersList.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Across {customersList.reduce((acc, c) => acc + c.ordersCount, 0)} total orders
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B6B6B]">Avg. Order Value (AOV)</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#171717] tabular-nums">
                    ₹{(() => {
                      const totalOrders = customersList.reduce((acc, c) => acc + c.ordersCount, 0);
                      const totalRevenue = customersList.reduce((acc, c) => acc + c.totalSpent, 0);
                      return totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString('en-IN') : 0;
                    })()}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Per completed purchase
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B6B6B]">VIP Customers</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Crown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-amber-700 tabular-nums">
                    {customersList.filter(c => c.status === 'VIP').length}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Spent ≥₹2,500 or 3+ orders
                  </span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customers by name, email, phone, city..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#FAFBF7] border border-[#E8E8E3] focus:border-[#71883F] rounded-xl text-xs text-[#171717] focus:outline-hidden"
                    />
                    {customerSearch && (
                      <button
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {[
                      { id: 'all' as const, label: 'All Customers', count: customersList.length },
                      { id: 'drivers' as const, label: 'Drivers', count: customersList.filter(c => c.isDriver).length },
                      { id: 'vip' as const, label: 'VIP', count: customersList.filter(c => c.status === 'VIP').length },
                      { id: 'regular' as const, label: 'Regular', count: customersList.filter(c => c.status === 'Regular').length },
                      { id: 'new' as const, label: 'New', count: customersList.filter(c => c.status === 'New').length },
                      { id: 'orders' as const, label: 'With Orders', count: customersList.filter(c => c.ordersCount > 0).length },
                      { id: 'registered' as const, label: 'Registered', count: customersList.filter(c => c.isRegistered).length },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setCustomerFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
                          customerFilter === f.id
                            ? 'bg-[#71883F] text-white shadow-2xs'
                            : 'bg-[#FAFBF7] text-[#6B6B6B] hover:text-[#171717] border border-[#E8E8E3]'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          customerFilter === f.id ? 'bg-white/20 text-white' : 'bg-neutral-200/60 text-neutral-600'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customers Table / Grid */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs">
                {filteredCustomersList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#171717]">
                      {customersList.length === 0 ? 'No Customer Records Yet' : 'No Customers Match Filters'}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                      {customersList.length === 0
                        ? 'Customer profiles are automatically created whenever a user registers or an order is placed.'
                        : 'Try adjusting your search terms or clearing the selected filter.'}
                    </p>
                    {(customerSearch || customerFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setCustomerSearch('');
                          setCustomerFilter('all');
                        }}
                        className="px-3.5 py-1.5 bg-[#71883F] text-white rounded-xl text-xs font-semibold hover:bg-[#5b6f32]"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAFBF7] border-b border-[#E8E8E3] text-[#6B6B6B]">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Customer</th>
                          <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                          <th className="py-3.5 px-4 font-semibold">Location</th>
                          <th className="py-3.5 px-4 font-semibold">Orders</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Total Spent</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Tier</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E3]">
                        {filteredCustomersList.map((cust) => {
                          const initials = cust.name
                            ? cust.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
                            : 'C';

                          return (
                            <tr
                              key={cust.id}
                              onClick={() => setViewingCustomer(cust)}
                              className="hover:bg-[#FAFBF7] cursor-pointer transition-colors group"
                            >
                              {/* Customer Identity */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {cust.photoURL ? (
                                    <img
                                      src={cust.photoURL}
                                      alt={cust.name}
                                      className="w-9 h-9 rounded-xl object-cover border border-[#E8E8E3] shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#71883F] to-[#55692d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-[#171717] group-hover:text-[#71883F] transition-colors flex items-center gap-1.5">
                                      {cust.name}
                                      {cust.status === 'VIP' && (
                                        <span title="VIP Customer" className="inline-flex">
                                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B] mt-0.5">
                                      {cust.isRegistered ? (
                                        <span className="text-emerald-700 font-medium">Registered</span>
                                      ) : (
                                        <span>Guest Order</span>
                                      )}
                                      {cust.role && cust.role !== 'customer' && (
                                        <>
                                          <span>•</span>
                                          <span className="font-semibold text-purple-700 uppercase text-[10px]">{cust.role}</span>
                                        </>
                                      )}
                                      {cust.isDriver && (
                                        <>
                                          <span>•</span>
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase text-[9px]">
                                            <Truck className="w-2.5 h-2.5" /> Driver
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <div className="text-[#171717] font-medium truncate max-w-[180px]" title={cust.email}>
                                    {cust.email || 'No email provided'}
                                  </div>
                                  <div className="text-[11px] text-[#6B6B6B]">
                                    {cust.phone || 'No phone'}
                                  </div>
                                </div>
                              </td>

                              {/* Location */}
                              <td className="py-3.5 px-4 text-[#6B6B6B]">
                                {[cust.city, cust.state].filter(Boolean).join(', ') || '—'}
                              </td>

                              {/* Orders */}
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-[#171717] block tabular-nums">
                                  {cust.ordersCount} order{cust.ordersCount === 1 ? '' : 's'}
                                </span>
                                {cust.lastOrderDate && (
                                  <span className="text-[10px] text-[#6B6B6B] block">
                                    Last: {cust.lastOrderDate}
                                  </span>
                                )}
                              </td>

                              {/* Total Spent */}
                              <td className="py-3.5 px-4 font-extrabold text-[#71883F] text-right tabular-nums text-sm">
                                ₹{cust.totalSpent.toLocaleString('en-IN')}
                              </td>

                              {/* Tier Status */}
                              <td className="py-3.5 px-4 text-center">
                                {cust.status === 'VIP' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Crown className="w-2.5 h-2.5 fill-current" /> VIP
                                  </span>
                                )}
                                {cust.status === 'Regular' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/30">
                                    Regular
                                  </span>
                                )}
                                {cust.status === 'New' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                    New
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => toggleCustomerVIP(cust.email || cust.id, cust.status !== 'VIP')}
                                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                      cust.status === 'VIP'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-white text-neutral-400 hover:text-amber-600 border-[#E8E8E3] hover:border-amber-300'
                                    }`}
                                    title={cust.status === 'VIP' ? 'VIP Customer (Click to revoke)' : 'Make VIP'}
                                  >
                                    <Crown className="w-3.5 h-3.5 fill-current" />
                                  </button>

                                  <button
                                    onClick={() => grantCustomerDriver(cust.email || cust.id, !cust.isDriver)}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      cust.isDriver
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                        : 'bg-white text-neutral-600 hover:text-emerald-700 border-[#E8E8E3] hover:border-emerald-300'
                                    }`}
                                    title={cust.isDriver ? 'Authorized Driver (Click to revoke Driver Portal access)' : 'Make Driver (Grant Driver Portal access)'}
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">{cust.isDriver ? 'Driver ✓' : 'Make Driver'}</span>
                                  </button>

                                  <button
                                    onClick={() => grantCustomerAdmin(cust.email || cust.id, cust.role !== 'admin')}
                                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                      cust.role === 'admin'
                                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                                        : 'bg-white text-neutral-400 hover:text-purple-600 border-[#E8E8E3] hover:border-purple-300'
                                    }`}
                                    title={cust.role === 'admin' ? 'Admin User (Click to revoke)' : 'Grant Admin Access'}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setViewingCustomer(cust)}
                                    className="px-2.5 py-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] hover:bg-[#71883F] hover:text-white rounded-lg text-xs font-semibold text-[#71883F] transition-all shadow-2xs cursor-pointer"
                                  >
                                    View Details →
                                  </button>

                                  <button
                                    onClick={() => setCustomerToDelete(cust)}
                                    className="p-1.5 bg-white border border-[#E8E8E3] hover:border-rose-500 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg transition-all shadow-2xs cursor-pointer"
                                    title="Delete User Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
                      Customer ratings and testimonials submitted by buyers will appear here automatically.
                    </p>
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
                          onClick={async () => await updateReviewStatus(rev.id, rev.status === 'approved' ? 'hidden' : 'approved')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                            rev.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          {rev.status === 'approved' ? 'Approved' : 'Hidden'}
                        </button>
                        <button
                          onClick={async () => await deleteReview(rev.id)}
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
          {/* 8. BANNERS TAB - CONTROLLED FROM ADMIN DASHBOARD WITH TOGGLE & REFERENCE IMAGE SECTION */}
          {currentTab === 'banners' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Promotional Image Banner Section
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Control the promotional banner section on the storefront homepage with live toggle on/off.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={async () => {
                      const refBanner = {
                        title: 'Up To 30% OFF',
                        subtitle: "On Selected Women's Fashion",
                        badge: 'Limited Time Offer',
                        discountText: '30% OFF',
                        buttonText: 'Grab the Deal',
                        buttonLink: 'shop',
                        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85',
                        bgTone: '#F05A4F',
                        active: true,
                      };
                      await addBanner(refBanner);
                      await updateStoreSettings({ showPromoBanner: true });
                      showToast('Reference image banner added and activated on storefront!', 'success');
                    }}
                    className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-lg text-xs font-bold text-[#171717] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F05A4F]" />
                    <span>Add Reference Image Banner</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingBanner(null);
                      setBannerForm({
                        title: 'Up To 30% OFF',
                        subtitle: "On Selected Women's Fashion",
                        badge: 'Limited Time Offer',
                        discountText: '30% OFF',
                        buttonText: 'Grab the Deal',
                        buttonLink: 'shop',
                        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85',
                        bgTone: '#F05A4F',
                        active: true,
                      });
                      setBannerModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Banner
                  </button>
                </div>
              </div>

              {/* Master Banner On/Off Toggle Card */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    storeSettings.showPromoBanner
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#171717]">
                        Homepage Banner Section Toggle
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        storeSettings.showPromoBanner
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {storeSettings.showPromoBanner ? '🟢 ON - Visible on Storefront' : '⚪ OFF - Hidden from Customers'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Toggle to instantly show or hide the promotional image banner section across the entire website.
                    </p>
                  </div>
                </div>

                {/* Sleek Master Switch Button */}
                <button
                  onClick={async () => {
                    const nextVal = !storeSettings.showPromoBanner;
                    await updateStoreSettings({ showPromoBanner: nextVal });
                    showToast(nextVal ? 'Promotional banner turned ON and visible on homepage!' : 'Promotional banner turned OFF and hidden from homepage.', 'info');
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                    storeSettings.showPromoBanner
                      ? 'bg-[#71883F] hover:bg-[#5F7334] text-white'
                      : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    storeSettings.showPromoBanner ? 'bg-white animate-pulse' : 'bg-neutral-500'
                  }`} />
                  <span>{storeSettings.showPromoBanner ? 'Banner is ON (Click to Turn OFF)' : 'Banner is OFF (Click to Turn ON)'}</span>
                </button>
              </div>

              {/* Live Preview Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Live Storefront Preview
                  </h3>
                  {!storeSettings.showPromoBanner && (
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Currently Hidden (Toggle is OFF)
                    </span>
                  )}
                </div>

                {/* Exact Reference Image Banner Preview Card */}
                {banners.find((b) => b.active) ? (
                  (() => {
                    const activeBanner = banners.find((b) => b.active)!;
                    return (
                      <div
                        className={`relative rounded-3xl overflow-hidden shadow-md border border-black/5 transition-opacity duration-300 ${
                          !storeSettings.showPromoBanner ? 'opacity-40 grayscale-[40%]' : ''
                        }`}
                        style={{ backgroundColor: activeBanner.bgTone || '#F05A4F' }}
                      >
                        {/* Botanical line art */}
                        <svg
                          className="absolute left-1/4 sm:left-1/3 top-0 h-full w-auto pointer-events-none opacity-20 sm:opacity-25"
                          viewBox="0 0 200 240"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M100 220 Q95 140 120 70 Q130 40 140 20" />
                          <path d="M110 160 Q135 150 145 135 Q135 125 118 140" />
                          <path d="M105 130 Q80 120 70 105 Q80 95 102 115" />
                          <path d="M115 95 Q140 85 150 70 Q140 60 120 75" />
                          <path d="M118 60 Q95 50 88 35 Q100 30 120 48" />
                          <path d="M130 35 Q145 25 150 15 Q140 12 128 25" />
                        </svg>

                        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[200px]">
                          <div className="md:col-span-7 p-6 sm:p-8 flex items-center z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full text-left">
                              {activeBanner.badge && (
                                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-lg flex items-center justify-center p-2">
                                  <div className="w-full h-full rounded-full border-2 border-dashed border-[#F05A4F]/60 flex items-center justify-center p-1 text-center">
                                    <span className="text-[10px] sm:text-xs font-black uppercase text-[#171717] leading-tight tracking-wider">
                                      {activeBanner.badge}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <div>
                                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                                    {activeBanner.title}
                                  </h2>
                                  <p className="text-white/90 text-xs sm:text-sm font-medium mt-1">
                                    {activeBanner.subtitle}
                                  </p>
                                </div>

                                <div>
                                  <span className="px-5 py-2 bg-white text-[#171717] rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5">
                                    <span>{activeBanner.buttonText}</span>
                                    <span>→</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-5 relative overflow-hidden flex items-end justify-center min-h-[160px] md:min-h-full">
                            <img
                              src={activeBanner.image || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85'}
                              alt={activeBanner.title}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-8 bg-white border border-dashed border-[#E8E8E3] rounded-3xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#171717]">No Active Promotional Banner Added</h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5 max-w-md mx-auto">
                        In accordance with the rule to remove all banners except what admin adds, no banner is currently displaying. Click below to add the reference image banner or create a custom one.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const refBanner = {
                          title: 'Up To 30% OFF',
                          subtitle: "On Selected Women's Fashion",
                          badge: 'Limited Time Offer',
                          discountText: '30% OFF',
                          buttonText: 'Grab the Deal',
                          buttonLink: 'shop',
                          image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85',
                          bgTone: '#F05A4F',
                          active: true,
                        };
                        await addBanner(refBanner);
                        await updateStoreSettings({ showPromoBanner: true });
                        showToast('Reference image banner added and activated!', 'success');
                      }}
                      className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Create Reference Image Banner Now
                    </button>
                  </div>
                )}
              </div>

              {/* All Saved Banners in Database */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Configured Banners in Database ({banners.length})
                </h3>

                {banners.length === 0 ? (
                  <p className="text-xs text-[#6B6B6B] italic py-4">No banners saved in Firestore yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((b, idx) => (
                      <div key={`${b.id}-${idx}`} className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#71883F] uppercase tracking-wider">{b.badge || 'Banner'}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => await updateBanner(b.id, { active: !b.active })}
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold cursor-pointer ${
                                b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {b.active ? 'Active' : 'Inactive'}
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
                              className="p-1 text-neutral-600 hover:text-[#71883F] cursor-pointer"
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

                        <div className="flex gap-3 items-center">
                          {b.image && (
                            <img
                              src={b.image}
                              alt={b.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E8E8E3]"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-[#171717] truncate">{b.title}</h4>
                            <p className="text-xs text-[#6B6B6B] truncate">{b.subtitle}</p>
                            <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                              Bg: {b.bgTone} • Button: "{b.buttonText}"
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8.5 HERO SLIDES TAB */}
          {currentTab === 'hero-slides' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                    Hero Section Slides ({(heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES).length})
                  </h1>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Customize rotating showcase slides, headlines, background visuals, CTAs and auto-play interval on the home hero.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {heroSlides.length === 0 && (
                    <button
                      onClick={seedHeroDefaults}
                      className="px-4 py-2.5 bg-[#EFF4E6] hover:bg-[#dfeacb] rounded-xl text-xs font-semibold text-[#71883F] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Seed Default Slides
                    </button>
                  )}
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
                    className="px-4 py-2.5 bg-[#71883F] hover:bg-[#5F7334] rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add New Slide
                  </button>
                </div>
              </div>

              {/* Slider Settings Bar */}
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={storeSettings.heroSliderAutoplay !== false}
                      onChange={async (e) => await updateStoreSettings({ heroSliderAutoplay: e.target.checked })}
                      className="accent-[#71883F]"
                    />
                    <span>Auto-Play Moving Slides</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#6B6B6B] font-medium">Slide Interval:</span>
                  <select
                    value={storeSettings.heroSliderInterval || 5000}
                    onChange={async (e) => await updateStoreSettings({ heroSliderInterval: Number(e.target.value) })}
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
                {(heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES).map((slide: HeroSlide, idx: number) => (
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
                          onClick={async () => await updateHeroSlide(slide.id, { active: !slide.active })}
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

              {/* Enhanced Report Export Options */}
              <div className="bg-gradient-to-r from-[#71883F] to-[#5F7334] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-black tracking-tight">Generate Financial Statements</h3>
                  <p className="text-xs text-white/80">Export comprehensive sales and revenue audits for tax compliance.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportCSV('revenue')}
                    className="px-5 py-2.5 bg-white text-[#71883F] rounded-xl text-xs font-black flex items-center gap-2 shadow-sm hover:scale-105 transition-all"
                  >
                    <Download className="w-4 h-4" /> Export CSV Report
                  </button>
                  <button
                    onClick={handleExportPDFReport}
                    className="px-5 py-2.5 bg-[#171717] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm hover:bg-black transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Export PDF Report
                  </button>
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

          {/* 10. DELIVERY & LIVE MAP TAB */}
          {(currentTab === 'deliveries' || currentTab === 'delivery') && (
            <AdminDeliveryManagement />
          )}

          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-6xl w-full">
              <div>
                <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Store Settings & Configuration
                </h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Update business profile, store manager account, delivery charges, and theme colors.
                </p>
              </div>

              {/* Authenticated Store Manager Profile Box */}
              <div className="bg-gradient-to-br from-[#EFF4E6] to-[#F7F9F0] border border-[#71883F]/40 rounded-2xl p-5 shadow-2xs text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.name || 'Store Manager'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#71883F] shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#71883F] text-white flex items-center justify-center font-black text-sm shadow-sm">
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'SM'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-[#171717]">
                          {currentUser?.name || 'Store Manager'}
                        </h3>
                        <span className="text-[10px] bg-[#71883F] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                          Store Manager (Admin)
                        </span>
                      </div>
                      <p className="text-[#4F5E2B] text-xs font-semibold mt-0.5">
                        {currentUser?.email || 'nihal.graphix@gmail.com'}
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-emerald-800 text-[11px] font-bold border border-emerald-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Admin Session
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#71883F]/20 text-[11px]">
                  <div>
                    <span className="text-[#6B6B6B] block">Account Role</span>
                    <strong className="text-[#171717] capitalize">{currentUser?.role || 'admin'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">User ID</span>
                    <span className="font-mono text-[#171717] truncate block">{currentUser?.id || 'admin_user'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Console Status</span>
                    <strong className="text-emerald-700">Full Access Granted</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Phone Contact</span>
                    <span className="text-[#171717]">{currentUser?.phone || '+91 98450 12345'}</span>
                  </div>
                </div>
              </div>

              {/* Store Location & GPS Dispatch Hub Configuration Card */}
              <StoreLocationConfigCard />

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
                      onClick={async () => {
                        await updateStoreSettings({ accentColor: settingsForm.accentColor });
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
                            onClick={async () => {
                              setSettingsForm({ ...settingsForm, accentColor: preset.hex });
                              await updateStoreSettings({ accentColor: preset.hex });
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
                        Preview Button
                      </span>
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold rounded"
                        style={{
                          backgroundColor: `${settingsForm.accentColor || '#71883F'}20`,
                          color: settingsForm.accentColor || '#71883F',
                        }}
                      >
                        Preview Badge
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
                        onChange={async (e) => {
                          const mode = e.target.value as any;
                          setSettingsForm({ ...settingsForm, storeThemeMode: mode });
                          await updateStoreSettings({ storeThemeMode: mode });
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
                        onChange={async (e) => {
                          const font = e.target.value as any;
                          setSettingsForm({ ...settingsForm, fontFamily: font });
                          await updateStoreSettings({ fontFamily: font });
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
                        onChange={async (e) => {
                          const mode = e.target.value as any;
                          setSettingsForm({ ...settingsForm, borderRadiusMode: mode });
                          await updateStoreSettings({ borderRadiusMode: mode });
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
                        onChange={async (e) => {
                          setSettingsForm({ ...settingsForm, heroSliderAutoplay: e.target.checked });
                          await updateStoreSettings({ heroSliderAutoplay: e.target.checked });
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
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          setSettingsForm({ ...settingsForm, heroSliderInterval: val });
                          await updateStoreSettings({ heroSliderInterval: val });
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
                      onClick={async () => {
                        await updateStoreSettings({
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

                {/* Automated Online Payment System & Gateway Configuration */}
                <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-5 shadow-2xs text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E8E3]">
                    <div>
                      <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#71883F]" />
                        Online Payment System & Automation Engine
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Configure NPCI UPI VPA, gateway provider, automated UTR verification, instant order confirmation, and automatic refund rules.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1 self-start sm:self-auto">
                      <Sparkles className="w-3 h-3" /> Webhook Auto-Verification Active
                    </span>
                  </div>

                  {/* Merchant VPA & Gateway Provider */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Merchant UPI ID (VPA)
                      </label>
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
                      <label className="font-semibold text-[#171717] block mb-1">
                        Merchant Business Name
                      </label>
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

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Payment Gateway Provider
                      </label>
                      <select
                        value={settingsForm.paymentGatewayProvider}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentGatewayProvider: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-semibold bg-white outline-none focus:border-[#71883F]"
                      >
                        <option value="Razorpay">Razorpay India</option>
                        <option value="Cashfree">Cashfree Payments</option>
                        <option value="PayU">PayU India</option>
                        <option value="Stripe India">Stripe India</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#171717] block mb-1">
                        Gateway Environment Mode
                      </label>
                      <select
                        value={settingsForm.paymentGatewayMode}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentGatewayMode: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-[#171717] font-semibold bg-white outline-none focus:border-[#71883F]"
                      >
                        <option value="live_auto">Live Automated Verification</option>
                        <option value="test_sandbox">Test Sandbox Mode</option>
                      </select>
                    </div>
                  </div>

                  {/* Online Payment Incentives & COD Fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-[#F7F8F3] p-3.5 rounded-xl border border-[#E8E8E3]">
                      <label className="font-bold text-[#171717] block mb-1">
                        Instant Online Payment Discount (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={settingsForm.onlinePaymentDiscountPercent}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            onlinePaymentDiscountPercent: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-[#171717] font-bold outline-none focus:border-[#71883F]"
                      />
                      <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                        Automatically deducts this % at checkout when customer pays online via UPI/Card/NetBanking.
                      </span>
                    </div>

                    <div className="bg-[#F7F8F3] p-3.5 rounded-xl border border-[#E8E8E3]">
                      <label className="font-bold text-[#171717] block mb-1">
                        Cash on Delivery (COD) Handling Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={settingsForm.codExtraFee}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            codExtraFee: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-[#171717] font-bold outline-none focus:border-[#71883F]"
                      />
                      <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                        Optional surcharge added to Cash on Delivery orders (set 0 for free COD).
                      </span>
                    </div>
                  </div>

                  {/* Automation Workflow Switches */}
                  <div className="bg-[#EFF4E6]/50 border border-[#71883F]/25 rounded-2xl p-4 space-y-3">
                    <span className="text-[11px] font-extrabold text-[#171717] uppercase tracking-wider block">
                      Automated Payment Processing Rules
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-start justify-between bg-white p-3 rounded-xl border border-[#E8E8E3] cursor-pointer">
                        <div className="pr-2">
                          <span className="font-bold text-[#171717] block">
                            Auto-Verify Online Payments (Webhook + UTR)
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            Automatically generates & verifies 12-digit NPCI UTR and marks order as Paid
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.autoVerifyOnlinePayment}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              autoVerifyOnlinePayment: e.target.checked,
                            })
                          }
                          className="accent-[#71883F] mt-1 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-start justify-between bg-white p-3 rounded-xl border border-[#E8E8E3] cursor-pointer">
                        <div className="pr-2">
                          <span className="font-bold text-[#171717] block">
                            Auto-Advance Paid Orders to "Processing"
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            Fast-tracks verified online orders straight into warehouse packing queue
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.autoConfirmPaidOrders}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              autoConfirmPaidOrders: e.target.checked,
                            })
                          }
                          className="accent-[#71883F] mt-1 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-start justify-between bg-white p-3 rounded-xl border border-[#E8E8E3] cursor-pointer">
                        <div className="pr-2">
                          <span className="font-bold text-[#171717] block">
                            Auto-Generate GST Tax Invoice & UTR Receipt
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            Issues instant digital payment certificate and customer notification upon payment
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.autoGeneratePaymentReceipt}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              autoGeneratePaymentReceipt: e.target.checked,
                            })
                          }
                          className="accent-[#71883F] mt-1 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-start justify-between bg-white p-3 rounded-xl border border-[#E8E8E3] cursor-pointer">
                        <div className="pr-2">
                          <span className="font-bold text-[#171717] block">
                            Auto-Refund Online Payment on Order Cancellation
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            Automatically records refund entry and notifies customer if a Paid order is cancelled
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.autoRefundOnCancel}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              autoRefundOnCancel: e.target.checked,
                            })
                          }
                          className="accent-[#71883F] mt-1 w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Supported Payment Channels */}
                  <div className="pt-2 flex flex-wrap items-center gap-5 border-t border-[#E8E8E3]">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableOnlinePayment}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, enableOnlinePayment: e.target.checked })
                        }
                        className="accent-[#71883F]"
                      />
                      <span>Online Checkout Enabled</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableUpiPayment}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, enableUpiPayment: e.target.checked })
                        }
                        className="accent-[#71883F]"
                      />
                      <span>UPI (GPay / PhonePe / Paytm / QR)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableCardPayment}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, enableCardPayment: e.target.checked })
                        }
                        className="accent-[#71883F]"
                      />
                      <span>Cards (RuPay / Visa / Mastercard)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableNetBankingPayment}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            enableNetBankingPayment: e.target.checked,
                          })
                        }
                        className="accent-[#71883F]"
                      />
                      <span>NetBanking</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableCodPayment}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            enableCodPayment: e.target.checked,
                            enableCOD: e.target.checked,
                          })
                        }
                        className="accent-[#71883F]"
                      />
                      <span>Cash on Delivery (COD)</span>
                    </label>
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
                        <span className="text-[11px] text-[#6B6B6B]">Highlight items in inventory with stock &le; threshold</span>
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

                    <div className="space-y-2 bg-[#EFF4E6]/50 p-3.5 rounded-xl border border-[#71883F]/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#71883F]" /> Automated Low Stock Email Alerts
                          </span>
                          <span className="text-[11px] text-[#6B6B6B]">Automatically send notification email alerts when stock drops &le; threshold</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.enableStockEmailAlerts ?? true}
                          onChange={(e) => setSettingsForm({ ...settingsForm, enableStockEmailAlerts: e.target.checked })}
                          className="accent-[#71883F] w-4 h-4 rounded cursor-pointer"
                        />
                      </div>

                      {settingsForm.enableStockEmailAlerts && (
                        <div className="pt-2 border-t border-[#71883F]/20">
                          <label className="text-[11px] font-bold text-[#171717] block mb-1">
                            Admin Recipient Email Address for Stock Alerts
                          </label>
                          <input
                            type="email"
                            value={settingsForm.adminStockAlertEmail || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, adminStockAlertEmail: e.target.value })}
                            placeholder="admin@fathimastores.com"
                            className="w-full px-3 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs font-medium text-[#171717] outline-none focus:border-[#71883F]"
                          />
                        </div>
                      )}
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

              {/* Category Image Customization */}
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Category Image *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border border-[#E8E8E3] bg-[#FAFBF7] overflow-hidden flex items-center justify-center shrink-0 p-1">
                      <ProductImage imageKey={catForm.image} name={catForm.name || 'Category'} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={catForm.image}
                        onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                        placeholder="Paste image URL (https://...) or image key"
                        className="w-full px-3 py-1.5 border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => catFileInputRef.current?.click()}
                          className="px-3 py-1 bg-white border border-[#E8E8E3] hover:border-[#71883F] text-[#171717] rounded-md text-[11px] font-semibold shadow-2xs cursor-pointer"
                        >
                          Upload Image File
                        </button>
                        <input
                          type="file"
                          ref={catFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string;
                                if (dataUrl) {
                                  setCatForm((prev) => ({ ...prev, image: dataUrl }));
                                  showToast('Category image uploaded!', 'success');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Image Presets */}
                  <div className="pt-1">
                    <span className="text-[11px] text-[#6B6B6B] block mb-1">Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'School Supplies', key: 'school-supplies' },
                        { label: 'Art & Craft', key: 'art-supplies' },
                        { label: 'Notebooks', key: 'fathima-notebook' },
                        { label: 'Fine Pens', key: 'fathima-pen' },
                        { label: 'Backpacks', key: 'fathima-backpack' },
                        { label: 'Office Supplies', key: 'office-supplies' },
                      ].map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setCatForm({ ...catForm, image: preset.key })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                            catForm.image === preset.key
                              ? 'bg-[#EFF4E6] text-[#71883F] border-[#71883F]'
                              : 'bg-white text-neutral-600 border-[#E8E8E3]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                        onChange={async (e) => {
                          const newStatus = e.target.value as OrderStatus;
                          await updateOrderStatus(viewingOrder.id, newStatus);
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

                  {/* Payment Verification Status & Income Audit Box */}
                  <div className={`p-4 rounded-xl border ${
                    viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Payment Verified — Counted in Store Income (₹{viewingOrder.paidAmount || viewingOrder.total})</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Payment Not Verified — Strictly EXCLUDED from Store Income</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                          {viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid'
                            ? `Confirmed received by ${viewingOrder.paymentVerifiedBy || 'Store Admin'} ${viewingOrder.paymentVerifiedAt ? `on ${new Date(viewingOrder.paymentVerifiedAt).toLocaleDateString()}` : ''}.`
                            : 'Orders are not counted as revenue until store admin confirms funds received.'}
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          const isCurrentlyVerified = viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid';
                          const nextState = !isCurrentlyVerified;
                          await verifyOrderPayment(viewingOrder.id, nextState);
                          setViewingOrder({
                            ...viewingOrder,
                            paymentVerified: nextState,
                            paymentStatus: nextState ? 'Paid' : 'Pending',
                            paidAmount: nextState ? viewingOrder.total : 0,
                            paymentVerifiedBy: nextState ? (currentUser?.name || 'Store Admin') : undefined,
                            paymentVerifiedAt: nextState ? new Date().toISOString() : undefined,
                          });
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer ${
                          viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid'
                            ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {viewingOrder.paymentVerified || viewingOrder.paymentStatus === 'Paid'
                          ? 'Unmark Payment'
                          : `Verify Payment (₹${viewingOrder.total}) → Add to Income`}
                      </button>
                    </div>
                  </div>

                  {/* Customer and shipping details */}
                  <div className="space-y-2 p-3.5 bg-white border border-[#E8E8E3] rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171717]">Customer & Delivery Option:</span>
                      <span className="text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] px-2 py-0.5 rounded-md">
                        {viewingOrder.deliveryMethod || 'Standard Delivery'}
                      </span>
                    </div>
                    <p className="font-semibold text-[#171717]">{viewingOrder.customerName}</p>
                    <p className="text-[#6B6B6B]">Phone: {viewingOrder.phone} · Email: {viewingOrder.email}</p>
                    <p className="text-[#6B6B6B]">
                      {viewingOrder.shippingAddress?.house}, {viewingOrder.shippingAddress?.street},{' '}
                      {viewingOrder.shippingAddress?.area}, {viewingOrder.shippingAddress?.city},{' '}
                      {viewingOrder.shippingAddress?.state} - {viewingOrder.shippingAddress?.pinCode}
                    </p>
                    {viewingOrder.shippingAddress?.lat && viewingOrder.shippingAddress?.lng && (
                      <div className="pt-1.5 border-t border-[#E8E8E3] flex items-center justify-between flex-wrap gap-2 text-[11px]">
                        <span className="font-mono text-[#71883F] font-bold">
                          Pinned GPS: {viewingOrder.shippingAddress.lat.toFixed(5)}, {viewingOrder.shippingAddress.lng.toFixed(5)}
                        </span>
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${viewingOrder.shippingAddress.lat},${viewingOrder.shippingAddress.lng}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#71883F] hover:underline"
                          >
                            Drive in Google Maps →
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${viewingOrder.shippingAddress.lat},${viewingOrder.shippingAddress.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#171717] hover:text-[#71883F] underline"
                          >
                            Open Pin
                          </a>
                        </div>
                      </div>
                    )}
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

      {/* Customer Full Profile & Information Modal */}
      {viewingCustomer && (
        <AdminCustomerModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onViewOrder={(order) => {
            setViewingOrder(order);
            setViewingCustomer(null);
          }}
          onViewInvoice={(order) => {
            setSelectedOrderForInvoice(order);
          }}
          onCreateOrder={() => {
            setViewingCustomer(null);
            setCurrentTab('billing');
          }}
        />
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
                    placeholder="e.g. Limited Time Offer"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    placeholder="Grab the Deal →"
                    className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Button Target Link</label>
                <input
                  type="text"
                  value={bannerForm.buttonLink}
                  onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                  placeholder="shop or categories"
                  className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F]"
                />
              </div>

              {/* Showcase Image Upload & Presets */}
              <div className="space-y-2">
                <label className="font-semibold text-[#171717] block">Banner Showcase Image</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerForm.image}
                    onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                    placeholder="Paste image URL..."
                    className="flex-1 px-3 py-2 border border-[#E8E8E3] rounded-lg outline-none focus:border-[#71883F] font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-[#E8E8E3] rounded-lg font-bold text-neutral-700 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-[#6B6B6B] font-semibold">Presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setBannerForm((prev) => ({
                        ...prev,
                        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=85',
                      }))
                    }
                    className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200"
                  >
                    Clothes Rack (Reference)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBannerForm((prev) => ({
                        ...prev,
                        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=85',
                      }))
                    }
                    className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                  >
                    Stationery Desk
                  </button>
                </div>

                {bannerForm.image && (
                  <div className="pt-1 flex items-center gap-3">
                    <img
                      src={bannerForm.image}
                      alt="Banner Preview"
                      className="w-16 h-14 rounded-lg object-cover border border-[#E8E8E3]"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold">Image loaded successfully</span>
                  </div>
                )}
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
                onClick={async () => {
                  await deleteHeroSlide(slideToDelete.id);
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
                onClick={async () => {
                  const idToDelete = productToDelete.id;
                  const nameToDelete = productToDelete.name;
                  await deleteProduct(idToDelete);
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

      {/* 2.5. BULK PRODUCTS INVENTORY UPDATE MODAL */}
      {showBulkStockModal && selectedProductIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Bulk Update Inventory</h3>
                <p className="text-xs text-[#6B6B6B]">
                  Adjust stock quantity for {selectedProductIds.length} selected product{selectedProductIds.length > 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-[#171717] block">
                Stock Adjustment (Positive to add, Negative to deduct):
              </label>
              <input
                type="number"
                value={bulkStockInput}
                onChange={(e) => setBulkStockInput(e.target.value)}
                placeholder="e.g. 15 or -5"
                className="w-full px-3 py-2.5 border border-[#E8E8E3] rounded-xl font-bold text-sm text-[#171717] outline-none focus:border-[#71883F]"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['+5', '+10', '+25', '+50', '-5', '-10'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBulkStockInput(preset.replace('+', ''))}
                    className="px-2.5 py-1 bg-[#F7F8F3] hover:bg-[#EFF4E6] border border-[#E8E8E3] rounded-lg text-[11px] font-bold text-[#171717] cursor-pointer"
                  >
                    {preset} units
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const adjustment = Number(bulkStockInput);
                  if (!isNaN(adjustment) && adjustment !== 0) {
                    await bulkUpdateStock(selectedProductIds, adjustment);
                    setSelectedProductIds([]);
                    setShowBulkStockModal(false);
                  }
                }}
                className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Warehouse className="w-3.5 h-3.5" /> Apply Inventory Update
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
                onClick={async () => {
                  await deleteCategory(categoryToDelete.id);
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
                onClick={async () => {
                  await deleteBanner(bannerToDelete.id);
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

      {/* CUSTOMER ACCOUNT DELETE CONFIRMATION MODAL */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E3] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#171717]">Delete User Account</h3>
                <p className="text-xs text-[#6B6B6B]">Remove customer user record from store.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete user account <strong>"{customerToDelete.name}"</strong> ({customerToDelete.email})? This action removes their account profile, custom role permissions, and stored data.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 border border-[#E8E8E3] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-[#171717] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteCustomer(customerToDelete.id || customerToDelete.email);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete User
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
                onClick={async () => {
                  await clearAllData();
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

      {/* BULK ORDER ACTION MODALS */}
      {showBulkOrderActionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E8E8E3]">
            <div className="p-6 border-b border-[#E8E8E3] bg-[#F7F8F3]/50">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  showBulkOrderActionModal.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-[#EFF4E6] text-[#71883F]'
                }`}>
                  {showBulkOrderActionModal.type === 'status' && <RotateCcw className="w-6 h-6" />}
                  {showBulkOrderActionModal.type === 'archive' && <Package className="w-6 h-6" />}
                  {showBulkOrderActionModal.type === 'delete' && <Trash2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#171717] tracking-tight">
                    {showBulkOrderActionModal.type === 'status' && 'Batch Status Update'}
                    {showBulkOrderActionModal.type === 'archive' && 'Archive Orders'}
                    {showBulkOrderActionModal.type === 'delete' && 'Delete Selected Orders'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">Modifying {selectedOrderIds.length} order records</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {showBulkOrderActionModal.type === 'status' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#171717] font-semibold">Select New Order Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={async () => {
                          await bulkUpdateOrderStatus(selectedOrderIds, status as OrderStatus);
                          setSelectedOrderIds([]);
                          setShowBulkOrderActionModal({ ...showBulkOrderActionModal, isOpen: false });
                        }}
                        className="px-3 py-2 border border-[#E8E8E3] hover:border-[#71883F] hover:bg-[#F7F8F3] rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#171717] transition-all text-left"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showBulkOrderActionModal.type === 'archive' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Archived orders will be hidden from the primary dashboard view but remain in the permanent database for accounting and records.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await bulkArchiveOrders(selectedOrderIds, true);
                        setSelectedOrderIds([]);
                        setShowBulkOrderActionModal({ ...showBulkOrderActionModal, isOpen: false });
                      }}
                      className="flex-1 py-3 bg-[#171717] text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Archive Records
                    </button>
                    <button
                      onClick={async () => {
                        await bulkArchiveOrders(selectedOrderIds, false);
                        setSelectedOrderIds([]);
                        setShowBulkOrderActionModal({ ...showBulkOrderActionModal, isOpen: false });
                      }}
                      className="flex-1 py-3 border border-[#E8E8E3] text-[#171717] rounded-xl text-xs font-bold"
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              )}

              {showBulkOrderActionModal.type === 'delete' && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Irreversible Action
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      Deleting orders will permanently remove them from the store records. This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await bulkDeleteOrders(selectedOrderIds);
                      setSelectedOrderIds([]);
                      setShowBulkOrderActionModal({ ...showBulkOrderActionModal, isOpen: false });
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Delete Permanently
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F7F8F3] flex justify-center">
              <button
                onClick={() => setShowBulkOrderActionModal({ ...showBulkOrderActionModal, isOpen: false })}
                className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#171717]"
              >
                Close Without Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
