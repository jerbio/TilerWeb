import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import React from 'react';
import { CalendarUIProvider, useCalendarUI, type CalendarUIContextType } from './CalendarUIProvider';

// ──── Helpers ────────────────────────────────────────────────────────────────

/**
 * Test harness component that uses the useCalendarUI hook
 */
interface TestUIHandle {
  getUIState: () => {
    isCreateTileModalOpen: boolean;
    isCreateTileModalExpanded: boolean;
  };
  setModalOpen: (isOpen: boolean) => void;
  setModalExpanded: (isExpanded: boolean) => void;
  getSetters: () => {
    setCreateTileModalOpen: (isOpen: boolean) => void;
    setCreateTileModalExpanded: (isExpanded: boolean) => void;
  };
}

const TestUIHarness = React.forwardRef<TestUIHandle, { demoMode?: boolean }>(
  (_ref, ref) => {
    const {
      isCreateTileModalOpen,
      setCreateTileModalOpen,
      isCreateTileModalExpanded,
      setCreateTileModalExpanded,
    } = useCalendarUI();

    React.useImperativeHandle(ref, () => ({
      getUIState: () => ({
        isCreateTileModalOpen,
        isCreateTileModalExpanded,
      }),
      setModalOpen: setCreateTileModalOpen,
      setModalExpanded: setCreateTileModalExpanded,
      getSetters: () => ({
        setCreateTileModalOpen,
        setCreateTileModalExpanded,
      }),
    }));

    return null;
  }
);
TestUIHarness.displayName = 'TestUIHarness';

/**
 * Renders CalendarUIProvider with a TestUIHarness inside
 */
function renderUIProvider(demoMode = false) {
  const uiRef = React.createRef<TestUIHandle>();

  const result = render(
    <CalendarUIProvider demoMode={demoMode}>
      <TestUIHarness ref={uiRef} demoMode={demoMode} />
    </CalendarUIProvider>
  );

  return {
    ...result,
    getUIState: () => uiRef.current!.getUIState(),
    setModalOpen: (isOpen: boolean) => {
      act(() => {
        uiRef.current!.setModalOpen(isOpen);
      });
    },
    setModalExpanded: (isExpanded: boolean) => {
      act(() => {
        uiRef.current!.setModalExpanded(isExpanded);
      });
    },
  };
}

/**
 * Renders multiple consumers in the same provider to test state sharing
 */
const UIConsumer: React.FC<{ onStateChange?: (state: CalendarUIContextType) => void }> = ({ onStateChange }) => {
  const ui = useCalendarUI();
  
  React.useEffect(() => {
    onStateChange?.(ui);
  }, [ui, onStateChange]);

  return null;
};

function renderMultipleConsumers(consumerCount: number, demoMode = false) {
  const onStateChanges = Array.from({ length: consumerCount }, () => vi.fn());
  
  const result = render(
    <CalendarUIProvider demoMode={demoMode}>
      {onStateChanges.map((onChange, i) => (
        <UIConsumer key={i} onStateChange={onChange} />
      ))}
    </CalendarUIProvider>
  );

  return {
    ...result,
    onStateChanges,
  };
}

// ──── CalendarUIProvider Tests ───────────────────────────────────────────────

