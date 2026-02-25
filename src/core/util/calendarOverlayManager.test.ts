import { describe, it, expect } from 'vitest';
import {
  overlayReducer,
  OverlayState,
  OverlayActionType,
  initialOverlayState,
} from './calendarOverlayManager';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function stateWith(overrides: Partial<OverlayState> = {}): OverlayState {
  return { ...initialOverlayState, ...overrides };
}

const MONDAY = '2026-02-23';
const TUESDAY = '2026-02-24';

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('calendarOverlayManager', () => {
  // â”€â”€ Viable event clicked on grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('VIABLE_EVENT_CLICKED', () => {
    it('dismisses the non-viable overlay', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.VIABLE_EVENT_CLICKED,
        eventId: 'evt-1',
      });
      expect(next.nonViableDay).toBeNull();
    });

    it('sets selectedEventId', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.VIABLE_EVENT_CLICKED,
        eventId: 'evt-1',
      });
      expect(next.selectedEventId).toBe('evt-1');
    });

    it('opens event info panel', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.VIABLE_EVENT_CLICKED,
        eventId: 'evt-1',
      });
      expect(next.eventInfoEventId).toBe('evt-1');
    });

    it('dismisses event info for a previously selected event', () => {
      const state = stateWith({
        selectedEventId: 'evt-old',
        eventInfoEventId: 'evt-old',
      });
      const next = overlayReducer(state, {
        type: OverlayActionType.VIABLE_EVENT_CLICKED,
        eventId: 'evt-new',
      });
      expect(next.eventInfoEventId).toBe('evt-new');
      expect(next.selectedEventId).toBe('evt-new');
    });
  });

  // â”€â”€ Non-viable event clicked on grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('NON_VIABLE_EVENT_CLICKED', () => {
    it('keeps the non-viable overlay open for the same day', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.NON_VIABLE_EVENT_CLICKED,
        eventId: 'nv-1',
        day: MONDAY,
      });
      expect(next.nonViableDay).toBe(MONDAY);
    });

    it('sets selectedEventId', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.NON_VIABLE_EVENT_CLICKED,
        eventId: 'nv-1',
        day: MONDAY,
      });
      expect(next.selectedEventId).toBe('nv-1');
    });

    it('opens event info panel', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.NON_VIABLE_EVENT_CLICKED,
        eventId: 'nv-1',
        day: MONDAY,
      });
      expect(next.eventInfoEventId).toBe('nv-1');
    });
  });

  // â”€â”€ Day navigation (chevron arrows) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('DAY_NAVIGATED', () => {
    it('dismisses the non-viable overlay', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, { type: OverlayActionType.DAY_NAVIGATED });
      expect(next.nonViableDay).toBeNull();
    });

    it('dismisses the event info panel', () => {
      const state = stateWith({ eventInfoEventId: 'evt-1' });
      const next = overlayReducer(state, { type: OverlayActionType.DAY_NAVIGATED });
      expect(next.eventInfoEventId).toBeNull();
    });

    it('clears selectedEventId', () => {
      const state = stateWith({ selectedEventId: 'evt-1' });
      const next = overlayReducer(state, { type: OverlayActionType.DAY_NAVIGATED });
      expect(next.selectedEventId).toBeNull();
    });

    it('is a no-op when nothing is open', () => {
      const next = overlayReducer(initialOverlayState, { type: OverlayActionType.DAY_NAVIGATED });
      expect(next).toEqual(initialOverlayState);
    });
  });

  // â”€â”€ ActionPill focus â†’ viable event â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('FOCUS_VIABLE_EVENT', () => {
    it('dismisses the non-viable overlay', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.FOCUS_VIABLE_EVENT,
        eventId: 'evt-1',
      });
      expect(next.nonViableDay).toBeNull();
    });

    it('sets selectedEventId', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.FOCUS_VIABLE_EVENT,
        eventId: 'evt-1',
      });
      expect(next.selectedEventId).toBe('evt-1');
    });

    it('opens event info panel for the focused event', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.FOCUS_VIABLE_EVENT,
        eventId: 'evt-1',
      });
      expect(next.eventInfoEventId).toBe('evt-1');
    });

    it('replaces a previously open event info panel', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-old',
        selectedEventId: 'evt-old',
      });
      const next = overlayReducer(state, {
        type: OverlayActionType.FOCUS_VIABLE_EVENT,
        eventId: 'evt-new',
      });
      expect(next.eventInfoEventId).toBe('evt-new');
    });
  });

  // â”€â”€ ActionPill focus â†’ non-viable event â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('FOCUS_NON_VIABLE_EVENT', () => {
    it('opens the non-viable overlay for the event day', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.FOCUS_NON_VIABLE_EVENT,
        eventId: 'nv-1',
        day: TUESDAY,
      });
      expect(next.nonViableDay).toBe(TUESDAY);
    });

    it('sets selectedEventId', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.FOCUS_NON_VIABLE_EVENT,
        eventId: 'nv-1',
        day: TUESDAY,
      });
      expect(next.selectedEventId).toBe('nv-1');
    });

    it('opens event info for the focused event', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.FOCUS_NON_VIABLE_EVENT,
        eventId: 'nv-1',
        day: TUESDAY,
      });
      expect(next.eventInfoEventId).toBe('nv-1');
    });

    it('switches overlay from a different day', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.FOCUS_NON_VIABLE_EVENT,
        eventId: 'nv-1',
        day: TUESDAY,
      });
      expect(next.nonViableDay).toBe(TUESDAY);
    });
  });

  // â”€â”€ Toggle non-viable overlay button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('TOGGLE_NON_VIABLE_OVERLAY', () => {
    it('opens the overlay when closed', () => {
      const next = overlayReducer(initialOverlayState, {
        type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY,
        day: MONDAY,
      });
      expect(next.nonViableDay).toBe(MONDAY);
    });

    it('closes overlay when toggling the same day', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY,
        day: MONDAY,
      });
      expect(next.nonViableDay).toBeNull();
    });

    it('switches to different day when another day is already open', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, {
        type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY,
        day: TUESDAY,
      });
      expect(next.nonViableDay).toBe(TUESDAY);
    });

    it('dismisses event info panel when opening', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, {
        type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY,
        day: MONDAY,
      });
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('does not dismiss event info when closing (toggle off same day)', () => {
      const state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'nv-1',
        selectedEventId: 'nv-1',
      });
      const next = overlayReducer(state, {
        type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY,
        day: MONDAY,
      });
      // Closing the overlay â€” event info stays for now (user can close it separately)
      expect(next.nonViableDay).toBeNull();
      expect(next.eventInfoEventId).toBe('nv-1');
    });
  });

  // â”€â”€ Date navigation (Phase 4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('NAVIGATE_TO_DATE', () => {
    it('dismisses non-viable overlay', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, { type: OverlayActionType.NAVIGATE_TO_DATE });
      expect(next.nonViableDay).toBeNull();
    });

    it('dismisses event info panel', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.NAVIGATE_TO_DATE });
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });
  });

  // â”€â”€ Content area click outside â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('CONTENT_CLICK_OUTSIDE', () => {
    it('dismisses event info panel', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.CONTENT_CLICK_OUTSIDE });
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('dismisses non-viable overlay', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, { type: OverlayActionType.CONTENT_CLICK_OUTSIDE });
      expect(next.nonViableDay).toBeNull();
    });

    it('dismisses both when both are open', () => {
      const state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.CONTENT_CLICK_OUTSIDE });
      expect(next.nonViableDay).toBeNull();
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });
  });

  // â”€â”€ Events reloaded â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('EVENTS_RELOADED', () => {
    it('dismisses event info panel (data may be stale)', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.EVENTS_RELOADED });
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('preserves non-viable overlay (non-viable list refreshes in place)', () => {
      const state = stateWith({ nonViableDay: MONDAY });
      const next = overlayReducer(state, { type: OverlayActionType.EVENTS_RELOADED });
      expect(next.nonViableDay).toBe(MONDAY);
    });
  });

  // â”€â”€ Close event info (explicit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('CLOSE_EVENT_INFO', () => {
    it('clears event info and selection', () => {
      const state = stateWith({
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.CLOSE_EVENT_INFO });
      expect(next.eventInfoEventId).toBeNull();
      expect(next.selectedEventId).toBeNull();
    });

    it('preserves non-viable overlay', () => {
      const state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'nv-1',
        selectedEventId: 'nv-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.CLOSE_EVENT_INFO });
      expect(next.nonViableDay).toBe(MONDAY);
    });
  });

  // â”€â”€ Compound scenarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('compound scenarios', () => {
    it('toggling non-viable overlay â†’ clicking viable event â†’ both dismissed', () => {
      let state = initialOverlayState;
      // Open non-viable overlay
      state = overlayReducer(state, { type: OverlayActionType.TOGGLE_NON_VIABLE_OVERLAY, day: MONDAY });
      expect(state.nonViableDay).toBe(MONDAY);

      // Click a non-viable event to open info
      state = overlayReducer(state, {
        type: OverlayActionType.NON_VIABLE_EVENT_CLICKED,
        eventId: 'nv-1',
        day: MONDAY,
      });
      expect(state.eventInfoEventId).toBe('nv-1');

      // Now click a viable event on the grid
      state = overlayReducer(state, {
        type: OverlayActionType.VIABLE_EVENT_CLICKED,
        eventId: 'evt-2',
      });
      expect(state.nonViableDay).toBeNull();
      expect(state.eventInfoEventId).toBe('evt-2');
      expect(state.selectedEventId).toBe('evt-2');
    });

    it('ActionPill viable focus while non-viable overlay is open â†’ overlay dismissed, event focused', () => {
      let state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'nv-1',
        selectedEventId: 'nv-1',
      });
      state = overlayReducer(state, {
        type: OverlayActionType.FOCUS_VIABLE_EVENT,
        eventId: 'evt-1',
      });
      expect(state.nonViableDay).toBeNull();
      expect(state.eventInfoEventId).toBe('evt-1');
    });

    it('navigate to date â†’ events reload â†’ clean slate', () => {
      let state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      // Phase 4 navigation
      state = overlayReducer(state, { type: OverlayActionType.NAVIGATE_TO_DATE });
      expect(state.nonViableDay).toBeNull();
      expect(state.eventInfoEventId).toBeNull();

      // Events reload
      state = overlayReducer(state, { type: OverlayActionType.EVENTS_RELOADED });
      expect(state).toEqual(initialOverlayState);
    });

    it('day navigation â†’ clean slate', () => {
      const state = stateWith({
        nonViableDay: MONDAY,
        eventInfoEventId: 'evt-1',
        selectedEventId: 'evt-1',
      });
      const next = overlayReducer(state, { type: OverlayActionType.DAY_NAVIGATED });
      expect(next).toEqual(initialOverlayState);
    });
  });
});
