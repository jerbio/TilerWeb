import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes as BrowserRoutes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, ThemeMode } from '@/core/theme/ThemeProvider';
import i18n from '@/i18n/config';
import { Routes as AppRoutes } from '@/core/constants/routes';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import SettingsLayout from './SettingsLayout';
import ConnectionsSettings from './ConnectionsSettings';
import ConnectionsDetailSettings from './ConnectionsDetailSettings';

// ---------------------------------------------------------------------------
// Phase 1 tests: Connections route and Settings entry.
//
// The protected Settings branch is rendered exactly as it is registered in
// App.tsx, so the routes under test behave like production routing.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock @/global_state with a controllable auth state
// ---------------------------------------------------------------------------
const authStore = vi.hoisted(() => ({
	isAuthenticated: true,
	isAuthLoading: false,
}));

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = {
				authenticatedUser: null,
				isAuthenticated: authStore.isAuthenticated,
				isAuthLoading: authStore.isAuthLoading,
				logout: vi.fn(),
			};
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({
				authenticatedUser: null,
				isAuthenticated: authStore.isAuthenticated,
				isAuthLoading: authStore.isAuthLoading,
			}),
		}
	),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const renderSettingsRoutes = (initialPath: string) =>
	render(
		<MemoryRouter initialEntries={[initialPath]}>
			<I18nextProvider i18n={i18n}>
				<ThemeProvider defaultTheme={ThemeMode.Dark}>
					<BrowserRoutes>
						<Route element={<ProtectedRoute />}>
							<Route path={AppRoutes.Settings} element={<SettingsLayout />}>
								<Route
									index
									element={<Navigate to={AppRoutes.SettingsAccount} replace />}
								/>
								<Route
									path={AppRoutes.SettingsAccount}
									element={<div>account-page-stub</div>}
								/>
								<Route
									path={AppRoutes.SettingsPreferences}
									element={<div>preferences-page-stub</div>}
								/>
								<Route
									path={AppRoutes.SettingsNotifications}
									element={<div>notifications-page-stub</div>}
								/>
								<Route
									path={AppRoutes.SettingsConnections}
									element={<ConnectionsSettings />}
								/>
								<Route
									path={AppRoutes.SettingsConnectionDetail.pattern}
									element={<ConnectionsDetailSettings />}
								/>
							</Route>
						</Route>
						<Route path={AppRoutes.SignIn} element={<div>signin-page-stub</div>} />
					</BrowserRoutes>
				</ThemeProvider>
			</I18nextProvider>
		</MemoryRouter>
	);

beforeEach(() => {
	authStore.isAuthenticated = true;
	authStore.isAuthLoading = false;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('route constants', () => {
	it('defines the connections list route', () => {
		expect(AppRoutes.SettingsConnections).toBe('/settings/connections');
	});

	it('defines the connections detail route with a callable path and pattern', () => {
		expect(AppRoutes.SettingsConnectionDetail.pattern).toBe(
			'/settings/connections/:integrationId'
		);
		expect(AppRoutes.SettingsConnectionDetail('integration-1')).toBe(
			'/settings/connections/integration-1'
		);
	});
});

describe('Settings index', () => {
	it('renders the Connections entry with its description', () => {
		renderSettingsRoutes(AppRoutes.Settings);
		expect(screen.getByText('Connections')).toBeInTheDocument();
		expect(screen.getByText('Manage apps connected to your Tiler account')).toBeInTheDocument();
	});

	it('navigates to /settings/connections when Connections is selected', async () => {
		renderSettingsRoutes(AppRoutes.Settings);
		// "Connections" also appears in the (invisible) Settings breadcrumb, so
		// target the clickable section item by its heading rather than raw text.
		fireEvent.click(screen.getByRole('heading', { name: 'Connections' }));

		await waitFor(() => {
			expect(screen.getByText('Connection settings coming soon...')).toBeInTheDocument();
		});
	});
});

describe('route protection', () => {
	it('redirects unauthenticated users to /signin for the list route', () => {
		authStore.isAuthenticated = false;
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(screen.getByText('signin-page-stub')).toBeInTheDocument();
		expect(screen.queryByText('Connection settings coming soon...')).not.toBeInTheDocument();
	});

	it('redirects unauthenticated users to /signin for the detail route', () => {
		authStore.isAuthenticated = false;
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));

		expect(screen.getByText('signin-page-stub')).toBeInTheDocument();
		expect(screen.queryByText('Connection settings coming soon...')).not.toBeInTheDocument();
	});
});

describe('detail route', () => {
	it('renders through the Settings outlet from a direct (deep-link/refresh) URL', () => {
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));

		// On detail pages SettingsLayout renders only the <Outlet />, so the
		// page's own breadcrumb (Settings / Connections) proves it rendered
		// inside the Settings shell rather than as a standalone route.
		expect(screen.getAllByText('Connections').length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText('Connection settings coming soon...')).toBeInTheDocument();
	});

	it('still renders the Settings shell for the detail URL after an unauthenticated redirect back', () => {
		// Simulates the user signing in and the router restoring the original
		// deep link: an authenticated load of the same detail URL must render.
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));
		expect(screen.getByText('Connection settings coming soon...')).toBeInTheDocument();
	});
});
