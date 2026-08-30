/**
 * Browser adapters for the experiment.
 *
 * Isolated from `assignment.ts` so the precedence chain stays pure and testable
 * without a DOM. Every read here degrades to `null` rather than throwing: a
 * storage failure must never prevent the hero from rendering.
 */

import { isAutomatedRender } from '@/core/analytics/config';
import type { HeroVariantKey } from './types';

export const PIN_KEY_PREFIX = 'tiler_exp_pin:';
export const OVERRIDE_KEY_PREFIX = 'tiler_exp_override:';
export const EXPOSED_KEY_PREFIX = 'tiler_exp_exposed:';
export const OVERRIDE_QUERY_PARAM = 'hero';

/** `?hero=auto` hands the tab back to real assignment. */
export const OVERRIDE_RESET_VALUES: readonly string[] = ['auto', 'off', 'clear', 'none'];

const readLocal = (key: string): string | null => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeLocal = (key: string, value: string): void => {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Private mode. The hash still resolves the same arm, so this is recoverable.
	}
};

const readSession = (key: string): string | null => {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeSession = (key: string, value: string): void => {
	try {
		sessionStorage.setItem(key, value);
	} catch {
		// Override degrades to per-navigation; acceptable for a QA affordance.
	}
};

const clearSession = (key: string): void => {
	try {
		sessionStorage.removeItem(key);
	} catch {
		// Nothing to clear if storage is unavailable.
	}
};

export const readPin = (experimentKey: string): string | null =>
	readLocal(`${PIN_KEY_PREFIX}${experimentKey}`);

export const writePin = (experimentKey: string, variant: HeroVariantKey): void => {
	writeLocal(`${PIN_KEY_PREFIX}${experimentKey}`, variant);
};

/**
 * A `?hero=` value sticks for the rest of the tab, so a reviewer can navigate
 * without re-appending it to every URL. `?hero=auto` releases it again — without
 * an escape hatch a reviewer who previews one arm can never see real assignment
 * in that tab.
 */
export const readOverride = (experimentKey: string, search?: string): string | null => {
	const sessionKey = `${OVERRIDE_KEY_PREFIX}${experimentKey}`;

	try {
		const raw = search ?? (typeof window === 'undefined' ? '' : window.location.search);
		const fromQuery = new URLSearchParams(raw).get(OVERRIDE_QUERY_PARAM);

		if (fromQuery && OVERRIDE_RESET_VALUES.includes(fromQuery.toLowerCase())) {
			clearSession(sessionKey);
			return null;
		}
		if (fromQuery) {
			writeSession(sessionKey, fromQuery);
			return fromQuery;
		}
	} catch {
		// Malformed query string; fall through to whatever the tab already holds.
	}

	return readSession(sessionKey);
};

export const hasExposed = (key: string): boolean => readLocal(key) !== null;

export const markExposed = (key: string, at: string): void => writeLocal(key, at);

export const isAutomated = (): boolean => isAutomatedRender();

/** Cache key written by i18next-browser-languagedetector. */
const I18N_LANGUAGE_KEY = 'i18nextLng';

/**
 * Language actually in effect, so results can be split English vs translated.
 *
 * `document.documentElement.lang` is deliberately last: it is baked into
 * index.html as `en` and is never updated when i18next switches language, so
 * trusting it first would record every visitor as English and silently destroy
 * the split this field exists for.
 */
export const readLocale = (): string => {
	const detected = readLocal(I18N_LANGUAGE_KEY);
	if (detected) return detected;

	if (typeof navigator !== 'undefined' && navigator.language) {
		return navigator.language;
	}
	if (typeof document !== 'undefined' && document.documentElement.lang) {
		return document.documentElement.lang;
	}
	return 'unknown';
};

export const readLandingPath = (): string =>
	typeof window === 'undefined' ? '' : window.location.pathname;
