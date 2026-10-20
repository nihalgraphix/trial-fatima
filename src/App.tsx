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
    isAuthLoading,
    currentUser,
    showForceSignInModal,
    setShowForceSignInModal,
    unauthorizedDomainInfo,
    setUnauthorizedDomainInfo,
  } = useStore();

  // Trigger Force Sign-In modal if user is not signed in
  useEffect(() => {
    if (!isAuthLoading && !currentUser && activePage !== 'admin' && activePage !== 'admin-login') {
      setShowForceSignInModal(true);
    }
  }, [isAuthLoading, currentUser, activePage, setShowForceSignInModal]);

  // Listen to browser hash or URL path
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin') {
        setActivePage('admin');
      } else if (hash === 'admin/login' || hash === 'admin-login') {
        setActivePage('admin-login');
      } else if (hash === 'shop') {
        setActivePage('shop');
      } else if (hash === 'categories') {
        setActivePage('categories');
      } else if (hash === 'cart') {
        setActivePage('cart');
      } else if (hash === 'checkout') {
        setActivePage('checkout');
      } else if (hash === 'order-success') {
        setActivePage('order-success');
      } else if (hash === 'account') {
        setActivePage('account');
      } else if (hash === 'profile') {
        setActivePage('profile');
      } else if (hash === 'wishlist') {
        setActivePage('wishlist');
      } else if (hash === 'delivery-portal') {
        setActivePage('delivery-portal');
      } else if (hash === 'order-tracking' || hash === 'track-order' || hash === 'track') {
        setActivePage('order-tracking');
      } else if (hash === 'about') {
        setActivePage('about');
      } else if (hash === 'contact') {
        setActivePage('contact');
      } else if (hash === 'login') {
        setActivePage('login');
      } else if (hash === 'register') {
        setActivePage('register');
      } else if (hash === 'home') {
        setActivePage('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setActivePage]);

  // Global loading state for auth
  if (isAuthLoading && activePage !== 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#71883F]/20 border-t-[#71883F] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#6B6B6B]">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Admin Views render full screen without consumer header/footer
  if (activePage === 'admin') {
    return (
      <>
        <AdminDashboard />
        <ToastContainer />
      </>
    );
  }

  if (activePage === 'admin-login') {
    return (
      <>
        <AdminLoginPage />
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
        isOpen={showForceSignInModal || (!currentUser && (activePage === 'cart' || activePage === 'checkout'))}
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
