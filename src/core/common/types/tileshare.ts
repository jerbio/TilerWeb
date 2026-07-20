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

export type DeleteTileShareClusterParams = {
	ClusterId: string | null;
	UserLongitude: string | null;
	UserLatitude: string | null;
	UserLocationVerified: string | null;
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
	IsOutbox?: boolean;
	IsInbox?: boolean;
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

export enum InvitationStatus {
	Accepted = 'accepted',
	Pending = 'pending',
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

/** Body for PUT api/TileShareCluster. All fields optional — send only what changed. */
export type UpdateClusterParams = {
	ClusterId: string;
	Name?: string;
	Notes?: string;
	/** Epoch ms. Server keeps the unspecified bound, so send both when editing dates. */
	StartTime?: number;
	EndTime?: number;
};

/** Body for POST api/TileshareTemplate. Adding a tilette auto-marks the cluster multi. */
export type CreateTileletteParams = {
	TileShareClusterId: string;
	Name?: string;
	Contacts?: string[];
	NoteMiscData?: string;
	StartTime: number;
	EndTime: number;
	DurationInMs: number;
};

/** Body for PUT api/TileshareTemplate. All fields except Id optional. */
export type UpdateTileletteParams = {
	Id: string;
	Name?: string;
	NoteMiscData?: string;
	StartTime?: number;
	EndTime?: number;
};
