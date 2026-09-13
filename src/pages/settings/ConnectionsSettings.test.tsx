import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes as BrowserRoutes, useLocation } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, ThemeMode } from '@/core/theme/ThemeProvider';
import i18n from '@/i18n/config';
import { Routes as AppRoutes } from '@/core/constants/routes';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { mapCalendarItemsEnvelope, mapIntegrationsEnvelope } from '@/core/integrations/mapping';
import {
	calendarItemsEnvelope,
	integrationSuccessEnvelope,
} from '@/test/fixtures/integrationResponses';
import SettingsLayout from './SettingsLayout';
import ConnectionsSettings from './ConnectionsSettings';
import ConnectionsDetailSettings from './ConnectionsDetailSettings';

// ---------------------------------------------------------------------------
// Phase 1 tests: Connections route and Settings entry.
//
// The protected Settings branch is rendered exactly as it is registered in
// App.tsx, so the routes under test behave like production routing.
// Phase 3 tests (provider list, Google connect start, OAuth return handling)
// live in the same file below.
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
// Mock the integrations service so tests control the data (and the call
// count) without real network access.
// ---------------------------------------------------------------------------
const integrationsServiceMock = vi.hoisted(() => ({
	getIntegrations: vi.fn(),
	getCalendarItems: vi.fn(),
	toggleCalendarItem: vi.fn(),
	disconnectIntegration: vi.fn(),
}));

vi.mock('@/services', () => ({
	__esModule: true,
	integrationsService: integrationsServiceMock,
}));

// Provide a deterministic API base URL for the OAuth start URL.
const envStore = vi.hoisted(() => ({ baseUrl: 'https://api.tiler.test/' }));
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => envStore.baseUrl,
	},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Records the router's search string on every render (renders nothing). */
const LocationProbe = ({ captured }: { captured: { current: string } | null }) => {
	const location = useLocation();
	if (captured) {
		captured.current = location.search;
	}
	return null;
};

const renderSettingsRoutes = (
	initialPath: string,
	capturedSearch: { current: string } | null = null
) =>
	render(
		<MemoryRouter initialEntries={[initialPath]}>
			<LocationProbe captured={capturedSearch} />
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
	envStore.baseUrl = 'https://api.tiler.test/';
	integrationsServiceMock.getIntegrations.mockReset();
	integrationsServiceMock.getIntegrations.mockResolvedValue([]);
	// Detail-page defaults (P4-3): a populated calendar list and no-op
	// mutations, so the detail route renders in tests that don't care about it.
	integrationsServiceMock.getCalendarItems.mockReset();
	integrationsServiceMock.getCalendarItems.mockResolvedValue(
		mapCalendarItemsEnvelope(calendarItemsEnvelope)
	);
	integrationsServiceMock.toggleCalendarItem.mockReset();
	integrationsServiceMock.toggleCalendarItem.mockResolvedValue(null);
	integrationsServiceMock.disconnectIntegration.mockReset();
	integrationsServiceMock.disconnectIntegration.mockResolvedValue(undefined);
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

		// The page shell renders and the integrations fetch completes (the empty
		// status shows because no integrations are mocked in this test).
		await waitFor(() => {
			expect(screen.getByText('No connected accounts yet.')).toBeInTheDocument();
		});
	});
});

describe('route protection', () => {
	it('redirects unauthenticated users to /signin for the list route', () => {
		authStore.isAuthenticated = false;
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(screen.getByText('signin-page-stub')).toBeInTheDocument();
		// The list page itself must not have rendered either.
		expect(screen.queryByText('No connected accounts yet.')).not.toBeInTheDocument();
	});

	it('redirects unauthenticated users to /signin for the detail route', () => {
		authStore.isAuthenticated = false;
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));

		expect(screen.getByText('signin-page-stub')).toBeInTheDocument();
		// The detail page itself must not have rendered either.
		expect(
			screen.queryByText('This connection is no longer available.')
		).not.toBeInTheDocument();
	});
});

