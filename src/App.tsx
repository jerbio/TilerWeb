import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes as BrowserRoutes, useLocation, Navigate } from 'react-router';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Articles from './pages/Articles';
import GettingStartedArticle from './pages/articles/GettingStartedArticle';
import Layout from './pages/Layout';
import { Toaster } from 'sonner';
import Waitlist from './pages/Waitlist';
import UserAuthentication from './pages/UserAuthentication';
import Timeline from './pages/app/Timeline';
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
import NotificationPreferencesSettings from './pages/settings/NotificationPreferencesSettings';
import { ThemeProvider } from './core/theme/ThemeProvider';
import ThemeInitializer from './core/theme/ThemeInitializer';
import NotificationToast from './core/ui/NotificationToast';
import AppLayout from './pages/app/AppLayout';
import TileshareDetailPage from './pages/app/tileshare/TileshareDetailPage';
import TileshareActive from './pages/app/tileshare/TileshareActive';
import TileshareInvitePage from './pages/app/tileshare/TileshareInvitePage';
import TileshareSent from './pages/app/tileshare/TileshareSent';
import TiletteDetailPage from './pages/app/tileshare/TiletteDetailPage';
import TileshareDashboardPage from './pages/app/tileshare/TileShareDashboard';
import { FlaggedRoute } from './core/auth/FlaggedRoute';
import { featureFlags } from './core/constants/featureFlags';
import { AdminRoute } from './core/auth/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import FeatureFlagsAdmin from './pages/admin/feature-flags/FeatureFlagsAdmin';
import { Routes } from '@/core/constants/routes';

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

// Reset scroll position to the top on every route change (unless the URL has a hash)
const ScrollToTop: React.FC = () => {
	const { pathname, hash } = useLocation();

	useEffect(() => {
		if (hash) return;
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
	}, [pathname, hash]);

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
		<ThemeProvider defaultTheme="dark">
			<HelmetProvider>
				<ConsentProvider>
					<AuthProvider>
						<BrowserRouter>
							<ThemeInitializer />
							<AnalyticsTracker />
							<ScrollToTop />
							<BrowserRoutes>
								<Route path={Routes.Home} element={<Layout />}>
									<Route index element={<Home />} />
									<Route path={Routes.Discover} element={<Discover />} />
									<Route path={Routes.Articles} element={<Articles />} />
									<Route
										path={Routes.ArticlesGettingStarted}
										element={<GettingStartedArticle />}
									/>
									{/* Legacy URL — keep redirect for SEO + backlinks */}
									<Route
										path="/get-started"
										element={
											<Navigate to={Routes.ArticlesGettingStarted} replace />
										}
									/>
								</Route>
								<Route
									path={Routes.Waitlist}
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
										path={Routes.SignUp}
										element={
											<>
												<UserAuthentication />
												<FooterSection />
											</>
										}
									/>
									<Route
										path={Routes.SignIn}
										element={
											<>
												<UserAuthentication />
												<FooterSection />
											</>
										}
									/>
								</Route>

								{/* Extranet Routes - perform operations without needing to sign in */}
								<Route
									path={Routes.Tileshare.invite.pattern}
									element={<TileshareInvitePage />}
								/>

								{/* Protected Routes - redirect to /signin if not authenticated */}
								<Route element={<ProtectedRoute />}>
									<Route element={<AppLayout />}>
										<Route path={Routes.Timeline} element={<Timeline />} />
										<Route
											element={
												<FlaggedRoute flag={featureFlags.TILESHARE_TAB} />
											}
										>
											<Route
												path={Routes.Tileshare.root}
												element={<TileshareDashboardPage />}
											>
												<Route
													index
													element={<Navigate to="inbox" replace />}
												/>
												<Route path="inbox" element={<TileshareActive />} />
												<Route path="outbox" element={<TileshareSent />} />
											</Route>
											<Route
												path={Routes.Tileshare.detail.pattern}
												element={<TileshareDetailPage />}
											/>
											<Route
												path={Routes.Tileshare.tilette.pattern}
												element={<TiletteDetailPage />}
											/>
										</Route>
										<Route path={Routes.Settings} element={<SettingsLayout />}>
											<Route
												index
												element={
													<Navigate to={Routes.SettingsAccount} replace />
												}
											/>
											<Route
												path={Routes.SettingsAccount}
												element={<AccountSettings />}
											/>
											<Route
												path={Routes.SettingsPreferences}
												element={<PreferencesSettings />}
											/>
											<Route
												path={Routes.SettingsNotifications}
												element={<NotificationPreferencesSettings />}
											/>
										</Route>
									</Route>
								</Route>

								{/* Admin Routes - redirect to /timeline if not admin */}
								<Route element={<AdminRoute />}>
									<Route path={Routes.Admin.root} element={<AdminLayout />}>
										<Route
											index
											element={
												<Navigate to={Routes.Admin.featureFlags} replace />
											}
										/>
										<Route
											path={Routes.Admin.featureFlags}
											element={<FeatureFlagsAdmin />}
										/>
									</Route>
								</Route>
							</BrowserRoutes>
							<Toaster position="bottom-left" theme="system" />
							<NotificationToast />
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
