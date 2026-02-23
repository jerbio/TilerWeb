import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ---------------------------------------------------------------------------
// Event Date Lookup — fetches a single event's start date via API
// ---------------------------------------------------------------------------

/**
 * Lookup function for `GET /api/SubCalendarEvent?EventID=...`
 * Returns at minimum `{ start }`, or `null` if the event doesn't exist.
 */
export type SubCalEventLookupFn = (
  eventId: string,
) => Promise<{ start: number } | null>;

/**
 * Lookup function for `GET /api/CalendarEvent?EventID=...`
 * Returns the CalendarEvent with its child subEvents, or `null`.
 */
export type CalEventLookupFn = (
  eventId: string,
) => Promise<{
  start: number;
  subEvents: Array<{ id: string; start: number }>;
} | null>;

// ── Params ─────────────────────────────────────────────────────

export interface FindEventDateParams {
  entityId: string;
  entityType: CalendarEntityType;
  /** Injected lookup for SubCalendarEvent endpoint */
  lookupSubCalEvent: SubCalEventLookupFn;
  /** Injected lookup for CalendarEvent endpoint */
  lookupCalEvent: CalEventLookupFn;
}

// ── Core function ──────────────────────────────────────────────

/**
 * Looks up the start date (ms timestamp) of an event by calling
 * the appropriate API endpoint based on `entityType`.
 *
 * - `SubcalendarEvent` → `GET /api/SubCalendarEvent` → `start`
 * - `CalendarEvent`    → `GET /api/CalendarEvent` → earliest `subEvents[].start`
 *                        (falls back to parent `start` if no subEvents)
 * - `RestrictionProfile` / `None` → `null` immediately
 *
 * @returns The start timestamp (ms) to navigate to, or `null` if not found.
 */
export async function findEventDate({
  entityId,
  entityType,
  lookupSubCalEvent,
  lookupCalEvent,
}: FindEventDateParams): Promise<number | null> {
  switch (entityType) {
    case CalendarEntityType.SubcalendarEvent: {
      try {
        const event = await lookupSubCalEvent(entityId);
        return event ? event.start : null;
      } catch {
        return null;
      }
    }

    case CalendarEntityType.CalendarEvent: {
      try {
        const calEvent = await lookupCalEvent(entityId);
        if (!calEvent) return null;

        // Prefer the earliest child subEvent's start (that's what appears on the grid)
        if (calEvent.subEvents.length > 0) {
          const earliest = calEvent.subEvents.reduce(
            (a, b) => (a.start <= b.start ? a : b),
          );
          return earliest.start;
        }

        // Fall back to the CalendarEvent's own start
        return calEvent.start;
      } catch {
        return null;
      }
    }

    case CalendarEntityType.RestrictionProfile:
    case CalendarEntityType.None:
      return null;

    default:
      return null;
  }
}
