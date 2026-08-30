import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createDestinationRegistry } from './registry';
import { createGa4Destination } from './ga4';
import { createGoogleAdsDestination } from './googleAds';
import { createMetaDestination } from './meta';
import { createRedditDestination } from './reddit';
import { createXDestination } from './x';
import type { ConversionDestination } from './types';
import type { ConsentSnapshot } from '../types';

const granted: ConsentSnapshot = {
	mode: 'bypass',
	grantedBy: 'config',
	analytics: true,
	marketing: true,
};

const deniedMarketing: ConsentSnapshot = {
	mode: 'enforce',
	grantedBy: 'user',
	analytics: true,
	marketing: false,
};

type Windowish = Window & Record<string, unknown>;
const win = window as unknown as Windowish;

beforeEach(() => {
	document.head.innerHTML = '';
	delete win.gtag;
	delete win.dataLayer;
	delete win.fbq;
	delete win._fbq;
	delete win.rdt;
	delete win.twq;
});

const fake = (overrides: Partial<ConversionDestination> = {}): ConversionDestination => ({
	id: 'meta',
	consentCategory: 'marketing',
	isConfigured: () => true,
	load: vi.fn(),
	send: vi.fn().mockReturnValue('sent'),
	...overrides,
});

/**
 * Regression guard for the landing-initialisation bug: pixels used to stay dormant
 * until a stage happened to map to them, so `fbclid`/`rdt_cid` were never exchanged
 * for the vendor cookies that later conversions match on.
 */
describe('registry.initAll', () => {
	it('loads every configured, consented destination', () => {
		const meta = fake({ id: 'meta' });
		const reddit = fake({ id: 'reddit' });
		const registry = createDestinationRegistry([meta, reddit]);

		registry.initAll(granted);

		expect(meta.load).toHaveBeenCalledTimes(1);
		expect(reddit.load).toHaveBeenCalledTimes(1);
	});

	it('fires each destination base page event after loading it', () => {
		const trackPageVisit = vi.fn();
		const meta = fake({ trackPageVisit });
		const registry = createDestinationRegistry([meta]);

		registry.initAll(granted);

		expect(trackPageVisit).toHaveBeenCalledTimes(1);
	});

	it('does not load an unconfigured destination', () => {
		const meta = fake({ isConfigured: () => false });
		const registry = createDestinationRegistry([meta]);

		registry.initAll(granted);

		expect(meta.load).not.toHaveBeenCalled();
	});

	it('does not load a destination whose consent category is denied', () => {
		const meta = fake({ consentCategory: 'marketing' });
		const registry = createDestinationRegistry([meta]);

		registry.initAll(deniedMarketing);

		expect(meta.load).not.toHaveBeenCalled();
	});

	it('is idempotent across repeated calls', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		registry.initAll(granted);
		registry.initAll(granted);

		expect(meta.load).toHaveBeenCalledTimes(1);
	});

	it('shares load state with dispatch so a destination is never loaded twice', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		registry.initAll(granted);
		registry.dispatch(
			{
				eventId: 'evt-1',
				stage: 'signup_verified',
				occurredAt: '2026-08-20T00:00:00.000Z',
				anonymousId: 'a',
				sessionId: 's',
				firstTouch: null,
				lastTouch: null,
				page: { path: '/', referrer: '', title: '' },
				consent: granted,
			},
			granted
		);

		expect(meta.load).toHaveBeenCalledTimes(1);
	});

	it('keeps initialising the rest when one destination throws', () => {
		const broken = fake({
			id: 'meta',
			load: vi.fn(() => {
				throw new Error('blocked by the browser');
			}),
		});
		const reddit = fake({ id: 'reddit' });
		const registry = createDestinationRegistry([broken, reddit]);

		expect(() => registry.initAll(granted)).not.toThrow();
		expect(reddit.load).toHaveBeenCalledTimes(1);
	});

	it('reports a log line per destination so init is visible in the [CVN] output', () => {
		const meta = fake({ id: 'meta' });
		const reddit = fake({ id: 'reddit', isConfigured: () => false });
		const registry = createDestinationRegistry([meta, reddit]);

		expect(registry.initAll(granted)).toEqual([
			{ destination: 'meta', event: 'init', status: 'sent' },
			{ destination: 'reddit', event: 'init', status: 'skipped:not-configured' },
		]);
	});
});

