export type InvitationScope = { ClusterId?: string; TiletteId?: string; AssignmentId?: string };
export type InvitationProject = { clusterId: string; name: string; pendingCount: number };
export type TileShareInvitation = {
	assignmentId: string;
	clusterId: string;
	tiletteId: string;
	name: string;
	clusterName: string;
	deadline: number | null;
	inviterName: string | null;
};
export type InvitationPage = {
	projects?: InvitationProject[];
	invitations?: TileShareInvitation[];
	nextCursor: string | null;
};
