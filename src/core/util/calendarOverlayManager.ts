/**
 * Pure reducer that governs calendar overlay dismiss / show rules.
 *
 * Two overlays coexist in the calendar:
 *   1. Non-viable events panel  (`nonViableDay`)
 *   2. Event-info detail modal  (`eventInfoEventId` + `selectedEventId`)
 *
 * This module encodes every interaction that can open, close, or swap them
 * so the logic is testable without rendering the full Calendar component.
 */

// ── State ──────────────────────────────────────────────────────

export type OverlayState = {
	/** Day-key (ISO) for which the non-viable overlay is open, or null. */
	nonViableDay: string | null;
	/** Event ID whose info modal is shown, or null. */
	eventInfoEventId: string | null;
	/** Currently highlight-selected event on the grid, or null. */
	selectedEventId: string | null;
};

export const initialOverlayState: OverlayState = {
	nonViableDay: null,
	eventInfoEventId: null,
	selectedEventId: null,
};

// ── Actions ────────────────────────────────────────────────────

export enum OverlayActionType {
	VIABLE_EVENT_CLICKED = 'VIABLE_EVENT_CLICKED',
	NON_VIABLE_EVENT_CLICKED = 'NON_VIABLE_EVENT_CLICKED',
	DAY_NAVIGATED = 'DAY_NAVIGATED',
	FOCUS_VIABLE_EVENT = 'FOCUS_VIABLE_EVENT',
	FOCUS_NON_VIABLE_EVENT = 'FOCUS_NON_VIABLE_EVENT',
	TOGGLE_NON_VIABLE_OVERLAY = 'TOGGLE_NON_VIABLE_OVERLAY',
	NAVIGATE_TO_DATE = 'NAVIGATE_TO_DATE',
	CONTENT_CLICK_OUTSIDE = 'CONTENT_CLICK_OUTSIDE',
	EVENTS_RELOADED = 'EVENTS_RELOADED',
	CLOSE_EVENT_INFO = 'CLOSE_EVENT_INFO',
}

export type OverlayAction =
	| { type: OverlayActionType.VIABLE_EVENT_CLICKED; eventId: string }
	| { type: OverlayActionType.NON_VIABLE_EVENT_CLICKED; eventId: string; day: string }
	| { type: OverlayActionType.DAY_NAVIGATED }
	| { type: OverlayActionType.FOCUS_VIABLE_EVENT; eventId: string }
	| { type: OverlayActionType.FOCUS_NON_VIABLE_EVENT; eventId: string; day: string }
	| { type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY; day: string }
	| { type: OverlayActionType.NAVIGATE_TO_DATE }
	| { type: OverlayActionType.CONTENT_CLICK_OUTSIDE }
	| { type: OverlayActionType.EVENTS_RELOADED }
	| { type: OverlayActionType.CLOSE_EVENT_INFO };

// ── Reducer ────────────────────────────────────────────────────

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
	switch (action.type) {
		// ── Grid interactions ──────────────────────────────────

		case OverlayActionType.VIABLE_EVENT_CLICKED:
			return {
				nonViableDay: null,
				selectedEventId: action.eventId,
				eventInfoEventId: action.eventId,
			};

		case OverlayActionType.NON_VIABLE_EVENT_CLICKED:
			return {
				nonViableDay: action.day,
				selectedEventId: action.eventId,
				eventInfoEventId: action.eventId,
			};

		// ── Day navigation (chevron arrows / swipe) ───────────

		case OverlayActionType.DAY_NAVIGATED:
			return { ...initialOverlayState };

		// ── ActionPill focus requests ─────────────────────────

		case OverlayActionType.FOCUS_VIABLE_EVENT:
			return {
				nonViableDay: null,
				selectedEventId: action.eventId,
				eventInfoEventId: action.eventId,
			};

		case OverlayActionType.FOCUS_NON_VIABLE_EVENT:
			return {
				nonViableDay: action.day,
				selectedEventId: action.eventId,
				eventInfoEventId: action.eventId,
			};

		// ── Non-viable toggle button ─────────────────────────

		case OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY: {
			const isClosing = state.nonViableDay !== null && state.nonViableDay === action.day;

			if (isClosing) {
				// Closing — keep event info as-is
				return {
					...state,
					nonViableDay: null,
				};
			}
			// Opening (or switching day) — dismiss event info
			return {
				nonViableDay: action.day,
				selectedEventId: null,
				eventInfoEventId: null,
			};
		}

		// ── Phase 4: date navigation for tile lookup ─────────

		case OverlayActionType.NAVIGATE_TO_DATE:
			return { ...initialOverlayState };

		// ── Clicking on the calendar content background ──────

		case OverlayActionType.CONTENT_CLICK_OUTSIDE:
			return { ...initialOverlayState };

		// ── Events data refreshed ────────────────────────────

		case OverlayActionType.EVENTS_RELOADED:
			return {
				...state,
				selectedEventId: null,
				eventInfoEventId: null,
			};

		// ── Explicit close of event info ─────────────────────

		case OverlayActionType.CLOSE_EVENT_INFO:
			return {
				...state,
				selectedEventId: null,
				eventInfoEventId: null,
			};

		default:
			return state;
	}
}
