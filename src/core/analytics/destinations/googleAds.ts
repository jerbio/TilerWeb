import type { ConversionEvent, SendStatus } from '../types';
import { getGtag, loadGtagFor } from './gtag';
import type { ConversionDestination } from './types';

export type GoogleAdsOptions = {
	getId: () => string | undefined;
	/** Logical label key (from DESTINATION_EVENTS) to Google Ads conversion label. */
	getLabels: () => Record<string, string | undefined>;
};

/**
 * Google Ads conversions. Addresses conversions by `AW-<id>/<label>`, so the
 * stage mapping stores a logical key that is resolved here against configuration.
 *
 * The payload deliberately excludes `userId` — Tiler user ids contain `@` and
 * would look like a raw address to any reviewer or DLP scanner.
 */
export const createGoogleAdsDestination = ({
	getId,
	getLabels,
}: GoogleAdsOptions): ConversionDestination => ({
	id: 'google_ads',
	consentCategory: 'marketing',

	isConfigured: () => Boolean(getId()),

	load() {
		const id = getId();
		if (!id) return;
		loadGtagFor(id)('config', id);
	},

	send(event: ConversionEvent, labelKey: string): SendStatus {
		const id = getId();
		const label = getLabels()[labelKey];
		if (!id || !label) return 'skipped:not-configured';

		const gtag = getGtag();
		if (!gtag) return 'error';

		gtag('event', 'conversion', {
			send_to: `${id}/${label}`,
			// Google's deduplication key.
			transaction_id: event.eventId,
			value: event.value,
			currency: event.currency,
			...(event.emailSha256
				? { user_data: { sha256_email_address: event.emailSha256 } }
				: {}),
		});

		return 'sent';
	},
});