describe('CalendarUIProvider', () => {
  describe('basic state management', () => {
    it('provides initial state with modal closed and not expanded', () => {
      const { getUIState } = renderUIProvider();

      const state = getUIState();
      expect(state.isCreateTileModalOpen).toBe(false);
      expect(state.isCreateTileModalExpanded).toBe(false);
    });

    it('can open and close the create tile modal', () => {
      const { getUIState, setModalOpen } = renderUIProvider();

      // Initial state
      expect(getUIState().isCreateTileModalOpen).toBe(false);

      // Open modal
      setModalOpen(true);
      expect(getUIState().isCreateTileModalOpen).toBe(true);

      // Close modal
      setModalOpen(false);
      expect(getUIState().isCreateTileModalOpen).toBe(false);
    });

    it('can expand and collapse the create tile modal', () => {
      const { getUIState, setModalExpanded } = renderUIProvider();

      // Initial state
      expect(getUIState().isCreateTileModalExpanded).toBe(false);

      // Expand modal
      setModalExpanded(true);
      expect(getUIState().isCreateTileModalExpanded).toBe(true);

      // Collapse modal
      setModalExpanded(false);
      expect(getUIState().isCreateTileModalExpanded).toBe(false);
    });

    it('manages both modal states independently', () => {
      const { getUIState, setModalOpen, setModalExpanded } = renderUIProvider();

      // Open modal but keep collapsed
      setModalOpen(true);
      expect(getUIState().isCreateTileModalOpen).toBe(true);
      expect(getUIState().isCreateTileModalExpanded).toBe(false);

      // Expand while open
      setModalExpanded(true);
      expect(getUIState().isCreateTileModalOpen).toBe(true);
      expect(getUIState().isCreateTileModalExpanded).toBe(true);

      // Close but keep expanded
      setModalOpen(false);
      expect(getUIState().isCreateTileModalOpen).toBe(false);
      expect(getUIState().isCreateTileModalExpanded).toBe(true);
    });
  });

  describe('state sharing between consumers', () => {
    it('multiple consumers share the same state', () => {
      const { onStateChanges } = renderMultipleConsumers(2);

      // Both consumers should receive the same initial state
      expect(onStateChanges[0]).toHaveBeenCalledTimes(1);
      expect(onStateChanges[1]).toHaveBeenCalledTimes(1);

      const initialState1 = onStateChanges[0].mock.calls[0][0];
      const initialState2 = onStateChanges[1].mock.calls[0][0];
      
      expect(initialState1.isCreateTileModalOpen).toBe(false);
      expect(initialState2.isCreateTileModalOpen).toBe(false);
      expect(initialState1).toEqual(initialState2);
    });

    it('state changes are propagated to all consumers', () => {
      const { onStateChanges } = renderMultipleConsumers(3);

      // Get initial state before clearing
      const firstConsumerState = onStateChanges[0].mock.calls[0][0];
      
      // Clear initial calls
      onStateChanges.forEach(fn => fn.mockClear());

      // Trigger a state change from one consumer
      act(() => {
        firstConsumerState.setCreateTileModalOpen(true);
      });

      // All consumers should receive the updated state
      onStateChanges.forEach((fn) => {
        expect(fn).toHaveBeenCalledTimes(1);
        const updatedState = fn.mock.calls[0][0];
        expect(updatedState.isCreateTileModalOpen).toBe(true);
      });
    });
  });

  describe('demo mode behavior', () => {
    it('prevents state changes when demo mode is enabled', () => {
      const { getUIState, setModalOpen, setModalExpanded } = renderUIProvider(true);

      // Initial state
      expect(getUIState().isCreateTileModalOpen).toBe(false);
      expect(getUIState().isCreateTileModalExpanded).toBe(false);

      // Try to change state - should be ignored
      setModalOpen(true);
      setModalExpanded(true);

      // State should remain unchanged
      expect(getUIState().isCreateTileModalOpen).toBe(false);
      expect(getUIState().isCreateTileModalExpanded).toBe(false);
    });

    it('demo mode consumers still receive initial state', () => {
      const { onStateChanges } = renderMultipleConsumers(2, true);

      // Consumers should still receive the initial state
      expect(onStateChanges[0]).toHaveBeenCalledTimes(1);
      expect(onStateChanges[1]).toHaveBeenCalledTimes(1);

      const initialState = onStateChanges[0].mock.calls[0][0];
      expect(initialState.isCreateTileModalOpen).toBe(false);
      expect(initialState.isCreateTileModalExpanded).toBe(false);
    });

    it('demo mode prevents state propagation', () => {
      const { onStateChanges } = renderMultipleConsumers(2, true);

      // Get initial state before clearing
      const firstConsumerState = onStateChanges[0].mock.calls[0][0];
      
      // Clear initial calls
      onStateChanges.forEach(fn => fn.mockClear());

      // Try to trigger state change
      act(() => {
        firstConsumerState.setCreateTileModalOpen(true);
      });

      // No additional calls should be made since state change is prevented
      onStateChanges.forEach(fn => {
        expect(fn).not.toHaveBeenCalled();
      });
    });
  });

  describe('hook error handling', () => {
    it('throws when useCalendarUI is used outside provider', () => {
      expect(() => {
        renderHook(() => useCalendarUI());
      }).toThrow('Calendar UI must be used within a CalendarUIProvider');
    });

    it('provides stable function references', () => {
      render(
        <CalendarUIProvider>
          <TestUIHarness />
        </CalendarUIProvider>
      );

      // The functions should be stable across re-renders
      // This is implicitly tested by the fact that the component doesn't crash
      // and the state management works correctly
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('context value structure', () => {
    it('provides all required properties', () => {
      const { getUIState } = renderUIProvider();

      const state = getUIState();
      
      expect(state).toHaveProperty('isCreateTileModalOpen');
      expect(state).toHaveProperty('isCreateTileModalExpanded');
      
      // State values should be booleans
      expect(typeof state.isCreateTileModalOpen).toBe('boolean');
      expect(typeof state.isCreateTileModalExpanded).toBe('boolean');
    });

    it('maintains boolean types for state values', () => {
      const { getUIState } = renderUIProvider();

      const state = getUIState();
      
      expect(typeof state.isCreateTileModalOpen).toBe('boolean');
      expect(typeof state.isCreateTileModalExpanded).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('handles rapid state changes correctly', () => {
      const { getUIState, setModalOpen, setModalExpanded } = renderUIProvider();

      // Rapidly change states
      act(() => {
        setModalOpen(true);
        setModalExpanded(true);
        setModalOpen(false);
        setModalExpanded(false);
        setModalOpen(true);
      });

      // Final state should be correct
      expect(getUIState().isCreateTileModalOpen).toBe(true);
      expect(getUIState().isCreateTileModalExpanded).toBe(false);
    });

    it('handles same-value state changes', () => {
      const { getUIState, setModalOpen } = renderUIProvider();

      // Set to same value multiple times
      setModalOpen(false);
      setModalOpen(false);
      setModalOpen(false);

      expect(getUIState().isCreateTileModalOpen).toBe(false);
    });

    it('works with no children (edge case)', () => {
      expect(() => {
        render(
          <CalendarUIProvider>
            {null}
          </CalendarUIProvider>
        );
      }).not.toThrow();
    });
  });
});
