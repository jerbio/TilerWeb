import { describe, expect, it, vi } from 'vitest';
import { createExposureTracker, type ExposureDeps } from './exposure';
import { EXPOSED_KEY_PREFIX } from './environment';
import type { Assignment, HeroVariantKey } from './types';
import type { Attribution } from '@/core/analytics/types';

const firstTouch: Attribution = {
	source: 'reddit',
	medium: 'cpc',
	campaign: 'q3',
	isAd: true,
	channel: 'reddit',
	clickIds: { rdt_cid: 'rc1' },
	landingPath: '/',
	capturedAt: '2026-08-01T00:00:00.000Z',
};

const assignment = (over: Partial<Assignment> = {}): Assignment => ({
	experimentKey: 'hero_v1',
	variant: 'nl_scheduling',
	source: 'hash',
	forced: false,
	...over,
});

/** Storage-backed fakes so the once-per-session guard is exercised for real. */
const harness = (over: Partial<ExposureDeps> = {}) => {
	const seen = new Map<string, string>();
	const post = vi.fn().mockResolvedValue({ status: 'sent', transport: 'fetch', attempts: 1 });
	const pin = vi.fn();
	let eventCounter = 0;

	const tracker = createExposureTracker({
		post,
		endpoint: '/api/Experiment/exposure',
		anonymousId: () => 'anon-1',
		sessionId: () => 'sess-1',
		firstTouch: () => firstTouch,
		locale: () => 'en',
		landingPath: () => '/',
		newEventId: () => `evt-${++eventCounter}`,
		exposed: (key) => seen.has(key),
		markSeen: (key, at) => void seen.set(key, at),
		pin,
		...over,
	});

	return { tracker, post, pin, seen };
};

describe('createExposureTracker', () => {
	it('posts a complete payload to the exposure endpoint', () => {
		const { tracker, post } = harness();

		const payload = tracker.track(assignment());

		expect(payload).toEqual({
			eventId: 'evt-1',
			experimentKey: 'hero_v1',
			variantKey: 'nl_scheduling',
			anonymousId: 'anon-1',
			sessionId: 'sess-1',
			occurredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
			source: 'hash',
			forced: false,
			locale: 'en',
			landingPath: '/',
			firstTouch,
		});
		expect(post).toHaveBeenCalledExactlyOnceWith('/api/Experiment/exposure', payload);
	});

	it('fires once per session even across repeated calls', () => {
		const { tracker, post } = harness();

		const first = tracker.track(assignment());
		const second = tracker.track(assignment());
		const third = tracker.track(assignment());

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(third).toBeNull();
		expect(post).toHaveBeenCalledTimes(1);
	});

	it('does not re-fire when a previous session already recorded the exposure', () => {
		const seen = new Map<string, string>([
			[`${EXPOSED_KEY_PREFIX}hero_v1:sess-1`, '2026-08-01T00:00:00.000Z'],
		]);
		const { tracker, post } = harness({
			exposed: (key) => seen.has(key),
			markSeen: (key, at) => void seen.set(key, at),
		});

		expect(tracker.track(assignment())).toBeNull();
		expect(post).not.toHaveBeenCalled();
	});

	it('scopes the guard to the session, so a rolled session exposes again', () => {
		let session = 'sess-1';
		const { tracker, post } = harness({ sessionId: () => session });

		tracker.track(assignment());
		session = 'sess-2';
		tracker.track(assignment());

		expect(post).toHaveBeenCalledTimes(2);
	});

	it('pins the assignment on first exposure so a roster change cannot move the visitor', () => {
		const { tracker, pin } = harness();

		tracker.track(assignment({ variant: 'self_healing' }));

		expect(pin).toHaveBeenCalledExactlyOnceWith('hero_v1', 'self_healing');
	});

	it.each<[Assignment['source'], boolean]>([
		['automated', true],
		['override', true],
	])('suppresses %s assignments entirely', (source, forced) => {
		const { tracker, post, pin } = harness();

		const payload = tracker.track(assignment({ source, forced }));

		expect(payload).toBeNull();
		expect(post).not.toHaveBeenCalled();
		expect(pin).not.toHaveBeenCalled();
	});

	it('records a pinned assignment with a pin source', () => {
		const { tracker } = harness();

		expect(tracker.track(assignment({ source: 'pin' }))?.source).toBe('pin');
	});

	it('marks the guard before posting, so a rejected beacon cannot double-fire', async () => {
		const post = vi.fn().mockRejectedValue(new Error('offline'));
		const { tracker } = harness({ post });

		expect(tracker.track(assignment())).not.toBeNull();
		await Promise.resolve();

		expect(tracker.track(assignment())).toBeNull();
		expect(post).toHaveBeenCalledTimes(1);
	});

	it('never throws when the transport throws synchronously', () => {
		const post = vi.fn(() => {
			throw new Error('blocked');
		});
		const { tracker } = harness({ post: post as unknown as ExposureDeps['post'] });

		expect(() => tracker.track(assignment())).not.toThrow();
	});

	it('still reports when the exposure guard cannot be persisted', () => {
		const { tracker, post } = harness({
			exposed: () => false,
			markSeen: () => {
				throw new Error('private mode');
			},
		});

		// The in-memory mirror is the fallback: report once, never break the hero.
		expect(() => tracker.track(assignment())).not.toThrow();
		expect(post).toHaveBeenCalledTimes(1);
		expect(tracker.track(assignment())).toBeNull();
	});

	it.each(['control', 'nl_scheduling', 'stop_deciding', 'self_healing', 'task_splitting'])(
		'reports the %s arm unchanged',
		(variant) => {
			const { tracker } = harness();

			expect(
				tracker.track(assignment({ variant: variant as HeroVariantKey }))?.variantKey
			).toBe(variant);
		}
	);
});
