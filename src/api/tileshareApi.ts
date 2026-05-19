import { AppApi } from './appApi';
import {
	DeleteTileShareClusterParams,
	DeleteTileShareClusterResponse,
	DesignatedTileListResponse,
	TileShareClusterListResponse,
} from '@/core/common/types/tileshare';

export class TileshareApi extends AppApi {
	getOutbox() {
		return this.apiRequest<TileShareClusterListResponse>('api/TileShareCluster?IsOutbox=true');
	}

	getInbox() {
		return this.apiRequest<DesignatedTileListResponse>(
			'api/DesignatedTile/designated?InvitationStatus=accepted'
		);
	}

	async deleteCluster(
		params: Omit<
			DeleteTileShareClusterParams,
			'UserLongitude' | 'UserLatitude' | 'UserLocationVerified'
		>
	) {
		const loc = await this.getLocationData();
		const body: DeleteTileShareClusterParams = {
			...params,
			UserLongitude: loc.longitude?.toString() ?? null,
			UserLatitude: loc.latitude?.toString() ?? null,
			UserLocationVerified: loc.verified ? 'true' : 'false',
		};
		return this.apiRequest<DeleteTileShareClusterResponse>('api/TileShareCluster', {
			method: 'DELETE',
			body: JSON.stringify(body),
		});
	}
}
