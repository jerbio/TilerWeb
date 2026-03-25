import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import dayjs from 'dayjs';
import { CalendarUIStore, createCalendarUIStore } from '../calendar-ui.store';
import { StoreApi } from 'zustand';
import { CalendarEvent, ScheduleCreateEventResponse, ThirdPartyType } from '@/core/common/types/schedule';

const demoMode = false;
let store: StoreApi<CalendarUIStore>;

function getState() {
	return store.getState().createTile.state;
}
function getActions() {
	return store.getState().createTile.actions;
}

function getEditState() {
	return store.getState().editTile.state;
}
function getEditActions() {
	return store.getState().editTile.actions;
}

const mockCalendarEvent: CalendarEvent = {
	id: 'evt-1',
	start: 1769925600000,
	end: 1770532200000,
	name: 'work out',
	address: '',
	addressDescription: '',
	searchdDescription: '',
	splitCount: 4,
	completeCount: 0,
	deletionCount: 0,
	thirdpartyType: ThirdPartyType.Tiler,
	thirdPartyId: null,
	thirdPartyUserId: null,
	colorOpacity: null,
	colorRed: null,
	colorGreen: null,
	colorBlue: null,
	isComplete: false,
	isEnabled: true,
	isRecurring: false,
	locationId: null,
	isReadOnly: false,
	isProcrastinateEvent: false,
	isRigid: false,
	uiConfig: { id: 'ui-1' } as CalendarEvent['uiConfig'],
	repetition: null,
	eachTileDuration: 3600000,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: false,
	entityName: 'CalendarEvent',
	blob: { type: 0, note: '', id: 'blob-1' },
	subEvents: null,
};

describe('calendar-ui.store', () => {
	beforeEach(() => {
		store = createCalendarUIStore(demoMode);
		// Reset store state
		act(() => {
			getActions().close();
			getEditActions().close();
		});
	});

	it('opens and closes the create tile modal', () => {
		act(() => {
			getActions().open();
		});
		expect(getState().isOpen).toBe(true);

		act(() => {
			getActions().close();
		});
		expect(getState().isOpen).toBe(false);
		expect(getState().isExpanded).toBe(false);
		expect(getState().loading.isActive).toBe(false);
		expect(getState().success.isOpen).toBe(false);
	});

	it('expands and collapses the create tile modal', () => {
		act(() => {
			getActions().expand();
		});
		expect(getState().isExpanded).toBe(true);

		act(() => {
			getActions().collapse();
		});
		expect(getState().isExpanded).toBe(false);
	});

	it('starts and ends loading', () => {
		act(() => {
			getActions().startLoading('TileA');
		});
		expect(getState().loading.isActive).toBe(true);
		expect(getState().loading.tileName).toBe('TileA');

		act(() => {
			getActions().endLoading();
		});
		expect(getState().loading.isActive).toBe(false);
		expect(getState().loading.tileName).toBeUndefined();
	});

	it('shows and hides success', () => {
		const tile = { id: 't1', name: 'Tile1' };
		act(() => {
			getActions().showSuccess(tile as ScheduleCreateEventResponse['Content']);
		});
		expect(getState().success.isOpen).toBe(true);
		expect(getState().success.tile).toEqual(tile);

		act(() => {
			getActions().hideSuccess();
		});
		expect(getState().success.isOpen).toBe(false);
		expect(getState().success.tile).toBeUndefined();
	});

	it('navigates to tile and completes navigation', () => {
		act(() => {
			getActions().navigateToTile();
		});
		expect(getState().success.isNavigatingToTile).toBe(true);

		act(() => {
			getActions().navigateToTileComplete();
		});
		expect(getState().success.isNavigatingToTile).toBe(false);
	});

	describe('editTile', () => {
		it('starts closed with null event', () => {
			expect(getEditState().isOpen).toBe(false);
			expect(getEditState().event).toBeNull();
		});

		it('opens with provided event', () => {
			act(() => {
				getEditActions().open(mockCalendarEvent);
			});
			expect(getEditState().isOpen).toBe(true);
			expect(getEditState().event).toEqual(mockCalendarEvent);
		});

		it('closes and clears event', () => {
			act(() => {
				getEditActions().open(mockCalendarEvent);
			});
			expect(getEditState().isOpen).toBe(true);

			act(() => {
				getEditActions().close();
			});
			expect(getEditState().isOpen).toBe(false);
			expect(getEditState().event).toBeNull();
		});

		it('does nothing in demo mode', () => {
			const demoStore = createCalendarUIStore(true);
			act(() => {
				demoStore.getState().editTile.actions.open(mockCalendarEvent);
			});
			expect(demoStore.getState().editTile.state.isOpen).toBe(false);
			expect(demoStore.getState().editTile.state.event).toBeNull();
		});
	});

	describe('viewInfo', () => {
		it('defaults to today with 7 days in view', () => {
			const { viewInfo } = store.getState();
			expect(viewInfo.startDay.isSame(dayjs().startOf('day'), 'day')).toBe(true);
			expect(viewInfo.daysInView).toBe(7);
		});

		it('updates via setViewInfo', () => {
			const newStart = dayjs('2025-03-10');
			act(() => {
				store.getState().setViewInfo({ startDay: newStart, daysInView: 5 });
			});
			const { viewInfo } = store.getState();
			expect(viewInfo.startDay.isSame(newStart, 'day')).toBe(true);
			expect(viewInfo.daysInView).toBe(5);
		});

		it('allows overwriting with a different range', () => {
			const first = dayjs('2025-06-01');
			const second = dayjs('2025-09-15');
			act(() => {
				store.getState().setViewInfo({ startDay: first, daysInView: 3 });
			});
			act(() => {
				store.getState().setViewInfo({ startDay: second, daysInView: 14 });
			});
			const { viewInfo } = store.getState();
			expect(viewInfo.startDay.isSame(second, 'day')).toBe(true);
			expect(viewInfo.daysInView).toBe(14);
		});
	});
});
