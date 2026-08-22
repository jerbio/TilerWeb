import type { ConversionEvent, SendStatus } from '../types';
import { getWindow, injectScript, type ConversionDestination } from './types';

const SCRIPT_MARKER = 'redditstatic.com';

type RdtFn = ((...args: unknown[]) => void) & {
	callQueue?: unknown[];
	sendEvent?: (...args: unknown[]) => void;
};

const ensureRdt = (): RdtFn => {
	const win = getWindow();
	if (typeof win.rdt === 'function') return win.rdt as RdtFn;

	const rdt: RdtFn = function rdtStub(...args: unknown[]) {
		if (typeof rdt.sendEvent === 'function') {
			rdt.sendEvent(...args);
		} else {
			rdt.callQueue?.push(args);
		}
	} as RdtFn;
	rdt.callQueue = [];

	win.rdt = rdt;
	return rdt;
};

/**
 * Reddit Pixel. `conversion_id` must match the value sent by the Reddit
 * Conversions API for deduplication.
 */
export const createRedditDestination = (
	getPixelId: () => string | undefined
): ConversionDestination => ({
	id: 'reddit',
	consentCategory: 'marketing',

	isConfigured: () => Boolean(getPixelId()),

	load() {
		const pixelId = getPixelId();
		if (!pixelId) return;

		const rdt = ensureRdt();
		injectScript('https://www.redditstatic.com/ads/pixel.js', SCRIPT_MARKER);
		rdt('init', pixelId);
	},

	trackPageVisit() {
		const win = getWindow();
		if (typeof win.rdt !== 'function') return;
		(win.rdt as RdtFn)('track', 'PageVisit');
	},

	send(event: ConversionEvent, eventName: string): SendStatus {
		const win = getWindow();
		if (typeof win.rdt !== 'function') return 'error';

		(win.rdt as RdtFn)('track', eventName, {
			conversion_id: event.eventId,
			value: event.value,
			currency: event.currency,
		});

		return 'sent';
	},
});
