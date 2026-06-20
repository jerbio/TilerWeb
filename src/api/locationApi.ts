import { LocationResponse, LocationSearchResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';

export class LocationApi extends AppApi {
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
