import { tiletteDurationInMs } from '@/core/util/tileshareDuration';
import { TileshareApi } from '@/api/tileshareApi';
import {
	ClusterDetail,
	ClusterPageParams,
	CreateTileletteParams,
	ContactModel,
	CreateTileShareClusterParams,
	DEFAULT_CLUSTER_PAGE_SIZE,
	DeleteTileShareClusterParams,
	GetClustersParams,
	InvitationStatus,
	TileshareFormState,
	TileshareMode,
	UpdateClusterParams,
	UpdateTileletteParams,
} from '@/core/common/types/tileshare';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';
import { classifyContact, normalizePhoneNumber } from '@/core/util/contact';
import { dateTimeToUnix } from '@/core/util/eventTimeConversion';
import { toAddressData } from '@/core/util/tileshareLocation';
export { toAddressData } from '@/core/util/tileshareLocation';

/**
 * Converts 1-based page params into the server's offset-based query.
 * The server expects `Index` as a record offset (page - 1) * pageSize,
 * not a page number.
 */
function toClusterQuery(params?: ClusterPageParams): Partial<GetClustersParams> {
	if (!params) return {};

	const query: Partial<GetClustersParams> = {};
	const { page, pageSize, sortOrder, sortBy } = params;

	if (pageSize !== undefined) query.PageSize = pageSize;
	if (page !== undefined) {
		const size = pageSize ?? DEFAULT_CLUSTER_PAGE_SIZE;
		query.Index = Math.max(0, (page - 1) * size);
	}
	if (sortOrder !== undefined) query.SortOrder = sortOrder;
	if (sortBy !== undefined) query.SortBy = sortBy;

	return query;
}

export type TileshareCreateContext = {
	userName: string | null;
	timeZone: string | null;
	timeZoneOffset: number | null;
	/** Bare dial code (e.g. "1") prepended to phone numbers lacking a '+' area code. */
	defaultCallingCode: string;
};

/**
 * Routes a raw share-to value to the correct contact channel. The backend does
 * not auto-detect email vs phone, so we classify client-side and normalize
 * phone numbers to `+<callingCode><digits>` form.
 */
export function toContact(value: string, defaultCallingCode: string): ContactModel {
	const trimmed = value.trim();
	return classifyContact(trimmed) === 'phone'
		? { PhoneNumber: normalizePhoneNumber(trimmed, defaultCallingCode) }
		: { Email: trimmed };
}

/** Submit the share and its optional draft tilettes together. */
export function toCreateClusterParams(
	form: TileshareFormState,
	mode: TileshareMode,
	ctx: TileshareCreateContext
): CreateTileShareClusterParams {
	const duration = tiletteDurationInMs(form.durationMinutes);
	if (duration === null) throw new Error('Duration must be a positive whole number of minutes.');
	// Leading spaces and line breaks can be meaningful Markdown (for example, code blocks).
	const note = form.note.trim() ? form.note : undefined;
	const recipients = form.recipients.map((r) => r.trim()).filter(Boolean);
	const contacts = recipients.map((r) => toContact(r, ctx.defaultCallingCode));
	const address = toAddressData({
		address: form.location,
		description: form.locationDescription ?? '',
		isVerified: form.locationIsVerified ?? false,
	});
	const deadline = form.deadline ? dateTimeToUnix(form.deadline, '11:59 PM') : undefined;
	const tasks =
		mode === TileshareMode.Broadcast
			? [
					{
						Name: form.name.trim(),
						DurationInMs: duration,
						EndTime: deadline,
						NoteMiscData: note || undefined,
						AddressData: address,
						Contacts: contacts,
						IncludeMe: true,
					},
				]
			: (form.tilettes ?? []).map((task, index) => {
					const taskDuration = tiletteDurationInMs(task.durationMinutes);
					if (!task.name.trim() || taskDuration === null)
						throw new Error(
							'Each tilette needs a name and a positive whole number of minutes.'
						);
					return {
						Name: task.name.trim(),
						DurationInMs: taskDuration,
						OrderedIndex: index,
						EndTime: task.deadline
							? dateTimeToUnix(task.deadline, '11:59 PM')
							: deadline,
						NoteMiscData: task.note.trim() ? task.note : undefined,
						AddressData: toAddressData(task.location),
						Contacts:
							mode === TileshareMode.Class
								? contacts
								: task.recipients.map((r) => toContact(r, ctx.defaultCallingCode)),
						IncludeMe: false,
					};
				});

	return {
		UserName: ctx.userName,
		TimeZone: ctx.timeZone,
		TimeZoneOffset: ctx.timeZoneOffset,
		Name: form.name.trim(),
		Mode: mode,
		IsMultiTilette: mode !== TileshareMode.Broadcast,
		IncludeMe: true,
		EndTime: deadline,
		DurationInMs: duration,
		Notes: note || undefined,
		AddressData: address,
		Contacts: contacts,
		ClusterTemplateTileModels: tasks,
	};
}

class TileshareService {
	private api: TileshareApi;

	constructor(api: TileshareApi) {
		this.api = api;
	}

	addTiletteRecipient(tiletteId: string, contact: ContactModel) {
		return this.api.addTiletteRecipient(tiletteId, contact);
	}

