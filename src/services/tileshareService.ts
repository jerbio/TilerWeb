import { TileshareApi } from '@/api/tileshareApi';
import {
	ClusterPageParams,
	ContactModel,
	CreateTileShareClusterParams,
	DEFAULT_CLUSTER_PAGE_SIZE,
	DeleteTileShareClusterParams,
	GetClustersParams,
	InvitationStatus,
	TileshareFormState,
	TileshareMode,
} from '@/core/common/types/tileshare';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';
import { classifyContact, normalizePhoneNumber } from '@/core/util/contact';
import { dateTimeToUnix } from '@/core/util/eventTimeConversion';

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

export type TileshareCreateContext = {
	userName: string | null;
	timeZone: string | null;
	timeZoneOffset: number | null;
	/** Bare dial code (e.g. "1") prepended to phone numbers lacking a '+' area code. */
	defaultCallingCode: string;
};

/** Default task length used until the form collects a real duration. */
const DEFAULT_TASK_DURATION_MS = 60 * 60 * 1000; // 1h

/**
 * Routes a raw share-to value to the correct contact channel. The backend does
 * not auto-detect email vs phone, so we classify client-side and normalize
 * phone numbers to `+<callingCode><digits>` form.
 */
function toContact(value: string, defaultCallingCode: string): ContactModel {
	const trimmed = value.trim();
	return classifyContact(trimmed) === 'phone'
		? { PhoneNumber: normalizePhoneNumber(trimmed, defaultCallingCode) }
		: { Email: trimmed };
}

/**
 * Maps the Create Tileshare form state to the server's TemplateClusterModel
 * payload: `deadline` -> end-of-day epoch ms `EndTime`, `location` -> AddressData
 * object, `shareTo` -> Contacts array (never null), `mode` -> IsMultiTilette.
 */
export function toCreateClusterParams(
	form: TileshareFormState,
	mode: TileshareMode,
	ctx: TileshareCreateContext
): CreateTileShareClusterParams {
	const location = form.location.trim();
	const note = form.note.trim();
	const recipients = form.recipients.map((r) => r.trim()).filter(Boolean);

	return {
		UserName: ctx.userName,
		TimeZone: ctx.timeZone,
		TimeZoneOffset: ctx.timeZoneOffset,
		Name: form.name.trim(),
		IsMultiTilette: mode === TileshareMode.Multi,
		IncludeMe: true,
		EndTime: form.deadline ? dateTimeToUnix(form.deadline, '11:59 PM') : undefined,
		DurationInMs: DEFAULT_TASK_DURATION_MS,
		Notes: note || undefined,
		AddressData: location ? { Address: location, AddressIsVerified: false } : undefined,
		Contacts: recipients.map((r) => toContact(r, ctx.defaultCallingCode)),
	};
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

	async getInboxClusters(params?: ClusterPageParams) {
		try {
			const res = await this.api.getClusters({ IsInbox: true, ...toClusterQuery(params) });
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
			return res.Content;
		} catch (error) {
			console.error('Error creating tileshare cluster', error);
			throw normalizeError(error);
		}
	}

	async deleteCluster(
		params: Omit<
			DeleteTileShareClusterParams,
			'UserLongitude' | 'UserLatitude' | 'UserLocationVerified'
		>
	) {
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