describe('detail route', () => {
	it('renders through the Settings outlet from a direct (deep-link/refresh) URL', async () => {
		integrationsServiceMock.getIntegrations.mockResolvedValueOnce(
			mapIntegrationsEnvelope(integrationSuccessEnvelope)
		);
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));

		// On detail pages SettingsLayout renders only the <Outlet />, so the
		// page's own breadcrumb (Settings / Connections / email) proves it
		// rendered inside the Settings shell rather than a standalone route.
		expect(await screen.findByRole('heading', { name: 'Google Calendar' })).toBeInTheDocument();
		expect(screen.getByText('Settings')).toBeInTheDocument();
		expect(screen.getByText('Connections')).toBeInTheDocument();
		// The email appears twice: in the breadcrumb and in the account header.
		expect(screen.getAllByText('person@example.com').length).toBe(2);
	});

	it('still renders the Settings shell for the detail URL after an unauthenticated redirect back', async () => {
		// Simulates the user signing in and the router restoring the original
		// deep link: an authenticated load of the same detail URL must render.
		// The default mock resolves an empty integration list, so the restored
		// deep link surfaces the not-found state instead of a blank page.
		renderSettingsRoutes(AppRoutes.SettingsConnectionDetail('integration-1'));
		expect(
			await screen.findByText('This connection is no longer available.')
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Back to Connections' })).toBeInTheDocument();
	});
});
// ---------------------------------------------------------------------------
// Phase 3: provider list, Google connect start, OAuth return handling.
//
// OAuth contract under test (verified against TilerFront, see
// `src/core/integrations/oauthReturn.ts`): the return URL carries the
// transient parameters `calendarConnect=success|declined|error` plus optional
// `integrationId` (composite server id) and `reason` (safe token). The page
// must show one notification, refresh only on success, and replace the URL
// with a clean one.
// ---------------------------------------------------------------------------

// jsdom's location.origin (set via the vitest jsdom url) is what the page uses
// for the OAuth redirectTarget. `origin` is a non-configurable getter, so the
// tests assert against the real origin instead of trying to redefine it.
const pageOrigin = window.location.origin;
/**
 * The server reports the newly persisted integration as a composite id
 * ({tilerUserId}_TCA_{accountEmail}_TCA_{providerId}_TCA_{ulid}), so the
 * fixture mirrors that exact shape.
 */
const integrationIdParam =
	'9f86d081-884c-4baf-a5e2-4b9c6d1e7f21_TCA_person@example.com_TCA_google_TCA_01J9V4Q7T8Z01J9V4Q7T8Z01J9';

describe('provider list', () => {
	it('renders Google as an available provider with a Connect action', async () => {
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		// "Google Calendar" is unique to the provider row (the connected
		// accounts list shows emails), so scope the Connect action to that
		// row — Microsoft is available too and has its own Connect button.
		const googleRow = (await screen.findByText('Google Calendar')).closest(
			'div'
		) as HTMLElement;
		expect(within(googleRow).getByRole('button', { name: 'Connect' })).toBeInTheDocument();
	});

	it('renders Apple, Slack, and Google Tasks unavailable, Microsoft available', async () => {
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		for (const name of ['Apple', 'Slack', 'Google Tasks']) {
			expect(await screen.findByText(name)).toBeInTheDocument();
		}
		// Three unavailable rows...
		expect(screen.getAllByText('Coming soon').length).toBe(3);
		// ...and exactly two Connect actions — one per available provider
		// (Google and Microsoft).
		expect(screen.getAllByRole('button', { name: 'Connect' }).length).toBe(2);
		const microsoftRow = screen.getByText('Microsoft').closest('div') as HTMLElement;
		expect(within(microsoftRow).getByRole('button', { name: 'Connect' })).toBeInTheDocument();
	});
});

