import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
	OVERRIDE_KEY_PREFIX,
	PIN_KEY_PREFIX,
	hasExposed,
	markExposed,
	readLocale,
	readOverride,
	readPin,
	writePin,
} from './environment';

const KEY = 'hero_v1';
const sessionKey = `${OVERRIDE_KEY_PREFIX}${KEY}`;

beforeEach(() => {
	sessionStorage.clear();
	localStorage.clear();
});

describe('readOverride', () => {
	it('returns null when nothing is set', () => {
		expect(readOverride(KEY, '')).toBeNull();
	});

	it('reads the arm from the query string', () => {
		expect(readOverride(KEY, '?hero=self_healing')).toBe('self_healing');
	});

	it('sticks for the rest of the tab so review does not need the param on every link', () => {
		readOverride(KEY, '?hero=self_healing');

		expect(readOverride(KEY, '')).toBe('self_healing');
	});

	it('replaces a previous override', () => {
		readOverride(KEY, '?hero=self_healing');

		expect(readOverride(KEY, '?hero=task_splitting')).toBe('task_splitting');
		expect(readOverride(KEY, '')).toBe('task_splitting');
	});

	it.each(['auto', 'off', 'clear', 'none', 'AUTO'])(
		'releases the tab back to real assignment with ?hero=%s',
		(reset) => {
			readOverride(KEY, '?hero=self_healing');

			expect(readOverride(KEY, `?hero=${reset}`)).toBeNull();
			expect(readOverride(KEY, '')).toBeNull();
			expect(sessionStorage.getItem(sessionKey)).toBeNull();
		}
	);

	it('ignores other query parameters', () => {
		expect(readOverride(KEY, '?utm_source=reddit&ref=abc')).toBeNull();
	});
});

describe('pin storage', () => {
	it('round-trips a pinned arm', () => {
		writePin(KEY, 'stop_deciding');

		expect(readPin(KEY)).toBe('stop_deciding');
		expect(localStorage.getItem(`${PIN_KEY_PREFIX}${KEY}`)).toBe('stop_deciding');
	});

	it('returns null when nothing is pinned', () => {
		expect(readPin(KEY)).toBeNull();
	});
});

describe('exposure guard storage', () => {
	it('reports an exposure only once it has been marked', () => {
		expect(hasExposed('k')).toBe(false);

		markExposed('k', '2026-08-25T00:00:00.000Z');

		expect(hasExposed('k')).toBe(true);
	});
});

describe('readLocale', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		document.documentElement.removeAttribute('lang');
	});

	it('prefers the language i18next actually detected', () => {
		localStorage.setItem('i18nextLng', 'de-DE');
		document.documentElement.lang = 'en';

		expect(readLocale()).toBe('de-DE');
	});

	it('does not trust the html lang attribute, which is baked in as en and never updated', () => {
		document.documentElement.lang = 'en';
		vi.stubGlobal('navigator', { language: 'ja-JP' });

		// Trusting it would record every visitor as English and destroy the
		// English-versus-translated split.
		expect(readLocale()).toBe('ja-JP');
	});

	it('falls back to the html lang attribute only when nothing else is available', () => {
		document.documentElement.lang = 'fr';
		vi.stubGlobal('navigator', {});

		expect(readLocale()).toBe('fr');
	});
});
