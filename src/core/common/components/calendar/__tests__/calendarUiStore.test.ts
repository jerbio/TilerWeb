import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { CalendarUIStore, createCalendarUIStore } from '../calendar-ui.store';
import { StoreApi } from 'zustand';
import { ScheduleCreateEventResponse } from '@/core/common/types/schedule';

const demoMode = false;
let store: StoreApi<CalendarUIStore>;

function getState() {
	return store.getState().createTile.state;
}
function getActions() {
	return store.getState().createTile.actions;
}

describe('calendar-ui.store', () => {
	beforeEach(() => {
		store = createCalendarUIStore(demoMode);
		// Reset store state
		act(() => {
			getActions().close();
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
});
