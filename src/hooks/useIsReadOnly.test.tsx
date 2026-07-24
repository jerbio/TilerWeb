import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import {
	SimulationDto,
	SimulationActionDto,
	SimulationScheduleResult,
	SimulationState,
	VibeRequest,
	VibeAction,
} from '@/core/common/types/chat';
import { Status, Actions } from '@/core/constants/enums';
import { isScheduleReadOnly, useIsReadOnly } from './useIsReadOnly';

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

function enterSimulationReview() {
	useSimulationOverlayStore.getState().enterReview({
		simulation: makeSimulation([makePreviewAction('a1')]),
		simulationResult: {
			preview: { subEvents: [], calendarEvents: [] },
		} as SimulationScheduleResult,
		vibeRequest: makeRequest([makeAction('a1')]),
	});
}

const initialOverlayState = useSimulationOverlayStore.getState();

describe('useIsReadOnly — non-React predicate (isScheduleReadOnly)', () => {
	beforeEach(() => {
		useSimulationOverlayStore.setState(initialOverlayState, true);
	});

	it('returns false by default (no blocking source active)', () => {
		expect(isScheduleReadOnly()).toBe(false);
	});

	it('returns true while simulation review is active', () => {
		enterSimulationReview();
		expect(isScheduleReadOnly()).toBe(true);
	});

	it('returns false again after simulation review exits', () => {
		enterSimulationReview();
		expect(isScheduleReadOnly()).toBe(true);

		useSimulationOverlayStore.getState().exitReview();
		expect(isScheduleReadOnly()).toBe(false);
	});
});

describe('useIsReadOnly — React hook', () => {
	beforeEach(() => {
		useSimulationOverlayStore.setState(initialOverlayState, true);
	});

	it('returns false on initial render', () => {
		const { result } = renderHook(() => useIsReadOnly());
		expect(result.current).toBe(false);
	});

	it('re-renders true when the underlying inReview flag flips on', () => {
		const { result } = renderHook(() => useIsReadOnly());
		expect(result.current).toBe(false);

		act(() => {
			enterSimulationReview();
		});

		expect(result.current).toBe(true);
	});

	it('re-renders false when the underlying inReview flag flips off', () => {
		enterSimulationReview();
		const { result } = renderHook(() => useIsReadOnly());
		expect(result.current).toBe(true);

		act(() => {
			useSimulationOverlayStore.getState().exitReview();
		});

		expect(result.current).toBe(false);
	});
});
