import { describe, expect, it, vi, beforeEach } from 'vitest';

const track = vi.fn();
const post = vi.fn().mockResolvedValue({ status: 'sent', transport: 'sendBeacon', attempts: 1 });

vi.mock('./conversionTracker', () => ({
	trackConversion: (...args: unknown[]) => track(...args),
}));

vi.mock('./beacon', () => ({
	postBeacon: (...args: unknown[]) => post(...args),
}));

vi.mock('./identity', () => ({
	getAnonymousId: () => 'anon-fixed',
}));

import {
	linkConversionIdentity,
	trackActivated,
	trackCtaClicked,
	trackDemoEngaged,
	trackDemoStarted,
} from './funnel';

beforeEach(() => {
	track.mockReset();
	post.mockClear();
	localStorage.clear();
});

const stageOf = (call: unknown[]) => call[0];
const optsOf = (call: unknown[]) => call[1] as Record<string, unknown>;

describe('trackDemoStarted', () => {
	it('emits demo_started for an anonymous persona demo', () => {
		trackDemoStarted({ personaId: 'chef', personaName: 'Chef', isAnonymous: true });

		expect(track).toHaveBeenCalledTimes(1);
		expect(stageOf(track.mock.calls[0]!)).toBe('demo_started');
	});

	it('scopes the once-guard to the persona so a second persona still counts', () => {
		trackDemoStarted({ personaId: 'chef', personaName: 'Chef', isAnonymous: true });
		trackDemoStarted({ personaId: 'nurse', personaName: 'Nurse', isAnonymous: true });

		expect(track).toHaveBeenCalledTimes(2);
		expect(optsOf(track.mock.calls[0]!).dedupeKey).not.toBe(
			optsOf(track.mock.calls[1]!).dedupeKey
		);
		expect(optsOf(track.mock.calls[0]!).once).toBe(true);
	});

	it('does not fire for an authenticated user, who is not in the demo funnel', () => {
		trackDemoStarted({ personaId: 'chef', personaName: 'Chef', isAnonymous: false });

		expect(track).not.toHaveBeenCalled();
	});
});

describe('trackDemoEngaged', () => {
	it('emits demo_engaged on the first anonymous chat message', () => {
		trackDemoEngaged({ personaId: 'chef', messageLength: 12, isAnonymous: true });

		expect(stageOf(track.mock.calls[0]!)).toBe('demo_engaged');
		expect(optsOf(track.mock.calls[0]!).once).toBe(true);
	});

	it('ignores messages sent from an authenticated session', () => {
		trackDemoEngaged({ personaId: 'chef', messageLength: 12, isAnonymous: false });

		expect(track).not.toHaveBeenCalled();
	});

	it('ignores an empty message', () => {
		trackDemoEngaged({ personaId: 'chef', messageLength: 0, isAnonymous: true });

		expect(track).not.toHaveBeenCalled();
	});
});

describe('trackCtaClicked', () => {
	it('emits cta_clicked with the placement and destination', () => {
		trackCtaClicked({ label: 'Try Free', location: 'Navigation', destination: '/signin' });

		expect(stageOf(track.mock.calls[0]!)).toBe('cta_clicked');
		expect(optsOf(track.mock.calls[0]!).properties).toEqual({
			label: 'Try Free',
			location: 'Navigation',
			destination: '/signin',
		});
	});

	it('is not deduped, because every click is intent signal', () => {
		trackCtaClicked({ label: 'Try Free', location: 'Navigation', destination: '/signin' });
		trackCtaClicked({ label: 'Try Free', location: 'Navigation', destination: '/signin' });

		expect(track).toHaveBeenCalledTimes(2);
		expect(optsOf(track.mock.calls[0]!).once).toBe(false);
	});
});

describe('trackActivated', () => {
	it('emits activated once per user for an authenticated creation', () => {
		trackActivated({ userId: 'TilerUser@@1', isAuthenticated: true });

		expect(stageOf(track.mock.calls[0]!)).toBe('activated');
		expect(optsOf(track.mock.calls[0]!)).toMatchObject({
			userId: 'TilerUser@@1',
			once: true,
			dedupeKey: 'TilerUser@@1',
		});
	});

	it('does not fire when the creation came from an anonymous demo session', () => {
		trackActivated({ userId: 'TilerUser@@1', isAuthenticated: false });

		expect(track).not.toHaveBeenCalled();
	});

	it('does not fire without a user id to scope the guard to', () => {
		trackActivated({ userId: undefined, isAuthenticated: true });

		expect(track).not.toHaveBeenCalled();
	});
});

/**
 * Signing in is not a conversion, but it is the only moment the anonymous visitor and
 * the account are both known. Without the link every pre-auth event stays orphaned.
 */
describe('linkConversionIdentity', () => {
	it('posts the anonymous id and user id to the alias endpoint', async () => {
		await linkConversionIdentity('TilerUser@@1');

		expect(post).toHaveBeenCalledTimes(1);
		const [url, body] = post.mock.calls[0]!;
		expect(url).toBe('/api/Conversion/alias');
		expect(body).toEqual({ anonymousId: 'anon-fixed', userId: 'TilerUser@@1' });
	});

	it('does nothing without a user id', async () => {
		await linkConversionIdentity('');

		expect(post).not.toHaveBeenCalled();
	});

	it('links once per user, since repeat sign-ins add nothing', async () => {
		await linkConversionIdentity('TilerUser@@1');
		await linkConversionIdentity('TilerUser@@1');

		expect(post).toHaveBeenCalledTimes(1);
	});

	it('never rejects, so a failed link cannot break sign-in', async () => {
		post.mockRejectedValueOnce(new Error('offline'));

		await expect(linkConversionIdentity('TilerUser@@2')).resolves.toBeUndefined();
	});
});
