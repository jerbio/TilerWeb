import { AppApi } from './appApi';
import {
	DeleteTileShareClusterParams,
	DeleteTileShareClusterResponse,
	DesignatedTileListResponse,
	GetClustersParams,
	GetDesignatedTilesParams,
	TileShareClusterListResponse,
} from '@/core/common/types/tileshare';

export class TileshareApi extends AppApi {
	getClusters(params?: GetClustersParams) {
		const qs = params
			? '?' +
				new URLSearchParams(
					Object.entries(params)
						.filter(([, v]) => v !== undefined)
						.map(([k, v]) => [k, String(v)])
				).toString()
			: '';
		return this.apiRequest<TileShareClusterListResponse>(`api/TileShareCluster${qs}`);
	}

	getDesignatedTiles(params?: GetDesignatedTilesParams) {
		const qs = params
			? '?' +
				new URLSearchParams(
					Object.entries(params)
						.filter(([, v]) => v !== undefined)
						.map(([k, v]) => [k, String(v)])
				).toString()
			: '';
		return this.apiRequest<DesignatedTileListResponse>(`api/DesignatedTile/designated${qs}`);
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
