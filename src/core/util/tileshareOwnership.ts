import type { UserInfo } from '@/global_state';
import type { TileshareUserProfile } from '@/core/common/types/tileshare';

const matches = (a: string | null | undefined, b: string | null | undefined): boolean =>
	!!a && !!b && a.toLowerCase() === b.toLowerCase();

/**
 * Whether the signed-in user created this tileshare, and so may edit, delete or
 * add to it. Assignees get a read-only view of the same pages.
 *
 * The creator profile and the session user come from different endpoints, so
 * any one of id / username / email matching is taken as the same person rather
 * than relying on a single field being populated in both payloads.
 */
export function isTileshareOwner(
	creator: TileshareUserProfile | null | undefined,
	user: UserInfo | null | undefined
): boolean {
	if (!creator || !user) return false;
	return (
		matches(creator.id, user.id) ||
		matches(creator.username, user.username) ||
		matches(creator.email, user.email)
	);
}
