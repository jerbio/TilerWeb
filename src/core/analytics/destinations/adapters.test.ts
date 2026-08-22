import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGa4Destination } from './ga4';
import { createGoogleAdsDestination } from './googleAds';
import { createMetaDestination } from './meta';
import { createRedditDestination } from './reddit';
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
	userId: 'TilerUser@@1',
	emailSha256: 'hashed-email',
	value: 12,
	currency: 'USD',
	firstTouch: null,
	lastTouch: null,
	page: { path: '/signup', referrer: '', title: 'Tiler' },
	consent: { mode: 'bypass', grantedBy: 'config', analytics: true, marketing: true },
};

beforeEach(() => {
	document.head.innerHTML = '';
	document.body.innerHTML = '';
	delete win.gtag;
	delete win.dataLayer;
	delete win.fbq;
	delete win._fbq;
	delete win.rdt;
	delete win.twq;
});

describe('GA4 destination', () => {
	it('is only configured with a measurement id', () => {
		expect(createGa4Destination(() => 'G-123').isConfigured()).toBe(true);
		expect(createGa4Destination(() => undefined).isConfigured()).toBe(false);
	});

	it('is gated on analytics consent, not marketing', () => {
		expect(createGa4Destination(() => 'G-123').consentCategory).toBe('analytics');
	});

	it('installs the gtag stub and script on load', () => {
		createGa4Destination(() => 'G-123').load();

		expect(typeof win.gtag).toBe('function');
		expect(
			document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
		).not.toBeNull();
	});

	it('disables the automatic page view so route tracking is not double counted', () => {
		createGa4Destination(() => 'G-123').load();

		const configCall = (win.dataLayer as unknown[][]).find(
			(args) => args[0] === 'config' && args[1] === 'G-123'
		);
		expect(configCall?.[2]).toMatchObject({ send_page_view: false });
	});

	it('only injects the script once', () => {
		const destination = createGa4Destination(() => 'G-123');
		destination.load();
		destination.load();

		expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1);
	});

	it('sends the mapped event name with flat GA4 params', () => {
		const destination = createGa4Destination(() => 'G-123');
		destination.load();
		const gtag = vi.fn();
		win.gtag = gtag;

		expect(destination.send(event, 'sign_up')).toBe('sent');
		expect(gtag).toHaveBeenCalledWith(
			'event',
			'sign_up',
			expect.objectContaining({
				event_id: 'evt-1',
				anonymous_id: 'anon-1',
				session_id: 'sess-1',
				value: 12,
				currency: 'USD',
			})
		);
	});
});

describe('Google Ads destination', () => {
	const options = {
		getId: () => 'AW-999' as string | undefined,
		getLabels: () => ({ signup: 'lbl-signup' }) as Record<string, string | undefined>,
	};

	it('needs both a conversion id and a label for the stage', () => {
		expect(createGoogleAdsDestination(options).isConfigured()).toBe(true);
		expect(
			createGoogleAdsDestination({ ...options, getId: () => undefined }).isConfigured()
		).toBe(false);
	});

	it('is gated on marketing consent', () => {
		expect(createGoogleAdsDestination(options).consentCategory).toBe('marketing');
	});

	it('resolves the logical label key into a send_to target', () => {
		const destination = createGoogleAdsDestination(options);
		destination.load();
		const gtag = vi.fn();
		win.gtag = gtag;

		expect(destination.send(event, 'signup')).toBe('sent');
		expect(gtag).toHaveBeenCalledWith(
			'event',
			'conversion',
			expect.objectContaining({
				send_to: 'AW-999/lbl-signup',
				transaction_id: 'evt-1',
			})
		);
	});

	it('skips when the stage has no configured label', () => {
		const destination = createGoogleAdsDestination(options);
		destination.load();
		win.gtag = vi.fn();

		expect(destination.send(event, 'activate')).toBe('skipped:not-configured');
	});

	it('passes the hashed email for enhanced conversions and never a raw address', () => {
		const destination = createGoogleAdsDestination(options);
		destination.load();
		const gtag = vi.fn();
		win.gtag = gtag;

		destination.send(event, 'signup');

		const payload = JSON.stringify(gtag.mock.calls);
		expect(payload).toContain('hashed-email');
		expect(payload).not.toContain('@');
	});
});

