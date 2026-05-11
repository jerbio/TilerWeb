import { describe, it, expect } from 'vitest';
import {
	getMobileReviewSheetSizing,
	getMobileReviewSheetSizingCss,
	PEEK_SHEET_HEIGHT_PX,
	MID_SHEET_HEIGHT_PX,
	FULL_SHEET_MAX_VH,
} from './reviewSheetSizing';

describe('reviewSheetSizing — bottom-sheet stops', () => {
	it('peek pins height and max-height to the same fixed pixel value', () => {
		const sizing = getMobileReviewSheetSizing('peek');
		expect(sizing.height).toBe(`${PEEK_SHEET_HEIGHT_PX}px`);
		expect(sizing.maxHeight).toBe(`${PEEK_SHEET_HEIGHT_PX}px`);
		// Sanity: peek must remain compact enough to leave the calendar grid
		// visible above it on a 600px-tall mobile viewport.
		expect(PEEK_SHEET_HEIGHT_PX).toBeLessThan(150);
	});

	it('mid pins height and max-height to the same fixed pixel value', () => {
		const sizing = getMobileReviewSheetSizing('mid');
		expect(sizing.height).toBe(`${MID_SHEET_HEIGHT_PX}px`);
		expect(sizing.maxHeight).toBe(`${MID_SHEET_HEIGHT_PX}px`);
		// Sanity: mid must be tall enough to fit the stepper + footer.
		expect(MID_SHEET_HEIGHT_PX).toBeGreaterThan(PEEK_SHEET_HEIGHT_PX);
	});

	it('full uses auto height capped by 70vh so action lists stay scrollable', () => {
		const sizing = getMobileReviewSheetSizing('full');
		expect(sizing.height).toBe('auto');
		expect(sizing.maxHeight).toBe(`${FULL_SHEET_MAX_VH}vh`);
		// Cap must leave at least 30% of the viewport for the calendar grid.
		expect(FULL_SHEET_MAX_VH).toBeLessThanOrEqual(75);
	});

	it('stops are strictly ordered peek < mid (so cycling visibly grows the sheet)', () => {
		expect(PEEK_SHEET_HEIGHT_PX).toBeLessThan(MID_SHEET_HEIGHT_PX);
	});

	it('CSS fragment string interpolates both height + max-height declarations', () => {
		expect(getMobileReviewSheetSizingCss('peek')).toBe('height: 96px; max-height: 96px;');
		expect(getMobileReviewSheetSizingCss('mid')).toBe('height: 220px; max-height: 220px;');
		expect(getMobileReviewSheetSizingCss('full')).toBe('height: auto; max-height: 70vh;');
	});

	it('unknown / fallback stop defaults to "full" sizing', () => {
		// Cast through unknown so a future enum value (or stale persisted
		// state) doesn't blow up at runtime.
		const sizing = getMobileReviewSheetSizing('unexpected' as unknown as 'peek');
		expect(sizing.height).toBe('auto');
		expect(sizing.maxHeight).toBe(`${FULL_SHEET_MAX_VH}vh`);
	});
});
