import { describe, expect, it } from 'vitest';
import { bucketOf, fnv1a32 } from './hash';

describe('fnv1a32', () => {
	it('matches the canonical FNV-1a 32-bit vectors', () => {
		// Pinned against the published algorithm, not against our own output, so a
		// refactor that silently changes bucketing cannot pass.
		expect(fnv1a32('')).toBe(0x811c9dc5);
		expect(fnv1a32('a')).toBe(0xe40c292c);
		expect(fnv1a32('foobar')).toBe(0xbf9cf968);
	});

	it('is deterministic across repeated calls', () => {
		const input = 'b3f1c0de-1111-4222-8333-444455556666:hero_v1';

		expect(fnv1a32(input)).toBe(fnv1a32(input));
		expect(fnv1a32(input)).toBe(fnv1a32(input));
	});

	it('always returns an unsigned 32-bit integer', () => {
		for (const input of ['', 'a', 'hero_v1', '\u00ff\u00fe', 'x'.repeat(500)]) {
			const hash = fnv1a32(input);

			expect(Number.isInteger(hash)).toBe(true);
			expect(hash).toBeGreaterThanOrEqual(0);
			expect(hash).toBeLessThanOrEqual(0xffffffff);
		}
	});

	it('avalanches on a single character change rather than clustering', () => {
		const base = '00000000-0000-4000-8000-00000000000';
		const buckets = new Set<number>();

		for (let i = 0; i < 10; i += 1) {
			buckets.add(fnv1a32(`${base}${i}`) % 5);
		}

		// Ten near-identical ids must not all land in one or two buckets.
		expect(buckets.size).toBeGreaterThanOrEqual(3);
	});
});

describe('bucketOf', () => {
	it('stays within range', () => {
		for (let i = 0; i < 200; i += 1) {
			const bucket = bucketOf(`id-${i}`, 'hero_v1', 5);

			expect(bucket).toBeGreaterThanOrEqual(0);
			expect(bucket).toBeLessThan(5);
		}
	});

	it('reshuffles when the experiment key changes', () => {
		const ids = Array.from({ length: 200 }, (_, i) => `visitor-${i}`);

		const moved = ids.filter((id) => bucketOf(id, 'hero_v1', 5) !== bucketOf(id, 'hero_v2', 5));

		// A different salt must not reproduce the same cohorts.
		expect(moved.length).toBeGreaterThan(ids.length * 0.5);
	});

	it('returns zero rather than NaN when there is nothing to bucket into', () => {
		expect(bucketOf('any-id', 'hero_v1', 0)).toBe(0);
	});
});
