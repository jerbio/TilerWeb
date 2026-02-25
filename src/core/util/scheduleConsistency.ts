import { VibeAction } from '@/core/common/types/chat';
import { Actions } from '@/core/constants/enums';

// ---------------------------------------------------------------------------
// Schedule Consistency — determines if an action's schedule nonces
// still match what the calendar is currently showing.
//
// When changes are accepted across multiple chat sessions the schedule ID
// advances each time (v1 → v2 → v3 …). Actions from earlier sessions carry
// the schedule ID they produced (`afterScheduleId`). If the calendar has
// since moved to a newer version, those actions are "stale".
// ---------------------------------------------------------------------------

/**
 * Possible schedule-relative states for a VibeAction.
 *
 * - `current`  – afterScheduleId matches the calendar's schedule → tile is present
 * - `stale`    – afterScheduleId does NOT match → a later accept superseded this
 * - `pending`  – no afterScheduleId yet; beforeScheduleId matches (pre-accept)
 * - `removed`  – action is a remove-type; tile won't be on the calendar
 * - `unknown`  – not enough information (no nonces, or no current schedule)
 */
export enum ScheduleState {
  Current = 'current',
  Stale = 'stale',
  Pending = 'pending',
  Removed = 'removed',
  Unknown = 'unknown',
}

/**
 * Determine the schedule-relative state of a VibeAction.
 *
 * @param action           The action to evaluate
 * @param currentScheduleId The scheduleId the calendar currently shows (from Zustand)
 * @returns One of the `ScheduleState` values
 */
export function getActionScheduleState(
  action: VibeAction,
  currentScheduleId: string | null,
): ScheduleState {
  // Remove actions — the tile is gone regardless of schedule version
  if (action.type === Actions.Remove_Existing_Task) {
    return ScheduleState.Removed;
  }

  // If we don't know the current schedule, we can't assess consistency
  if (!currentScheduleId) {
    return ScheduleState.Unknown;
  }

  const { beforeScheduleId, afterScheduleId } = action;

  // If the action has an afterScheduleId it was already accepted
  if (afterScheduleId) {
    return afterScheduleId === currentScheduleId
      ? ScheduleState.Current
      : ScheduleState.Stale;
  }

  // No afterScheduleId — this action hasn't been accepted yet
  if (beforeScheduleId) {
    // If beforeScheduleId matches current, the action is pending accept
    // on the schedule the calendar currently displays
    return beforeScheduleId === currentScheduleId
      ? ScheduleState.Pending
      : ScheduleState.Stale; // schedule has moved on since this action was created
  }

  // No nonces at all
  return ScheduleState.Unknown;
}

/**
 * Convenience predicate — true only when the action's resulting tile
 * is expected to be on the calendar the user is currently viewing.
 */
export function isActionOnCurrentSchedule(
  action: VibeAction,
  currentScheduleId: string | null,
): boolean {
  return getActionScheduleState(action, currentScheduleId) === ScheduleState.Current;
}
