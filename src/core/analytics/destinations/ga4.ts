import type { ConversionEvent, SendStatus } from '../types';
import { getGtag, loadGtagFor } from './gtag';
import type { ConversionDestination } from './types';

/**
 * GA4. Gated on analytics consent rather than marketing, and the only destination
 * that receives upper-funnel stages.
 */
export const createGa4Destination = (
	getMeasurementId: () => string | undefined
): ConversionDestination => ({
	id: 'ga4',
	consentCategory: 'analytics',

	isConfigured: () => Boolean(getMeasurementId()),

	load() {
		const measurementId = getMeasurementId();
		if (!measurementId) return;

		// send_page_view is disabled because route changes are tracked explicitly;
		// leaving it on double counts every navigation.
		loadGtagFor(measurementId)('config', measurementId, { send_page_view: false });
	},

	send(event: ConversionEvent, eventName: string): SendStatus {
		const gtag = getGtag();
		if (!gtag) return 'error';

		gtag('event', eventName, {
			event_id: event.eventId,
			stage: event.stage,
			anonymous_id: event.anonymousId,
			session_id: event.sessionId,
			value: event.value,
			currency: event.currency,
			first_touch_source: event.firstTouch?.source ?? event.firstTouch?.channel,
			first_touch_campaign: event.firstTouch?.campaign,
			last_touch_source: event.lastTouch?.source ?? event.lastTouch?.channel,
			last_touch_campaign: event.lastTouch?.campaign,
			...event.properties,
		});

		return 'sent';
	},
});
