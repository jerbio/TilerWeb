import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes as BrowserRoutes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, ThemeMode } from '@/core/theme/ThemeProvider';
import i18n from '@/i18n/config';
import { Routes as AppRoutes } from '@/core/constants/routes';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import {
	mapCalendarItemsEnvelope,
	mapIntegrationCalendarItem,
	mapIntegrationLocation,
	mapIntegrationsEnvelope,
} from '@/core/integrations/mapping';
import { TilerResponseError } from '@/core/common/types/errors';
import ServerError from '@/core/error/server';
import type { EventLocation } from '@/core/common/types/schedule';
import {
	calendarDefaultLocationSuccessEnvelope,
	calendarItemToggleEnvelope,
	calendarItemsEnvelope,
	integrationDeleteErrorEnvelope,
	integrationDeleteProviderFailureEnvelope,
	integrationSuccessEnvelope,
} from '@/test/fixtures/integrationResponses';
import SettingsLayout from './SettingsLayout';
import ConnectionsSettings from './ConnectionsSettings';
import ConnectionsDetailSettings from './ConnectionsDetailSettings';

// ---------------------------------------------------------------------------
// Phase 4 (P4-3) tests: connection detail page.
//
// The service layer, global auth state, environment config and analytics are
// mocked; the page renders inside the real SettingsLayout router together
// with the real connections list page, so back/disconnect navigation is
// exercised against production routing. Text assertions use the en.json
// values (the i18n config is the real one).
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

const integrationsServiceMock = vi.hoisted(() => ({
	getIntegrations: vi.fn(),
	getCalendarItems: vi.fn(),
	toggleCalendarItem: vi.fn(),
	disconnectIntegration: vi.fn(),
	setCalendarDefaultLocation: vi.fn(),
}));

const scheduleServiceMock = vi.hoisted(() => ({
	searchLocations: vi.fn(),
}));

vi.mock('@/services', () => ({
	__esModule: true,
	integrationsService: integrationsServiceMock,
	scheduleService: scheduleServiceMock,
}));

const envStore = vi.hoisted(() => ({ baseUrl: 'https://api.tiler.test/' }));
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => envStore.baseUrl,
	},
}));

const analyticsMock = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock('@/core/util/analytics', () => ({
	__esModule: true,
	default: analyticsMock,
}));

const integrationId = 'integration-1';
const accountEmail = 'person@example.com';
const integrationData = mapIntegrationsEnvelope(integrationSuccessEnvelope);
const calendarData = mapCalendarItemsEnvelope(calendarItemsEnvelope);

