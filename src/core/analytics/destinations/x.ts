import type { ConversionEvent, SendStatus } from '../types';
import { getWindow, injectScript, type ConversionDestination } from './types';

const SCRIPT_MARKER = 'ads-twitter.com';

/**
 * X answers 200 for any event id and discards unknown ones server-side, so a typo or a
 * leftover placeholder is invisible on the network. Checking the shape here is the only
 * place the mistake can surface before it reaches X Ads.
 */
const X_EVENT_ID = /^tw-[a-z0-9]{5}-[a-z0-9]{5}$/;

export const isValidXEventId = (value: string | undefined): boolean =>
	typeof value === 'string' && X_EVENT_ID.test(value);

type TwqFn = ((...args: unknown[]) => void) & {
	exe?: (...args: unknown[]) => void;
	queue?: unknown[];
	version?: string;
};

export type XOptions = {
	getId: () => string | undefined;
	/** Logical key (from DESTINATION_EVENTS) to the `tw-xxxx-xxxx` event id. */
	getEventIds: () => Record<string, string | undefined>;
};

const ensureTwq = (): TwqFn => {
	const win = getWindow();
	if (typeof win.twq === 'function') return win.twq as TwqFn;

	const twq: TwqFn = function twqStub(...args: unknown[]) {
		if (typeof twq.exe === 'function') {
			twq.exe(...args);
		} else {
			twq.queue?.push(args);
		}
	} as TwqFn;
	twq.queue = [];
	twq.version = '1.1';

	win.twq = twq;
	return twq;
};

/**
 * X (Twitter) Universal Website Tag. Conversions are addressed by an
 * account-specific `tw-xxxx-xxxx` id, so the stage mapping stores a logical key
 * resolved here. `conversion_id` must match the X Conversion API payload.
 */
export const createXDestination = ({ getId, getEventIds }: XOptions): ConversionDestination => ({
	id: 'x',
	consentCategory: 'marketing',

	isConfigured: () => Boolean(getId()),

	load() {
		const pixelId = getId();
		if (!pixelId) return;

		const twq = ensureTwq();
		injectScript('https://static.ads-twitter.com/uwt.js', SCRIPT_MARKER);
		twq('config', pixelId);
	},

	/**
	 * `twq('config')` initialises the tag but sends nothing, so a visit needs its own
	 * event id from X Events Manager. Without it X never sees the `twclid` landing.
	 */
	trackPageVisit() {
		const pageViewEventId = getEventIds()['page_view'];
		if (!isValidXEventId(pageViewEventId)) return;

		const win = getWindow();
		if (typeof win.twq !== 'function') return;
		(win.twq as TwqFn)('event', pageViewEventId, {});
	},

	send(event: ConversionEvent, eventKey: string): SendStatus {
		const xEventId = getEventIds()[eventKey];
		if (!getId() || !isValidXEventId(xEventId)) return 'skipped:not-configured';

		const win = getWindow();
		if (typeof win.twq !== 'function') return 'error';

		(win.twq as TwqFn)('event', xEventId, {
			conversion_id: event.eventId,
			value: event.value,
			currency: event.currency,
		});

		return 'sent';
	},
});
