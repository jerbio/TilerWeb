export interface LocationData {
	location: string;
	longitude?: number;
	latitude?: number;
	verified: boolean;
	status: LocationStatus;
}

export type LocationStatus = 'verified' | 'unavailable' | 'permission_denied' | 'manual_unverified';

export interface LocationCoordinates {
	latitude: number;
	longitude: number;
	displayName: string;
}

class LocationService {
	// Cache for the locally set manual location
	private cachedManualLocation: LocationData | null = null;

	/**
	 * Get the default location data
	 * @deprecated Use getUnavailableLocation(). The app should not use a fake
	 * location as the user's commute anchor.
	 */
	getDefaultLocation(): LocationData {
		return this.getUnavailableLocation();
	}

	getUnavailableLocation(
		status: Extract<LocationStatus, 'unavailable' | 'permission_denied'> = 'unavailable'
	): LocationData {
		return {
			location: '',
			verified: false,
			status,
		};
	}

	/**
	 * Set a manually entered location (persists until cleared)
	 */
	setManualLocation(location: LocationData): void {
		this.setCurrentLocation(location);
	}

	/**
	 * Clear the manually entered location
	 */
	clearManualLocation(): void {
		this.cachedManualLocation = null;
	}

	/**
	 * Check if a manual location is set
	 */
	hasManualLocation(): boolean {
		return this.cachedManualLocation !== null;
	}

	/**
	 * Set the current location data (used when user manually enters an address)
	 */
	setCurrentLocation(locationData: LocationData): void {
		if (
			locationData.status === 'verified' &&
			locationData.latitude !== undefined &&
			locationData.longitude !== undefined
		) {
			this.cachedManualLocation = locationData;
		} else {
			this.cachedManualLocation = null;
		}
	}

	/**
	 * Get the user's current location
	 * Returns a manually selected location when available. Otherwise, refreshes
	 * browser geolocation so chat requests do not reuse an old commute origin.
	 */
	async getCurrentLocation(): Promise<LocationData> {
		if (this.cachedManualLocation) {
			return this.cachedManualLocation;
		}

		return this.fetchBrowserLocation();
	}

	/**
	 * Try browser geolocation even when a manual address exists. If the browser
	 * lookup fails, keep the manual address rather than replacing it with unknown.
	 */
	async refreshLocationFromBrowser(): Promise<LocationData> {
		const manualLocation = this.cachedManualLocation;
		const location = await this.fetchBrowserLocation();

		if (location.status === 'verified') {
			this.cachedManualLocation = null;
			return location;
		}

		if (manualLocation) {
			return manualLocation;
		}

		return location;
	}

	/**
	 * Fetch location from browser geolocation API
	 */
	private async fetchBrowserLocation(): Promise<LocationData> {
		try {
			// Check if geolocation is supported by the browser
			if (!navigator.geolocation) {
				const unavailableLocation = this.getUnavailableLocation();
				return unavailableLocation;
			}

			// Avoid unnecessary geolocation calls when browser permission is already denied.
			if (await this.isGeolocationPermissionDenied()) {
				const unavailableLocation = this.getUnavailableLocation('permission_denied');
				return unavailableLocation;
			}

			// Get the current position with a timeout
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					timeout: 10000,
					enableHighAccuracy: true,
				});
			});

			const { latitude, longitude } = position.coords;

			try {
				// Use reverse geocoding to get a human-readable address
				const address = await this.reverseGeocode(latitude, longitude);

				const locationData = {
					location: address,
					longitude,
					latitude,
					verified: true,
					status: 'verified' as const,
				};

				return locationData;
			} catch (err) {
				// If reverse geocoding fails, just use coordinates
				console.error('Reverse geocoding failed:', err);
				const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

				const locationData = {
					location: coords,
					longitude,
					latitude,
					verified: true,
					status: 'verified' as const,
				};

				return locationData;
			}
		} catch (err) {
			const geolocationError = err as GeolocationPositionError;
			if (!this.isPermissionDeniedError(geolocationError)) {
				console.error('Geolocation error:', err);
			}
			const unavailableLocation = this.getUnavailableLocation(
				this.isPermissionDeniedError(geolocationError) ? 'permission_denied' : 'unavailable'
			);
			return unavailableLocation;
		}
	}

	/**
	 * Browser geolocation permission denial is expected user behavior, not a hard error.
	 */
	private isPermissionDeniedError(err: GeolocationPositionError | null | undefined): boolean {
		return err?.code === 1;
	}

	private async isGeolocationPermissionDenied(): Promise<boolean> {
		if (!navigator.permissions?.query) {
			return false;
		}

		try {
			const permission = await navigator.permissions.query({
				name: 'geolocation' as PermissionName,
			});
			return permission.state === 'denied';
		} catch {
			return false;
		}
	}

	/**
	 * Convert coordinates to human-readable address using reverse geocoding
	 */
	async reverseGeocode(latitude: number, longitude: number): Promise<string> {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch location information');
		}

		const data = await response.json();
		return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
	}

	/**
	 * Convert address to coordinates using geocoding
	 */
	async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
			);

			if (!response.ok) {
				throw new Error('Failed to geocode address');
			}

			const data = await response.json();

			if (data && data.length > 0) {
				const result = data[0];
				return {
					latitude: parseFloat(result.lat),
					longitude: parseFloat(result.lon),
					displayName: result.display_name,
				};
			}

			return null;
		} catch (err) {
			console.error('Geocoding failed', err);
			return null;
		}
	}

	/**
	 * Get location data from a custom address input
	 */
	async getLocationFromAddress(address: string): Promise<LocationData> {
		try {
			// Try to geocode the entered address to get coordinates
			const geocodedResult = await this.geocodeAddress(address.trim());

			if (geocodedResult) {
				const locationData = {
					location: geocodedResult.displayName,
					longitude: geocodedResult.longitude,
					latitude: geocodedResult.latitude,
					verified: true,
					status: 'verified' as const,
				};

				// Cache the location data
				this.cachedManualLocation = locationData;
				return locationData;
			}

			throw new Error('Unable to find coordinates for address');
		} catch (err) {
			console.error('Error processing address:', err);
			this.cachedManualLocation = null;
			throw err;
		}
	}

	/**
	 * Convert LocationData to API-compatible format
	 */
	toApiFormat(locationData: LocationData) {
		return {
			userLongitude: locationData.longitude?.toString() ?? '',
			userLatitude: locationData.latitude?.toString() ?? '',
			userLocationVerified: locationData.verified ? 'true' : 'false',
		};
	}
}

// Export a singleton instance
export const locationService = new LocationService();
export default locationService;
