import { InvitationStatus } from '@/core/common/types/tileshare';
import { AppApi } from './appApi';
import { ApiResponse } from '@/core/common/types/api';
import { TilerResponseError } from '@/core/common/types/errors';
import { InvitationPage, InvitationScope } from '@/core/common/types/tileshareInvitations';
import {
	TileShareActivityPage,
	TileShareActivityQuery,
} from '@/core/common/types/tileshareActivity';
import {
	CreateTileletteParams,
	CreateTileShareClusterParams,
	CreateTileShareClusterResponse,
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
	async setActivityDismissed(eventId: string, isDismissed: boolean) {
		const response = await this.apiRequest<ApiResponse<null>>(
			'api/TileShare/Activity/Dismissal',
			{
				method: 'POST',
				body: JSON.stringify({ EventId: eventId, IsDismissed: isDismissed }),
			}
		);
		if (response.Error?.Code !== '0')
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? {
					Code: 'invalid_response',
					Message: 'Invalid TileShare response.',
				}
			);
		return response.Content;
	}

	async getInvitations(
		params: InvitationScope & { AfterId?: string; PageSize?: number } = {},
		signal?: AbortSignal
	) {
		const response = await this.apiRequest<ApiResponse<InvitationPage>>(
			`api/TileShare/Invitations${buildQuery(params)}`,
			{
				signal,
				cache: 'no-store',
			}
		);
		if (response.Error?.Code !== '0')
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? {
					Code: 'invalid_response',
					Message: 'Invalid TileShare response.',
				}
			);
		return response.Content;
	}
	async respondToInvitation(
		id: string,
		status: InvitationStatus.Accepted | InvitationStatus.Declined
	) {
		const response = await this.apiRequest<ApiResponse<unknown>>('api/DesignatedTile/status', {
			method: 'POST',
			body: JSON.stringify({ Id: id, Status: status }),
		});
		if (response.Error?.Code !== '0')
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? {
					Code: 'invalid_response',
					Message: 'Invalid TileShare response.',
				}
			);
		return response;
	}

	async getActivity(params: TileShareActivityQuery = {}, signal?: AbortSignal) {
		const query = new URLSearchParams(
			Object.entries(params)
				.filter(([, value]) => value !== undefined)
				.map(([key, value]) => [key, String(value)])
		);
		const response = await this.apiRequest<ApiResponse<TileShareActivityPage>>(
			`api/TileShare/Activity?${query}`,
			{
				signal,
				cache: 'no-store',
			}
		);
		if (response.Error?.Code !== '0')
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? {
					Code: 'invalid_response',
					Message: 'Invalid TileShare response.',
				}
			);
		return response.Content;
	}

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

	createCluster(body: CreateTileShareClusterParams) {
		return this.apiRequest<CreateTileShareClusterResponse>('api/TileShareCluster', {
			method: 'POST',
			body: JSON.stringify(body),
		});
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
