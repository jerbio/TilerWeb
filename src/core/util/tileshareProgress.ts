import {
	InvitationStatus,
	TileletteStatus,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import { validDesignatedUsers } from './tileshareAssignees';

/**
 * Derive a tilette's completion status from its assignee data.
 *
 * Precedence: an unaccepted invitation means no work can have started, so it
 * wins over a 100% completion reading. Only when every assignee has accepted
 * and every accepted assignee reports 100% completion is the tilette
 * Completed; everything else — including an unassigned tilette — is In progress.
 */
export function deriveTileletteStatus(tilette: TileShareTemplate): TileletteStatus {
	const users = validDesignatedUsers(tilette.designatedUsers);
	if (users.length === 0) return TileletteStatus.InProgress;
	if (users.some((user) => user.rsvpStatus !== InvitationStatus.Accepted)) {
		return TileletteStatus.Todo;
	}
	const fullyComplete = users.every(
		(user) =>
			user.completionPct != null &&
			Number.isFinite(user.completionPct) &&
			user.completionPct >= 100
	);
	return fullyComplete ? TileletteStatus.Completed : TileletteStatus.InProgress;
}

/**
 * Derive a tilette's status for a single viewer (the board's "Just me" lane).
 *
 * Only the viewer's own assignment counts: a not-yet-accepted invitation
 * (None, Tentative or Declined) means the viewer's work cannot have started, so
 * the tilette is Todo. Once the viewer has accepted, 100% completion makes it
 * Completed; an accepted but unfinished (or unknown-completion) tilette is In
 * progress. A viewer with no assignment on the tilette falls back to In
 * progress, matching the unassigned tilette rule of {@link deriveTileletteStatus}.
 */
export function deriveMyTileletteStatus(
	tilette: TileShareTemplate,
	userId: string
): TileletteStatus {
	const mine = validDesignatedUsers(tilette.designatedUsers).find(
		(user) => user.userId === userId
	);
	if (!mine) return TileletteStatus.InProgress;
	if (mine.rsvpStatus !== InvitationStatus.Accepted) return TileletteStatus.Todo;
	const fullyComplete =
		mine.completionPct != null &&
		Number.isFinite(mine.completionPct) &&
		mine.completionPct >= 100;
	return fullyComplete ? TileletteStatus.Completed : TileletteStatus.InProgress;
}

/**
 * Whether a viewer is assigned to the tilette — the "Just me" filter's
 * visibility rule (the viewer appears in `designatedUsers`).
 */
export function isMineAssignment(tilette: TileShareTemplate, userId: string): boolean {
	return validDesignatedUsers(tilette.designatedUsers).some((user) => user.userId === userId);
}

/**
 * Whether dragging the tilette from the Todo lane to In progress should accept
 * the viewer's invitation. Requires an assignment the viewer can respond to
 * (`designatedTileTemplateId`) whose RSVP is still open (None or Tentative) —
 * mirroring the guard used by the inline invitation actions. Already-resolved
 * responses (Accepted/Declined) are never re-accepted by a drag.
 */
export function canAcceptByDrag(tilette: TileShareTemplate, userId: string): boolean {
	const mine = validDesignatedUsers(tilette.designatedUsers).find(
		(user) => user.userId === userId
	);
	if (!mine?.designatedTileTemplateId) return false;
	return (
		mine.rsvpStatus === InvitationStatus.None || mine.rsvpStatus === InvitationStatus.Tentative
	);
}

/**
 * Cluster progress as a whole percentage (0–100), rolled up from the collective
 * tilette statuses. Only Completed tilettes count toward the total; Todo and
 * In progress tilettes both count as unfinished. Returns 0 for an empty
 * (or null) list.
 *
 * `resolveStatus` defaults to {@link deriveTileletteStatus}; it's injectable so
 * the rollup math can be exercised independently of the status rules.
 */
export function computeClusterProgress(
	tilettes: TileShareTemplate[] | null,
	resolveStatus: (tilette: TileShareTemplate) => TileletteStatus = deriveTileletteStatus
): number {
	if (!tilettes || tilettes.length === 0) return 0;

	const completed = tilettes.filter(
		(tilette) => resolveStatus(tilette) === TileletteStatus.Completed
	).length;

	return Math.round((completed / tilettes.length) * 100);
}
