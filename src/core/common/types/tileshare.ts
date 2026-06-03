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
	start: number | null;
	end: number | null;
	isCompleted: boolean | null;
	isDeleted: boolean | null;
	isDismissed: boolean | null;
	isMultiTilette: boolean | null;
	creator: TileshareUserProfile | null;
	tileShareTemplates: unknown[] | null;
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

export type DesignatedTileListResponse = ApiResponse<{
	designatedTiles: DesignatedTile[];
}>;

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

export type GetClustersParams = {
	IsOutbox?: boolean;
	IsInbox?: boolean;
};

export enum InvitationStatus {
	Accepted = 'accepted',
	Pending = 'pending',
	Declined = 'declined',
}

export type GetDesignatedTilesParams = {
	InvitationStatus?: InvitationStatus;
};
