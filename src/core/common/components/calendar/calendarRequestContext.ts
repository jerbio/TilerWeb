import { ActionType } from '@/core/common/types/chat';

// ---------------------------------------------------------------------------
// Calendar Request types — discriminated union, extensible per Phase 4+
// ---------------------------------------------------------------------------

/** Entity types that the calendar knows how to display */
export enum CalendarEntityType {
  SubcalendarEvent = 'SubcalendarEvent',
  CalendarEvent = 'CalendarEvent',
  RestrictionProfile = 'RestrictionProfile',
  None = 'None',
}

/** Result reported back to the dispatcher after the calendar processes a request */
export type CalendarRequestResult =
  | { status: 'found'; entityId: string }
  | { status: 'not_found'; entityId: string }
  | { status: 'navigating'; entityId: string }
  | { status: 'stale'; entityId: string }
  | { status: 'error'; message: string };

/**
 * Schedule context attached to a request so the calendar listener
 * can verify the action's schedule version matches what is currently displayed.
 *
 * - `afterScheduleId`   — the schedule version the action produced (from VibeAction)
 * - `currentScheduleId` — the schedule version the calendar currently displays (from Zustand)
 */
export interface ScheduleContext {
  afterScheduleId: string | null;
  currentScheduleId: string | null;
}

// ── Individual request types ───────────────────────────────────

/**
 * Ask the calendar to scroll to / highlight a specific event tile.
 *
 * Dispatched by Chat when the user clicks an action pill.
 * Handled by Calendar internally.
 */
export interface FocusEventRequest {
  type: 'focus_event';
  entityId: string;
  entityType: CalendarEntityType;
  actionType: ActionType;
  /** Optional schedule context for staleness detection */
  scheduleContext?: ScheduleContext;
}

/**
 * Ask the calendar to navigate its view to a specific date.
 *
 * Used internally (Phase 4) when a focus_event target is outside the
 * currently loaded date range.
 */
export interface NavigateToDateRequest {
  type: 'navigate_to_date';
  /** ISO-8601 date string or unix ms timestamp */
  date: string | number;
  /** Optional: after navigating, re-attempt this pending focus */
  pendingFocusEntityId?: string;
}

/** Discriminated union of every request the calendar can handle */
export type CalendarRequest = FocusEventRequest | NavigateToDateRequest;

// ── Envelope — wraps a request with transport-level concerns ───

/**
 * The envelope separates the request payload from transport concerns
 * (like the optional result callback). Listeners receive the full
 * envelope; dispatchers provide the request + optional onResult.
 */
export interface CalendarRequestEnvelope {
  request: CalendarRequest;
  /** Optional callback so the dispatcher can react to the outcome */
  onResult?: (result: CalendarRequestResult) => void;
}

// ── Listener callback signature ────────────────────────────────

export type CalendarRequestHandler = (envelope: CalendarRequestEnvelope) => void;