	removeTiletteRecipient(tiletteId: string, assignmentId: string) {
		return this.api.removeTiletteRecipient(tiletteId, assignmentId);
	}

	deleteTilette(id: string) {
		return this.api.deleteTilette(id);
	}

	async getClusters(params?: ClusterPageParams) {
		try {
			const res = await this.api.getClusters({
				IncludeCreated: true,
				IsOutbox: params?.createdByMe ?? false,
				...toClusterQuery(params),
			});
			if (res.Error && res.Error.Code !== '0')
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			return res.Content.clusters;
		} catch (error) {
			throw normalizeError(error);
		}
	}

	async getOutboxClusters(params?: ClusterPageParams) {
		try {
			const res = await this.api.getClusters({ IsOutbox: true, ...toClusterQuery(params) });
			return res.Content.clusters;
		} catch (error) {
			console.error('Error fetching tileshare outbox', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Clusters shared with the caller. The server branches only on `IsOutbox`
	 * (there is no `IsInbox` parameter), so the received list is `IsOutbox=false`.
	 * Returns invitations in every status — accepted, declined and not-yet-answered.
	 */
	async getInboxClusters(params?: ClusterPageParams) {
		try {
			const res = await this.api.getClusters({ IsOutbox: false, ...toClusterQuery(params) });
			return res.Content.clusters;
		} catch (error) {
			console.error('Error fetching tileshare inbox clusters', error);
			throw normalizeError(error);
		}
	}

	async getDesignatedTiles() {
		try {
			const res = await this.api.getDesignatedTiles({
				InvitationStatus: InvitationStatus.Accepted,
			});
			return res.Content.designatedTiles;
		} catch (error) {
			console.error('Error fetching tileshare inbox', error);
			throw normalizeError(error);
		}
	}

	async createCluster(params: CreateTileShareClusterParams) {
		try {
			const res = await this.api.createCluster(params);
			// Success is a null Error or Code "0"; only a present non-zero code is a failure.
			if (res.Error && res.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			}
			window.dispatchEvent(new Event('tileshare-changed'));
			return res.Content;
		} catch (error) {
			console.error('Error creating tileshare cluster', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Cluster detail page data. The header and the tilette list come from two
	 * separate endpoints — the cluster route scopes tilettes to the caller, which
	 * would drop the assignee stack — so they're fetched together and composed.
	 */
	async getClusterDetail(clusterId: string): Promise<ClusterDetail> {
		try {
			const [headerRes, tilettesRes] = await Promise.all([
				this.api.getClusterHeader(clusterId),
				this.api.getClusterTilettes(clusterId),
			]);
			return {
				cluster: headerRes.Content.cluster,
				tilettes: tilettesRes.Content.tileShareTemplates,
			};
		} catch (error) {
			console.error('Error fetching tileshare cluster detail', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Cluster header only (name, dates, flags) — e.g. to resolve a tilette's
	 * parent cluster for the breadcrumb without fetching its tilette list.
	 */
	async getClusterHeader(clusterId: string) {
		try {
			const res = await this.api.getClusterHeader(clusterId);
			return res.Content.cluster;
		} catch (error) {
			console.error('Error fetching tileshare cluster header', error);
			throw normalizeError(error);
		}
	}

	/** Single tileshare (tilette) detail. */
	async getTileletteDetail(id: string) {
		try {
			const res = await this.api.getTilette(id);
			return res.Content.tileShareTemplate;
		} catch (error) {
			console.error('Error fetching tileshare tilette detail', error);
			throw normalizeError(error);
		}
	}

	async updateCluster(params: UpdateClusterParams) {
		try {
			if ((params.StartTime !== undefined) !== (params.EndTime !== undefined))
				throw new Error('A share timeline update requires both bounds.');
			const res = await this.api.updateCluster(params);
			if (res.Error && String(res.Error.Code) !== '0')
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			return res.Content.cluster;
		} catch (error) {
			console.error('Error updating tileshare cluster', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Add a tilette to a cluster. Also flips the cluster to multi and recomputes
	 * its truncated users server-side, so callers should refetch the cluster.
	 */
	async createTilette(params: CreateTileletteParams) {
		try {
			const res = await this.api.createTilette(params);
			// Create answers with `tileTemplate`; the read and update routes use
			// `tileShareTemplate`.
			return res.Content.tileTemplate;
		} catch (error) {
			console.error('Error creating tileshare tilette', error);
			throw normalizeError(error);
		}
	}

	async updateTilette(params: UpdateTileletteParams) {
		try {
			const res = await this.api.updateTilette(params);
			if (res.Error && String(res.Error.Code) !== '0')
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			return res.Content.tileShareTemplate;
		} catch (error) {
			console.error('Error updating tileshare tilette', error);
			throw normalizeError(error);
		}
	}

	async deleteCluster(params: DeleteTileShareClusterParams) {
		try {
			const res = await this.api.deleteCluster(params);
			if (res.Error && res.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			}
			window.dispatchEvent(new Event('tileshare-changed'));
			return res.Content;
		} catch (error) {
			console.error('Error deleting tileshare cluster', error);
			throw normalizeError(error);
		}
	}
}

export default TileshareService;
