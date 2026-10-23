import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationApi } from '@/api/locationApi';
import type { EventLocation } from '@/core/common/types/schedule';
import { LocationDecision } from '@/core/constants/location';
import {
	LocationService,
	LOCATION_REFRESH_INTERVAL,
	LOCATION_STORAGE_KEY,
} from '../locationService';

const place: EventLocation = {
	id: 'nyc',
	address: '350 Fifth Avenue, New York, NY',
	description: 'Empire State Building',
	latitude: 40.7484,
	longitude: -73.9857,
	isVerified: true,
	isDefault: false,
	isNull: false,
	thirdPartyId: 'nyc',
	userId: null,
	source: 'google',
	nickname: 'Empire State Building',
};

let service: LocationService;
let getPosition: ReturnType<typeof vi.fn>;
let permissionQuery: ReturnType<typeof vi.fn>;

function commitAddress() {
	service.previewAddress(place);
	service.confirmCandidate();
}

function successfulDetection() {
	getPosition.mockImplementation((success: PositionCallback) =>
		success({
			coords: { latitude: 42.36, longitude: -71.06, accuracy: 2000 },
			timestamp: Date.now(),
		} as GeolocationPosition)
	);
	vi.spyOn(service, 'reverseGeocode').mockResolvedValue('Boston, Massachusetts, USA');
}

beforeEach(() => {
	getPosition = vi.fn();
	permissionQuery = vi.fn().mockResolvedValue({ state: 'granted' });
	vi.stubGlobal('navigator', {
		geolocation: { getCurrentPosition: getPosition },
		permissions: { query: permissionQuery },
	});
	service = new LocationService();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('confirmed scheduling location', () => {
	it('waits for confirmation before resuming a request with the selected address', async () => {
		const resumed = vi.fn();
		const decision = service.requestSelectionDecision().then(resumed);
		expect(service.store.getState()).toMatchObject({
			pickerOpen: true,
			requestNeedsLocation: true,
		});
		service.previewAddress(place);
		await Promise.resolve();
		expect(resumed).not.toHaveBeenCalled();
		service.confirmCandidate();
		await decision;
		expect(resumed).toHaveBeenCalledExactlyOnceWith(LocationDecision.Confirmed);
		expect((await service.getCurrentLocation()).location).toBe(place.address);
	});

	it('resumes after an explicit decision to continue without location', async () => {
		const decision = service.requestSelectionDecision();
		service.continueWithoutLocation();
		await expect(decision).resolves.toBe(LocationDecision.WithoutLocation);
		expect(await service.getCurrentLocation()).toEqual({ location: '', verified: false });
	});

	it('cancels a waiting request on close and does not resume it after a later choice', async () => {
		const resumed = vi.fn();
		const decision = service.requestSelectionDecision().then(resumed);
		service.closePicker();
		commitAddress();
		await decision;
		expect(resumed).toHaveBeenCalledExactlyOnceWith(LocationDecision.Cancelled);
	});

	it('aborts a waiting request and closes its picker', async () => {
		const controller = new AbortController();
		const decision = service.requestSelectionDecision(controller.signal);
		controller.abort();
		await expect(decision).resolves.toBe(LocationDecision.Cancelled);
		expect(service.store.getState().pickerOpen).toBe(false);
	});

	it('does not open the picker for an already aborted request', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(service.requestSelectionDecision(controller.signal)).resolves.toBe(
			LocationDecision.Cancelled
		);
		expect(service.store.getState().pickerOpen).toBe(false);
	});

	it('does not reopen the picker when a location decision already exists', async () => {
		commitAddress();
		await expect(service.requestSelectionDecision()).resolves.toBe(LocationDecision.Confirmed);
		expect(service.store.getState().pickerOpen).toBe(false);
		service.continueWithoutLocation();
		await expect(service.requestSelectionDecision()).resolves.toBe(
			LocationDecision.WithoutLocation
		);
		expect(service.store.getState().pickerOpen).toBe(false);
	});

	it('cancels a superseded waiter without letting its abort close the replacement picker', async () => {
		const controller = new AbortController();
		const first = service.requestSelectionDecision(controller.signal);
		const second = service.requestSelectionDecision();
		controller.abort();
		expect(service.store.getState().pickerOpen).toBe(true);
		service.continueWithoutLocation();
		await expect(first).resolves.toBe(LocationDecision.Cancelled);
		await expect(second).resolves.toBe(LocationDecision.WithoutLocation);
	});

	it('reads an empty location without triggering browser access or fabricating an address', async () => {
		expect(await service.getCurrentLocation()).toEqual({ location: '', verified: false });
		expect(service.hasSelectionDecision()).toBe(false);
		expect(getPosition).not.toHaveBeenCalled();
		expect(permissionQuery).not.toHaveBeenCalled();
	});

	it('keeps a new address as a draft until explicitly confirmed', async () => {
		commitAddress();
		service.previewAddress({ ...place, id: 'boston', address: 'Boston', latitude: 42.36 });
		expect((await service.getCurrentLocation()).location).toBe(place.address);
		expect(JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY)!).active.location).toBe(
			place.address
		);
		service.confirmCandidate();
		expect((await service.getCurrentLocation()).location).toBe('Boston');
	});

	it.each([
		{ isVerified: false },
		{ isDefault: true },
		{ isNull: true },
		{ latitude: 91 },
		{ longitude: Infinity },
		{ latitude: NaN },
		{ address: '' },
	])('rejects an unusable lookup result: %j', (overrides) => {
		expect(service.previewAddress({ ...place, ...overrides })).toBe(false);
		expect(service.confirmCandidate()).toBe(false);
		expect(service.store.getState().active).toBeNull();
	});

	it('does not mistake valid zero coordinates for missing coordinates', () => {
		expect(service.previewAddress({ ...place, latitude: 0, longitude: 0 })).toBe(true);
		expect(service.confirmCandidate()).toBe(true);
	});

	it('restores a confirmed address across reload without geolocation', async () => {
		commitAddress();
		const reloaded = new LocationService();
		expect((await reloaded.getCurrentLocation()).location).toBe(place.address);
		expect(reloaded.store.getState().active?.source).toBe('address');
		expect(getPosition).not.toHaveBeenCalled();
	});

	it('persists an explicit choice to continue without location and clears old coordinates', async () => {
		commitAddress();
		service.continueWithoutLocation();
		const reloaded = new LocationService();
		expect(reloaded.hasSelectionDecision()).toBe(true);
		expect(reloaded.toApiFormat(await reloaded.getCurrentLocation())).toEqual({
			userLatitude: '',
			userLongitude: '',
			userLocationVerified: 'false',
		});
	});

	it.each([
		'invalid JSON',
		JSON.stringify({
			version: 1,
			active: {
				...place,
				verified: true,
				location: 'Invalid',
				source: 'device',
				latitude: 900,
			},
		}),
	])('ignores corrupt persisted data', async (stored) => {
		localStorage.setItem(LOCATION_STORAGE_KEY, stored);
		expect((await service.getCurrentLocation()).verified).toBe(false);
		expect(service.hasSelectionDecision()).toBe(false);
	});

	it('keeps the in-page choice and exposes a failed storage write', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('Storage blocked');
		});
		commitAddress();
		expect((await service.getCurrentLocation()).location).toBe(place.address);
		expect(service.store.getState().persistenceFailed).toBe(true);
	});

	it('does not send coordinates from unverified or invalid data', () => {
		expect(
			service.toApiFormat({
				location: 'Unknown',
				verified: false,
				latitude: 10,
				longitude: 20,
			})
		).toEqual({ userLatitude: '', userLongitude: '', userLocationVerified: 'false' });
		expect(
			service.toApiFormat({
				location: 'Invalid',
				verified: true,
				latitude: 100,
				longitude: 20,
			}).userLocationVerified
		).toBe('false');
	});

	it('returns an independent request snapshot when the active location changes', async () => {
		commitAddress();
		const requestLocation = await service.getCurrentLocation();
		service.continueWithoutLocation();
		expect(service.toApiFormat(requestLocation).userLatitude).toBe(String(place.latitude));
		expect((await service.getCurrentLocation()).verified).toBe(false);
	});
});