describe('real adapters initialise on landing', () => {
	it('meta installs the pixel and records a PageView', () => {
		const registry = createDestinationRegistry([createMetaDestination(() => '123456')]);

		registry.initAll(granted);

		expect(typeof win.fbq).toBe('function');
		expect(document.querySelector('script[src*="connect.facebook.net"]')).not.toBeNull();

		const queued = (win.fbq as { queue?: unknown[][] }).queue ?? [];
		expect(queued).toContainEqual(['init', '123456']);
		expect(queued).toContainEqual(['track', 'PageView']);
	});

	it('reddit installs the pixel and records a PageVisit', () => {
		const registry = createDestinationRegistry([createRedditDestination(() => 'a2_test')]);

		registry.initAll(granted);

		expect(typeof win.rdt).toBe('function');
		expect(document.querySelector('script[src*="redditstatic.com"]')).not.toBeNull();

		const queued = (win.rdt as { callQueue?: unknown[][] }).callQueue ?? [];
		expect(queued).toContainEqual(['init', 'a2_test']);
		expect(queued).toContainEqual(['track', 'PageVisit']);
	});

	it('x installs the tag and configures the pixel', () => {
		const registry = createDestinationRegistry([
			createXDestination({ getId: () => 'oxxxx', getEventIds: () => ({}) }),
		]);

		registry.initAll(granted);

		expect(typeof win.twq).toBe('function');
		expect(document.querySelector('script[src*="ads-twitter.com"]')).not.toBeNull();
		expect((win.twq as { queue?: unknown[][] }).queue ?? []).toContainEqual([
			'config',
			'oxxxx',
		]);
	});

	/**
	 * `twq('config')` initialises the tag but emits no beacon on its own — verified
	 * against the live X tag. A page view needs its own configured event id, and
	 * without one X never sees the visit that carries `twclid`.
	 */
	it('x fires its configured page view event so twclid is captured', () => {
		const registry = createDestinationRegistry([
			createXDestination({
				getId: () => 'oxxxx',
				getEventIds: () => ({ page_view: 'tw-oxxxx-pv123' }),
			}),
		]);

		registry.initAll(granted);

		const queued = (win.twq as { queue?: unknown[][] }).queue ?? [];
		expect(queued).toContainEqual(['event', 'tw-oxxxx-pv123', {}]);
	});

	it('x skips the page view when no page view event id is configured', () => {
		const registry = createDestinationRegistry([
			createXDestination({ getId: () => 'oxxxx', getEventIds: () => ({}) }),
		]);

		registry.initAll(granted);

		const queued = (win.twq as { queue?: unknown[][] }).queue ?? [];
		expect(queued.some((args) => args[0] === 'event')).toBe(false);
	});

	it('google destinations install gtag without a duplicate page view', () => {
		const registry = createDestinationRegistry([
			createGa4Destination(() => 'G-123'),
			createGoogleAdsDestination({ getId: () => 'AW-123', getLabels: () => ({}) }),
		]);

		registry.initAll(granted);

		const calls = (win.dataLayer as unknown[][]) ?? [];
		expect(calls.find((a) => a[0] === 'config' && a[1] === 'G-123')?.[2]).toMatchObject({
			send_page_view: false,
		});
		expect(calls.some((a) => a[0] === 'config' && a[1] === 'AW-123')).toBe(true);
	});

	it('installs nothing at all when marketing consent is denied', () => {
		const registry = createDestinationRegistry([
			createMetaDestination(() => '123456'),
			createRedditDestination(() => 'a2_test'),
			createXDestination({ getId: () => 'oxxxx', getEventIds: () => ({}) }),
		]);

		registry.initAll(deniedMarketing);

		expect(win.fbq).toBeUndefined();
		expect(win.rdt).toBeUndefined();
		expect(win.twq).toBeUndefined();
		expect(document.querySelectorAll('script')).toHaveLength(0);
	});
});
