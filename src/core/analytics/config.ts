import type { ConsentMode } from './types';

/**
 * Optional analytics configuration.
 *
 * Deliberately does not use the `Env` getter: that helper throws on missing keys,
 * and every value here is optional — an absent pixel id simply disables that
 * destination rather than breaking the app.
 */

export type DebugLevel = 'off' | 'summary' | 'verbose';

const read = (key: string): string | undefined => {
	const value = (import.meta.env as Record<string, string | undefined>)[key];
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

export const getConsentMode = (): ConsentMode => {
	const raw = read('VITE_CONSENT_MODE')?.toLowerCase();
	return raw === 'enforce' ? 'enforce' : 'bypass';
};

export const getDebugLevel = (): DebugLevel => {
	const raw = read('VITE_CONVERSION_DEBUG')?.toLowerCase();
	if (raw === 'verbose') return 'verbose';
	if (raw === 'summary') return 'summary';
	return 'off';
};

export const analyticsConfig = {
	get ga4MeasurementId() {
		return read('VITE_GA_MEASUREMENT_ID');
	},
	get googleAdsId() {
		return read('VITE_GOOGLE_ADS_ID');
	},
	get googleAdsLabels(): Record<string, string | undefined> {
		return {
			signup_start: read('VITE_GOOGLE_ADS_LABEL_SIGNUP_START'),
			signup: read('VITE_GOOGLE_ADS_LABEL_SIGNUP'),
			activate: read('VITE_GOOGLE_ADS_LABEL_ACTIVATE'),
			lead: read('VITE_GOOGLE_ADS_LABEL_LEAD'),
		};
	},
	get metaPixelId() {
		return read('VITE_META_PIXEL_ID');
	},
	get redditPixelId() {
		return read('VITE_REDDIT_PIXEL_ID');
	},
	get xPixelId() {
		return read('VITE_X_PIXEL_ID');
	},
	get xEventIds(): Record<string, string | undefined> {
		return {
			page_view: read('VITE_X_EVENT_PAGE_VIEW'),
			signup_start: read('VITE_X_EVENT_SIGNUP_START'),
			signup: read('VITE_X_EVENT_SIGNUP'),
			activate: read('VITE_X_EVENT_ACTIVATE'),
			lead: read('VITE_X_EVENT_LEAD'),
		};
	},
	get conversionEndpoint() {
		return toRootRelative(read('VITE_CONVERSION_ENDPOINT') ?? 'api/Conversion');
	},
	get aliasEndpoint() {
		return this.conversionEndpoint.replace(/\/+$/, '') + '/alias';
	},
	/** Separate from the conversion endpoint: exposure must never reach an ad platform. */
	get experimentExposureEndpoint() {
		return toRootRelative(read('VITE_EXPERIMENT_ENDPOINT') ?? 'api/Experiment/exposure');
	},
};

/**
 * The browser resolves a relative URL against the current page, so `api/Conversion`
 * becomes `/settings/api/Conversion` on a nested route. Beacons fail silently, so the
 * endpoint is forced root-relative unless an absolute URL was configured.
 */
const toRootRelative = (endpoint: string): string => {
	if (/^https?:\/\//i.test(endpoint)) {
		return endpoint;
	}
	return '/' + endpoint.replace(/^\/+/, '');
};

/**
 * True while the page is being driven by the build-time prerenderer or any other
 * automation. Trackers must stay inert so synthetic traffic never reaches a vendor
 * and no tracker state is serialised into the shipped static HTML.
 */
export const isAutomatedRender = (): boolean => {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
	if (navigator.webdriver) return true;
	return /HeadlessChrome|Prerender/i.test(navigator.userAgent ?? '');
};
