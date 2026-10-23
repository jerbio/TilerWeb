import { LocationResponse, LocationSearchResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';
import type { LocationData } from '@/services/locationService';
import { LocationVerification } from '@/core/constants/location';

export class LocationApi extends AppApi {
	/** Public address search, optionally biased by the confirmed scheduling location. */
	public searchAnonymousByName(query: string, anchor?: LocationData, signal?: AbortSignal) {
		const params = new URLSearchParams({
			data: query,
			includeMapSearch: 'true',
			mobileApp: 'true',
		});
		if (anchor?.verified && anchor.latitude !== undefined && anchor.longitude !== undefined) {
			params.set('UserLatitude', String(anchor.latitude));
			params.set('UserLongitude', String(anchor.longitude));
			params.set('UserLocationVerified', LocationVerification.Verified);
		}
		return this.apiRequest<LocationSearchResponse>(`api/Location/Anonymous/Name?${params}`, {
			usesUserLocation: anchor !== undefined,
			signal,
		});
	}

	/**
	 * Fetch a location by ID.
	 * `GET /api/Location?id=...&IdSearch.mobileApp=true`
	 */
	public getLocation(locationId: string) {
		const params = new URLSearchParams({
			id: locationId,
			version: 'v2',
		});
		return this.apiRequest<LocationResponse>(`api/Location?${params}`);
	}

	/**
	 * Search locations by name, optionally including Google Maps results.
	 * `GET /api/Location/Name?data=...&includeMapSearch=true&version=v2`
	 */
	public searchByName(query: string) {
		const params = new URLSearchParams({
			data: query,
			includeMapSearch: 'true',
			mobileApp: 'true',
		});
		return this.apiRequest<LocationSearchResponse>(`api/Location/Name?${params}`);
	}
}
