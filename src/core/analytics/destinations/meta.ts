import type { ConversionEvent, SendStatus } from '../types';
import { getWindow, injectScript, type ConversionDestination } from './types';

const SCRIPT_MARKER = 'connect.facebook.net';

type FbqFn = ((...args: unknown[]) => void) & {
	queue?: unknown[];
	callMethod?: (...args: unknown[]) => void;
	loaded?: boolean;
	version?: string;
	push?: unknown;
};

const ensureFbq = (): FbqFn => {
	const win = getWindow();
	if (typeof win.fbq === 'function') return win.fbq as FbqFn;

	const fbq: FbqFn = function fbqStub(...args: unknown[]) {
		if (typeof fbq.callMethod === 'function') {
			fbq.callMethod(...args);
		} else {
			fbq.queue?.push(args);
		}
	} as FbqFn;
	fbq.queue = [];
	fbq.loaded = true;
	fbq.version = '2.0';
	fbq.push = fbq;

	win.fbq = fbq;
	win._fbq = fbq;
	return fbq;
};

/**
 * Meta Pixel. `eventID` must match the `event_id` sent by the Conversions API or
 * Meta counts the conversion twice.
 */
export const createMetaDestination = (
	getPixelId: () => string | undefined
): ConversionDestination => ({
	id: 'meta',
	consentCategory: 'marketing',

	isConfigured: () => Boolean(getPixelId()),

	load() {
		const pixelId = getPixelId();
		if (!pixelId) return;

		const fbq = ensureFbq();
		injectScript('https://connect.facebook.net/en_US/fbevents.js', SCRIPT_MARKER);
		fbq('init', pixelId);
	},

	trackPageVisit() {
		const win = getWindow();
		if (typeof win.fbq !== 'function') return;
		(win.fbq as FbqFn)('track', 'PageView');
	},

	send(event: ConversionEvent, eventName: string): SendStatus {
		const win = getWindow();
		if (typeof win.fbq !== 'function') return 'error';

		(win.fbq as FbqFn)(
			'track',
			eventName,
			{
				value: event.value,
				currency: event.currency,
				content_name: event.stage,
			},
			{ eventID: event.eventId }
		);

		return 'sent';
	},
});
