import { describe, expect, it, vi, afterEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyticsConfig, getConsentMode, getDebugLevel, isAutomatedRender } from './config';

/**
 * Every env key the analytics module consumes. Adding a destination means adding its
 * key here — the `.env` audit below fails on any analytics key not in this list, which
 * is what catches a misspelled or renamed variable before it silently disables tracking.
 */
const CONSUMED_KEYS = [
	'VITE_CONSENT_MODE',
	'VITE_CONVERSION_DEBUG',
	'VITE_CONVERSION_ENDPOINT',
	'VITE_CLICK_ID_RULES',
	'VITE_GA_MEASUREMENT_ID',
	'VITE_GOOGLE_ADS_ID',
	'VITE_GOOGLE_ADS_LABEL_SIGNUP_START',
	'VITE_GOOGLE_ADS_LABEL_SIGNUP',
	'VITE_GOOGLE_ADS_LABEL_ACTIVATE',
	'VITE_GOOGLE_ADS_LABEL_LEAD',
	'VITE_META_PIXEL_ID',
	'VITE_REDDIT_PIXEL_ID',
	'VITE_X_PIXEL_ID',
	'VITE_X_EVENT_PAGE_VIEW',
	'VITE_X_EVENT_SIGNUP_START',
	'VITE_X_EVENT_SIGNUP',
	'VITE_X_EVENT_ACTIVATE',
	'VITE_X_EVENT_LEAD',
] as const;

/** Non-analytics keys the app already owns; ignored by the audit. */
const UNRELATED_KEYS = [
	'VITE_BASE_URL',
	'VITE_NODE_ENV',
	'VITE_DEMO_MODE',
	'VITE_ANALYTICS_PROVIDER',
	'VITE_ANALYTICS_ENDPOINT',
];

/** Anything matching this looks like an ad/analytics setting and must be consumed. */
const ANALYTICS_KEY_PATTERN =
	/(GA_|ANALYTICS|CONVERSION|CONSENT|PIXEL|GOOGLE_ADS|META|FACEBOOK|INSTAGRAM|REDDIT|TWITTER|_X_|TIKTOK|LINKEDIN|SNAP)/i;

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('analytics env key contract', () => {
	it.each([
		['VITE_GA_MEASUREMENT_ID', 'G-TEST', () => analyticsConfig.ga4MeasurementId],
		['VITE_GOOGLE_ADS_ID', 'AW-TEST', () => analyticsConfig.googleAdsId],
		['VITE_META_PIXEL_ID', '1234567890', () => analyticsConfig.metaPixelId],
		['VITE_REDDIT_PIXEL_ID', 'a2_test', () => analyticsConfig.redditPixelId],
		['VITE_X_PIXEL_ID', 'otest', () => analyticsConfig.xPixelId],
	])('reads %s', (key, value, read) => {
		vi.stubEnv(key, value);
		expect(read()).toBe(value);
	});

	it.each([
		['VITE_GOOGLE_ADS_LABEL_SIGNUP_START', 'signup_start'],
		['VITE_GOOGLE_ADS_LABEL_SIGNUP', 'signup'],
		['VITE_GOOGLE_ADS_LABEL_ACTIVATE', 'activate'],
		['VITE_GOOGLE_ADS_LABEL_LEAD', 'lead'],
	])('reads %s into the %s ads label', (key, slot) => {
		vi.stubEnv(key, 'lbl-123');
		expect(analyticsConfig.googleAdsLabels[slot]).toBe('lbl-123');
	});

	it.each([
		['VITE_X_EVENT_PAGE_VIEW', 'page_view'],
		['VITE_X_EVENT_SIGNUP_START', 'signup_start'],
		['VITE_X_EVENT_SIGNUP', 'signup'],
		['VITE_X_EVENT_ACTIVATE', 'activate'],
		['VITE_X_EVENT_LEAD', 'lead'],
	])('reads %s into the %s x event id', (key, slot) => {
		vi.stubEnv(key, 'tw-a-b');
		expect(analyticsConfig.xEventIds[slot]).toBe('tw-a-b');
	});

	it('treats blank and whitespace-only values as unset', () => {
		vi.stubEnv('VITE_META_PIXEL_ID', '   ');
		expect(analyticsConfig.metaPixelId).toBeUndefined();
	});

	it('defaults the conversion endpoint when unset', () => {
		vi.stubEnv('VITE_CONVERSION_ENDPOINT', '');
		expect(analyticsConfig.conversionEndpoint).toBe('/api/Conversion');
	});

	it('defaults consent mode to bypass and only accepts an exact enforce opt-in', () => {
		vi.stubEnv('VITE_CONSENT_MODE', '');
		expect(getConsentMode()).toBe('bypass');

		vi.stubEnv('VITE_CONSENT_MODE', 'ENFORCE');
		expect(getConsentMode()).toBe('enforce');

		vi.stubEnv('VITE_CONSENT_MODE', 'enforced-ish');
		expect(getConsentMode()).toBe('bypass');
	});

	it('defaults debug logging to off so production never leaks funnel internals', () => {
		vi.stubEnv('VITE_CONVERSION_DEBUG', '');
		expect(getDebugLevel()).toBe('off');

		vi.stubEnv('VITE_CONVERSION_DEBUG', 'verbose');
		expect(getDebugLevel()).toBe('verbose');

		vi.stubEnv('VITE_CONVERSION_DEBUG', 'nonsense');
		expect(getDebugLevel()).toBe('off');
	});
});

