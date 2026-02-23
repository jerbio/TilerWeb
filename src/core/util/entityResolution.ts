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
  events: readonly EventLike[],
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
        (e) => e.id.startsWith(prefix + '_') && !isCalendarEventId(e.id),
      );
      if (children.length === 0) return null;
      // Return the earliest child by start time
      const earliest = children.reduce((a, b) => (a.start <= b.start ? a : b));
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
