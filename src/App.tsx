import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, useLocation, Navigate } from 'react-router';
import Home from './pages/Home';
import Discover from './pages/Discover';
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
import NotificationToast from './core/ui/NotificationToast';
import AppLayout from './pages/app/AppLayout';
import TileshareDetailPage from './pages/app/tileshare/TileshareDetailPage';
import TileshareActive from './pages/app/tileshare/TileshareActive';
import TileshareInvitePage from './pages/app/tileshare/TileshareInvitePage';
import TileshareSent from './pages/app/tileshare/TileshareSent';
import TiletteDetailPage from './pages/app/tileshare/TiletteDetailPage';
import TileshareDashboardPage from './pages/app/tileshare/TileShareDashboard';
import ROUTES from './core/constants/routes';

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
		<ThemeProvider defaultTheme="dark">
			<HelmetProvider>
				<ConsentProvider>
					<AuthProvider>
						<BrowserRouter>
							<AnalyticsTracker />
							<Routes>
								<Route path="/" element={<Layout />}>
									<Route index element={<Home />} />
									<Route path="/discover" element={<Discover />} />
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

								{/* Extranet Routes - perform operations without needing to sign in */}
								<Route
									path={ROUTES.tileshare.patterns.invite}
									element={<TileshareInvitePage />}
								/>

								{/* Protected Routes - redirect to /signin if not authenticated */}
								<Route element={<ProtectedRoute />}>
									<Route element={<AppLayout />}>
										<Route path={ROUTES.timeline} element={<Timeline />} />
										<Route
											path={ROUTES.tileshare.root}
											element={<TileshareDashboardPage />}
										>
											<Route
												index
												element={<Navigate to="active" replace />}
											/>
											<Route path="active" element={<TileshareActive />} />
											<Route path="sent" element={<TileshareSent />} />
										</Route>
										<Route
											path={ROUTES.tileshare.patterns.detail}
											element={<TileshareDetailPage />}
										/>

										<Route
											path={ROUTES.tileshare.patterns.tilette}
											element={<TiletteDetailPage />}
										/>
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
											<Route
												path="notifications"
												element={<NotificationPreferencesSettings />}
											/>
										</Route>
									</Route>
								</Route>
							</Routes>
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
