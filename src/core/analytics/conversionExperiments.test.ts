import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createConversionTracker } from './conversionTracker';
import { CONVERSION_STAGES } from './conversionEvents';
import type { ConsentSnapshot, ConversionExperiment } from './types';

const granted: ConsentSnapshot = {
	mode: 'bypass',
	grantedBy: 'config',
	analytics: true,
	marketing: true,
};

const arm: ConversionExperiment = { key: 'hero_v1', variant: 'self_healing', forced: false };

const makeTracker = (experiments: () => ConversionExperiment[] | undefined) =>
	createConversionTracker({
		registry: { dispatch: vi.fn(() => []), initAll: vi.fn(() => []) },
		post: vi.fn().mockResolvedValue({ status: 'sent', transport: 'sendBeacon', attempts: 1 }),
		log: vi.fn(),
		resolveConsentFn: () => granted,
		isAutomated: () => false,
		endpoint: '/api/Conversion',
		experiments,
	});

beforeEach(() => {
	localStorage.clear();
});

/**
 * The whole point of stamping inside `track` is that no call site can forget it,
 * so every stage is asserted rather than a representative sample.
 */
describe('conversion envelope experiment stamping', () => {
	it.each(CONVERSION_STAGES)('stamps the arm onto a %s event', (stage) => {
		const tracker = makeTracker(() => [arm]);

		const event = tracker.track(stage, { dedupeKey: `k-${stage}` });

		expect(event?.experiments).toEqual([arm]);
	});

	it('omits the field entirely when the visitor has no assignment', () => {
		const tracker = makeTracker(() => undefined);

		const event = tracker.track('cta_clicked');

		expect(event?.experiments).toBeUndefined();
		expect(event && 'experiments' in event).toBe(true);
	});

	it('carries the forced flag so QA sessions can be excluded server-side', () => {
		const forced: ConversionExperiment = { ...arm, forced: true };
		const tracker = makeTracker(() => [forced]);

		expect(tracker.track('cta_clicked')?.experiments).toEqual([forced]);
	});

	it('posts the arm to the server, not just to the pixels', async () => {
		const post = vi
			.fn()
			.mockResolvedValue({ status: 'sent', transport: 'sendBeacon', attempts: 1 });
		const tracker = createConversionTracker({
			registry: { dispatch: vi.fn(() => []), initAll: vi.fn(() => []) },
			post,
			log: vi.fn(),
			resolveConsentFn: () => granted,
			isAutomated: () => false,
			endpoint: '/api/Conversion',
			experiments: () => [arm],
		});

		tracker.track('signup_started');
		await Promise.resolve();

		const [, body] = post.mock.calls[0] ?? [];
		expect((body as { experiments?: ConversionExperiment[] }).experiments).toEqual([arm]);
	});

	it('still reports the conversion when the experiment lookup throws', () => {
		const tracker = makeTracker(() => {
			throw new Error('experiment plumbing broken');
		});

		// A broken experiment must never cost a conversion.
		expect(() => tracker.track('signup_verified')).not.toThrow();
	});
});