describe('connected accounts states', () => {
	it('shows the app-wide loading bar while integrations are fetching', async () => {
		integrationsServiceMock.getIntegrations.mockReturnValueOnce(new Promise(() => {}));

		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(screen.getByTestId('connections-loading')).toBeInTheDocument();
	});

	it('toggles the expansion when the whole provider row is clicked', async () => {
		const data = mapIntegrationsEnvelope(integrationSuccessEnvelope);
		integrationsServiceMock.getIntegrations.mockResolvedValueOnce(data);

		renderSettingsRoutes(AppRoutes.SettingsConnections);

		const googleRow = (await screen.findByText('Google Calendar')).closest(
			'div'
		) as HTMLElement;
		// The row header itself toggles the expansion (no need to hit the chevron).
		fireEvent.click(googleRow);
		expect(await screen.findByText('person@example.com')).toBeInTheDocument();

		// A second click collapses the row again.
		fireEvent.click(googleRow);
		await waitFor(() => {
			expect(screen.queryByText('person@example.com')).not.toBeInTheDocument();
		});
	});

	it('renders connected accounts after load and links to the detail page', async () => {
		const data = mapIntegrationsEnvelope(integrationSuccessEnvelope);
		// The list load and the detail load both receive the success envelope.
		integrationsServiceMock.getIntegrations.mockResolvedValueOnce(data);
		integrationsServiceMock.getIntegrations.mockResolvedValueOnce(data);

		renderSettingsRoutes(AppRoutes.SettingsConnections);

		// Accounts render inside the expandable provider row (Microsoft is
		// available too but has no accounts), so open the Google row first.
		const googleRow = (await screen.findByText('Google Calendar')).closest(
			'div'
		) as HTMLElement;
		fireEvent.click(within(googleRow).getByRole('button', { name: 'Expand accounts' }));

		expect(await screen.findByText('person@example.com')).toBeInTheDocument();
		expect(screen.getByText('2 calendars connected')).toBeInTheDocument();

		// Two integrations are rendered (person@example.com and other@example.com),
		// so target the first row's Manage action rather than a single-element query.
		fireEvent.click(screen.getAllByRole('button', { name: 'Manage' })[0]);
		// The detail page (P4-3) proves the navigation reached the detail route:
		// the provider header and the calendar toggles render.
		expect(await screen.findByRole('heading', { name: 'Google Calendar' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Work — Enabled' })).toBeInTheDocument();
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(2);
	});

	it('renders the empty state when the server returns no integrations', async () => {
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(await screen.findByText('No connected accounts yet.')).toBeInTheDocument();
	});

	it('renders an error state with a Retry action and recovers on retry', async () => {
		integrationsServiceMock.getIntegrations
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce(mapIntegrationsEnvelope(integrationSuccessEnvelope));

		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(
			await screen.findByText("We couldn't load your connections. Please try again.")
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

		// Recovery loads the accounts inside the Google row — expand it.
		const googleRow = screen.getByText('Google Calendar').closest('div') as HTMLElement;
		fireEvent.click(within(googleRow).getByRole('button', { name: 'Expand accounts' }));
		await screen.findByText('person@example.com');
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(2);
	});
});

describe('Google connect start', () => {
	it('navigates the browser to the server-owned OAuth start URL', () => {
		// jsdom cannot perform cross-origin navigations, and `window.location.assign`
		// is a non-configurable data property, so neither `vi.spyOn` nor a Proxy
		// trap can intercept it on the real Location. Replace `window.location` with
		// a plain object that exposes the real origin and a spied `assign`.
		const assignSpy = vi.fn();
		const realLocation = window.location;
		const fakeLocation = {
			href: realLocation.href,
			origin: realLocation.origin,
			pathname: realLocation.pathname,
			search: realLocation.search,
			hash: realLocation.hash,
			assign: assignSpy,
		};

		Object.defineProperty(window, 'location', {
			value: fakeLocation,
			writable: true,
			configurable: true,
		});

		try {
			renderSettingsRoutes(AppRoutes.SettingsConnections);
			// Google and Microsoft both expose a Connect action; this test
			// pins the Google row's OAuth start URL, so target that row.
			const googleRow = screen.getByText('Google Calendar').closest('div') as HTMLElement;
			fireEvent.click(within(googleRow).getByRole('button', { name: 'Connect' }));

			expect(assignSpy).toHaveBeenCalledOnce();
			const url = new URL(assignSpy.mock.calls[0][0] as string);
			expect(url.origin).toBe('https://api.tiler.test');
			expect(url.pathname).toBe('/api/Integrations/connect');
			expect(url.searchParams.get('provider')).toBe('google');
			// The intended return destination is the own-origin Connections page.
			expect(url.searchParams.get('redirectTarget')).toBe(
				`${pageOrigin}${AppRoutes.SettingsConnections}`
			);
		} finally {
			Object.defineProperty(window, 'location', {
				value: realLocation,
				writable: true,
				configurable: true,
			});
		}
	});
});

describe('OAuth return handling', () => {
	it('shows a success notification and refreshes integrations', async () => {
		const data = mapIntegrationsEnvelope(integrationSuccessEnvelope);
		integrationsServiceMock.getIntegrations
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce(data);
		const captured = {
			current: `?calendarConnect=success&integrationId=${integrationIdParam}`,
		};

		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=success&integrationId=${integrationIdParam}`,
			captured
		);

		expect(await screen.findByText('Connected Google Calendar')).toBeInTheDocument();
		// The refresh surfaced the newly connected integration.
		await screen.findByText('person@example.com');
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(2);
		// The transient params are cleaned with replace navigation.
		await waitFor(() => expect(captured.current).toBe(''));
	});

	it('shows a cancellation notification and does not refresh', async () => {
		renderSettingsRoutes(`${AppRoutes.SettingsConnections}?calendarConnect=declined`);

		expect(await screen.findByText('Google connection cancelled')).toBeInTheDocument();
		// Only the initial load — no unnecessary refresh after a cancellation.
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('Connected Google Calendar')).not.toBeInTheDocument();
	});

	it('shows a generic failure notification for an error result and does not refresh', async () => {
		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=error&reason=google_auth_failed`
		);

		expect(
			await screen.findByText("We couldn't connect Google. Please try again.")
		).toBeInTheDocument();
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
	});

	it('shows a Microsoft success notification when the integrationId carries a microsoft provider', async () => {
		const microsoftIntegrationId =
			'9f86d081-884c-4baf-a5e2-4b9c6d1e7f21_TCA_person@example.com_TCA_microsoft_TCA_01J9V4Q7T8Z01J9V4Q7T8Z01J9';
		const data = mapIntegrationsEnvelope(integrationSuccessEnvelope);
		integrationsServiceMock.getIntegrations
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce(data);
		const captured = {
			current: `?calendarConnect=success&integrationId=${microsoftIntegrationId}`,
		};

		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=success&integrationId=${microsoftIntegrationId}`,
			captured
		);

		expect(await screen.findByText('Connected Microsoft Calendar')).toBeInTheDocument();
		// The transient params are cleaned with replace navigation.
		await waitFor(() => expect(captured.current).toBe(''));
	});

	it('prefers the provider embedded in the integrationId over a stale started-provider marker', async () => {
		// The marker is what a Microsoft Connect click would have written; the
		// server-reported Google integrationId must win over it.
		localStorage.setItem('connections.oauth.startedProvider', 'microsoft');
		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=success&integrationId=${integrationIdParam}`
		);

		expect(await screen.findByText('Connected Google Calendar')).toBeInTheDocument();
	});

	it('shows a Microsoft cancellation notification when the round trip was started for Microsoft', async () => {
		localStorage.setItem('connections.oauth.startedProvider', 'microsoft');

		renderSettingsRoutes(`${AppRoutes.SettingsConnections}?calendarConnect=declined`);

		expect(await screen.findByText('Microsoft connection cancelled')).toBeInTheDocument();
		// Only the initial load — no unnecessary refresh after a cancellation.
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
	});

	it('shows a Microsoft failure notification when the round trip was started for Microsoft', async () => {
		localStorage.setItem('connections.oauth.startedProvider', 'microsoft');

		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=error&reason=microsoft_auth_failed`
		);

		expect(
			await screen.findByText("We couldn't connect Microsoft. Please try again.")
		).toBeInTheDocument();
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
	});

	it('ignores an unsupported calendarConnect value (no notification, no refresh) and still cleans the URL', async () => {
		const captured = { current: '?calendarConnect=weird' };

		renderSettingsRoutes(`${AppRoutes.SettingsConnections}?calendarConnect=weird`, captured);

		expect(await screen.findByText('No connected accounts yet.')).toBeInTheDocument();
		expect(screen.queryByText('Connected Google Calendar')).not.toBeInTheDocument();
		expect(screen.queryByText('Google connection cancelled')).not.toBeInTheDocument();
		expect(
			screen.queryByText("We couldn't connect Google. Please try again.")
		).not.toBeInTheDocument();
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(captured.current).toBe(''));
	});

	it('preserves unrelated query parameters while stripping the oauth parameters', async () => {
		const captured = { current: '?calendarConnect=declined&foo=bar' };

		renderSettingsRoutes(
			`${AppRoutes.SettingsConnections}?calendarConnect=declined&foo=bar`,
			captured
		);

		expect(await screen.findByText('Google connection cancelled')).toBeInTheDocument();
		await waitFor(() => expect(captured.current).toBe('?foo=bar'));
	});

	it('does not notify or refresh on a plain (clean-URL) page load', async () => {
		renderSettingsRoutes(AppRoutes.SettingsConnections);

		expect(await screen.findByText('No connected accounts yet.')).toBeInTheDocument();
		expect(integrationsServiceMock.getIntegrations).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('Connected Google Calendar')).not.toBeInTheDocument();
		expect(screen.queryByText('Google connection cancelled')).not.toBeInTheDocument();
		expect(
			screen.queryByText("We couldn't connect Google. Please try again.")
		).not.toBeInTheDocument();
	});
});
