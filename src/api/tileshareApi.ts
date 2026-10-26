import {
	TileShareLockedTimeLineRequest,
	TileSharePreview,
	TileShareAssignmentResponse,
	TileSharePreviewOptions,
} from '@/core/common/types/tilesharePreview';
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
	async previewAssignment(id: string, signal?: AbortSignal): Promise<TileSharePreview> {
		const response = await this.apiRequest<ApiResponse<TileSharePreview>>(
			'api/DesignatedTile/Preview',
			{
				method: 'POST',
				body: JSON.stringify({
					Id: id,
					TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				}),
				signal,
				cache: 'no-store',
			}
		);
		if (response.Error?.Code !== '0' || !response.Content)
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? { Code: 'invalid_response', Message: 'Invalid preview response.' }
			);
		return response.Content;
	}

	private async previewRequest<T>(
		route: string,
		body: Record<string, unknown>,
		signal?: AbortSignal
	): Promise<T> {
		const response = await this.apiRequest<ApiResponse<T>>(route, {
			method: 'POST',
			body: JSON.stringify({
				...body,
				TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			}),
			signal,
			cache: 'no-store',
		});
		if (response.Error?.Code !== '0' || !response.Content)
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? { Code: 'invalid_response', Message: 'Invalid preview response.' }
			);
		return response.Content;
	}

	getPreviewOptions(
		id: string,
		token: string,
		sessionKey: string,
		offset: number,
		signal?: AbortSignal
	) {
		return this.previewRequest<TileSharePreviewOptions>(
			'api/DesignatedTile/Preview/Options',
			{ Id: id, PreviewToken: token, SessionKey: sessionKey, Offset: offset },
			signal
		);
	}

	revisePreview(
		id: string,
		token: string,
		selection: { OptionId?: string; SessionKey?: string; Fixed?: boolean },
		signal?: AbortSignal
	) {
		return this.previewRequest<TileSharePreview>(
			'api/DesignatedTile/Preview/Revise',
			{ Id: id, PreviewToken: token, ...selection },
			signal
		);
	}

	private async manageTilette(
		route: string,
		method: 'PUT' | 'DELETE',
		body: Record<string, unknown>
	) {
		const response = await this.apiRequest<ApiResponse<unknown>>(route, {
			method,
			body: JSON.stringify({
				...body,
				TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			}),
		});
		if (response.Error?.Code !== '0')
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? { Code: 'invalid_response', Message: 'Invalid tilette response.' }
			);
		return response.Content;
	}

	addTiletteRecipient(tiletteId: string, contact: { Email?: string; PhoneNumber?: string }) {
		return this.manageTilette('api/TileshareTemplate/contact', 'PUT', {
			EntityId: tiletteId,
			Contact: contact,
		});
	}

	removeTiletteRecipient(tiletteId: string, assignmentId: string) {
		return this.manageTilette('api/TileshareTemplate/contact', 'DELETE', {
			TiletteId: tiletteId,
			AssignmentId: assignmentId,
		});
	}

	deleteTilette(id: string) {
		return this.manageTilette('api/TileshareTemplate', 'DELETE', { Id: id });
	}

	async acceptAssignment(id: string, lockedTimeLineRequest?: TileShareLockedTimeLineRequest) {
		const result = await this.respondToInvitation(
			id,
			InvitationStatus.Accepted,
			lockedTimeLineRequest
		);
		if (!result.Content?.response || result.Content.response.id !== id)
			throw new Error('Invalid assignment response.');
		return result.Content.response;
	}

	async getAssignmentResponse(
		id: string,
		signal?: AbortSignal
	): Promise<TileShareAssignmentResponse> {
		const response = await this.apiRequest<ApiResponse<TileShareAssignmentResponse>>(
			`api/DesignatedTile/Response${buildQuery({ id })}`,
			{ signal, cache: 'no-store' }
		);
		if (response.Error?.Code !== '0' || !response.Content)
			throw TilerResponseError.fromApiCodeResponse(
				response.Error ?? {
					Code: 'invalid_response',
					Message: 'Invalid assignment response.',
				}
			);
		return response.Content;
	}

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
		status: InvitationStatus.Accepted | InvitationStatus.Declined,
		lockedTimeLineRequest?: TileShareLockedTimeLineRequest
	) {
		const response = await this.apiRequest<
			ApiResponse<{ response?: TileShareAssignmentResponse }>
		>('api/DesignatedTile/status', {
			method: 'POST',
			body: JSON.stringify({
				Id: id,
				Status: status,
				LockedTimeLineRequest: lockedTimeLineRequest,
			}),
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
