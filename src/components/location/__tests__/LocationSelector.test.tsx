import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import en from '@/i18n/locales/en.json';
import {
	locationService,
	LOCATION_STORAGE_KEY,
	LOCATION_REFRESH_INTERVAL,
} from '@/services/locationService';
import type { EventLocation } from '@/core/common/types/schedule';
import LocationSelector, { LocationPicker } from '../LocationSelector';

const i18n = createInstance();
const place: EventLocation = {
	id: 'office',
	address: '350 Fifth Avenue, New York, NY',
	description: 'Office',
	latitude: 40.7484,
	longitude: -73.9857,
	isVerified: true,
	isDefault: false,
	isNull: false,
	thirdPartyId: 'office',
	source: 'google',
	nickname: 'Office',
	userId: null,
};
let getPosition: ReturnType<typeof vi.fn>;
let search: MockInstance<typeof locationService.searchAddresses>;
let permissionStatus: {
	state: PermissionState;
	addEventListener: ReturnType<typeof vi.fn>;
	removeEventListener: ReturnType<typeof vi.fn>;
};

beforeAll(async () => {
	await i18n.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		resources: { en: { translation: en } },
		interpolation: { escapeValue: false },
	});
});

beforeEach(() => {
	locationService.initialize();
	locationService.cancelDetection();
	locationService.store.setState(locationService.store.getInitialState(), true);
	getPosition = vi.fn();
	permissionStatus = { state: 'prompt', addEventListener: vi.fn(), removeEventListener: vi.fn() };
	Object.defineProperty(navigator, 'geolocation', {
		configurable: true,
		value: { getCurrentPosition: getPosition },
	});
	Object.defineProperty(navigator, 'permissions', {
		configurable: true,
		value: { query: vi.fn().mockResolvedValue(permissionStatus) },
	});
	search = vi.spyOn(locationService, 'searchAddresses').mockResolvedValue([place]);
});

afterEach(() => {
	cleanup();
	locationService.cancelDetection();
	vi.restoreAllMocks();
});

function renderSelector(compact = false) {
	return render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider theme={darkTheme}>
				<LocationSelector compact={compact} />
				<LocationPicker />
			</ThemeProvider>
		</I18nextProvider>
	);
}

async function openPanel() {
	const user = userEvent.setup();
	await user.click(screen.getByRole('button', { name: 'Choose an address' }));
	return { user, panel: within(screen.getByRole('dialog', { name: 'Location' })) };
}

