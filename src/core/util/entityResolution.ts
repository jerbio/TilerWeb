import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ---------------------------------------------------------------------------
// Entity Resolution — maps entity IDs + types to tile IDs on the calendar grid
// ---------------------------------------------------------------------------

/**
 * Extracts the first two underscore-separated segments from an entity ID.
 *
 * Both CalendarEvent (`abcd_efgh_0_0`) and SubcalendarEvent (`abcd_efgh_ijkl_mnop`)
 * share the same first two segments, which serve as the parent CalendarEvent key.
 */
export function extractCalendarEventPrefix(entityId: string): string {
	const segments = entityId.split('_');
	if (segments.length < 2) return entityId;
	return `${segments[0]}_${segments[1]}`;
}

/**
 * Derives the parent CalendarEvent ID from any entity ID (sub-event or calendar event).
 *
 * CalendarEvent IDs follow the pattern `prefix_0_0`. Given a SubcalendarEvent ID
 * like `prefix_ijkl_mnop`, this extracts the shared prefix and appends `_0_0`.
 * If the ID is already a CalendarEvent ID, it is returned unchanged.
 */
export function getCalendarEventId(entityId: string): string {
	return `${extractCalendarEventPrefix(entityId)}_0_0`;
}

/**
 * Returns `true` if the given ID has the CalendarEvent format (`xxxx_xxxx_0_0`).
 *
 * This is used to exclude CalendarEvent-shaped entries from the child search,
 * since the calendar grid should only render SubcalendarEvent tiles.
 */
export function isCalendarEventId(id: string): boolean {
	const segments = id.split('_');
	if (segments.length < 4) return false;
	return segments[2] === '0' && segments[3] === '0';
}

/**
 * Minimal shape required from a styled event for resolution.
 * Keeps this utility decoupled from the full StyledEvent type.
 */
interface EventLike {
	id: string;
	start: number;
}

/**
 * Third-party routing reference used to resolve a focus target when the
 * caller's `entityId` is not a stable calendar identifier (e.g. the
 * timeline SearchBar's multi-source results, whose `id` is a search-time
 * value that never matches a grid tile).
 */
export type ThirdPartyEventRef = {
	thirdPartyType?: string | null;
	thirdPartyId?: string | null;
	thirdPartyUserId?: string | null;
};

/** Minimal shape required for third-party resolution. */
type ThirdPartyEventLike = EventLike & {
	thirdPartyType?: string | null;
	thirdPartyId?: string | null;
	thirdPartyUserId?: string | null;
};

function normalizeId(value: string | null | undefined): string {
	return String(value ?? '')
		.trim()
		.toLowerCase();
}

/**
 * True when the given event matches the supplied third-party reference.
 *
 * `thirdPartyId` is the stable unique identifier for third-party events, so a
 * reference without one never matches — matching only on type/userId could
 * focus the wrong tile. `thirdPartyType` and `thirdPartyUserId` are applied
 * as additional AND filters when present (type compared case-insensitively
 * because the wire casing is inconsistent: `thirdpartyType` vs `thirdPartyType`).
 */
function matchesThirdPartyReference(event: ThirdPartyEventLike, ref: ThirdPartyEventRef): boolean {
	const refId = normalizeId(ref.thirdPartyId);
	if (!refId) return false;
	if (normalizeId(event.thirdPartyId) !== refId) return false;

	const refType = ref.thirdPartyType?.trim().toLowerCase();
	if (
		refType &&
		String(event.thirdPartyType ?? '')
			.trim()
			.toLowerCase() !== refType
	) {
		return false;
	}

	if (
		ref.thirdPartyUserId != null &&
		String(event.thirdPartyUserId ?? '') !== String(ref.thirdPartyUserId)
	) {
		return false;
	}
	return true;
}

/**
 * Resolves a third-party reference to a concrete tile ID on the calendar
 * grid, or `null` when no rendered tile matches.
 *
 * When several tiles share the reference (e.g. a multi-day event split into
 * visual segments), the earliest by `start` is returned — the same rule
 * {@link resolveEntityToTileId} applies to parent-event resolution.
 */
export function resolveThirdPartyToTileId(
	ref: ThirdPartyEventRef,
	events: readonly ThirdPartyEventLike[]
): string | null {
	const matches = events.filter((e) => matchesThirdPartyReference(e, ref));
	if (matches.length === 0) return null;
	const earliest = matches.reduce((a, b) => (a.start <= b.start ? a : b), matches[0]);
	return earliest.id;
}

/**
 * Resolves a focus target to a concrete tile ID, preferring third-party
 * routing metadata when the caller supplied it and a tile matches, and
 * falling back to the classic entity-ID resolution otherwise.
 *
 * Callers that omit `thirdParty` keep today's behavior untouched.
 */
export function resolveTileForFocus(
	entityId: string,
	entityType: CalendarEntityType,
	events: readonly EventLike[],
	thirdParty?: ThirdPartyEventRef
): string | null {
	if (thirdParty) {
		const byThirdParty = resolveThirdPartyToTileId(
			thirdParty,
			events as readonly ThirdPartyEventLike[]
		);
		if (byThirdParty) return byThirdParty;
	}
	return resolveEntityToTileId(entityId, entityType, events);
}

/**
 * Resolves an entity ID + type to a concrete tile ID on the calendar grid.
 *
 * - `SubcalendarEvent` → direct ID lookup
 * - `CalendarEvent`    → prefix-match children, return the earliest by `start`
 * - `RestrictionProfile` → not yet supported, returns `null`
 * - `None` → no calendar tile, returns `null`
 *
 * @returns The tile ID to focus, or `null` if no matching tile was found.
 */
export function resolveEntityToTileId(
	entityId: string,
	entityType: CalendarEntityType,
	events: readonly EventLike[]
): string | null {
	switch (entityType) {
		case CalendarEntityType.SubcalendarEvent: {
			const match = events.find((e) => e.id === entityId);
			return match ? match.id : null;
		}

		case CalendarEntityType.CalendarEvent: {
			const prefix = extractCalendarEventPrefix(entityId);
			// Find all child SubcalendarEvents sharing the same prefix,
			// excluding any CalendarEvent-shaped IDs.
			const children = events.filter(
				(e) => e.id.startsWith(prefix + '_') && !isCalendarEventId(e.id)
			);
			if (children.length === 0) return null;
			// Return the earliest child by start time
			const earliest = children.reduce((a, b) => (a.start <= b.start ? a : b), children[0]);
			return earliest.id;
		}

		case CalendarEntityType.RestrictionProfile:
			// Not yet supported — skip
			return null;

		case CalendarEntityType.None:
			return null;

		default:
			return null;
	}
}
