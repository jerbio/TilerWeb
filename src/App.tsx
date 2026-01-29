import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, useLocation, Navigate } from 'react-router';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Features from './pages/Features';
import { Toaster } from 'sonner';
import Waitlist from './pages/Waitlist';
import UserAuthentication from './pages/UserAuthentication';
import Timeline from './pages/Timeline';
import FooterSection from './components/footer_section';
import { ConsentProvider } from './core/common/components/consent';
import { HelmetProvider } from 'react-helmet-async';
import DevUserIdOverlay from './core/common/components/dev/DevUserIdOverlay';
import DevModeBadge from './core/common/components/dev/DevModeBadge';
import useDevTools from './core/common/hooks/useDevTools';
import { AuthProvider } from './core/auth/AuthProvider';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import analytics from './core/util/analytics';
import { PublicRoute } from './components/auth/PublicRoute';
import SettingsLayout from './pages/settings/SettingsLayout';
import AccountSettings from './pages/settings/AccountSettings';
import PreferencesSettings from './pages/settings/PreferencesSettings';
import { ThemeProvider } from './core/theme/ThemeProvider';
// import useAppStore from './global_state';

// Component to track page views on route changes
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pageName = location.pathname === '/' ? 'Home' : location.pathname.slice(1);
    analytics.trackPageView(pageName, {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer,
    });
  }, [location]);

  return null;
};

const App: React.FC = () => {
  // Dev tools for testing
  const { isOverlayVisible, closeOverlay } = useDevTools();

  // Track app initialization
  useEffect(() => {
    analytics.trackEvent('App', 'Initialized', undefined, undefined, {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });
  }, []);

  return (
    <ThemeProvider defaultTheme='dark'>
      <HelmetProvider>
        <ConsentProvider>
          <AuthProvider>
            <BrowserRouter>
              <AnalyticsTracker />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="/features" element={<Features />} />
                </Route>
                <Route
                  path="/waitlist"
                  element={
                    <>
                      <Waitlist />
                      <FooterSection />
                    </>
                  }
                />

                {/* Public Routes - redirect to /timeline if already authenticated */}
                <Route element={<PublicRoute />}>
                  <Route
                    path="/signup"
                    element={
                      <>
                        <UserAuthentication />
                        <FooterSection />
                      </>
                    }
                  />
                  <Route
                    path="/signin"
                    element={
                      <>
                        <UserAuthentication />
                        <FooterSection />
                      </>
                    }
                  />
                </Route>

                {/* Protected Routes - redirect to /signin if not authenticated */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/settings" element={<SettingsLayout />}>
                    <Route
                      index
                      element={<Navigate to="/settings" replace />}
                    />
                    <Route path="account" element={<AccountSettings />} />
                    <Route
                      path="preferences"
                      element={<PreferencesSettings />}
                    />
                  </Route>
                </Route>
              </Routes>
              <Toaster position="bottom-left" theme="system" />
            </BrowserRouter>
          </AuthProvider>

          {/* Dev tools - only rendered in development mode */}
          <DevUserIdOverlay isVisible={isOverlayVisible} onClose={closeOverlay} />
          <DevModeBadge />
        </ConsentProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
};

export default App;
