// Export all consent-related components and utilities
export { default as ConsentProvider, useConsent } from './consent-provider';
export { default as CookieConsentBanner } from './cookie-consent-banner';
export { default as PrivacySettingsModal } from './privacy-settings-modal';
export { default as PrivacySettingsButton } from './privacy-settings-button';
export { consentManager } from './consent-manager';
export type { ConsentPreferences, ConsentDecision } from './consent-manager';
