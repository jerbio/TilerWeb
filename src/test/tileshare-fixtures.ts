import { DesignatedUser, InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';

export function shareAssignment(
	userId: string,
	rsvpStatus: string = InvitationStatus.None,
	completionPct: number | null = null
): DesignatedUser {
	return {
		userId,
		displayedIdentifier: `${userId}@example.com`,
		designatedTileTemplateId: `assignment-${userId}`,
		userProfile: null,
		rsvpStatus,
		completionPct,
	};
}
export function shareTilette(
	id: string,
	designatedUsers: DesignatedUser[] = []
): TileShareTemplate {
	return {
		id,
		name: id,
		designatedUsers,
		creator: null,
		clusterId: 'share',
		duration: 3600000,
		start: null,
		end: null,
		miscData: null,
	};
}
