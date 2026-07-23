import type {
	DesignatedUser,
	TileShareTemplate,
	TileshareUserProfile,
} from '@/core/common/types/tileshare';
import type { AvatarUser } from '@/core/common/components/AvatarCluster';

/** Map a tilette's designated users to the avatar-cluster shape. */
export function designatedToAvatars(designated: DesignatedUser[] | null): AvatarUser[] {
	return (designated ?? []).map((d) => ({
		name: d.userProfile?.fullName || d.userProfile?.firstName || d.displayedIdentifier,
		email: d.userProfile?.email || d.displayedIdentifier,
	}));
}

export type Assignee = {
	/** Stable key — userId, or the displayed identifier when userId is absent. */
	id: string;
	/** Display name, e.g. "Jessica J." */
	name: string;
	avatar: AvatarUser;
	/** Tilettes this person is designated on, in cluster order. */
	tilettes: TileShareTemplate[];
};

/** "Jessica J." from first name + last initial, with graceful fallbacks. */
function formatAssigneeName(profile: TileshareUserProfile | null, fallback: string | null): string {
	const first = profile?.firstName?.trim();
	if (first) {
		const lastInitial = profile?.lastName?.trim()?.[0];
		return lastInitial ? `${first} ${lastInitial}.` : first;
	}
	return profile?.fullName?.trim() || fallback || 'Unknown';
}

/**
 * Pivots a cluster's tilettes into per-assignee lanes for the assignee view.
 * Each designated user becomes one lane holding the tilettes they're on,
 * deduped by userId (or displayed identifier when userId is missing).
 */
export function buildAssignees(tilettes: TileShareTemplate[]): Assignee[] {
	const byId = new Map<string, Assignee>();

	for (const tilette of tilettes) {
		for (const designated of tilette.designatedUsers ?? []) {
			const key = designated.userId ?? designated.displayedIdentifier;
			if (!key) continue;

			let assignee = byId.get(key);
			if (!assignee) {
				const profile = designated.userProfile;
				const name = formatAssigneeName(profile, designated.displayedIdentifier);
				assignee = {
					id: key,
					name,
					avatar: { name, email: profile?.email ?? designated.displayedIdentifier },
					tilettes: [],
				};
				byId.set(key, assignee);
			}
			assignee.tilettes.push(tilette);
		}
	}

	return Array.from(byId.values());
}
