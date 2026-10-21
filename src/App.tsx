import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/home/HeroSection';
import { StoreBenefits } from './components/home/StoreBenefits';
import { CategoryCircles } from './components/home/CategoryCircles';
import { BestSellingSection } from './components/home/BestSellingSection';
import { PromoBanner } from './components/home/PromoBanner';
import { NewArrivalsSection } from './components/home/NewArrivalsSection';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { CustomerReviewsSection } from './components/home/CustomerReviewsSection';
import { ShopPage } from './components/shop/ShopPage';
import { CategoriesPage } from './components/shop/CategoriesPage';
import { ProductDetailPage } from './components/shop/ProductDetailPage';
import { CartPage } from './components/cart/CartPage';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { OrderSuccessPage } from './components/checkout/OrderSuccessPage';
import { AccountPage } from './components/account/AccountPage';
import { WishlistPage } from './components/account/WishlistPage';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { OrderTrackingPage } from './components/pages/OrderTrackingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SearchModal } from './components/common/SearchModal';
import { ToastContainer } from './components/common/ToastContainer';

import { QuickViewModal } from './components/common/QuickViewModal';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { LiveChatWidget } from './components/common/LiveChatWidget';

import { ProfilePage } from './components/account/ProfilePage';
import { DeliveryPortalPage } from './components/delivery/DeliveryPortalPage';
import { ForceSignInModal } from './components/common/ForceSignInModal';
import { UnauthorizedDomainModal } from './components/common/UnauthorizedDomainModal';
import { CompareProductsBar } from './components/shop/CompareProductsBar';

