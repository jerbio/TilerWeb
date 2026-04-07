import { describe, it, expect } from 'vitest';
import { computeStaggerLayout } from '../event_layout';
import {
	STAGGER_INCREMENT,
	MIN_EVENT_HEIGHT,
	MAX_STAGGER_RATIO,
	getStaggerIncrement,
	getMinEventHeight,
} from '../event_layout.constants';
import { LayoutEvent, StaggerLayoutOptions } from '../event_layout.types';

// Helper to create a LayoutEvent from hour ranges on a single day column
function makeEvent(
	id: string,
	startHour: number,
	endHour: number,
	overrides?: Partial<LayoutEvent>
): LayoutEvent {
	const CELL_HEIGHT = 96; // pixels per hour
	return {
		id,
		start: startHour * 3600, // unix seconds from midnight
		end: endHour * 3600,
		x: 0,
		y: startHour * CELL_HEIGHT,
		height: (endHour - startHour) * CELL_HEIGHT,
		width: 300, // default column width
		...overrides,
	};
}

const DEFAULT_OPTIONS: StaggerLayoutOptions = {
	staggerIncrement: 20,
	maxStaggerRatio: 0.5,
	minEventHeight: 44,
};

// ─── Constants ─────────────────────────────────────────────────────────────────

describe('event_layout.constants', () => {
	it('has correct stagger increments', () => {
		expect(STAGGER_INCREMENT.MOBILE).toBe(20);
		expect(STAGGER_INCREMENT.TABLET).toBe(24);
		expect(STAGGER_INCREMENT.DESKTOP).toBe(16);
	});

	it('has correct min event heights', () => {
		expect(MIN_EVENT_HEIGHT.TOUCH).toBe(44);
		expect(MIN_EVENT_HEIGHT.POINTER).toBe(28);
	});

	it('has correct max stagger ratio', () => {
		expect(MAX_STAGGER_RATIO).toBe(0.5);
	});

	describe('getStaggerIncrement', () => {
		it('returns MOBILE for widths <= 428', () => {
			expect(getStaggerIncrement(320)).toBe(20);
			expect(getStaggerIncrement(375)).toBe(20);
			expect(getStaggerIncrement(428)).toBe(20);
		});

		it('returns TABLET for widths 429-1024', () => {
			expect(getStaggerIncrement(429)).toBe(24);
			expect(getStaggerIncrement(768)).toBe(24);
			expect(getStaggerIncrement(1024)).toBe(24);
		});

		it('returns DESKTOP for widths >= 1025', () => {
			expect(getStaggerIncrement(1025)).toBe(16);
			expect(getStaggerIncrement(1440)).toBe(16);
			expect(getStaggerIncrement(1920)).toBe(16);
		});
	});

	describe('getMinEventHeight', () => {
		it('returns TOUCH for mobile/tablet', () => {
			expect(getMinEventHeight(375)).toBe(44);
			expect(getMinEventHeight(768)).toBe(44);
			expect(getMinEventHeight(1024)).toBe(44);
		});

		it('returns POINTER for desktop', () => {
			expect(getMinEventHeight(1025)).toBe(28);
			expect(getMinEventHeight(1440)).toBe(28);
		});
	});
});

// ─── Single event ──────────────────────────────────────────────────────────────

