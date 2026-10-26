import { describe, it, expect, beforeEach } from 'vitest';
import useSimulationOverlayStore from './simulationOverlayStore';
import {
	SimulationDto,
	SimulationActionDto,
	SimulationScheduleResult,
	SimulationState,
	VibeRequest,
	VibeAction,
} from '@/core/common/types/chat';
import { Status, Actions } from '@/core/constants/enums';

function makeAction(id: string): VibeAction {
	return {
		id,
		descriptions: `Description ${id}`,
		type: Actions.Add_New_Appointment as unknown as VibeAction['type'],
		creationTimeInMs: 1,
		status: Status.Pending,
		entityId: `entity-${id}`,
		entityType: 'SubCalendarEvent',
		beforeScheduleId: null,
		afterScheduleId: null,
		vibeRequest: null,
	};
}

function makePreviewAction(actionId: string): SimulationActionDto {
	return {
		actionId,
		entityId: `entity-${actionId}`,
		entityType: 'SubCalendarEvent',
		vibePreviewId: 'p1',
	};
}

function makeRequest(actions: VibeAction[]): VibeRequest {
	return {
		id: 'r1',
		creationTimeInMs: 1,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions,
	};
}

function makeSimulation(previewActions: SimulationActionDto[]): SimulationDto {
	return {
		id: 'p1',
		vibeRequestId: 'r1',
		tilerUserId: 'u',
		creationTimeInMs: 1,
		state: SimulationState.Ready,
		previewActions,
	};
}

const initialState = useSimulationOverlayStore.getState();

describe('simulationOverlayStore — reviewStop', () => {
	beforeEach(() => {
		// Reset to a known clean state between tests (zustand persists state
		// across imports, so without this reviewStop / inReview leak between
		// individual cases).
		useSimulationOverlayStore.setState(initialState, true);
	});

	it('defaults reviewStop to "full"', () => {
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('full');
	});

	it('setReviewStop replaces the current stop', () => {
		useSimulationOverlayStore.getState().setReviewStop('peek');
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('peek');
		useSimulationOverlayStore.getState().setReviewStop('mid');
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('mid');
	});

	it('cycleReviewStop advances hidden → peek → mid → full → hidden', () => {
		const { setReviewStop, cycleReviewStop } = useSimulationOverlayStore.getState();
		setReviewStop('hidden');
		cycleReviewStop();
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('peek');
		cycleReviewStop();
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('mid');
		cycleReviewStop();
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('full');
		cycleReviewStop();
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('hidden');
	});

	it('enterReview resets reviewStop to "full"', () => {
		useSimulationOverlayStore.getState().setReviewStop('peek');
		useSimulationOverlayStore.getState().enterReview({
			simulation: makeSimulation([makePreviewAction('a1')]),
			simulationResult: {
				preview: { subEvents: [], calendarEvents: [] },
			} as SimulationScheduleResult,
			vibeRequest: makeRequest([makeAction('a1')]),
		});
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('full');
		expect(useSimulationOverlayStore.getState().inReview).toBe(true);
	});

	it('exitReview resets reviewStop to "full"', () => {
		useSimulationOverlayStore.getState().setReviewStop('mid');
		useSimulationOverlayStore.getState().exitReview();
		expect(useSimulationOverlayStore.getState().reviewStop).toBe('full');
		expect(useSimulationOverlayStore.getState().inReview).toBe(false);
	});
});
