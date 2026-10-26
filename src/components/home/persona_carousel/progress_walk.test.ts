import { describe, it, expect } from 'vitest';
import { generateSectionDurations } from './progress_walk';

const APPROX_TOLERANCE = 1e-6;

function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

describe('generateSectionDurations', () => {
	describe('invariants (random RNG)', () => {
		const NUM_SECTIONS = 3; // matches the persona card: 4 steps → 3 timed sections
		const TOTAL_MS = 45_000;
		const MIN_MS = 2_000;
		const ITERATIONS = 200;

		it(`always returns exactly ${NUM_SECTIONS} durations`, () => {
			for (let i = 0; i < ITERATIONS; i++) {
				const result = generateSectionDurations(NUM_SECTIONS, TOTAL_MS, MIN_MS);
				expect(result).toHaveLength(NUM_SECTIONS);
			}
		});

		it(`every duration is >= ${MIN_MS}ms (the per-section floor)`, () => {
			for (let i = 0; i < ITERATIONS; i++) {
				const result = generateSectionDurations(NUM_SECTIONS, TOTAL_MS, MIN_MS);
				for (const d of result) {
					expect(d).toBeGreaterThanOrEqual(MIN_MS);
				}
			}
		});

		it(`durations always sum to exactly ${TOTAL_MS}ms`, () => {
			for (let i = 0; i < ITERATIONS; i++) {
				const result = generateSectionDurations(NUM_SECTIONS, TOTAL_MS, MIN_MS);
				expect(sum(result)).toBeCloseTo(TOTAL_MS, 6);
			}
		});

		it('cumulative offsets land the final transition at TOTAL_MS', () => {
			for (let i = 0; i < ITERATIONS; i++) {
				const result = generateSectionDurations(NUM_SECTIONS, TOTAL_MS, MIN_MS);
				let cumulative = 0;
				const transitionOffsets: number[] = [];
				for (const d of result) {
					cumulative += d;
					transitionOffsets.push(cumulative);
				}
				expect(transitionOffsets[transitionOffsets.length - 1]).toBeCloseTo(TOTAL_MS, 6);
			}
		});

		it('produces at least some variation across invocations (not degenerate)', () => {
			const firstDurations = new Set<number>();
			for (let i = 0; i < ITERATIONS; i++) {
				const [first] = generateSectionDurations(NUM_SECTIONS, TOTAL_MS, MIN_MS);
				firstDurations.add(Math.round(first));
			}
			// With 200 samples and a 39s flex budget, the first duration should
			// take many distinct values. Anything less than 10 means the RNG or
			// distribution is degenerate.
			expect(firstDurations.size).toBeGreaterThan(10);
		});
	});

	describe('edge cases', () => {
		it('returns an empty array when numSections is 0', () => {
			expect(generateSectionDurations(0, 45_000, 2_000)).toEqual([]);
		});

		it('returns an empty array when numSections is negative', () => {
			expect(generateSectionDurations(-1, 45_000, 2_000)).toEqual([]);
		});

		it('returns [totalMs] when numSections is 1', () => {
			const result = generateSectionDurations(1, 45_000, 2_000);
			expect(result).toHaveLength(1);
			expect(result[0]).toBeCloseTo(45_000, 6);
		});

		it('falls back to equal min-floor split when totalMs equals numSections * minMs', () => {
			const result = generateSectionDurations(3, 6_000, 2_000);
			expect(result).toEqual([2_000, 2_000, 2_000]);
		});

		it('honours the min floor even when totalMs is under-budgeted', () => {
			// Caller mis-sized the budget: each section should still get at least minMs.
			const result = generateSectionDurations(4, 5_000, 2_000);
			expect(result).toHaveLength(4);
			for (const d of result) {
				expect(d).toBeGreaterThanOrEqual(2_000);
			}
		});
	});

	describe('deterministic RNG', () => {
		// Injecting a stubbed RNG lets us pin down the distribution shape and
		// document the break-a-stick contract exactly.
		function scriptedRng(values: number[]): () => number {
			let i = 0;
			return () => {
				const v = values[i % values.length];
				i += 1;
				return v;
			};
		}

		it('splits evenly when all cuts sit at the midpoint (0.5)', () => {
			// 3 sections, 45_000 total, 2_000 min → flex = 39_000
			// Cuts: [0.5 * 39_000, 0.5 * 39_000] = [19_500, 19_500] → sorted same.
			// Gaps: 19_500, 0, 19_500 → +2_000 each = [21_500, 2_000, 21_500].
			const rng = scriptedRng([0.5, 0.5]);
			const result = generateSectionDurations(3, 45_000, 2_000, rng);
			expect(result).toEqual([21_500, 2_000, 21_500]);
			expect(sum(result)).toBeCloseTo(45_000, 6);
		});

		it('produces an even split when cuts fall at 1/3 and 2/3', () => {
			// flex = 39_000 → cuts at 13_000 and 26_000 → gaps 13_000, 13_000, 13_000
			// → +2_000 = 15_000 each.
			const rng = scriptedRng([1 / 3, 2 / 3]);
			const result = generateSectionDurations(3, 45_000, 2_000, rng);
			for (const d of result) {
				expect(d).toBeCloseTo(15_000, APPROX_TOLERANCE);
			}
			expect(sum(result)).toBeCloseTo(45_000, 6);
		});

		it('sorts the cut points so section order is monotonic in cumulative time', () => {
			// Provide unsorted cuts; the implementation must sort them before
			// computing gaps, so the resulting durations remain non-negative
			// (i.e. no section shrinks below minMs).
			const rng = scriptedRng([0.9, 0.1]);
			const result = generateSectionDurations(3, 45_000, 2_000, rng);
			expect(result).toHaveLength(3);
			for (const d of result) {
				expect(d).toBeGreaterThanOrEqual(2_000);
			}
			expect(sum(result)).toBeCloseTo(45_000, 6);
		});
	});
});
