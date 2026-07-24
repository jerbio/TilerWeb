import { describe, it, expect, beforeEach } from 'vitest';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';

// Reset store between tests.
beforeEach(() => {
	useSimulationOverlayStore.setState({
		activeKindFilter: null,
	} as Parameters<typeof useSimulationOverlayStore.setState>[0]);
});

describe('simulationOverlayStore — activeKindFilter', () => {
	it('initialises activeKindFilter as null', () => {
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBeNull();
	});

	it('setKindFilter sets the filter', () => {
		useSimulationOverlayStore.getState().setKindFilter('new');
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBe('new');
	});

	it('setKindFilter(null) clears the filter', () => {
		useSimulationOverlayStore.getState().setKindFilter('removed');
		useSimulationOverlayStore.getState().setKindFilter(null);
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBeNull();
	});

	it('toggleKindFilter sets filter when none is active', () => {
		useSimulationOverlayStore.getState().toggleKindFilter('updated');
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBe('updated');
	});

	it('toggleKindFilter clears filter when same kind is toggled again', () => {
		useSimulationOverlayStore.getState().toggleKindFilter('conflict');
		useSimulationOverlayStore.getState().toggleKindFilter('conflict');
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBeNull();
	});

	it('toggleKindFilter switches to a different kind without going through null', () => {
		useSimulationOverlayStore.getState().toggleKindFilter('new');
		useSimulationOverlayStore.getState().toggleKindFilter('removed');
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBe('removed');
	});

	it('exitReview clears activeKindFilter', () => {
		useSimulationOverlayStore.getState().setKindFilter('conflict');
		useSimulationOverlayStore.getState().exitReview();
		expect(useSimulationOverlayStore.getState().activeKindFilter).toBeNull();
	});
});
