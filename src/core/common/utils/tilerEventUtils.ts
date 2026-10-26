/**
 * Normalize a calendar-event id to the root id form the backend expects
 * (`<root>_7_0_0`) when looking up a calendar event or its sub-events.
 *
 * A calendar-event id looks like `<root>_<a>_<b>_<c>`; only the `<root>`
 * segment identifies the parent event. This is idempotent for ids that are
 * already normalized.
 */
export function normalizeRootId(eventId: string): string {
	const root = (eventId ?? '').split('_')[0];
	return `${root}_7_0_0`;
}
