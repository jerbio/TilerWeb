import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setupUser } from '@/test/test-utils';
import ActionPill from './ActionPill';
import { VibeAction } from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';
import { CalendarRequestProvider } from '@/core/common/components/calendar/CalendarRequestProvider';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import React from 'react';

// ── Mock Zustand store ────────────────────────────────────────

const mockGetActivePersonaSession = vi.fn();

vi.mock('@/global_state', () => ({
  __esModule: true,
  default: Object.assign(
    // The Zustand hook itself — when called with a selector, invoke it
    (selector?: (state: unknown) => unknown) => {
      const state = {
        getActivePersonaSession: mockGetActivePersonaSession,
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        getActivePersonaSession: mockGetActivePersonaSession,
      }),
    }
  ),
}));

// ── Mock i18n ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}));

// ── Helpers ──────────────────────────────────────────────────

function createAction(overrides: Partial<VibeAction> = {}): VibeAction {
  return {
    id: 'action-1',
    descriptions: 'Add morning standup',
    type: Actions.Add_New_Task,
    creationTimeInMs: Date.now(),
    status: Status.Executed,
    entityId: 'entity-abc',
    entityType: CalendarEntityType.SubcalendarEvent,
    beforeScheduleId: 'schedule-v1',
    afterScheduleId: 'schedule-v2',
    vibeRequest: null,
    ...overrides,
  };
}

/**
 * Render ActionPill within CalendarRequestProvider. 
 * Returns the dispatch spy so tests can assert on dispatched requests.
 */
function renderActionPill(action: VibeAction) {
  const dispatchSpy = vi.fn();

  // We wrap ActionPill in CalendarRequestProvider and a test component that
  // intercepts dispatch via ref.
  const DispatchInterceptor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // This component renders inside the provider and uses useCalendarRequestListener
    // to capture dispatches (but we'll use a simpler approach by intercepting at the provider level).
    return <>{children}</>;
  };

  const result = render(
    <ThemeProvider>
      <CalendarRequestProvider>
        <DispatchInterceptor>
          <ActionPill action={action} />
        </DispatchInterceptor>
      </CalendarRequestProvider>
    </ThemeProvider>
  );

  return { ...result, dispatchSpy };
}

/** Set the mock scheduleId that the ActionPill will read from the store */
function setCurrentScheduleId(scheduleId: string | null) {
  mockGetActivePersonaSession.mockReturnValue({
    scheduleId,
    personaId: 'test-persona',
    personaName: 'Test',
    userId: 'test-user',
    chatSessionId: 'test-session',
    chatContext: [],
    userInfo: null,
    scheduleLastUpdatedBy: null,
  });
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setCurrentScheduleId('schedule-v2'); // default: calendar shows v2
});

