import { getConsentMode } from './config';
import { getGtag } from './destinations/gtag';

export type GoogleConsentInput = {
	analytics: boolean;
	marketing: boolean;
};

/**
 * Mirrors a consent decision into Google Consent Mode v2.
 *
 * Inert while `VITE_CONSENT_MODE=bypass`: the defaults declared in index.html are
 * already granted, and letting a banner dismissal silently revoke them would make
 * the funnel unverifiable. Becomes live the moment the mode flips to `enforce`.
 */
export const syncGoogleConsent = (
	preferences: GoogleConsentInput,
	mode = getConsentMode()
): void => {
	if (mode !== 'enforce') return;

	const gtag = getGtag();
	if (!gtag) return;

	const marketing = preferences.marketing ? 'granted' : 'denied';

	gtag('consent', 'update', {
		analytics_storage: preferences.analytics ? 'granted' : 'denied',
		ad_storage: marketing,
		ad_user_data: marketing,
		ad_personalization: marketing,
	});
};
