import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createConversionTracker, FIRED_KEY_PREFIX } from './conversionTracker';
import { recordTouch } from './attribution';
import type { ConsentSnapshot, ConversionEvent, DestinationLogLine } from './types';

const granted: ConsentSnapshot = {
	mode: 'bypass',
	grantedBy: 'config',
	analytics: true,
	marketing: true,
};

const makeDeps = (overrides: Record<string, unknown> = {}) => {
	const dispatch = vi.fn<(e: ConversionEvent, c: ConsentSnapshot) => DestinationLogLine[]>(() => [
		{ destination: 'ga4', event: 'sign_up', status: 'sent' },
	]);
	const initAll = vi.fn<(c: ConsentSnapshot) => DestinationLogLine[]>(() => []);
	const post = vi
		.fn()
		.mockResolvedValue({ status: 'sent', transport: 'sendBeacon', attempts: 1 });
	const log = vi.fn();

	return {
		deps: {
			registry: { dispatch, initAll },
			post,
			log,
			resolveConsentFn: () => granted,
			isAutomated: () => false,
			endpoint: '/api/Conversion',
			...overrides,
		},
		dispatch,
		initAll,
		post,
		log,
	};
};

beforeEach(() => {
	localStorage.clear();
});

describe('trackConversion envelope', () => {
	it('builds an envelope with every required field', () => {
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		const event = tracker.track('signup_verified', { userId: 'TilerUser@@1' });

		expect(event).not.toBeNull();
		expect(event).toMatchObject({
			stage: 'signup_verified',
			userId: 'TilerUser@@1',
			consent: granted,
		});
		expect(event?.eventId).toBeTruthy();
		expect(event?.anonymousId).toBeTruthy();
		expect(event?.sessionId).toBeTruthy();
		expect(event?.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(event?.page.path).toBe(window.location.pathname);
	});

	it('mints a unique eventId per call', () => {
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		const first = tracker.track('cta_clicked');
		const second = tracker.track('cta_clicked');

		expect(first?.eventId).not.toBe(second?.eventId);
	});

	it('keeps the anonymous id stable across events', () => {
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		expect(tracker.track('cta_clicked')?.anonymousId).toBe(
			tracker.track('cta_clicked')?.anonymousId
		);
	});

	it('attaches the stored first and last touch attribution', () => {
		recordTouch('https://tiler.app/?utm_source=reddit&utm_campaign=q3', '');
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		const event = tracker.track('signup_started');

		expect(event?.firstTouch?.source).toBe('reddit');
		expect(event?.lastTouch?.campaign).toBe('q3');
	});

	it('carries the hashed email but never a raw address', () => {
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		const event = tracker.track('signup_verified', { emailSha256: 'deadbeef' });

		expect(event?.emailSha256).toBe('deadbeef');
		expect(JSON.stringify(event)).not.toContain('@example');
	});
});

describe('trackConversion dispatch', () => {
	it('dispatches to the destination registry with the consent snapshot', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		const event = tracker.track('signup_verified');

		expect(dispatch).toHaveBeenCalledWith(event, granted);
	});

	it('posts the same eventId to the server so pixel and CAPI deduplicate', () => {
		const { deps, post } = makeDeps();
		const tracker = createConversionTracker(deps);

		const event = tracker.track('signup_verified');

		expect(post).toHaveBeenCalledTimes(1);
		expect(post.mock.calls[0]?.[0]).toBe('/api/Conversion');
		expect((post.mock.calls[0]?.[1] as ConversionEvent).eventId).toBe(event?.eventId);
	});

	it('logs the destination outcomes plus the server line', () => {
		const { deps, log } = makeDeps();
		const tracker = createConversionTracker(deps);

		tracker.track('signup_verified');

		const lines = log.mock.calls[0]?.[1] as DestinationLogLine[];
		expect(lines).toContainEqual({ destination: 'ga4', event: 'sign_up', status: 'sent' });
		expect(lines.some((line) => line.destination === 'server')).toBe(true);
	});

	it('does not reject or throw when the server post fails', () => {
		const { deps } = makeDeps({ post: vi.fn().mockRejectedValue(new Error('offline')) });
		const tracker = createConversionTracker(deps);

		expect(() => tracker.track('signup_verified')).not.toThrow();
	});

	it('still returns the event when the registry throws', () => {
		const { deps } = makeDeps({
			registry: {
				dispatch: vi.fn().mockImplementation(() => {
					throw new Error('registry blew up');
				}),
			},
		});
		const tracker = createConversionTracker(deps);

		expect(tracker.track('signup_verified')).not.toBeNull();
	});
});

describe('idempotency', () => {
	it('fires a once-per-user stage only once', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		const first = tracker.track('signup_verified', { userId: 'u1' });
		const second = tracker.track('signup_verified', { userId: 'u1' });

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('survives a reload by persisting the guard', () => {
		const { deps } = makeDeps();
		createConversionTracker(deps).track('signup_verified', { userId: 'u1' });

		const afterReload = createConversionTracker(makeDeps().deps);
		expect(afterReload.track('signup_verified', { userId: 'u1' })).toBeNull();
		expect(localStorage.getItem(`${FIRED_KEY_PREFIX}signup_verified:u1`)).toBeTruthy();
	});

	it('fires again for a different user', () => {
		const { deps } = makeDeps();
		const tracker = createConversionTracker(deps);

		expect(tracker.track('signup_verified', { userId: 'u1' })).not.toBeNull();
		expect(tracker.track('signup_verified', { userId: 'u2' })).not.toBeNull();
	});

	it('collapses a React StrictMode double invocation into one event', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		const effect = () => tracker.track('activated', { userId: 'u1' });
		effect();
		effect();

		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('does not guard repeatable stages', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		tracker.track('cta_clicked');
		tracker.track('cta_clicked');
		tracker.track('demo_engaged');

		expect(dispatch).toHaveBeenCalledTimes(3);
	});

	it('lets a caller opt a normally repeatable stage into once-only', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		tracker.track('demo_started', { once: true, dedupeKey: 'persona-1' });
		tracker.track('demo_started', { once: true, dedupeKey: 'persona-1' });
		tracker.track('demo_started', { once: true, dedupeKey: 'persona-2' });

		expect(dispatch).toHaveBeenCalledTimes(2);
	});

	it('lets a caller opt a once-only stage out, for retry scenarios', () => {
		const { deps, dispatch } = makeDeps();
		const tracker = createConversionTracker(deps);

		tracker.track('waitlist_joined', { once: false });
		tracker.track('waitlist_joined', { once: false });

		expect(dispatch).toHaveBeenCalledTimes(2);
	});
});

describe('automation guard', () => {
	it('emits nothing while the page is being prerendered', () => {
		const { deps, dispatch, post, log } = makeDeps({ isAutomated: () => true });
		const tracker = createConversionTracker(deps);

		expect(tracker.track('signup_verified')).toBeNull();
		expect(dispatch).not.toHaveBeenCalled();
		expect(post).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('does not consume the idempotency guard while prerendering', () => {
		createConversionTracker(makeDeps({ isAutomated: () => true }).deps).track(
			'signup_verified',
			{ userId: 'u1' }
		);

		const real = makeDeps();
		expect(
			createConversionTracker(real.deps).track('signup_verified', { userId: 'u1' })
		).not.toBeNull();
	});
});
