import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import React, { useImperativeHandle, forwardRef } from 'react';
import {
  CalendarRequestProvider,
  useCalendarDispatch,
  useCalendarRequestListener,
} from './CalendarRequestProvider';
import {
  CalendarRequest,
  CalendarRequestEnvelope,
  CalendarRequestResult,
  CalendarEntityType,
  FocusEventRequest,
} from './calendarRequestContext';
import { Actions } from '@/core/constants/enums';

// ── Helpers ────────────────────────────────────────────────────

function createFocusRequest(overrides: Partial<FocusEventRequest> = {}): FocusEventRequest {
  return {
    type: 'focus_event',
    entityId: 'entity-1',
    entityType: CalendarEntityType.SubcalendarEvent,
    actionType: Actions.Add_New_Task,
    ...overrides,
  };
}

/**
 * Test harness component that lives inside CalendarRequestProvider.
 * Provides both dispatch and listener registration via a ref.
 */
interface TestBusHandle {
  dispatch: (request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => void;
}

const TestBusHarness = forwardRef<TestBusHandle, { handler: (e: CalendarRequestEnvelope) => void }>(
  ({ handler }, ref) => {
    const dispatch = useCalendarDispatch();
    useCalendarRequestListener(handler);
    useImperativeHandle(ref, () => ({ dispatch }));
    return null;
  }
);
TestBusHarness.displayName = 'TestBusHarness';

/**
 * Renders a CalendarRequestProvider with a TestBusHarness inside, returning
 * a ref-based `dispatch` function and the react-testing-library result.
 */
function renderBus(handler: (e: CalendarRequestEnvelope) => void) {
  const busRef = React.createRef<TestBusHandle>();

  const result = render(
    <CalendarRequestProvider>
      <TestBusHarness ref={busRef} handler={handler} />
    </CalendarRequestProvider>
  );

  return {
    ...result,
    dispatch: (request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => {
      act(() => {
        busRef.current!.dispatch(request, onResult);
      });
    },
  };
}

/**
 * Variant that supports multiple listeners (renders multiple harnesses
 * in the same provider).
 */
const ListenerOnly: React.FC<{ handler: (e: CalendarRequestEnvelope) => void }> = ({ handler }) => {
  useCalendarRequestListener(handler);
  return null;
};

function renderBusMultiListener(
  handlers: Array<(e: CalendarRequestEnvelope) => void>
) {
  const busRef = React.createRef<TestBusHandle>();

  const result = render(
    <CalendarRequestProvider>
      <TestBusHarness ref={busRef} handler={handlers[0]} />
      {handlers.slice(1).map((h, i) => (
        <ListenerOnly key={i} handler={h} />
      ))}
    </CalendarRequestProvider>
  );

  return {
    ...result,
    dispatch: (request: CalendarRequest, onResult?: (r: CalendarRequestResult) => void) => {
      act(() => {
        busRef.current!.dispatch(request, onResult);
      });
    },
  };
}

// ── CalendarRequestProvider dispatch/subscribe ────────────────

describe('CalendarRequestProvider', () => {
  describe('basic pub/sub', () => {
    it('dispatched request is received by listener', () => {
      const handler = vi.fn();
      const { dispatch } = renderBus(handler);

      dispatch(createFocusRequest());

      expect(handler).toHaveBeenCalledTimes(1);
      const envelope: CalendarRequestEnvelope = handler.mock.calls[0][0];
      expect(envelope.request.type).toBe('focus_event');
      expect((envelope.request as FocusEventRequest).entityId).toBe('entity-1');
    });

    it('onResult callback is available on the envelope', () => {
      const handler = vi.fn();
      const onResult = vi.fn();
      const { dispatch } = renderBus(handler);

      dispatch(createFocusRequest(), onResult);

      // The handler receives the envelope with onResult
      const envelope: CalendarRequestEnvelope = handler.mock.calls[0][0];
      expect(envelope.onResult).toBe(onResult);

      // Calendar calls onResult
      envelope.onResult!({ status: 'found', entityId: 'entity-1' });
      expect(onResult).toHaveBeenCalledWith({ status: 'found', entityId: 'entity-1' });
    });

    it('multiple listeners all receive the dispatch', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const { dispatch } = renderBusMultiListener([handler1, handler2]);

      dispatch(createFocusRequest());

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes listener on unmount', () => {
      const handler = vi.fn();
      const busRef = React.createRef<TestBusHandle>();
      let showListener = true;

      const TestWrapper: React.FC = () => (
        <CalendarRequestProvider>
          <TestBusHarness ref={busRef} handler={() => {}} />
          {showListener && <ListenerOnly handler={handler} />}
        </CalendarRequestProvider>
      );

      const { rerender } = render(<TestWrapper />);

      // Remove the listener by re-rendering without it
      showListener = false;
      rerender(<TestWrapper />);

      // Dispatch after unmount
      act(() => {
        busRef.current!.dispatch(createFocusRequest());
      });

      // The unmounted handler should NOT have been called
      // (it was registered but then removed via cleanup)
      // Note: The TestBusHarness handler (no-op) will still fire
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('schedule context on requests', () => {
    it('FocusEventRequest can carry scheduleContext with afterScheduleId', () => {
      const handler = vi.fn();
      const { dispatch } = renderBus(handler);

      const request = createFocusRequest({
        scheduleContext: {
          afterScheduleId: 'schedule-v2',
          currentScheduleId: 'schedule-v2',
        },
      });

      dispatch(request);

      const envelope: CalendarRequestEnvelope = handler.mock.calls[0][0];
      const focusReq = envelope.request as FocusEventRequest;
      expect(focusReq.scheduleContext?.afterScheduleId).toBe('schedule-v2');
      expect(focusReq.scheduleContext?.currentScheduleId).toBe('schedule-v2');
    });

    it('listener can detect stale request by comparing scheduleContext', () => {
      const onResult = vi.fn();

      // Smart handler that checks schedule consistency
      const smartHandler = (envelope: CalendarRequestEnvelope) => {
        if (envelope.request.type === 'focus_event') {
          const req = envelope.request as FocusEventRequest;
          if (
            req.scheduleContext &&
            req.scheduleContext.afterScheduleId !== req.scheduleContext.currentScheduleId
          ) {
            envelope.onResult?.({ status: 'stale', entityId: req.entityId });
            return;
          }
        }
        envelope.onResult?.({ status: 'found', entityId: 'entity-1' });
      };

      const { dispatch } = renderBus(smartHandler);

      // Dispatch a stale request (afterScheduleId ≠ currentScheduleId)
      const staleRequest = createFocusRequest({
        scheduleContext: {
          afterScheduleId: 'schedule-v1',
          currentScheduleId: 'schedule-v3',
        },
      });

      dispatch(staleRequest, onResult);

      expect(onResult).toHaveBeenCalledWith({
        status: 'stale',
        entityId: 'entity-1',
      });
    });

    it('listener processes valid request when schedule matches', () => {
      const onResult = vi.fn();

      const smartHandler = (envelope: CalendarRequestEnvelope) => {
        if (envelope.request.type === 'focus_event') {
          const req = envelope.request as FocusEventRequest;
          if (
            req.scheduleContext &&
            req.scheduleContext.afterScheduleId !== req.scheduleContext.currentScheduleId
          ) {
            envelope.onResult?.({ status: 'stale', entityId: req.entityId });
            return;
          }
        }
        envelope.onResult?.({ status: 'found', entityId: 'entity-1' });
      };

      const { dispatch } = renderBus(smartHandler);

      const validRequest = createFocusRequest({
        scheduleContext: {
          afterScheduleId: 'schedule-v2',
          currentScheduleId: 'schedule-v2',
        },
      });

      dispatch(validRequest, onResult);

      expect(onResult).toHaveBeenCalledWith({
        status: 'found',
        entityId: 'entity-1',
      });
    });

    it('request without scheduleContext is processed normally (backwards compat)', () => {
      const onResult = vi.fn();

      const handler = (envelope: CalendarRequestEnvelope) => {
        envelope.onResult?.({ status: 'found', entityId: 'entity-1' });
      };

      const { dispatch } = renderBus(handler);

      dispatch(createFocusRequest(), onResult);

      expect(onResult).toHaveBeenCalledWith({
        status: 'found',
        entityId: 'entity-1',
      });
    });
  });

  describe('error handling', () => {
    it('throws when useCalendarDispatch is used outside provider', () => {
      expect(() => {
        renderHook(() => useCalendarDispatch());
      }).toThrow('useCalendarDispatch must be used within CalendarRequestProvider');
    });

    it('throws when useCalendarRequestListener is used outside provider', () => {
      expect(() => {
        renderHook(() => useCalendarRequestListener(() => {}));
      }).toThrow('useCalendarRequestListener must be used within CalendarRequestProvider');
    });

    it('handler errors do not break other listeners', () => {
      const errorHandler = () => { throw new Error('boom'); };
      const goodHandler = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { dispatch } = renderBusMultiListener([errorHandler, goodHandler]);

      dispatch(createFocusRequest());

      // Good handler still receives the dispatch
      expect(goodHandler).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });
  });
});

// ── CalendarRequestResult type tests ─────────────────────────

describe('CalendarRequestResult types', () => {
  it('supports stale status', () => {
    const result: CalendarRequestResult = {
      status: 'stale',
      entityId: 'entity-1',
    };

    // Now a proper member of the union — no cast needed
    expect(result.status).toBe('stale');
  });
});
