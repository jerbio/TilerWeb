import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	isCountedAssignment,
	resolveVariant,
	shouldRecordExposure,
	type ResolveInput,
} from './assignment';
import { HERO_ROSTER } from './roster';
import type { HeroVariantDefinition } from './types';

const EXPERIMENT = 'hero_v1';

const resolve = (overrides: Partial<ResolveInput> = {}) =>
	resolveVariant({
		experimentKey: EXPERIMENT,
		anonymousId: 'b3f1c0de-1111-4222-8333-444455556666',
		roster: HERO_ROSTER,
		...overrides,
	});

/** Seeded so a distribution run is reproducible; `crypto.randomUUID` is not. */
const mulberry32 = (seed: number) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seededId = (rand: () => number): string =>
	'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (rand() * 16) | 0;
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});

afterEach(() => {
	vi.useRealTimers();
});

describe('resolveVariant precedence', () => {
	it('serves control and marks it forced under automation', () => {
		const assignment = resolve({
			automated: true,
			override: 'self_healing',
			pin: 'stop_deciding',
		});

		expect(assignment.variant).toBe('control');
		expect(assignment.source).toBe('automated');
		expect(assignment.forced).toBe(true);
	});

	it('lets an override beat a pin', () => {
		const assignment = resolve({ override: 'self_healing', pin: 'stop_deciding' });

		expect(assignment.variant).toBe('self_healing');
		expect(assignment.source).toBe('override');
		expect(assignment.forced).toBe(true);
	});

	it('lets a pin beat the hash', () => {
		const assignment = resolve({ pin: 'stop_deciding' });

		expect(assignment.variant).toBe('stop_deciding');
		expect(assignment.source).toBe('pin');
		expect(assignment.forced).toBe(false);
	});

	it('falls through to the hash when nothing else applies', () => {
		expect(resolve().source).toBe('hash');
	});
});

describe('resolveVariant input validation', () => {
	it('ignores an override that is not a known variant key', () => {
		expect(resolve({ override: 'not_a_variant' }).source).toBe('hash');
		expect(resolve({ override: '' }).source).toBe('hash');
		expect(resolve({ override: null }).source).toBe('hash');
	});

	it('ignores a pin referencing a key that never existed', () => {
		expect(resolve({ pin: 'legacy_variant' }).source).toBe('hash');
	});

	it('ignores a pin referencing a retired arm so retiring one stops serving it', () => {
		const roster: HeroVariantDefinition[] = [
			{ key: 'control', enabled: true },
			{ key: 'nl_scheduling', enabled: true },
			{ key: 'stop_deciding', enabled: false },
		];

		const assignment = resolveVariant({
			experimentKey: EXPERIMENT,
			anonymousId: 'visitor-on-a-retired-arm',
			roster,
			pin: 'stop_deciding',
		});

		expect(assignment.variant).not.toBe('stop_deciding');
		expect(assignment.source).toBe('hash');
	});

	it('still renders a retired arm when explicitly overridden, so it can be reviewed', () => {
		const roster: HeroVariantDefinition[] = [
			{ key: 'control', enabled: true },
			{ key: 'self_healing', enabled: false },
		];

		const assignment = resolveVariant({
			experimentKey: EXPERIMENT,
			anonymousId: 'reviewer',
			roster,
			override: 'self_healing',
		});

		expect(assignment.variant).toBe('self_healing');
		expect(assignment.forced).toBe(true);
	});

	it('never buckets into a disabled arm', () => {
		const roster: HeroVariantDefinition[] = [
			{ key: 'control', enabled: true },
			{ key: 'nl_scheduling', enabled: false },
			{ key: 'stop_deciding', enabled: true },
		];
		const rand = mulberry32(7);

		for (let i = 0; i < 500; i += 1) {
			const assignment = resolveVariant({
				experimentKey: EXPERIMENT,
				anonymousId: seededId(rand),
				roster,
			});

			expect(assignment.variant).not.toBe('nl_scheduling');
		}
	});

	it('renders control without counting it when no arm is eligible', () => {
		const assignment = resolveVariant({
			experimentKey: EXPERIMENT,
			anonymousId: 'visitor',
			roster: [{ key: 'control', enabled: false }],
		});

		expect(assignment.variant).toBe('control');
		expect(assignment.forced).toBe(true);
	});
});

