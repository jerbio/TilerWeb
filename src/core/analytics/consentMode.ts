import { consentManager } from '@/core/common/components/consent/consent-manager';
import type { ConsentPreferences } from '@/core/common/components/consent/consent-manager';
import { getConsentMode } from './config';
import type { ConsentMode, ConsentSnapshot } from './types';

/**
 * The single consent authority for the conversion tracker.
 *
 * Destination adapters and the server dispatcher read this and nothing else, so
 * re-enabling the consent gate later is a `VITE_CONSENT_MODE` flip rather than a
 * change to every call site. See CONVERSION_TRACKING_DESIGN.md §4.5.
 */

const ALL_GRANTED: Omit<ConsentSnapshot, 'mode'> = {
	grantedBy: 'config',
	analytics: true,
	marketing: true,
};

const ALL_DENIED: Omit<ConsentSnapshot, 'mode'> = {
	grantedBy: 'none',
	analytics: false,
	marketing: false,
};

export const resolveConsentFor = (
	mode: ConsentMode,
	preferences: ConsentPreferences | null
): ConsentSnapshot => {
	if (mode === 'bypass') return { mode, ...ALL_GRANTED };
	if (!preferences) return { mode, ...ALL_DENIED };

	return {
		mode,
		grantedBy: 'user',
		analytics: preferences.analytics === true,
		marketing: preferences.marketing === true,
	};
};

export const resolveConsent = (mode: ConsentMode = getConsentMode()): ConsentSnapshot => {
	if (mode === 'bypass') return resolveConsentFor(mode, null);

	try {
		return resolveConsentFor(mode, consentManager.getPreferences());
	} catch {
		// Fail closed: an unreadable preference store must never imply consent.
		return resolveConsentFor(mode, null);
	}
};
