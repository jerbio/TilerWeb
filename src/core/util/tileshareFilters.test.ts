import { describe, expect, it } from 'vitest';
import { deadlineParams } from './tileshareFilters';

describe('TileShare deadline bounds', () => {
	const now = new Date(2026, 9, 24, 15, 30);
	it('uses local calendar days for today and the next seven days', () => {
		expect(deadlineParams('today', '', '', now)).toEqual({
			deadlineFilter: 'Range',
			deadlineFrom: new Date(2026, 9, 24).getTime(),
			deadlineBefore: new Date(2026, 9, 25).getTime(),
		});
		expect(deadlineParams('next7Days', '', '', now)?.deadlineBefore).toBe(
			new Date(2026, 9, 31).getTime()
		);
	});
	it('includes the entire last date and permits either open end', () => {
		expect(deadlineParams('custom', '2026-10-24', '2026-10-24')).toEqual({
			deadlineFilter: 'Range',
			deadlineFrom: new Date(2026, 9, 24).getTime(),
			deadlineBefore: new Date(2026, 9, 25).getTime(),
		});
		expect(deadlineParams('custom', '', '2026-10-24')?.deadlineFrom).toBeUndefined();
		expect(deadlineParams('custom', '2026-10-24', '')?.deadlineBefore).toBeUndefined();
	});
	it('rejects incomplete, reversed, and impossible dates', () => {
		for (const [from, to] of [
			['', ''],
			['2026-10-25', '2026-10-24'],
			['bad', ''],
			['2026-02-30', ''],
		]) {
			expect(deadlineParams('custom', from, to)).toBeNull();
		}
	});
	it('advances through daylight saving changes using the next local midnight', () => {
		for (const date of [new Date(2026, 2, 8, 12), new Date(2026, 10, 1, 12)]) {
			const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
			expect(deadlineParams('today', '', '', date)?.deadlineBefore).toBe(end.getTime());
		}
	});
});
