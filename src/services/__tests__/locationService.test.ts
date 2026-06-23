import { afterEach, beforeEach, vi } from 'vitest';
import { locationService } from '../locationService';

describe('locationService', () => {
	const originalGeolocation = navigator.geolocation;
	const originalPermissions = navigator.permissions;

	beforeEach(() => {
		locationService.clearManualLocation();
		locationService.setCurrentLocation(locationService.getUnavailableLocation());
		vi.restoreAllMocks();
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: originalGeolocation,
		});
		Object.defineProperty(navigator, 'permissions', {
			configurable: true,
			value: originalPermissions,
		});
	});

	it('represents unavailable location without fallback coordinates', () => {
		const location = locationService.getUnavailableLocation();

		expect(location).toEqual({
			location: '',
			verified: false,
			status: 'unavailable',
		});

		expect(locationService.toApiFormat(location)).toEqual({
			userLongitude: '',
			userLatitude: '',
			userLocationVerified: 'false',
		});
	});

	it('refreshes browser location instead of reusing cached unavailable state', async () => {
		const getCurrentPosition = vi.fn((success: PositionCallback) =>
			success({
				coords: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			} as GeolocationPosition)
		);

		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: { getCurrentPosition },
		});
		Object.defineProperty(navigator, 'permissions', {
			configurable: true,
			value: {
				query: vi.fn().mockResolvedValue({ state: 'granted' }),
			},
		});
		vi.spyOn(locationService, 'reverseGeocode').mockResolvedValue('New York, NY');

		const location = await locationService.getCurrentLocation();

		expect(getCurrentPosition).toHaveBeenCalledOnce();
		expect(location).toMatchObject({
			location: 'New York, NY',
			latitude: 40.7128,
			longitude: -74.006,
			status: 'verified',
		});
	});

	it('uses a manually saved address instead of refreshing browser location', async () => {
		const manualLocation = {
			location: '1 Main St',
			latitude: 35,
			longitude: -80,
			verified: true,
			status: 'verified' as const,
		};
		const getCurrentPosition = vi.fn();

		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: { getCurrentPosition },
		});

		locationService.setManualLocation(manualLocation);

		await expect(locationService.getCurrentLocation()).resolves.toBe(manualLocation);
		expect(getCurrentPosition).not.toHaveBeenCalled();
	});
});