describe('.env file audit', () => {
	const root = process.cwd();
	const envFiles = readdirSync(root).filter((name) => name.startsWith('.env'));

	const keysIn = (file: string): string[] =>
		readFileSync(join(root, file), 'utf8')
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'))
			.map((line) => line.split('=')[0]?.trim() ?? '')
			.filter(Boolean);

	it('finds env files to audit', () => {
		expect(envFiles.length).toBeGreaterThan(0);
	});

	it.each(envFiles)('%s declares no analytics key the code does not read', (file) => {
		const orphans = keysIn(file).filter(
			(key) =>
				!CONSUMED_KEYS.includes(key as (typeof CONSUMED_KEYS)[number]) &&
				!UNRELATED_KEYS.includes(key) &&
				ANALYTICS_KEY_PATTERN.test(key)
		);

		expect(
			orphans,
			`${file} sets analytics keys that nothing consumes: ${orphans.join(', ')}`
		).toEqual([]);
	});

	/**
	 * X answers 200 for any event id and drops unknown ones server-side, so a leftover
	 * placeholder is invisible in a HAR. The format check is the only early warning.
	 */
	it.each(envFiles)('%s uses well-formed X event ids', (file) => {
		const valueOf = (line: string) => line.split('=').slice(1).join('=').trim();
		const bad = readFileSync(join(root, file), 'utf8')
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.startsWith('VITE_X_EVENT_') && !line.startsWith('#'))
			.filter((line) => valueOf(line) && !/^tw-[a-z0-9]{5}-[a-z0-9]{5}$/.test(valueOf(line)))
			.map((line) => line.split('=')[0]);

		expect(
			bad,
			`${file}: these X event ids are not 'tw-xxxxx-xxxxx'; X will accept the ` +
				`beacon with a 200 and silently discard it: ${bad.join(', ')}`
		).toEqual([]);
	});

	/**
	 * Google accepts a beacon carrying an unknown conversion label and drops it, so a
	 * placeholder is as invisible as a malformed X event id.
	 */
	it.each(envFiles)('%s uses well-formed Google Ads labels', (file) => {
		const valueOf = (line: string) => line.split('=').slice(1).join('=').trim();
		const bad = readFileSync(join(root, file), 'utf8')
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.startsWith('VITE_GOOGLE_ADS_LABEL_') && !line.startsWith('#'))
			.filter((line) => valueOf(line) && !/^[A-Za-z0-9_-]{15,}$/.test(valueOf(line)))
			.map((line) => line.split('=')[0]);

		expect(
			bad,
			`${file}: these Google Ads labels do not look like a real conversion label ` +
				`(the part after AW-xxx/); Google will accept the beacon and discard it: ${bad.join(', ')}`
		).toEqual([]);
	});
});

describe('isAutomatedRender', () => {
	it('reports automation when webdriver is set', () => {
		const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
		Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true });

		expect(isAutomatedRender()).toBe(true);

		delete (navigator as unknown as Record<string, unknown>).webdriver;
		if (original) Object.defineProperty(Navigator.prototype, 'webdriver', original);
	});

	it('reports automation for a headless user agent', () => {
		const spy = vi
			.spyOn(navigator, 'userAgent', 'get')
			.mockReturnValue('Mozilla/5.0 HeadlessChrome/120');
		expect(isAutomatedRender()).toBe(true);
		spy.mockRestore();
	});

	it('reports a normal browser as not automated', () => {
		expect(isAutomatedRender()).toBe(false);
	});
});
