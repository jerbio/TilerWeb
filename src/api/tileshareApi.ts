import { AppApi } from './appApi';
import {
	CreateTileletteParams,
	DeleteTileShareClusterParams,
	DeleteTileShareClusterResponse,
	DesignatedTileListResponse,
	GetClustersParams,
	GetClusterTilettesParams,
	GetDesignatedTilesParams,
	GetTileletteParams,
	TileShareClusterListResponse,
	TileShareClusterResponse,
	TileShareTemplateListResponse,
	TileShareTemplateResponse,
	TileTemplateResponse,
	UpdateClusterParams,
	UpdateTileletteParams,
} from '@/core/common/types/tileshare';

/** Serialize a params object into a query string, dropping undefined values. */
function buildQuery(params?: Record<string, unknown>): string {
	if (!params) return '';
	const entries = Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => [k, String(v)]);
	if (entries.length === 0) return '';
	return '?' + new URLSearchParams(entries).toString();
}

export class TileshareApi extends AppApi {
	getClusters(params?: GetClustersParams) {
		return this.apiRequest<TileShareClusterListResponse>(
			`api/TileShareCluster${buildQuery(params)}`
		);
	}

	/** Single cluster header. Omits DataFormat — the tilette list comes from getClusterTilettes. */
	getClusterHeader(clusterId: string) {
		return this.apiRequest<TileShareClusterResponse>(
			`api/TileShareCluster${buildQuery({ ClusterId: clusterId })}`
		);
	}

	/** Tilette list for a cluster, with full assignees (unlike the caller-scoped cluster route). */
	getClusterTilettes(clusterId: string) {
		const params: GetClusterTilettesParams = {
			TileShareClusterId: clusterId,
			Format: 'full',
		};
		return this.apiRequest<TileShareTemplateListResponse>(
			`api/TileshareTemplate${buildQuery(params)}`
		);
	}

	/** Single tilette (single tileshare) detail. */
	getTilette(id: string) {
		const params: GetTileletteParams = { Id: id, Format: 'full' };
		return this.apiRequest<TileShareTemplateResponse>(
			`api/TileshareTemplate${buildQuery(params)}`
		);
	}

	getDesignatedTiles(params?: GetDesignatedTilesParams) {
		return this.apiRequest<DesignatedTileListResponse>(
			`api/DesignatedTile/designated${buildQuery(params)}`
		);
	}

	updateCluster(params: UpdateClusterParams) {
		return this.apiRequest<TileShareClusterResponse>('api/TileShareCluster', {
			method: 'PUT',
			body: JSON.stringify(params),
		});
	}

	/** Note the response key is `tileTemplate` here, not `tileShareTemplate`. */
	createTilette(params: CreateTileletteParams) {
		return this.apiRequest<TileTemplateResponse>('api/TileshareTemplate', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	}

	updateTilette(params: UpdateTileletteParams) {
		return this.apiRequest<TileShareTemplateResponse>('api/TileshareTemplate', {
			method: 'PUT',
			body: JSON.stringify(params),
		});
	}

	/**
	 * Delete a cluster. Takes a JSON body, not query params. The handler reads
	 * only the id and TimeZone/refNow — it never calls getCurrentLocation — so no
	 * location is sent and the browser is not prompted for one.
	 *
	 * Note it wraps everything in a try/catch returning BadRequest, so a server
	 * failure surfaces as a 400: don't report 400 here as invalid input.
	 */
	deleteCluster(params: DeleteTileShareClusterParams) {
		return this.apiRequest<DeleteTileShareClusterResponse>('api/TileShareCluster', {
			method: 'DELETE',
			body: JSON.stringify(params),
		});
	}
}