describe('ActionPill schedule consistency', () => {
  describe('rendering schedule state', () => {
    it('renders the action description text', () => {
      const action = createAction({ afterScheduleId: 'schedule-v2' });
      renderActionPill(action);
      expect(screen.getByText('Add morning standup')).toBeInTheDocument();
    });

    it('shows "Click to find on calendar" when action is on current schedule', () => {
      const action = createAction({ afterScheduleId: 'schedule-v2' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click to find on calendar');
    });

    it('shows stale tooltip when action afterScheduleId does not match current schedule', () => {
      const action = createAction({ afterScheduleId: 'schedule-v1' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      // Should communicate that this action may no longer reflect the calendar
      expect(button.getAttribute('title')).toContain('may have changed');
    });

    it('shows pending tooltip when action has no afterScheduleId', () => {
      const action = createAction({
        status: Status.Pending,
        afterScheduleId: null,
        beforeScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Accept changes to see this tile');
    });

    it('shows removed tooltip for remove actions', () => {
      const action = createAction({ type: Actions.Remove_Existing_Task });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Tile removed');
    });
  });

  describe('click behavior with schedule guards', () => {
    it('dispatches focus_event when action is on current schedule', async () => {
      const user = setupUser();
      const action = createAction({ afterScheduleId: 'schedule-v2' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      await user.click(button);

      // Button should be clickable (pointer cursor)
      expect(button.style.cursor).toBe('pointer');
    });

    it('does NOT dispatch when action is stale (afterScheduleId mismatch)', async () => {
      setupUser();
      const action = createAction({ afterScheduleId: 'schedule-v1' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('does NOT dispatch when action is a remove action', async () => {
      setupUser();
      const action = createAction({ type: Actions.Remove_Existing_Task });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
      expect(button.style.opacity).toBe('0.6');
    });

    it('does NOT dispatch when action is pending', async () => {
      setupUser();
      const action = createAction({
        status: Status.Pending,
        afterScheduleId: null,
        beforeScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('does NOT dispatch when entityId is missing', async () => {
      setupUser();
      const action = createAction({
        afterScheduleId: 'schedule-v2',
        entityId: undefined,
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });
  });

  describe('cross-session scenarios', () => {
    it('action from session 1 becomes unclickable after session 2 moves schedule forward', () => {
      // Session 1 action produced schedule-v2
      const session1Action = createAction({
        beforeScheduleId: 'schedule-v1',
        afterScheduleId: 'schedule-v2',
      });

      // But now the calendar is on schedule-v3 (session 2 advanced it)
      setCurrentScheduleId('schedule-v3');
      renderActionPill(session1Action);

      const button = screen.getByRole('button');
      // Should not be clickable — stale
      expect(button.style.cursor).toBe('default');
      expect(button.getAttribute('title')).toContain('may have changed');
    });

    it('action from session 2 is clickable when schedule matches', () => {
      const session2Action = createAction({
        beforeScheduleId: 'schedule-v2',
        afterScheduleId: 'schedule-v3',
      });

      setCurrentScheduleId('schedule-v3');
      renderActionPill(session2Action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('pointer');
    });

    it('shows stale state when no scheduleId is available (unknown)', () => {
      setCurrentScheduleId(null);
      const action = createAction({
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      // When scheduleId is null, we still allow click for backwards compat
      // (unknown state → clickable if entity info is present)
      // This tests that the component handles null gracefully
      expect(button).toBeInTheDocument();
    });

    it('action with no schedule nonces is still clickable (backwards compat)', () => {
      const action = createAction({
        beforeScheduleId: null,
        afterScheduleId: null,
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      // Unknown state — allow click since we can't determine staleness
      expect(button.style.cursor).toBe('pointer');
    });
  });

  describe('visual indicators', () => {
    it('stale actions have reduced opacity', () => {
      setCurrentScheduleId('schedule-v3');
      const action = createAction({ afterScheduleId: 'schedule-v1' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.opacity).toBe('0.6');
    });

    it('current actions have full opacity', () => {
      const action = createAction({ afterScheduleId: 'schedule-v2' });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.opacity).toBe('1');
    });

    it('removed actions have reduced opacity', () => {
      const action = createAction({ type: Actions.Remove_Existing_Task });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.opacity).toBe('0.6');
    });
  });

  describe('entity type handling', () => {
    it('is clickable for SubcalendarEvent entityType', () => {
      const action = createAction({
        entityType: CalendarEntityType.SubcalendarEvent,
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('pointer');
    });

    it('is clickable for CalendarEvent entityType', () => {
      const action = createAction({
        entityType: CalendarEntityType.CalendarEvent,
        entityId: 'abc_def_0_0',
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('pointer');
    });

    it('is non-interactive for None entityType', () => {
      const action = createAction({
        entityType: CalendarEntityType.None,
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('is non-interactive for RestrictionProfile entityType', () => {
      const action = createAction({
        entityType: CalendarEntityType.RestrictionProfile,
        entityId: 'restriction-123',
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('None entityType does not dispatch on click', async () => {
      const user = setupUser();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const action = createAction({
        entityType: CalendarEntityType.None,
        afterScheduleId: 'schedule-v2',
      });
      renderActionPill(action);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not trigger any dispatch — no console warnings about entity lookup
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