describe('shared location selector', () => {
	it('does not request device location on mount, opening, or typing an address', async () => {
		renderSelector();
		const { user, panel } = await openPanel();
		await user.type(panel.getByRole('searchbox'), 'NYC');
		expect(panel.getByText(/Enter at least 4 characters/)).toBeVisible();
		expect(search).not.toHaveBeenCalled();
		await user.type(panel.getByRole('searchbox'), ' Office');
		await panel.findByRole('button', { name: /350 Fifth Avenue.*Use this address/ });
		expect(getPosition).not.toHaveBeenCalled();
	});

	it('saves a matched address on the second tap, without another confirmation screen', async () => {
		renderSelector(true);
		const { user, panel } = await openPanel();
		await user.type(panel.getByRole('searchbox'), 'Office');
		await user.click(
			await panel.findByRole('button', { name: /350 Fifth Avenue.*Use this address/ })
		);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Location: 350 Fifth Avenue/ })).toBeVisible();
		expect(JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY)!).active.location).toBe(
			place.address
		);
	});

	it('keeps the confirmed address when an edited draft is cancelled', async () => {
		locationService.previewAddress(place);
		locationService.confirmCandidate();
		renderSelector();
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /Location: 350 Fifth Avenue/ }));
		await user.type(screen.getByRole('searchbox'), 'Boston');
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect((await locationService.getCurrentLocation()).location).toBe(place.address);
	});

	it('shows unresolved results without allowing them to become active', async () => {
		search.mockResolvedValue([{ ...place, isVerified: false, latitude: 0, longitude: 0 }]);
		renderSelector();
		const { user, panel } = await openPanel();
		await user.type(panel.getByRole('searchbox'), 'Office');
		expect(await panel.findByRole('button', { name: /Address not matched/ })).toBeDisabled();
		expect(panel.queryByRole('button', { name: 'Use this address' })).not.toBeInTheDocument();
	});

	it('distinguishes no matches from a failed search and supports retry', async () => {
		search.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([]);
		renderSelector();
		const { user, panel } = await openPanel();
		await user.type(panel.getByRole('searchbox'), 'Office');
		expect(await panel.findByText(/Couldn't search/)).toBeVisible();
		await user.click(panel.getByRole('button', { name: 'Retry' }));
		expect(await panel.findByText(/No matches/)).toBeVisible();
	});

	it('ignores a slow response from an earlier search', async () => {
		let completeOld!: (locations: EventLocation[]) => void;
		search
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						completeOld = resolve;
					})
			)
			.mockResolvedValueOnce([{ ...place, id: 'boston', address: 'Boston, MA' }]);
		renderSelector();
		const { user, panel } = await openPanel();
		await user.type(panel.getByRole('searchbox'), 'Office');
		await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
		await user.clear(panel.getByRole('searchbox'));
		await user.type(panel.getByRole('searchbox'), 'Boston');
		await panel.findByRole('button', { name: /Boston, MA.*Use this address/ });
		await act(async () => completeOld([place]));
		expect(
			panel.queryByRole('button', { name: /350 Fifth Avenue.*Use this address/ })
		).not.toBeInTheDocument();
	});

	it('finds and confirms a device address in two app taps, with permission context and progress', async () => {
		let finish!: PositionCallback;
		getPosition.mockImplementation((success: PositionCallback) => {
			finish = success;
		});
		vi.spyOn(locationService, 'reverseGeocode').mockResolvedValue('Boston, MA');
		renderSelector(true);
		const user = userEvent.setup();
		const useCurrent = screen.getByRole('button', { name: 'Use current location' });
		expect(useCurrent).toHaveAttribute('title', 'Your browser may ask for location access.');
		expect(getPosition).not.toHaveBeenCalled();
		await user.click(useCurrent);
		const panel = within(screen.getByRole('dialog', { name: 'Location' }));
		expect(panel.getByText('Waiting for browser location access…')).toBeVisible();
		await act(async () =>
			finish({
				coords: { latitude: 42.36, longitude: -71.06, accuracy: 2000 },
			} as GeolocationPosition)
		);
		expect(await panel.findByText('Near Boston, MA')).toBeVisible();
		expect(panel.getByText(/2,000 m accuracy/)).toBeVisible();
		expect(panel.queryByRole('searchbox')).not.toBeInTheDocument();
		expect(panel.getByRole('button', { name: 'Use this address' })).toHaveFocus();
		expect(locationService.store.getState().active).toBeNull();
		await user.click(panel.getByRole('button', { name: 'Use this address' }));
		expect(screen.getByRole('button', { name: /Location: Boston, MA/ })).toBeVisible();
	});

	it('replaces a saved address with a device estimate in two app taps and keeps the old address until confirmed', async () => {
		locationService.previewAddress(place);
		locationService.confirmCandidate();
		permissionStatus.state = 'granted';
		getPosition.mockImplementation((success: PositionCallback) =>
			success({
				coords: { latitude: 42.36, longitude: -71.06, accuracy: 100 },
			} as GeolocationPosition)
		);
		vi.spyOn(locationService, 'reverseGeocode').mockResolvedValue('Boston, MA');
		renderSelector();
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: 'Use current location' }));
		const panel = within(screen.getByRole('dialog', { name: 'Location' }));
		await panel.findByText('Near Boston, MA');
		expect((await locationService.getCurrentLocation()).location).toBe(place.address);
		expect(panel.getByText(`Using: ${place.address}`)).toBeVisible();
		await user.click(panel.getByRole('button', { name: 'Use this address' }));
		expect((await locationService.getCurrentLocation()).location).toBe('Boston, MA');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('provides recovery guidance for denied permission without making another device request', async () => {
		permissionStatus.state = 'denied';
		renderSelector();
		const { user, panel } = await openPanel();
		await user.click(panel.getByRole('button', { name: 'Use current location' }));
		expect(await panel.findByText(/Location is blocked/)).toBeVisible();
		expect(getPosition).not.toHaveBeenCalled();
	});

	it('explains continuing without location and remembers the decision', async () => {
		renderSelector();
		const { user, panel } = await openPanel();
		expect(panel.getAllByText(/Travel suggestions may use defaults/).length).toBeGreaterThan(0);
		await user.click(panel.getByRole('button', { name: 'Continue without location' }));
		expect(locationService.hasSelectionDecision()).toBe(true);
		expect(locationService.store.getState().withoutLocation).toBe(true);
		expect(locationService.toApiFormat(await locationService.getCurrentLocation())).toEqual({
			userLatitude: '',
			userLongitude: '',
			userLocationVerified: 'false',
		});
	});

	it('restores focus after Escape and traps Tab inside the panel', async () => {
		renderSelector();
		const trigger = screen.getByRole('button', { name: 'Choose an address' });
		const { user, panel } = await openPanel();
		const close = panel.getByRole('button', { name: 'Close location selector' });
		expect(panel.getByRole('searchbox')).toHaveFocus();
		act(() => close.focus());
		await user.tab({ shift: true });
		expect(panel.getByRole('button', { name: 'Continue without location' })).toHaveFocus();
		await user.tab();
		expect(close).toHaveFocus();
		await user.keyboard('{Escape}');
		expect(trigger).toHaveFocus();
	});

	it('surfaces a wake-time device update without changing the confirmed location', async () => {
		locationService.previewAddress(place);
		locationService.confirmCandidate();
		locationService.store.setState({
			active: {
				...locationService.store.getState().active!,
				source: 'device',
				checkedAt: Date.now(),
			},
		});
		permissionStatus.state = 'granted';
		getPosition.mockImplementation((success: PositionCallback) =>
			success({
				coords: { latitude: 42.36, longitude: -71.06, accuracy: 500 },
			} as GeolocationPosition)
		);
		vi.spyOn(locationService, 'reverseGeocode').mockResolvedValue('Boston, MA');
		renderSelector();
		await act(async () => {
			locationService.store.setState({
				active: {
					...locationService.store.getState().active!,
					checkedAt: Date.now() - LOCATION_REFRESH_INTERVAL - 1,
				},
			});
		});
		fireEvent.focus(window);
		expect(await screen.findByText('New location · Review')).toBeVisible();
		expect(screen.getByRole('button', { name: /Location: 350 Fifth Avenue/ })).toBeVisible();
	});
});