describe('address search', () => {
	it('uses the public endpoint through LocationApi and keeps lookup results out of the active state', async () => {
		const lookup = vi.spyOn(LocationApi.prototype, 'searchAnonymousByName').mockResolvedValue({
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: [place],
			ServerStatus: null,
		});
		commitAddress();
		const signal = new AbortController().signal;
		expect(await service.searchAddresses(' New York ', signal)).toEqual([place]);
		expect(lookup).toHaveBeenCalledWith(
			'New York',
			expect.objectContaining({ location: place.address }),
			signal
		);
		expect(service.store.getState().candidate).toBeNull();
		expect(getPosition).not.toHaveBeenCalled();
	});

	it('does not search below the backend minimum of four characters', async () => {
		const lookup = vi.spyOn(LocationApi.prototype, 'searchAnonymousByName');
		expect(await service.searchAddresses('NYC')).toEqual([]);
		expect(lookup).not.toHaveBeenCalled();
	});

	it('distinguishes a backend error from a successful empty result', async () => {
		vi.spyOn(LocationApi.prototype, 'searchAnonymousByName').mockResolvedValue({
			Error: { Code: '4', Message: 'Error' },
			Content: [],
			ServerStatus: null,
		});
		await expect(service.searchAddresses('Boston')).rejects.toThrow('Location lookup failed');
	});
});

