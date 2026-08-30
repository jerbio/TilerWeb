/**
 * Which locales have hero-experiment copy of their own.
 *
 * Everything else falls back to English (`fallbackLng` in i18n config). That is a
 * deliberate choice, not an oversight: a flat machine translation reads as a weak
 * message, and the experiment would score the translation rather than the idea.
 *
 * When a locale is translated, add it here and the parity test starts enforcing
 * completeness for it.
 */

export const HERO_COPY_SOURCE_LOCALE = 'en';

export const HERO_TRANSLATED_LOCALES: readonly string[] = [HERO_COPY_SOURCE_LOCALE];

/**
 * Copy actually shown, which is not the visitor's locale while translations are
 * pending. Analysis needs the distinction: a German visitor reading English hero
 * copy is neither English traffic nor a translated arm.
 */
export const heroCopyLocale = (visitorLocale: string): string => {
	const base = (visitorLocale || '').split('-')[0].toLowerCase();
	return HERO_TRANSLATED_LOCALES.includes(base) ? base : HERO_COPY_SOURCE_LOCALE;
};
