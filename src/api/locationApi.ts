import { LocationResponse } from '../core/common/types/schedule';
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
}
