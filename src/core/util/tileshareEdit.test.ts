import { describe, expect, it } from 'vitest';
import { editedDeadline, tilettesDueAfter } from './tileshareEdit';
import { TileShareTemplate, DesignatedUser } from '@/core/common/types/tileshare';

describe('edit deadline guidance', () => {
	it('preserves the exact instant when date and time are unchanged', () => {
		const seed = new Date(2026, 9, 20, 17, 30, 45, 123).getTime();
		expect(editedDeadline('2026-10-20', '17:30', seed)).toBe(seed);
		expect(editedDeadline('2026-10-21', '17:30', seed)).toBe(
			new Date(2026, 9, 21, 17, 30).getTime()
		);
	});
	it('rejects invalid calendar dates and incomplete times', () => {
		expect(editedDeadline('2026-02-30', '17:30', null)).toBeNull();
		expect(editedDeadline('2026-10-20', '25:00', null)).toBeNull();
	});
	it('counts accepted tasks once, ignores null assignees and inherited dates', () => {
		const tasks = [
			{
				end: 5000,
				designatedUsers: [
					null,
					{ rsvpStatus: 'accepted' },
					{ rsvpStatus: 'accepted' },
				] as unknown as DesignatedUser[],
			},
			{ end: 5000, designatedUsers: [null] as unknown as DesignatedUser[] },
			{ end: null, designatedUsers: [] },
			{ end: 3000, designatedUsers: [] },
		] as TileShareTemplate[];
		expect(tilettesDueAfter(tasks, 4000)).toEqual({ accepted: 1, notAccepted: 1 });
	});
});
