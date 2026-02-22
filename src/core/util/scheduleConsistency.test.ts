import { describe, it, expect } from 'vitest';
import {
  getActionScheduleState,
  isActionOnCurrentSchedule,
  ScheduleState,
} from './scheduleConsistency';
import { Actions, Status } from '@/core/constants/enums';
import { VibeAction } from '@/core/common/types/chat';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ── Helpers ────────────────────────────────────────────────────

/** Factory for building VibeAction test fixtures */
function createAction(overrides: Partial<VibeAction> = {}): VibeAction {
  return {
    id: 'action-1',
    descriptions: 'Test action',
    type: Actions.Add_New_Task,
    creationTimeInMs: Date.now(),
    status: Status.Executed,
    entityId: 'entity-abc',
    entityType: CalendarEntityType.SubcalendarEvent,
    beforeScheduleId: null,
    afterScheduleId: null,
    vibeRequest: null,
    ...overrides,
  };
}

// ── getActionScheduleState ─────────────────────────────────────

describe('getActionScheduleState', () => {
  // --- Actions without schedule nonces ---

  it('returns "unknown" when action has no schedule nonces', () => {
    const action = createAction({
      beforeScheduleId: null,
      afterScheduleId: null,
    });
    expect(getActionScheduleState(action, 'schedule-1')).toBe(ScheduleState.Unknown);
  });

  it('returns "unknown" when current scheduleId is null', () => {
    const action = createAction({
      beforeScheduleId: 'sched-before',
      afterScheduleId: 'sched-after',
    });
    expect(getActionScheduleState(action, null)).toBe(ScheduleState.Unknown);
  });

  // --- Actions that are on the current schedule ---

  it('returns "current" when afterScheduleId matches current scheduleId', () => {
    const action = createAction({
      afterScheduleId: 'schedule-v2',
    });
    expect(getActionScheduleState(action, 'schedule-v2')).toBe(ScheduleState.Current);
  });

  // --- Actions that are stale (superseded by later accept) ---

  it('returns "stale" when afterScheduleId does NOT match current scheduleId', () => {
    const action = createAction({
      afterScheduleId: 'schedule-v1',
    });
    expect(getActionScheduleState(action, 'schedule-v3')).toBe(ScheduleState.Stale);
  });

  it('returns "stale" when both nonces are present but afterScheduleId mismatches', () => {
    const action = createAction({
      beforeScheduleId: 'schedule-v0',
      afterScheduleId: 'schedule-v1',
    });
    expect(getActionScheduleState(action, 'schedule-v3')).toBe(ScheduleState.Stale);
  });

  // --- Pre-accept state (action has beforeScheduleId matching, no afterScheduleId) ---

  it('returns "pending" when beforeScheduleId matches current but no afterScheduleId', () => {
    const action = createAction({
      beforeScheduleId: 'schedule-v1',
      afterScheduleId: null,
      status: Status.Pending,
    });
    expect(getActionScheduleState(action, 'schedule-v1')).toBe(ScheduleState.Pending);
  });

  it('returns "pending" when only beforeScheduleId is present and it matches', () => {
    const action = createAction({
      beforeScheduleId: 'schedule-v1',
      afterScheduleId: null,
      status: Status.Parsed,
    });
    expect(getActionScheduleState(action, 'schedule-v1')).toBe(ScheduleState.Pending);
  });

  // --- Removed actions ---

  it('returns "removed" for remove actions regardless of schedule nonces', () => {
    const action = createAction({
      type: Actions.Remove_Existing_Task,
      afterScheduleId: 'schedule-v2',
    });
    expect(getActionScheduleState(action, 'schedule-v2')).toBe(ScheduleState.Removed);
  });

  it('returns "removed" for remove actions even when stale', () => {
    const action = createAction({
      type: Actions.Remove_Existing_Task,
      afterScheduleId: 'schedule-v1',
    });
    expect(getActionScheduleState(action, 'schedule-v3')).toBe(ScheduleState.Removed);
  });

  // --- Edge case: beforeScheduleId only, but it does NOT match current ---

  it('returns "stale" when beforeScheduleId does not match and afterScheduleId is null', () => {
    const action = createAction({
      beforeScheduleId: 'schedule-old',
      afterScheduleId: null,
      status: Status.Pending,
    });
    expect(getActionScheduleState(action, 'schedule-new')).toBe(ScheduleState.Stale);
  });
});