const MainContent: React.FC = () => {
  const {
    activePage,
    setActivePage,
    storeSettings,
    isAdmin,
    showForceSignInModal,
    setShowForceSignInModal,
    setSelectedOrderId,
    unauthorizedDomainInfo,
    setUnauthorizedDomainInfo,
  } = useStore();

  // Listen to browser hash or URL path with robust query string parsing
  useEffect(() => {
    const handleHash = () => {
      const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
      const rawPath = (window.location.pathname || '').replace(/^\/+|\/+$/g, '').trim();
      const sourceToken = rawHash || rawPath;
      if (!sourceToken) {
        return;
      }
      const [baseToken, queryString] = sourceToken.split('?');
      const cleanHash = baseToken.replace(/\/+$/, '').toLowerCase();

      if (queryString) {
        const params = new URLSearchParams(queryString);
        const orderIdParam = params.get('orderId') || params.get('id') || params.get('track');
        if (orderIdParam) {
          setSelectedOrderId(orderIdParam);
        }
      }

      if (cleanHash === 'admin' || cleanHash === 'admin-dashboard' || cleanHash === 'dashboard') {
        setActivePage('admin');
      } else if (cleanHash === 'admin/login' || cleanHash === 'admin-login') {
        setActivePage('admin-login');
      } else if (cleanHash === 'shop' || cleanHash === 'products') {
        setActivePage('shop');
      } else if (cleanHash === 'categories') {
        setActivePage('categories');
      } else if (cleanHash === 'cart') {
        setActivePage('cart');
      } else if (cleanHash === 'checkout') {
        setActivePage('checkout');
      } else if (cleanHash === 'order-success') {
        setActivePage('order-success');
      } else if (cleanHash === 'account') {
        setActivePage('account');
      } else if (cleanHash === 'profile') {
        setActivePage('profile');
      } else if (cleanHash === 'wishlist') {
        setActivePage('wishlist');
      } else if (cleanHash === 'delivery-portal' || cleanHash === 'delivery') {
        setActivePage('delivery-portal');
      } else if (cleanHash === 'order-tracking' || cleanHash === 'track-order' || cleanHash === 'track') {
        setActivePage('order-tracking');
      } else if (cleanHash === 'about' || cleanHash === 'about-us') {
        setActivePage('about');
      } else if (cleanHash === 'contact' || cleanHash === 'contact-us' || cleanHash === 'contactus') {
        setActivePage('contact');
      } else if (cleanHash === 'login') {
        setActivePage('login');
      } else if (cleanHash === 'register') {
        setActivePage('register');
      } else if (cleanHash === 'home') {
        setActivePage('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, [setActivePage, setSelectedOrderId]);

  // Admin Views render full screen without consumer header/footer
  if (activePage === 'admin') {
    return (
      <>
        {isAdmin ? <AdminDashboard /> : <AdminLoginPage />}
        <ToastContainer />
        {unauthorizedDomainInfo && (
          <UnauthorizedDomainModal
            domain={unauthorizedDomainInfo.domain}
            projectId={unauthorizedDomainInfo.projectId}
            onClose={() => setUnauthorizedDomainInfo(null)}
          />
        )}
      </>
    );
  }

  if (activePage === 'admin-login') {
    return (
      <>
        {isAdmin ? <AdminDashboard /> : <AdminLoginPage />}
        <ToastContainer />
        {unauthorizedDomainInfo && (
          <UnauthorizedDomainModal
            domain={unauthorizedDomainInfo.domain}
            projectId={unauthorizedDomainInfo.projectId}
            onClose={() => setUnauthorizedDomainInfo(null)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        storeSettings.storeThemeMode === 'cream'
          ? 'bg-[#FAF8F5] text-[#1F1E1D]'
          : storeSettings.storeThemeMode === 'linen'
          ? 'bg-[#F4F4F0] text-[#191918]'
          : storeSettings.storeThemeMode === 'dark'
          ? 'bg-[#111111] text-[#F5F5F5]'
          : 'bg-white text-[#171717]'
      }`}
      style={{ fontFamily: storeSettings.fontFamily || 'Plus Jakarta Sans' }}
    >
      {/* Consumer Header */}
      <Header />

      {/* Main Body per Page */}
      <main className="flex-1">
        {activePage === 'home' && (
          <div
            className="relative transition-all duration-300"
            style={{
              backgroundColor: storeSettings.homeBgColor || '#FFFFFF',
              backgroundImage: storeSettings.homeBgImage ? `url("${storeSettings.homeBgImage}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: storeSettings.homeBgImage ? 'fixed' : undefined,
            }}
          >
            {/* Dynamic Landing Page Background Overlay */}
            {storeSettings.homeBgImage && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity ${
                  storeSettings.homeBgOverlay === 'dark'
                    ? 'bg-neutral-950'
                    : storeSettings.homeBgOverlay === 'gradient'
                    ? 'bg-gradient-to-b from-white/95 via-white/85 to-white/95'
                    : storeSettings.homeBgOverlay === 'none'
                    ? 'bg-transparent'
                    : 'bg-white'
                }`}
                style={{ opacity: (storeSettings.homeBgOpacity ?? 90) / 100 }}
              />
            )}
            <div className="relative z-10">
              <HeroSection />
              <StoreBenefits />
              <CategoryCircles />
              <BestSellingSection />
              <PromoBanner />
              <NewArrivalsSection />
              <WhyChooseUs />
              <CustomerReviewsSection />
            </div>
          </div>
        )}

        {activePage === 'shop' && <ShopPage />}
        {activePage === 'categories' && <CategoriesPage />}
        {activePage === 'product-details' && <ProductDetailPage />}
        {activePage === 'cart' && <CartPage />}
        {activePage === 'checkout' && <CheckoutPage />}
        {activePage === 'order-success' && <OrderSuccessPage />}
        {activePage === 'account' && <AccountPage />}
        {activePage === 'profile' && <ProfilePage />}
        {activePage === 'wishlist' && <WishlistPage />}
        {activePage === 'about' && <AboutPage />}
        {activePage === 'contact' && <ContactPage />}
        {activePage === 'order-tracking' && <OrderTrackingPage />}
        {activePage === 'delivery-portal' && <DeliveryPortalPage />}
        {activePage === 'login' && <LoginPage />}
        {activePage === 'register' && <RegisterPage />}
      </main>

      {/* Global Modals & Drawers */}
      <ForceSignInModal
        isOpen={showForceSignInModal}
        onClose={() => setShowForceSignInModal(false)}
      />
      <CartDrawer />
      <SearchModal />
      <QuickViewModal />
      <CompareProductsBar />
      <WhatsAppButton />
      <LiveChatWidget />
      <ToastContainer />
      {unauthorizedDomainInfo && (
        <UnauthorizedDomainModal
          domain={unauthorizedDomainInfo.domain}
          projectId={unauthorizedDomainInfo.projectId}
          onClose={() => setUnauthorizedDomainInfo(null)}
        />
      )}
      

      {/* Consumer Footer */}
      <Footer />
    </div>
  );
};

import { GoogleMapsWrapper } from './components/common/GoogleMapsWrapper';

export default function App() {
  return (
    <StoreProvider>
      <GoogleMapsWrapper>
        <MainContent />
      </GoogleMapsWrapper>
    </StoreProvider>
  );
}