describe('stickiness', () => {
	it('returns the same arm on every call for the same visitor', () => {
		const first = resolve().variant;

		for (let i = 0; i < 100; i += 1) {
			expect(resolve().variant).toBe(first);
		}
	});

	it('recovers the same arm from the id alone, with no pin present', () => {
		const anonymousId = 'a1b2c3d4-5566-4777-8888-99990000aaaa';

		const beforeClear = resolveVariant({
			experimentKey: EXPERIMENT,
			anonymousId,
			roster: HERO_ROSTER,
			pin: 'self_healing',
		});
		const afterClear = resolveVariant({
			experimentKey: EXPERIMENT,
			anonymousId,
			roster: HERO_ROSTER,
			pin: null,
		});

		// The pin is an optimisation, not the mechanism. Losing it must not lose the arm
		// unless the roster itself changed.
		expect(afterClear.source).toBe('hash');
		expect(beforeClear.variant).toBe('self_healing');
	});
});

describe('distribution', () => {
	it('splits 10,000 seeded visitors within two points of even', () => {
		const rand = mulberry32(20260825);
		const counts = new Map<string, number>();
		const total = 10_000;

		for (let i = 0; i < total; i += 1) {
			const { variant } = resolveVariant({
				experimentKey: EXPERIMENT,
				anonymousId: seededId(rand),
				roster: HERO_ROSTER,
			});
			counts.set(variant, (counts.get(variant) ?? 0) + 1);
		}

		expect(counts.size).toBe(HERO_ROSTER.length);

		// Derived from the roster, not hardcoded: adding an arm changes what "even"
		// means, and a fixed bound would fail for the right answer.
		const evenShare = 1 / HERO_ROSTER.length;
		const tolerance = 0.02;
		const expected = total / HERO_ROSTER.length;
		for (const [, count] of counts) {
			const share = count / total;
			expect(share).toBeGreaterThan(evenShare - tolerance);
			expect(share).toBeLessThan(evenShare + tolerance);
		}

		const chiSquare = [...counts.values()].reduce(
			(sum, count) => sum + (count - expected) ** 2 / expected,
			0
		);

		// 4 degrees of freedom, critical value at p = 0.001.
		expect(chiSquare).toBeLessThan(18.47);
	});
});

describe('time invariance', () => {
	it('assigns identically regardless of the clock', () => {
		const anonymousId = 'c0ffee00-1234-4567-89ab-cdef01234567';
		const at = (iso: string) => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(iso));
			return resolveVariant({ experimentKey: EXPERIMENT, anonymousId, roster: HERO_ROSTER })
				.variant;
		};

		const start = at('2026-09-01T00:00:00Z');

		expect(at('2026-09-01T13:45:00Z')).toBe(start);
		expect(at('2026-09-30T23:59:59Z')).toBe(start);
		expect(at('2027-06-01T00:00:00Z')).toBe(start);
		expect(at('2020-01-01T00:00:00Z')).toBe(start);
	});

	it('does not reference any time or locale API in the assignment path', () => {
		const sources = ['./assignment.ts', './hash.ts', './roster.ts'].map((file) =>
			readFileSync(new URL(file, import.meta.url), 'utf8')
		);

		for (const source of sources) {
			expect(source).not.toMatch(/\bDate\b/);
			expect(source).not.toMatch(/\bperformance\b/);
			expect(source).not.toMatch(/\bIntl\b/);
			expect(source).not.toMatch(/getTimezoneOffset/);
		}
	});
});

describe('result eligibility', () => {
	it('counts only organic assignments', () => {
		expect(isCountedAssignment(resolve())).toBe(true);
		expect(isCountedAssignment(resolve({ pin: 'stop_deciding' }))).toBe(true);
		expect(isCountedAssignment(resolve({ override: 'stop_deciding' }))).toBe(false);
		expect(isCountedAssignment(resolve({ automated: true }))).toBe(false);
	});

	it('records exposure only for organic assignments', () => {
		expect(shouldRecordExposure(resolve())).toBe(true);
		expect(shouldRecordExposure(resolve({ pin: 'stop_deciding' }))).toBe(true);
		expect(shouldRecordExposure(resolve({ override: 'stop_deciding' }))).toBe(false);
		expect(shouldRecordExposure(resolve({ automated: true }))).toBe(false);
	});
});