// ── isActionOnCurrentSchedule ──────────────────────────────────

describe('isActionOnCurrentSchedule', () => {
  it('returns true when state is "current"', () => {
    const action = createAction({ afterScheduleId: 'schedule-v2' });
    expect(isActionOnCurrentSchedule(action, 'schedule-v2')).toBe(true);
  });

  it('returns false when state is "stale"', () => {
    const action = createAction({ afterScheduleId: 'schedule-v1' });
    expect(isActionOnCurrentSchedule(action, 'schedule-v3')).toBe(false);
  });

  it('returns false when state is "pending" (not yet accepted)', () => {
    const action = createAction({
      beforeScheduleId: 'schedule-v1',
      afterScheduleId: null,
      status: Status.Pending,
    });
    expect(isActionOnCurrentSchedule(action, 'schedule-v1')).toBe(false);
  });

  it('returns false when state is "removed"', () => {
    const action = createAction({
      type: Actions.Remove_Existing_Task,
      afterScheduleId: 'schedule-v2',
    });
    expect(isActionOnCurrentSchedule(action, 'schedule-v2')).toBe(false);
  });

  it('returns false when state is "unknown" (no nonces)', () => {
    const action = createAction({
      beforeScheduleId: null,
      afterScheduleId: null,
    });
    expect(isActionOnCurrentSchedule(action, 'schedule-v1')).toBe(false);
  });
});

// ── Cross-session scenario integration tests ─────────────────

describe('cross-session schedule consistency', () => {
  it('session 1 actions become stale after session 2 accept', () => {
    // Session 1: user accepts changes → schedule moves from v1 → v2
    const session1Action = createAction({
      beforeScheduleId: 'schedule-v1',
      afterScheduleId: 'schedule-v2',
    });

    // At this point calendar shows schedule-v2, action is current
    expect(getActionScheduleState(session1Action, 'schedule-v2')).toBe(ScheduleState.Current);
    expect(isActionOnCurrentSchedule(session1Action, 'schedule-v2')).toBe(true);

    // Session 2: user accepts more changes → schedule moves from v2 → v3
    const session2Action = createAction({
      id: 'action-2',
      beforeScheduleId: 'schedule-v2',
      afterScheduleId: 'schedule-v3',
    });

    // Now calendar shows schedule-v3
    // Session 2 action is current
    expect(getActionScheduleState(session2Action, 'schedule-v3')).toBe(ScheduleState.Current);
    expect(isActionOnCurrentSchedule(session2Action, 'schedule-v3')).toBe(true);

    // Session 1 action is now stale — its afterScheduleId (v2) doesn't match current (v3)
    expect(getActionScheduleState(session1Action, 'schedule-v3')).toBe(ScheduleState.Stale);
    expect(isActionOnCurrentSchedule(session1Action, 'schedule-v3')).toBe(false);
  });

  it('actions from multiple sessions form a chain of staleness', () => {
    const actions = [
      createAction({ id: 'a1', beforeScheduleId: 's0', afterScheduleId: 's1' }),
      createAction({ id: 'a2', beforeScheduleId: 's1', afterScheduleId: 's2' }),
      createAction({ id: 'a3', beforeScheduleId: 's2', afterScheduleId: 's3' }),
    ];

    const currentSchedule = 's3';

    // Only the latest action references the current schedule
    expect(getActionScheduleState(actions[0], currentSchedule)).toBe(ScheduleState.Stale);
    expect(getActionScheduleState(actions[1], currentSchedule)).toBe(ScheduleState.Stale);
    expect(getActionScheduleState(actions[2], currentSchedule)).toBe(ScheduleState.Current);
  });

  it('pending actions from a stale schedule are recognized as stale', () => {
    const pendingAction = createAction({
      status: Status.Pending,
      beforeScheduleId: 'schedule-v1',
      afterScheduleId: null,
    });

    // If current schedule has already moved past v1, pending action is stale
    expect(getActionScheduleState(pendingAction, 'schedule-v2')).toBe(ScheduleState.Stale);
  });

  it('pending actions from the current schedule are recognized as pending', () => {
    const pendingAction = createAction({
      status: Status.Pending,
      beforeScheduleId: 'schedule-v2',
      afterScheduleId: null,
    });

    // Schedule hasn't changed yet — action is pending
    expect(getActionScheduleState(pendingAction, 'schedule-v2')).toBe(ScheduleState.Pending);
  });
});
