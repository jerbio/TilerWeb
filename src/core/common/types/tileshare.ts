import { ApiResponse } from './api';

export type TileshareUserProfile = {
	id: string | null;
	username: string | null;
	timeZoneDifference: number | null;
	timeZone: string | null;
	email: string | null;
	endfOfDay: string | null;
	endOfDay: string | null;
	phoneNumber: string | null;
	fullName: string | null;
	firstName: string | null;
	lastName: string | null;
	countryCode: string | null;
};

export type TileShareCluster = {
	id: string | null;
	name: string | null;
	/** Cluster description. Persisted on write; may be null until the read payload emits it. */
	notes: string | null;
	start: number | null;
	end: number | null;
	isCompleted: boolean | null;
	isDeleted: boolean | null;
	isDismissed: boolean | null;
	isMultiTilette: boolean | null;
	creator: TileshareUserProfile | null;
	tileShareTemplates: TileShareTemplate[] | null;
	truncatedUser: string | null;
};

export type DesignatedUser = {
	displayedIdentifier: string | null;
	userId: string | null;
	designatedTileTemplateId: string | null;
	userProfile: TileshareUserProfile | null;
	rsvpStatus: string | null;
	completionPct: number | null;
};

export type TileShareTemplate = {
	id: string | null;
	name: string | null;
	creator: TileshareUserProfile | null;
	designatedUsers: DesignatedUser[] | null;
	clusterId: string | null;
	duration: number | null;
	start: number | null;
	end: number | null;
	miscData: {
		id: string | null;
		userNote: string | null;
	} | null;
};

export type DesignatedTile = {
	id: string | null;
	name: string | null;
	template: TileShareTemplate | null;
	displayedIdentifier: string | null;
	isViable: boolean | null;
	invitationStatus: string | null;
	tileTemplateId: string | null;
	status: string | null;
	isDisabled: boolean | null;
	user: TileshareUserProfile | null;
	completionPercent: number | null;
	tilerEvent: unknown | null;
	clusterOwner: TileshareUserProfile | null;
};

export type TileShareClusterListResponse = ApiResponse<{
	clusters: TileShareCluster[];
}>;

/** Single-cluster fetch (ClusterId). Envelope key pending backend confirm — see tileshareApi. */
export type TileShareClusterResponse = ApiResponse<{
	cluster: TileShareCluster;
}>;

export type TileShareTemplateListResponse = ApiResponse<{
	tileShareTemplates: TileShareTemplate[];
}>;

export type TileShareTemplateResponse = ApiResponse<{
	tileShareTemplate: TileShareTemplate;
}>;

/**
 * Create-tilette's envelope. POST api/TileshareTemplate returns its payload
 * under `tileTemplate`, where the GET and PUT routes use `tileShareTemplate` —
 * so each call unwraps its own key rather than sharing one helper. The contact
 * routes (PUT/DELETE api/DesignatedTile/contact) use `tileTemplate` too.
 */
export type TileTemplateResponse = ApiResponse<{
	tileTemplate: TileShareTemplate;
}>;

export type DesignatedTileListResponse = ApiResponse<{
	designatedTiles: DesignatedTile[];
}>;

/**
 * Composed shape consumed by the cluster detail page. The header and the
 * tilette list come from two separate endpoints (the cluster route scopes
 * tilettes to the caller, which drops the assignee stack).
 */
export type ClusterDetail = {
	cluster: TileShareCluster;
	tilettes: TileShareTemplate[];
};

/**
 * Per-tilette completion status. Derived client-side for now — the backend
 * has no completion field yet, so {@link deriveTileletteStatus} returns a stub.
 * When the wire field lands, only that helper changes.
 */
export enum TileletteStatus {
	InProgress = 'in_progress',
	Completed = 'completed',
}

/**
 * Body for DELETE api/TileShareCluster. Only the id and TimeZone/refNow fields
 * are read server-side; the location fields the other write routes take are
 * never looked at on this path, so they aren't sent.
 */
export type DeleteTileShareClusterParams = {
	ClusterId: string | null;
	MobileApp: boolean | null;
	SocketId: boolean | null;
	TimeZoneOffset: number | null;
	Version: string | null;
	TimeZone: string | null;
	IsTimeZoneAdjusted: string | null;
	getTimeSpan: string | null;
	UserName: string | null;
	UserID: string | null;
};

