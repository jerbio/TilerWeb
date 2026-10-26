import { describe, expect, it, beforeEach } from 'vitest';
import { createXDestination } from './x';
import type { ConversionEvent } from '../types';

type Windowish = Window & Record<string, unknown>;
const win = window as unknown as Windowish;

const event: ConversionEvent = {
	eventId: 'evt-1',
	stage: 'signup_verified',
	occurredAt: '2026-08-20T00:00:00.000Z',
	anonymousId: 'anon-1',
	sessionId: 'sess-1',
	firstTouch: null,
	lastTouch: null,
	page: { path: '/signup', referrer: '', title: 'Tiler' },
	consent: { mode: 'bypass', grantedBy: 'config', analytics: true, marketing: true },
};

const queued = () =>
	((win.twq as { queue?: unknown[][] }).queue ?? []).filter((a) => a[0] === 'event');

beforeEach(() => {
	document.head.innerHTML = '';
	delete win.twq;
});

/**
 * X returns HTTP 200 for any event id, real or invented, and discards unknown ones
 * server-side. The network therefore gives no signal at all, so a malformed id has to
 * be caught here or it is never caught.
 */
describe('X event id validation', () => {
	const send = (eventId: string) => {
		const destination = createXDestination({
			getId: () => 'qftok',
			getEventIds: () => ({ signup: eventId }),
		});
		destination.load();
		return destination.send(event, 'signup');
	};

	it('sends a correctly formed event id', () => {
		expect(send('tw-qftok-abc12')).toBe('sent');
		expect(queued()).toHaveLength(1);
	});

	it.each([
		['uppercase suffix', 'tw-qftok-START'],
		['suffix too long', 'tw-qftok-SIGNUP'],
		['suffix too short', 'tw-qftok-LEAD'],
		['placeholder text', 'tw-qftok-ACTIVATE'],
		['missing the tw prefix', 'qftok-abc12'],
		['pixel id only', 'qftok'],
		['empty', ''],
	])('refuses to send a %s and reports it rather than failing silently', (_label, eventId) => {
		expect(send(eventId)).toBe('skipped:not-configured');
		expect(queued()).toHaveLength(0);
	});

	it('does not fire a page visit for a malformed page view id', () => {
		const destination = createXDestination({
			getId: () => 'qftok',
			getEventIds: () => ({ page_view: 'tw-qftok-PAGEVIEW' }),
		});
		destination.load();
		destination.trackPageVisit?.();

		expect(queued()).toHaveLength(0);
	});

	it('fires a page visit for a correctly formed page view id', () => {
		const destination = createXDestination({
			getId: () => 'qftok',
			getEventIds: () => ({ page_view: 'tw-qftok-pv123' }),
		});
		destination.load();
		destination.trackPageVisit?.();

		expect(queued()).toHaveLength(1);
	});
});
