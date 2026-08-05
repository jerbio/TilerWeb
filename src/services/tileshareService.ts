import { TileshareApi } from '@/api/tileshareApi';
import {
	ClusterDetail,
	ClusterPageParams,
	CreateTileletteParams,
	DEFAULT_CLUSTER_PAGE_SIZE,
	DeleteTileShareClusterParams,
	GetClustersParams,
	InvitationStatus,
	UpdateClusterParams,
	UpdateTileletteParams,
} from '@/core/common/types/tileshare';
import { normalizeError } from '@/core/error';

/**
 * Converts 1-based page params into the server's offset-based query.
 * The server expects `Index` as a record offset (page - 1) * pageSize,
 * not a page number.
 */
function toClusterQuery(params?: ClusterPageParams): Partial<GetClustersParams> {
	if (!params) return {};

	const query: Partial<GetClustersParams> = {};
	const { page, pageSize, sortOrder } = params;

	if (pageSize !== undefined) query.PageSize = pageSize;
	if (page !== undefined) {
		const size = pageSize ?? DEFAULT_CLUSTER_PAGE_SIZE;
		query.Index = Math.max(0, (page - 1) * size);
	}
	if (sortOrder !== undefined) query.SortOrder = sortOrder;

	return query;
}

class TileshareService {
	private api: TileshareApi;

	constructor(api: TileshareApi) {
		this.api = api;
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
			const res = await this.api.updateCluster(params);
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
			return res.Content.tileShareTemplate;
		} catch (error) {
			console.error('Error updating tileshare tilette', error);
			throw normalizeError(error);
		}
	}

	async deleteCluster(params: DeleteTileShareClusterParams) {
		try {
			const res = await this.api.deleteCluster(params);
			return res.Content;
		} catch (error) {
			console.error('Error deleting tileshare cluster', error);
			throw normalizeError(error);
		}
	}
}

export default TileshareService;