describe('Meta destination', () => {
	it('is only configured with a pixel id', () => {
		expect(createMetaDestination(() => 'PIX').isConfigured()).toBe(true);
		expect(createMetaDestination(() => undefined).isConfigured()).toBe(false);
	});

	it('installs the fbq stub and script on load', () => {
		createMetaDestination(() => 'PIX').load();

		expect(typeof win.fbq).toBe('function');
		expect(document.querySelector('script[src*="connect.facebook.net"]')).not.toBeNull();
	});

	it('only injects the script once', () => {
		const destination = createMetaDestination(() => 'PIX');
		destination.load();
		destination.load();

		expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1);
	});

	it('passes eventID so the browser and CAPI events deduplicate', () => {
		const destination = createMetaDestination(() => 'PIX');
		destination.load();
		const fbq = vi.fn();
		win.fbq = fbq;

		expect(destination.send(event, 'CompleteRegistration')).toBe('sent');
		expect(fbq).toHaveBeenCalledWith(
			'track',
			'CompleteRegistration',
			expect.objectContaining({ value: 12, currency: 'USD' }),
			{ eventID: 'evt-1' }
		);
	});

	it('reports an error rather than throwing when the pixel global is missing', () => {
		const destination = createMetaDestination(() => 'PIX');
		expect(destination.send(event, 'CompleteRegistration')).toBe('error');
	});
});

describe('Reddit destination', () => {
	it('is only configured with a pixel id', () => {
		expect(createRedditDestination(() => 'a2_x').isConfigured()).toBe(true);
		expect(createRedditDestination(() => undefined).isConfigured()).toBe(false);
	});

	it('installs the rdt stub and script on load', () => {
		createRedditDestination(() => 'a2_x').load();

		expect(typeof win.rdt).toBe('function');
		expect(document.querySelector('script[src*="redditstatic.com"]')).not.toBeNull();
	});

	it('passes conversion_id so the browser and CAPI events deduplicate', () => {
		const destination = createRedditDestination(() => 'a2_x');
		destination.load();
		const rdt = vi.fn();
		win.rdt = rdt;

		expect(destination.send(event, 'SignUp')).toBe('sent');
		expect(rdt).toHaveBeenCalledWith(
			'track',
			'SignUp',
			expect.objectContaining({ conversion_id: 'evt-1' })
		);
	});
});

describe('X destination', () => {
	const options = {
		getId: () => 'oxxxx' as string | undefined,
		getEventIds: () => ({ signup: 'tw-abcde-fghij' }) as Record<string, string | undefined>,
	};

	it('is only configured with a pixel id', () => {
		expect(createXDestination(options).isConfigured()).toBe(true);
		expect(createXDestination({ ...options, getId: () => undefined }).isConfigured()).toBe(
			false
		);
	});

	it('installs the twq stub and script on load', () => {
		createXDestination(options).load();

		expect(typeof win.twq).toBe('function');
		expect(document.querySelector('script[src*="ads-twitter.com"]')).not.toBeNull();
	});

	it('resolves the logical key into a configured X event id', () => {
		const destination = createXDestination(options);
		destination.load();
		const twq = vi.fn();
		win.twq = twq;

		expect(destination.send(event, 'signup')).toBe('sent');
		expect(twq).toHaveBeenCalledWith(
			'event',
			'tw-abcde-fghij',
			expect.objectContaining({ conversion_id: 'evt-1' })
		);
	});

	it('skips when the stage has no configured event id', () => {
		const destination = createXDestination(options);
		destination.load();
		win.twq = vi.fn();

		expect(destination.send(event, 'activate')).toBe('skipped:not-configured');
	});
});
