import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { StoreApi } from 'zustand';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import {
	SimulationActionDto,
	SimulationDto,
	SimulationScheduleResult,
	SimulationState,
	VibeAction,
	VibeRequest,
} from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';
import { CalendarUIStore, createCalendarUIStore } from '../calendar-ui.store';

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

describe('calendar-ui.store — Tier 1 read-only gating', () => {
	let store: StoreApi<CalendarUIStore>;

	beforeEach(() => {
		useSimulationOverlayStore.setState(initialOverlayState, true);
		store = createCalendarUIStore(false);
	});

	describe('createSelection.actions.open', () => {
		it('opens normally when read-only is inactive', () => {
			act(() => {
				store.getState().createSelection.actions.open();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(true);
		});

		it('no-ops when read-only is active', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createSelection.actions.open();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(false);
		});

		it('opens again after read-only clears', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createSelection.actions.open();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(false);

			useSimulationOverlayStore.getState().exitReview();
			act(() => {
				store.getState().createSelection.actions.open();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(true);
		});
	});

	describe('createTile.actions.open', () => {
		it('opens normally when read-only is inactive', () => {
			act(() => {
				store.getState().createTile.actions.open();
			});
			expect(store.getState().createTile.state.isOpen).toBe(true);
		});

		it('no-ops when read-only is active', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createTile.actions.open();
			});
			expect(store.getState().createTile.state.isOpen).toBe(false);
		});

		it('opens again after read-only clears', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createTile.actions.open();
			});
			expect(store.getState().createTile.state.isOpen).toBe(false);

			useSimulationOverlayStore.getState().exitReview();
			act(() => {
				store.getState().createTile.actions.open();
			});
			expect(store.getState().createTile.state.isOpen).toBe(true);
		});
	});

	describe('createBlock.actions.open', () => {
		it('opens normally when read-only is inactive', () => {
			act(() => {
				store.getState().createBlock.actions.open();
			});
			expect(store.getState().createBlock.state.isOpen).toBe(true);
		});

		it('no-ops when read-only is active', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createBlock.actions.open();
			});
			expect(store.getState().createBlock.state.isOpen).toBe(false);
		});

		it('opens again after read-only clears', () => {
			enterSimulationReview();
			act(() => {
				store.getState().createBlock.actions.open();
			});
			expect(store.getState().createBlock.state.isOpen).toBe(false);

			useSimulationOverlayStore.getState().exitReview();
			act(() => {
				store.getState().createBlock.actions.open();
			});
			expect(store.getState().createBlock.state.isOpen).toBe(true);
		});
	});

	describe('close actions', () => {
		it('createSelection.close still works while read-only is active', () => {
			act(() => {
				store.getState().createSelection.actions.open();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(true);

			enterSimulationReview();
			act(() => {
				store.getState().createSelection.actions.close();
			});
			expect(store.getState().createSelection.state.isOpen).toBe(false);
		});

		it('createTile.close still works while read-only is active', () => {
			act(() => {
				store.getState().createTile.actions.open();
			});
			enterSimulationReview();
			act(() => {
				store.getState().createTile.actions.close();
			});
			expect(store.getState().createTile.state.isOpen).toBe(false);
		});

		it('createBlock.close still works while read-only is active', () => {
			act(() => {
				store.getState().createBlock.actions.open();
			});
			enterSimulationReview();
			act(() => {
				store.getState().createBlock.actions.close();
			});
			expect(store.getState().createBlock.state.isOpen).toBe(false);
		});
	});
});