export type DeleteTileShareClusterResponse = ApiResponse<unknown>;

export type SortOrder = 'asc' | 'desc';

/** Default server page size (ServerContants.batchPageSize). */
export const DEFAULT_CLUSTER_PAGE_SIZE = 50;

export type GetClustersParams = {
	/**
	 * `true` for clusters the caller created, `false` for ones shared with them.
	 * The only list filter the server reads — there is no `IsInbox` counterpart.
	 */
	IsOutbox?: boolean;
	/** Record offset passed to .Skip() — NOT a page number. */
	Index?: number;
	/** Number of records to .Take(). Defaults to 50 server-side. */
	PageSize?: number;
	/** "asc" / "desc" on creation time. Case-insensitive. */
	SortOrder?: SortOrder;
	/** When non-empty, also hydrates TileShareTemplates per cluster. */
	DataFormat?: string;
	/** When set, returns a single cluster (pagination ignored). */
	ClusterId?: string;
};

/**
 * Page-based params for the cluster service. `page` is 1-based and is
 * converted to the server's record `Index` offset before the request.
 */
export type ClusterPageParams = {
	page?: number;
	pageSize?: number;
	sortOrder?: SortOrder;
};

/**
 * Wire values for a designated tile's invitation status. `None` is the initial
 * state an invite is created in — the server's enum has no "pending" member, and
 * an unrecognized value is silently coerced to `none`, so these must match
 * exactly. Comparisons are lower-cased server-side.
 */
export enum InvitationStatus {
	Accepted = 'accepted',
	/** Invited but not yet answered. */
	None = 'none',
	Declined = 'declined',
}

export type GetDesignatedTilesParams = {
	InvitationStatus?: InvitationStatus;
};

export type GetClusterTilettesParams = {
	TileShareClusterId: string;
	/** Non-empty hydrates miscData (userNote). Use "full". */
	Format?: string;
};

export type GetTileletteParams = {
	Id: string;
	/** Non-empty hydrates miscData (userNote). Use "full". */
	Format?: string;
};

/**
 * Body for PUT api/TileShareCluster.
 *
 * Unlike the tilette route, this handler does NOT merge with stored values: an
 * absent `StartTime` is written as `DateTimeOffset.MinValue`, wiping the
 * cluster's start. Both bounds are therefore required, not optional.
 */
export type UpdateClusterParams = {
	/**
	 * The cluster id. Named `Id` here — this route binds TemplateClusterModel,
	 * which has no `ClusterId` property, so sending that binds nothing and the
	 * null lookup 404s. (DELETE binds a different model and does use `ClusterId`.)
	 */
	Id: string;
	Name?: string;
	/** The cluster description. `ClusterNote` exists on the model but is ignored. */
	Notes?: string;
	/** Epoch ms. Always send both bounds — see the note above. */
	StartTime: number;
	EndTime: number;
};

/** An assignee on a tilette. The wire shape the server binds — not a bare string. */
export type ContactModel = {
	Id?: string;
	FirstName?: string;
	LastName?: string;
	Email?: string;
	PhoneNumber?: string;
};

/**
 * Body for POST api/TileshareTemplate.
 *
 * The id key is `ClusterId` — `TileShareClusterId` exists only on the GET's
 * search model and would bind as null here. Adding a tilette flips the cluster's
 * `isMultiTilette` to true and recomputes its truncated user list, so refetch
 * the cluster afterwards rather than patching it locally.
 */
export type CreateTileletteParams = {
	ClusterId: string;
	Name?: string;
	Contacts?: ContactModel[];
	NoteMiscData?: string;
	/** Optional — falls back to the cluster's timeline when omitted. */
	StartTime?: number;
	EndTime?: number;
	/** Optional. */
	DurationInMs?: number;
};

/**
 * Body for PUT api/TileshareTemplate. All fields except Id optional — unlike the
 * cluster route, this one merges with stored values, so partial time updates are
 * safe. A missing Id is a 400; no write-access row for the caller is a 404.
 */
export type UpdateTileletteParams = {
	Id: string;
	Name?: string;
	/** Writes miscData.UserNote, returned as `miscData.userNote`. */
	NoteMiscData?: string;
	StartTime?: number;
	EndTime?: number;
};