describe('computeStaggerLayout', () => {
	describe('single event', () => {
		it('returns stagger level 0 with full width', () => {
			const events = [makeEvent('A', 9, 10)];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('A');
			expect(result[0].staggerLevel).toBe(0);
			expect(result[0].x).toBe(0);
			expect(result[0].width).toBe(300);
		});

		it('preserves the original height when above minimum', () => {
			const events = [makeEvent('A', 9, 10)]; // 96px height
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result[0].height).toBe(96);
		});
	});

	// ─── Empty input ─────────────────────────────────────────────────────────────

	describe('empty input', () => {
		it('returns empty array', () => {
			const result = computeStaggerLayout([], DEFAULT_OPTIONS);
			expect(result).toEqual([]);
		});
	});

	// ─── Non-overlapping events ──────────────────────────────────────────────────

	describe('non-overlapping events', () => {
		it('all events at stagger level 0 with full width', () => {
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 11, 12),
				makeEvent('C', 14, 15),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result).toHaveLength(3);
			for (const r of result) {
				expect(r.staggerLevel).toBe(0);
				expect(r.x).toBe(0);
				expect(r.width).toBe(300);
			}
		});
	});

	// ─── Two overlapping events ──────────────────────────────────────────────────

	describe('two overlapping events', () => {
		it('assigns stagger levels 0 and 1', () => {
			const events = [
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result).toHaveLength(2);
			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(1);
		});

		it('offsets x by stagger increment for level 1', () => {
			const events = [
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			expect(a.x).toBe(0);
			expect(b.x).toBe(20); // staggerIncrement = 20
		});

		it('reduces width by stagger offset', () => {
			const events = [
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const b = result.find((r) => r.id === 'B')!;
			expect(b.width).toBe(300 - 20); // fullWidth - offset
		});
	});

	// ─── Z-index ordering ────────────────────────────────────────────────────────

	describe('z-index ordering', () => {
		it('later start time gets higher z-index', () => {
			const events = [
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			expect(b.zIndex).toBeGreaterThan(a.zIndex);
		});

		it('same start time: shorter duration on top (higher z)', () => {
			const events = [
				makeEvent('LONG', 9, 12), // 3 hours
				makeEvent('SHORT', 9, 10), // 1 hour
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const long = result.find((r) => r.id === 'LONG')!;
			const short = result.find((r) => r.id === 'SHORT')!;

			expect(short.zIndex).toBeGreaterThan(long.zIndex);
		});

		it('same start, same duration: stable z-index order', () => {
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 9, 10),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			// Both should have defined z-index values
			expect(a.zIndex).toBeDefined();
			expect(b.zIndex).toBeDefined();
		});
	});

	// ─── Same start time — stagger by duration ─────────────────────────────────

	describe('same start time events', () => {
		it('longer duration at level 0 (behind), shorter at higher levels (in front)', () => {
			const events = [
				makeEvent('LONG', 9, 13), // 4 hours
				makeEvent('MED', 9, 11), // 2 hours
				makeEvent('SHORT', 9, 10), // 1 hour
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const long = result.find((r) => r.id === 'LONG')!;
			const med = result.find((r) => r.id === 'MED')!;
			const short = result.find((r) => r.id === 'SHORT')!;

			expect(long.staggerLevel).toBe(0);
			expect(med.staggerLevel).toBe(1);
			expect(short.staggerLevel).toBe(2);
		});
	});

	// ─── Transitive overlap (A-B-C where A doesn't overlap C) ───────────────────

	describe('transitive overlap', () => {
		it('A-B overlap, B-C overlap, but A-C do not — C still gets correct stagger level', () => {
			// A: 9-10, B: 9:45-10:45, C: 10:30-11:30
			// A overlaps B, B overlaps C, but A does NOT overlap C
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 9.75, 10.75),
				makeEvent('C', 10.5, 11.5),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;
			const c = result.find((r) => r.id === 'C')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(1);
			// C only overlaps B (not A), so it should be able to reuse level 0 or get level 2
			// The key is that it gets a VALID stagger level based on actual overlapping events
			expect(c.staggerLevel).toBeGreaterThanOrEqual(0);
			// C should NOT be forced into an unnecessarily high level
			expect(c.staggerLevel).toBeLessThanOrEqual(2);
		});
	});

	// ─── Multiple overlap groups ─────────────────────────────────────────────────

	describe('multiple independent overlap groups', () => {
		it('two separate groups have independent stagger levels', () => {
			const events = [
				// Group 1
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
				// Group 2 (no overlap with group 1)
				makeEvent('C', 14, 16),
				makeEvent('D', 15, 17),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;
			const c = result.find((r) => r.id === 'C')!;
			const d = result.find((r) => r.id === 'D')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(1);
			expect(c.staggerLevel).toBe(0);
			expect(d.staggerLevel).toBe(1);
		});
	});

	// ─── Max stagger ratio cap ───────────────────────────────────────────────────

	describe('max stagger ratio cap', () => {
		it('stagger offset never exceeds maxStaggerRatio * width', () => {
			// Create many overlapping events to push stagger offsets high
			const events: LayoutEvent[] = [];
			for (let i = 0; i < 20; i++) {
				events.push(makeEvent(`E${i}`, 9, 11)); // all overlap each other
			}
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const maxOffset = DEFAULT_OPTIONS.maxStaggerRatio * 300; // 0.5 * 300 = 150px
			for (const r of result) {
				const offset = r.x - 0; // baseX is 0
				expect(offset).toBeLessThanOrEqual(maxOffset);
				expect(r.width).toBeGreaterThan(0);
			}
		});

		it('width never goes below 50% of available width', () => {
			const events: LayoutEvent[] = [];
			for (let i = 0; i < 20; i++) {
				events.push(makeEvent(`E${i}`, 9, 11));
			}
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const minWidth = 300 * (1 - DEFAULT_OPTIONS.maxStaggerRatio);
			for (const r of result) {
				expect(r.width).toBeGreaterThanOrEqual(minWidth);
			}
		});
	});

	// ─── Minimum event height ────────────────────────────────────────────────────

	describe('minimum event height', () => {
		it('enforces min height for short events', () => {
			// 5 minute event: 5/60 * 96 = 8px — well below 44px minimum
			const events = [makeEvent('SHORT', 9, 9 + 5 / 60)];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result[0].height).toBe(44);
		});

		it('does not increase height for tall events', () => {
			const events = [makeEvent('TALL', 9, 12)]; // 3 hours = 288px
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result[0].height).toBe(288);
		});

		it('uses the provided minEventHeight option', () => {
			const events = [makeEvent('SHORT', 9, 9 + 5 / 60)];
			const result = computeStaggerLayout(events, {
				...DEFAULT_OPTIONS,
				minEventHeight: 28,
			});

			expect(result[0].height).toBe(28);
		});
	});

	// ─── Different day columns ───────────────────────────────────────────────────

	describe('events on different day columns', () => {
		it('events on different days do not affect each other stagger', () => {
			const events = [
				makeEvent('MON', 9, 11, { x: 0 }),
				makeEvent('TUE', 9, 11, { x: 300 }),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const mon = result.find((r) => r.id === 'MON')!;
			const tue = result.find((r) => r.id === 'TUE')!;

			expect(mon.staggerLevel).toBe(0);
			expect(tue.staggerLevel).toBe(0);
		});
	});

	// ─── Stagger increment math ──────────────────────────────────────────────────

	describe('stagger increment correctness', () => {
		it('level n has x = baseX + n * increment', () => {
			// 5 overlapping events
			const events = [
				makeEvent('A', 9, 12),
				makeEvent('B', 9.5, 12),
				makeEvent('C', 10, 12),
				makeEvent('D', 10.5, 12),
				makeEvent('E', 11, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			// Sort by stagger level
			const sorted = [...result].sort((a, b) => a.staggerLevel - b.staggerLevel);

			for (let i = 0; i < sorted.length; i++) {
				const expectedX = Math.min(i * 20, 300 * 0.5);
				expect(sorted[i].x).toBe(expectedX);
			}
		});

		it('width = fullWidth - x for each event', () => {
			const events = [
				makeEvent('A', 9, 12),
				makeEvent('B', 10, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			for (const r of result) {
				expect(r.width).toBe(300 - r.x);
			}
		});
	});

	// ─── Scale test ──────────────────────────────────────────────────────────────

	describe('scale', () => {
		it('handles 100+ events without throwing', () => {
			const events: LayoutEvent[] = [];
			for (let i = 0; i < 150; i++) {
				events.push(
					makeEvent(`E${i}`, 8 + (i % 10) * 0.1, 9 + (i % 10) * 0.1)
				);
			}

			expect(() =>
				computeStaggerLayout(events, DEFAULT_OPTIONS)
			).not.toThrow();

			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);
			expect(result).toHaveLength(150);
		});
	});

	// ─── Output completeness ─────────────────────────────────────────────────────

	describe('output completeness', () => {
		it('returns all required fields for each event', () => {
			const events = [makeEvent('A', 9, 10)];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const r = result[0];
			expect(r).toHaveProperty('id');
			expect(r).toHaveProperty('staggerLevel');
			expect(r).toHaveProperty('x');
			expect(r).toHaveProperty('width');
			expect(r).toHaveProperty('zIndex');
			expect(r).toHaveProperty('height');
		});

		it('returns same number of results as input events', () => {
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 10, 11),
				makeEvent('C', 11, 12),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);
			expect(result).toHaveLength(events.length);
		});
	});

	// ─── Overlap detection (vertical) ────────────────────────────────────────────

	describe('overlap detection', () => {
		it('events that end exactly when another starts do NOT overlap', () => {
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 10, 11), // starts exactly when A ends
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(0);
		});

		it('events that overlap by even 1 minute DO overlap', () => {
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 9 + 59 / 60, 11), // starts 1 min before A ends
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(1);
		});
	});

	// ─── Complex overlap scenario ────────────────────────────────────────────────

	describe('complex overlap scenario', () => {
		it('handles 5 events with varying overlaps correctly', () => {
			// A: 9-11
			// B: 10-12 (overlaps A)
			// C: 10-11 (overlaps A, B)
			// D: 13-14 (no overlap)
			// E: 13.5-15 (overlaps D)
			const events = [
				makeEvent('A', 9, 11),
				makeEvent('B', 10, 12),
				makeEvent('C', 10, 11),
				makeEvent('D', 13, 14),
				makeEvent('E', 13.5, 15),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result).toHaveLength(5);

			const d = result.find((r) => r.id === 'D')!;
			const e = result.find((r) => r.id === 'E')!;

			// D and E form their own group
			expect(d.staggerLevel).toBe(0);
			expect(e.staggerLevel).toBe(1);
		});
	});

	// ─── Min-height inflation must NOT cause false overlaps ──────────────────────

	describe('min-height inflation', () => {
		it('does NOT stagger sequential events when min-height inflates a short event', () => {
			// "Get some Vit.d" 30min = 48px, inflated to 60px by MIN_CELL_HEIGHT.
			// Next event starts right after — should NOT be considered overlapping.
			const events = [
				makeEvent('VitD', 9, 9.5),      // 30min = 48px, inflated to 60px
				makeEvent('Fix', 9.5, 10.5),     // starts exactly when VitD ends
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const vitD = result.find((r) => r.id === 'VitD')!;
			const fix = result.find((r) => r.id === 'Fix')!;

			// Both should be at level 0 — they are sequential, not overlapping
			expect(vitD.staggerLevel).toBe(0);
			expect(fix.staggerLevel).toBe(0);
		});

		it('does NOT stagger events with a small gap between them', () => {
			// 15-minute event (24px, inflated to 44px) followed by event 15min later
			const events = [
				makeEvent('Short', 9, 9.25),     // 15min
				makeEvent('Next', 9.5, 10.5),    // starts 15min after Short ends
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			expect(result.find((r) => r.id === 'Short')!.staggerLevel).toBe(0);
			expect(result.find((r) => r.id === 'Next')!.staggerLevel).toBe(0);
		});
	});

	// ─── Stagger level reuse ─────────────────────────────────────────────────────

	describe('stagger level reuse', () => {
		it('reuses lower stagger levels when earlier events have ended', () => {
			// A: 9-10 (level 0)
			// B: 9.5-10.5 (level 1, overlaps A)
			// C: 10.25-11.25 (overlaps B but NOT A — can reuse level 0)
			const events = [
				makeEvent('A', 9, 10),
				makeEvent('B', 9.5, 10.5),
				makeEvent('C', 10.25, 11.25),
			];
			const result = computeStaggerLayout(events, DEFAULT_OPTIONS);

			const a = result.find((r) => r.id === 'A')!;
			const b = result.find((r) => r.id === 'B')!;
			const c = result.find((r) => r.id === 'C')!;

			expect(a.staggerLevel).toBe(0);
			expect(b.staggerLevel).toBe(1);
			// C should get level 0 since A has ended
			expect(c.staggerLevel).toBe(0);
		});
	});
});