// Renders the real Settings router with the detail route as the entry point.
const renderDetailRoute = (integrationIdParam = integrationId) =>
	render(
		<MemoryRouter initialEntries={[AppRoutes.SettingsConnectionDetail(integrationIdParam)]}>
			<I18nextProvider i18n={i18n}>
				<ThemeProvider defaultTheme={ThemeMode.Dark}>
					<BrowserRoutes>
						<Route element={<ProtectedRoute />}>
							<Route path={AppRoutes.Settings} element={<SettingsLayout />}>
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

// Wait for the ready state (provider header rendered) before interacting.
const waitForDetailReady = async () => screen.findByRole('heading', { name: 'Google Calendar' });

beforeEach(() => {
	authStore.isAuthenticated = true;
	authStore.isAuthLoading = false;
	envStore.baseUrl = 'https://api.tiler.test/';
	integrationsServiceMock.getIntegrations.mockReset();
	integrationsServiceMock.getIntegrations.mockResolvedValue(integrationData);
	integrationsServiceMock.getCalendarItems.mockReset();
	integrationsServiceMock.getCalendarItems.mockResolvedValue(calendarData);
	integrationsServiceMock.toggleCalendarItem.mockReset();
	integrationsServiceMock.toggleCalendarItem.mockResolvedValue(null);
	integrationsServiceMock.disconnectIntegration.mockReset();
	integrationsServiceMock.disconnectIntegration.mockResolvedValue(undefined);
	integrationsServiceMock.setCalendarDefaultLocation.mockReset();
	integrationsServiceMock.setCalendarDefaultLocation.mockResolvedValue(
		mapIntegrationLocation(calendarDefaultLocationSuccessEnvelope.Content)
	);
	scheduleServiceMock.searchLocations.mockReset();
	scheduleServiceMock.searchLocations.mockResolvedValue([]);
	analyticsMock.trackEvent.mockReset();
});

describe('ConnectionsDetailSettings', () => {
	describe('loading and ready states', () => {
		it('shows a loading state until the account and calendars are resolved', () => {
			integrationsServiceMock.getIntegrations.mockReturnValueOnce(new Promise(() => {}));

			renderDetailRoute();

			expect(screen.getByText('Loading connection...')).toBeInTheDocument();
			expect(
				screen.queryByRole('heading', { name: 'Google Calendar' })
			).not.toBeInTheDocument();
		});

		it('shows the provider header, calendar toggles and the disconnect section once loaded', async () => {
			renderDetailRoute();

			expect(await waitForDetailReady()).toBeInTheDocument();
			// The email appears in the account header and in the breadcrumb.
			expect(screen.getAllByText(accountEmail).length).toBe(2);
			expect(screen.getByRole('heading', { name: 'Calendars' })).toBeInTheDocument();
			expect(screen.getByText('Choose which calendars Tiler can read.')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Work — Enabled' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Personal — Disabled' })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Disconnect' })).toBeInTheDocument();
			expect(
				screen.getByText(
					'Disconnecting this account stops Tiler from reading its calendars.'
				)
			).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
			// Load success is tracked with the allowed analytics properties only.
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection detail loaded',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('shows the empty state when the account exposes no calendars', async () => {
			integrationsServiceMock.getCalendarItems.mockResolvedValueOnce([]);

			renderDetailRoute();

			expect(await waitForDetailReady()).toBeInTheDocument();
			expect(
				screen.getByText('No calendars available for this account.')
			).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Work/ })).not.toBeInTheDocument();
		});
	});

	describe('calendar visibility toggles', () => {
		it('flips optimistically, reconciles with the server echo and tracks the change', async () => {
			// The server echoes the updated item (Work is now deselected).
			integrationsServiceMock.toggleCalendarItem.mockResolvedValueOnce(
				mapIntegrationCalendarItem(calendarItemToggleEnvelope.Content)
			);

			renderDetailRoute();

			const workToggle = await screen.findByRole('button', {
				name: 'Work — Enabled',
			});
			fireEvent.click(workToggle);

			// The optimistic flip renders before the round trip settles.
			expect(screen.getByRole('button', { name: 'Work — Disabled' })).toBeInTheDocument();
			expect(integrationsServiceMock.toggleCalendarItem).toHaveBeenCalledTimes(1);
			expect(integrationsServiceMock.toggleCalendarItem).toHaveBeenCalledWith({
				integrationId,
				calendarItemId: 'calendar-id',
				isSelected: false,
			});

			// The server echo settles into the same deselected state and the
			// other calendar is untouched.
			await waitFor(() =>
				expect(integrationsServiceMock.toggleCalendarItem).toHaveReturnedTimes(1)
			);
			expect(screen.getByRole('button', { name: 'Work — Disabled' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Personal — Disabled' })).toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Calendar visibility toggled',
				'Google',
				undefined,
				{ provider: 'Google', selected: false }
			);
		});

		it('lets the authoritative server copy win over the optimistic flip', async () => {
			// The server keeps the calendar selected (the optimistic flip loses
			// the race): the response must restore the original state.
			integrationsServiceMock.toggleCalendarItem.mockResolvedValueOnce(calendarData[0]);

			renderDetailRoute();

			const workToggle = await screen.findByRole('button', {
				name: 'Work — Enabled',
			});
			fireEvent.click(workToggle);

			// Optimistic flip renders first...
			expect(screen.getByRole('button', { name: 'Work — Disabled' })).toBeInTheDocument();
			// ...and the server copy restores the original state.
			expect(
				await screen.findByRole('button', { name: 'Work — Enabled' })
			).toBeInTheDocument();
		});

		it('rolls back the optimistic flip and shows a transient error notice on failure', async () => {
			integrationsServiceMock.toggleCalendarItem.mockRejectedValueOnce(new Error('boom'));

			renderDetailRoute();

			const workToggle = await screen.findByRole('button', {
				name: 'Work — Enabled',
			});
			fireEvent.click(workToggle);

			// The optimistic flip renders before the failure is observed.
			expect(screen.getByRole('button', { name: 'Work — Disabled' })).toBeInTheDocument();

			// The original state is restored and the failure notice appears.
			expect(
				await screen.findByRole('button', { name: 'Work — Enabled' })
			).toBeInTheDocument();
			expect(screen.getByRole('alert')).toHaveTextContent(
				"We couldn't update this calendar. Please try again."
			);
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Calendar visibility toggle failed',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('auto-dismisses the toggle error notice after a few seconds', async () => {
			integrationsServiceMock.toggleCalendarItem.mockRejectedValueOnce(new Error('boom'));

			renderDetailRoute();
			const workToggle = await screen.findByRole('button', {
				name: 'Work — Enabled',
			});

			// Freeze time before the click so the auto-dismiss timer is faked.
			vi.useFakeTimers();
			fireEvent.click(workToggle);
			// The mocked rejection settles through microtasks (not faked), so a
			// few hops flush the rollback, the notice and the timer setup.
			await act(async () => {
				await Promise.resolve();
				await Promise.resolve();
			});

			expect(screen.getByRole('alert')).toBeInTheDocument();
			act(() => {
				vi.advanceTimersByTime(5100);
			});
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it('disables the pending toggle while the round trip is in flight', async () => {
			integrationsServiceMock.toggleCalendarItem.mockReturnValueOnce(new Promise(() => {}));

			renderDetailRoute();

			const workToggle = await screen.findByRole('button', {
				name: 'Work — Enabled',
			});
			fireEvent.click(workToggle);

			// The clicked toggle flips optimistically and stays disabled until
			// the round trip settles, while other toggles remain interactive.
			expect(screen.getByRole('button', { name: 'Work — Disabled' })).toBeDisabled();
			expect(screen.getByRole('button', { name: 'Personal — Disabled' })).not.toBeDisabled();
			// A second click on the pending toggle is ignored.
			fireEvent.click(screen.getByRole('button', { name: 'Work — Disabled' }));
			expect(integrationsServiceMock.toggleCalendarItem).toHaveBeenCalledTimes(1);
		});
	});

	describe('load failures and retry', () => {
		it('shows a load error with a Retry action and recovers on retry', async () => {
			integrationsServiceMock.getIntegrations
				.mockRejectedValueOnce(new Error('boom'))
				.mockResolvedValueOnce(integrationData);

			renderDetailRoute();

			expect(
				await screen.findByText("We couldn't load this connection. Please try again.")
			).toBeInTheDocument();
			// A transient failure keeps the page: no not-found, no navigation.
			expect(
				screen.queryByText('This connection is no longer available.')
			).not.toBeInTheDocument();

			fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

			expect(await waitForDetailReady()).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Work — Enabled' })).toBeInTheDocument();
		});
	});

	describe('not-found states', () => {
		it('maps a plain 404 to the not-found state without a Retry action', async () => {
			integrationsServiceMock.getIntegrations.mockRejectedValueOnce(
				new ServerError('Not Found', '/api/integrations', undefined, 404)
			);

			renderDetailRoute();

			expect(
				await screen.findByText('This connection is no longer available.')
			).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Back to Connections' })).toBeInTheDocument();
		});

		it('maps an empty integration list to the not-found state', async () => {
			integrationsServiceMock.getIntegrations.mockResolvedValueOnce([]);

			renderDetailRoute();

			expect(
				await screen.findByText('This connection is no longer available.')
			).toBeInTheDocument();
		});

		it('navigates back to the connections list from the not-found state', async () => {
			integrationsServiceMock.getIntegrations
				.mockResolvedValueOnce([]) // detail load: the row is already gone
				.mockResolvedValueOnce(integrationData); // list load after navigation

			renderDetailRoute();

			await screen.findByText('This connection is no longer available.');
			fireEvent.click(screen.getByRole('button', { name: 'Back to Connections' }));

			// The list page renders (its h1 is 'Connections').
			expect(await screen.findByRole('heading', { name: 'Connections' })).toBeInTheDocument();
		});
	});

	describe('disconnect', () => {
		const openConfirmModal = async (): Promise<HTMLElement> => {
			await waitForDetailReady();
			fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
			const heading = await screen.findByRole('heading', {
				name: 'Disconnect this account?',
			});
			// The Modal portals its content to document.body while the page's
			// own "Disconnect" section button stays mounted underneath, so
			// global button queries are ambiguous while the modal is open.
			// Return the modal container (the <header>'s parent) so callers
			// can scope their footer queries to it.
			const headerEl = heading.closest('header');
			if (!headerEl || !headerEl.parentElement) {
				throw new Error('modal container not found');
			}
			return headerEl.parentElement;
		};

		it('opens the confirmation modal and closes it again via Cancel', async () => {
			renderDetailRoute();
			await openConfirmModal();

			expect(
				screen.getByText('Tiler will no longer be able to read person@example.com.')
			).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

			// The modal unmounts, no disconnect call went out, and the page
			// remains fully interactive.
			expect(
				screen.queryByRole('heading', { name: 'Disconnect this account?' })
			).not.toBeInTheDocument();
			expect(integrationsServiceMock.disconnectIntegration).not.toHaveBeenCalled();
			expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
		});

		it('disables the modal footer while the provider call is in flight', async () => {
			integrationsServiceMock.disconnectIntegration.mockReturnValueOnce(
				new Promise(() => {})
			);

			renderDetailRoute();
			const modal = await openConfirmModal();
			fireEvent.click(within(modal).getByRole('button', { name: 'Disconnect' }));

			// Pending state: the confirm label swaps and both footer buttons
			// lock while the round trip is in flight.
			expect(await screen.findByText('Disconnecting...')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Disconnecting...' })).toBeDisabled();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
			expect(integrationsServiceMock.disconnectIntegration).toHaveBeenCalledTimes(1);
			expect(integrationsServiceMock.disconnectIntegration).toHaveBeenCalledWith({
				integrationId,
				provider: 'Google',
			});
			// The request is tracked with the allowed analytics properties only.
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Disconnect requested',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('navigates back to the connections list after a successful disconnect', async () => {
			integrationsServiceMock.disconnectIntegration.mockResolvedValueOnce(undefined);

			renderDetailRoute();
			const modal = await openConfirmModal();
			// The detail load already consumed the default integrationData;
			// queue the empty list for the list page's load that follows the
			// navigation back.
			integrationsServiceMock.getIntegrations.mockResolvedValueOnce([]);
			fireEvent.click(within(modal).getByRole('button', { name: 'Disconnect' }));

			expect(await screen.findByRole('heading', { name: 'Connections' })).toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Disconnect completed',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('keeps the modal open with the provider message when the provider refuses the delete', async () => {
			// The server answers HTTP 200 with Error.Code 10000009; the
			// normalized TilerResponseError code (not the HTTP status) drives
			// this branch.
			integrationsServiceMock.disconnectIntegration.mockRejectedValueOnce(
				TilerResponseError.fromApiCodeResponse(
					integrationDeleteProviderFailureEnvelope.Error!
				)
			);

			renderDetailRoute();
			const modal = await openConfirmModal();
			fireEvent.click(within(modal).getByRole('button', { name: 'Disconnect' }));

			expect(await screen.findByRole('alert')).toHaveTextContent(
				"The calendar provider couldn't be disconnected right now. Please try again in a moment."
			);
			// Still on the detail page, modal still open, ready to retry.
			expect(
				screen.getByRole('heading', { name: 'Disconnect this account?' })
			).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Google Calendar' })).toBeInTheDocument();
			expect(screen.queryByRole('heading', { name: 'Connections' })).not.toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Disconnect failed',
				'Google',
				undefined,
				{ provider: 'Google', providerError: true }
			);
		});

		it('shows the generic failure message for any other disconnect error', async () => {
			integrationsServiceMock.disconnectIntegration.mockRejectedValueOnce(
				TilerResponseError.fromApiCodeResponse(integrationDeleteErrorEnvelope.Error!)
			);

			renderDetailRoute();
			const modal = await openConfirmModal();
			fireEvent.click(within(modal).getByRole('button', { name: 'Disconnect' }));

			expect(await screen.findByRole('alert')).toHaveTextContent(
				"We couldn't disconnect this account. Please try again."
			);
			// Still on the detail page, modal still open, ready to retry.
			expect(
				screen.getByRole('heading', { name: 'Disconnect this account?' })
			).toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Disconnect failed',
				'Google',
				undefined,
				{ provider: 'Google', providerError: false }
			);
		});

		it('treats a 404 during disconnect as completed and navigates back', async () => {
			integrationsServiceMock.disconnectIntegration.mockRejectedValueOnce(
				new ServerError('Not Found', '/api/integrations', undefined, 404)
			);

			renderDetailRoute();
			const modal = await openConfirmModal();
			// As above: the empty list is queued for the list page's load
			// after the navigation, not the settled detail load.
			integrationsServiceMock.getIntegrations.mockResolvedValueOnce([]);
			fireEvent.click(within(modal).getByRole('button', { name: 'Disconnect' }));

			expect(await screen.findByRole('heading', { name: 'Connections' })).toBeInTheDocument();
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Disconnect completed',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});
	});

	describe('default location', () => {
		// A searched location distinct from the stored fixture copy so the
		// optimistic update, the result row and the server copy can be told
		// apart by their addresses.
		const location1: EventLocation = {
			id: 'location-1',
			description: 'Oak Street Café',
			address: '456 Oak Ave, New York, NY',
			longitude: -73.9845,
			latitude: 40.7495,
			isVerified: true,
			isDefault: false,
			isNull: false,
			thirdPartyId: 'google-place-id-2',
			userId: null,
			source: 'google',
			nickname: '',
		};

		const locationInput = () =>
			screen.getByRole('textbox', { name: 'Search for a location...' });

		const resultButton = () => screen.getByRole('button', { name: /Oak Street Café/ });

		// Clicks the "Change location" action and waits for the inline
		// editor to expand inside the "Default location" section.
		const openPicker = async (): Promise<void> => {
			await waitForDetailReady();
			fireEvent.click(screen.getByRole('button', { name: 'Change location' }));
			await screen.findByRole('heading', { name: 'Choose a default location' });
		};

		// Advances the faked 300 ms search debounce and flushes the mocked
		// round trip through a few microtask hops.
		const flushSearch = async () => {
			await act(async () => {
				vi.advanceTimersByTime(300);
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
			});
		};

		const flushSave = async () => {
			await act(async () => {
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
			});
		};

		it('shows the stored default location and a change action in the ready state', async () => {
			renderDetailRoute();

			expect(await waitForDetailReady()).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Default location' })).toBeInTheDocument();
			expect(
				screen.getByText('Tiler uses this location for new events from this account.')
			).toBeInTheDocument();
			// The stored address is surfaced; the server's cal-default-location-*
			// description marker is not, and the empty state is hidden.
			expect(screen.getByTitle('123 Main St')).toBeInTheDocument();
			expect(screen.queryByText('No default location set.')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Change location' })).toBeInTheDocument();
		});

		it('shows the empty state when no default location is stored', async () => {
			const noLocationData = mapIntegrationsEnvelope({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [
					{
						id: 'integration-id',
						provider: 'Google',
						email: accountEmail,
						location: null,
						calendarItems: [
							{ id: 'calendar-id', name: 'Work', isEnabled: true, isSelected: true },
						],
					},
				],
			});
			integrationsServiceMock.getIntegrations.mockResolvedValueOnce(noLocationData);

			renderDetailRoute();

			expect(await waitForDetailReady()).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Default location' })).toBeInTheDocument();
			expect(screen.getByText('No default location set.')).toBeInTheDocument();
			expect(screen.queryByTitle('123 Main St')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Change location' })).toBeInTheDocument();
		});

		it('expands the inline editor with a search field and a cancel action', async () => {
			renderDetailRoute();
			await openPicker();

			// Fresh editor: the search field is present and enabled, the
			// cancel action is available, and the searching / no-results
			// states are not.
			expect(locationInput()).not.toBeDisabled();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
			expect(screen.queryByText('Searching locations...')).not.toBeInTheDocument();
			expect(screen.queryByText('No matching locations found.')).not.toBeInTheDocument();
			expect(scheduleServiceMock.searchLocations).not.toHaveBeenCalled();
			// The editor expands in place of the button: the stored location
			// stays visible above it and the button is gone.
			expect(screen.getByTitle('123 Main St')).toBeInTheDocument();
			expect(
				screen.queryByRole('button', { name: 'Change location' })
			).not.toBeInTheDocument();
		});

		it('debounces the search and shows the searching state until it settles', async () => {
			scheduleServiceMock.searchLocations.mockResolvedValueOnce([location1]);

			renderDetailRoute();
			await openPicker();

			// Freeze time before typing so the 300 ms debounce is faked.
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Oak' } });

			// The query crossed the 3-character minimum: the searching state
			// shows, but the debounced search has not fired yet.
			expect(scheduleServiceMock.searchLocations).not.toHaveBeenCalled();
			expect(screen.getByText('Searching locations...')).toBeInTheDocument();

			await flushSearch();

			expect(scheduleServiceMock.searchLocations).toHaveBeenCalledTimes(1);
			expect(scheduleServiceMock.searchLocations).toHaveBeenCalledWith('Oak');
			expect(screen.queryByText('Searching locations...')).not.toBeInTheDocument();
			// Both the description and the address of the result render.
			expect(screen.getByText('Oak Street Café')).toBeInTheDocument();
			expect(screen.getByText('456 Oak Ave, New York, NY')).toBeInTheDocument();
		});

		it('shows no results when the search finds nothing', async () => {
			scheduleServiceMock.searchLocations.mockResolvedValueOnce([]);

			renderDetailRoute();
			await openPicker();
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Nowhere' } });
			await flushSearch();

			expect(screen.getByText('No matching locations found.')).toBeInTheDocument();
			expect(screen.queryByText('Searching locations...')).not.toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection location search completed',
				'Google',
				undefined,
				expect.objectContaining({ provider: 'Google', resultCount: 0 })
			);
		});

		it('treats a failed search like no results', async () => {
			scheduleServiceMock.searchLocations.mockRejectedValueOnce(new Error('boom'));

			renderDetailRoute();
			await openPicker();
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Broken' } });
			await flushSearch();

			expect(screen.getByText('No matching locations found.')).toBeInTheDocument();
			expect(screen.queryByText('Searching locations...')).not.toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection location search failed',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('selecting a location saves it, lets the server copy win and collapses the editor', async () => {
			scheduleServiceMock.searchLocations.mockResolvedValueOnce([location1]);

			renderDetailRoute();
			await openPicker();
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Oak' } });
			await flushSearch();
			fireEvent.click(resultButton());
			await flushSave();

			// The saved server copy (456 Oak Ave) wins and the editor
			// collapses back to the "Change location" action.
			expect(screen.getByTitle('456 Oak Ave')).toBeInTheDocument();
			expect(screen.queryByTitle('456 Oak Ave, New York, NY')).not.toBeInTheDocument();
			expect(
				screen.queryByRole('heading', { name: 'Choose a default location' })
			).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Change location' })).toBeInTheDocument();
			// The server's internal description marker is never surfaced.
			expect(
				screen.queryByText('cal-default-location-9c1d2e3f-0000-0000-0000-000000000000')
			).not.toBeInTheDocument();
			expect(integrationsServiceMock.setCalendarDefaultLocation).toHaveBeenCalledTimes(1);
			expect(integrationsServiceMock.setCalendarDefaultLocation).toHaveBeenCalledWith({
				integrationId,
				location: mapIntegrationLocation(location1),
			});
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection location save requested',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection location saved',
				'Google',
				undefined,
				{ provider: 'Google' }
			);
		});

		it('keeps the editor open with an error on save failure and retries', async () => {
			scheduleServiceMock.searchLocations.mockResolvedValue([location1]);
			integrationsServiceMock.setCalendarDefaultLocation
				.mockRejectedValueOnce(new Error('boom'))
				.mockResolvedValueOnce(
					mapIntegrationLocation(calendarDefaultLocationSuccessEnvelope.Content)
				);

			renderDetailRoute();
			await openPicker();
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Oak' } });
			await flushSearch();
			fireEvent.click(resultButton());
			await flushSave();

			// Failure: the error surfaces, the previous location is restored
			// and the editor stays open with the results intact for a retry.
			expect(
				screen.getByText("We couldn't save this location. Please try again.")
			).toBeInTheDocument();
			expect(
				screen.getByRole('heading', { name: 'Choose a default location' })
			).toBeInTheDocument();
			expect(screen.getByTitle('123 Main St')).toBeInTheDocument();
			expect(resultButton()).toBeInTheDocument();
			expect(screen.queryByText('Saving location...')).not.toBeInTheDocument();
			expect(analyticsMock.trackEvent).toHaveBeenCalledWith(
				'Connections',
				'Connection location save failed',
				'Google',
				undefined,
				{ provider: 'Google' }
			);

			// Retry: the second attempt succeeds and collapses the editor.
			fireEvent.click(resultButton());
			await flushSave();
			expect(screen.getByTitle('456 Oak Ave')).toBeInTheDocument();
			expect(
				screen.queryByRole('heading', { name: 'Choose a default location' })
			).not.toBeInTheDocument();
			expect(integrationsServiceMock.setCalendarDefaultLocation).toHaveBeenCalledTimes(2);
		});

		it('disables the search field and results while a save is in flight', async () => {
			scheduleServiceMock.searchLocations.mockResolvedValueOnce([location1]);
			integrationsServiceMock.setCalendarDefaultLocation.mockReturnValueOnce(
				new Promise(() => {})
			);

			renderDetailRoute();
			await openPicker();
			vi.useFakeTimers();
			fireEvent.change(locationInput(), { target: { value: 'Oak' } });
			await flushSearch();
			fireEvent.click(resultButton());

			// The saving state shows and the inputs are frozen; the save was
			// requested exactly once.
			expect(screen.getByText('Saving location...')).toBeInTheDocument();
			expect(locationInput()).toBeDisabled();
			expect(resultButton()).toBeDisabled();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
			expect(integrationsServiceMock.setCalendarDefaultLocation).toHaveBeenCalledTimes(1);
		});

		it('discards changes when the editor is cancelled without selecting', async () => {
			renderDetailRoute();
			await openPicker();
			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

			expect(
				screen.queryByRole('heading', { name: 'Choose a default location' })
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole('textbox', { name: 'Search for a location...' })
			).not.toBeInTheDocument();
			expect(integrationsServiceMock.setCalendarDefaultLocation).not.toHaveBeenCalled();
			// The section is untouched.
			expect(screen.getByTitle('123 Main St')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Change location' })).toBeInTheDocument();
		});
	});
});