describe('device access and refresh', () => {
	it('shows the found address and accuracy as a candidate, preserving the current selection', async () => {
		commitAddress();
		successfulDetection();
		await service.detectCurrentLocation();
		expect(service.store.getState().candidate).toMatchObject({
			location: 'Boston, Massachusetts, USA',
			accuracy: 2000,
			source: 'device',
		});
		expect((await service.getCurrentLocation()).location).toBe(place.address);
		service.confirmCandidate();
		expect((await service.getCurrentLocation()).location).toBe('Boston, Massachusetts, USA');
	});

	it('enters browser permission flow only for an explicit action', async () => {
		permissionQuery.mockResolvedValue({ state: 'prompt' });
		await service.detectCurrentLocation(false);
		expect(getPosition).not.toHaveBeenCalled();
		expect(service.store.getState().issue).toBe('refreshNeeded');
		successfulDetection();
		await service.detectCurrentLocation(true);
		expect(getPosition).toHaveBeenCalledOnce();
	});

	it('does not repeatedly request access when permission is denied', async () => {
		commitAddress();
		permissionQuery.mockResolvedValue({ state: 'denied' });
		await service.detectCurrentLocation();
		expect(getPosition).not.toHaveBeenCalled();
		expect(service.store.getState()).toMatchObject({ issue: 'blocked', stage: 'idle' });
		expect((await service.getCurrentLocation()).location).toBe(place.address);
	});

	it('supports explicit detection when permission querying is unavailable', async () => {
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: getPosition } });
		successfulDetection();
		await service.detectCurrentLocation(false);
		expect(getPosition).not.toHaveBeenCalled();
		await service.detectCurrentLocation();
		expect(service.store.getState().candidate?.location).toBe('Boston, Massachusetts, USA');
	});

	it('does not request device access in an insecure context', async () => {
		vi.stubGlobal('isSecureContext', false);
		await service.detectCurrentLocation();
		expect(getPosition).not.toHaveBeenCalled();
		expect(service.store.getState().issue).toBe('unavailable');
	});

	it.each([
		{ code: 1, issue: 'blocked' },
		{ code: 2, issue: 'unavailable' },
		{ code: 3, issue: 'timeout' },
	])(
		'preserves the active selection after a detection failure: $issue',
		async ({ code, issue }) => {
			commitAddress();
			getPosition.mockImplementation(
				(_success: PositionCallback, failure: PositionErrorCallback) =>
					failure({ code } as GeolocationPositionError)
			);
			await service.detectCurrentLocation();
			expect(service.store.getState()).toMatchObject({
				stage: 'idle',
				issue,
				candidate: null,
			});
			expect((await service.getCurrentLocation()).location).toBe(place.address);
		}
	);

	it('does not call device coordinates verified when no address can be shown for review', async () => {
		commitAddress();
		successfulDetection();
		vi.mocked(service.reverseGeocode).mockRejectedValue(new Error('No address'));
		await service.detectCurrentLocation();
		expect(service.store.getState()).toMatchObject({
			candidate: null,
			issue: 'addressUnavailable',
		});
		expect((await service.getCurrentLocation()).location).toBe(place.address);
	});

	it('ignores a late device callback after the user selects another address', async () => {
		let deliverPosition!: PositionCallback;
		getPosition.mockImplementation((success: PositionCallback) => {
			deliverPosition = success;
		});
		const detection = service.detectCurrentLocation();
		await vi.waitFor(() => expect(getPosition).toHaveBeenCalledOnce());
		commitAddress();
		deliverPosition({
			coords: { latitude: 1, longitude: 2, accuracy: 10 },
		} as GeolocationPosition);
		await detection;
		expect(service.store.getState().candidate).toBeNull();
		expect((await service.getCurrentLocation()).location).toBe(place.address);
	});

	it('stops waiting on an unanswered permission request and returns to a recoverable state', async () => {
		vi.useFakeTimers();
		permissionQuery.mockResolvedValue({ state: 'prompt' });
		const detection = service.detectCurrentLocation();
		await vi.advanceTimersByTimeAsync(20000);
		await detection;
		expect(service.store.getState()).toMatchObject({ stage: 'idle', issue: 'timeout' });
	});

	it('never refreshes a manually selected address on wake', async () => {
		commitAddress();
		service.store.setState({
			active: {
				...service.store.getState().active!,
				checkedAt: Date.now() - LOCATION_REFRESH_INTERVAL - 1,
			},
		});
		await service.refreshIfStale();
		expect(getPosition).not.toHaveBeenCalled();
		expect(permissionQuery).not.toHaveBeenCalled();
	});

	it('refreshes a stale device selection once and requires confirmation of the new place', async () => {
		successfulDetection();
		await service.detectCurrentLocation();
		service.confirmCandidate();
		service.store.setState({
			active: {
				...service.store.getState().active!,
				checkedAt: Date.now() - LOCATION_REFRESH_INTERVAL - 1,
			},
		});
		vi.mocked(service.reverseGeocode).mockResolvedValue('Chicago, Illinois, USA');
		await service.refreshIfStale();
		await service.refreshIfStale();
		expect(getPosition).toHaveBeenCalledTimes(2);
		expect(service.store.getState().candidate?.location).toBe('Chicago, Illinois, USA');
		expect((await service.getCurrentLocation()).location).toBe('Boston, Massachusetts, USA');
	});
});
