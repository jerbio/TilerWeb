import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import React from 'react';
import i18next from 'i18next';

import en from '@/i18n/locales/en.json';
import de from '@/i18n/locales/de.json';
import { darkTheme } from '@/core/theme/dark';
import { HERO_COPY_SOURCE_LOCALE, HERO_TRANSLATED_LOCALES, heroCopyLocale } from './locales';

const requested = new Set<string>();
const missing = new Set<string>();

const lookup = (key: string): unknown =>
	key.split('.').reduce<unknown>((node, part) => {
		if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
			return (node as Record<string, unknown>)[part];
		}
		return undefined;
	}, en);

/** Resolves against the real en.json and records anything the arms ask for but it lacks. */
const recordingT = (key: string, vars?: Record<string, unknown>): string => {
	requested.add(key);
	const value = lookup(key);

	if (typeof value !== 'string' || value.trim() === '') {
		missing.add(key);
		return key;
	}
	return vars
		? value.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? ''))
		: value;
};

vi.mock('@/core/analytics/funnel', () => ({ trackCtaClicked: vi.fn() }));
vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return { ...actual, useTranslation: () => ({ t: recordingT }) };
});

import HeroNlScheduling from './hero_nl_scheduling';
import HeroStopDeciding from './hero_stop_deciding';
import HeroSelfHealing from './hero_self_healing';
import HeroTaskSplitting from './hero_task_splitting';
import HeroCapacityCheck from './hero_capacity_check';
import { DEMO_TOTAL_MS } from './demos/use_demo_scenario';

const ARMS = [
	['nl_scheduling', HeroNlScheduling],
	['stop_deciding', HeroStopDeciding],
	['self_healing', HeroSelfHealing],
	['task_splitting', HeroTaskSplitting],
	['capacity_check', HeroCapacityCheck],
] as const;

beforeEach(() => {
	vi.useFakeTimers({
		toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
	});
	requested.clear();
	missing.clear();
});

afterEach(() => {
	vi.useRealTimers();
});

/** Drives the arm through its whole scenario so every conditional string renders. */
const renderArm = (Arm: React.ComponentType) => {
	render(
		<ThemeProvider theme={darkTheme}>
			<Arm />
		</ThemeProvider>
	);
	for (let i = 0; i < 12; i += 1) {
		act(() => {
			vi.advanceTimersByTime(Math.ceil(DEMO_TOTAL_MS / 12));
		});
	}
};

describe.each(ARMS)('%s copy', (variant, Arm) => {
	it('has every key it asks for present and non-empty in en.json', () => {
		renderArm(Arm);

		// Guards against the suite passing vacuously: if the arm rendered nothing,
		// `missing` would also be empty and the assertion below would prove nothing.
		expect(requested.size).toBeGreaterThanOrEqual(10);

		// en.json is the single source of truth; a missing key renders as the raw
		// dotted path, which is the most visible bug a landing page can ship.
		expect([...missing]).toEqual([]);
	});

	it('reads all of its copy from the heroExperiment namespace', () => {
		renderArm(Arm);

		const foreign = [...requested].filter(
			(key) => !key.startsWith(`home.heroExperiment.${variant}.`)
		);

		expect(foreign).toEqual([]);
	});

	it('leaves the existing home.hero keys untouched for control', () => {
		renderArm(Arm);

		const controlKeys = [...requested].filter((key) => key.startsWith('home.hero.'));

		expect(controlKeys).toEqual([]);
	});
});

describe('translation readiness', () => {
	it('detects a key that en.json does not define', () => {
		// Negative control for the completeness tests above: without this, a broken
		// recorder would report zero missing keys forever.
		recordingT('home.heroExperiment.self_healing.doesNotExist');

		expect([...missing]).toEqual(['home.heroExperiment.self_healing.doesNotExist']);
	});

	it('interpolates variables the arms pass', () => {
		expect(recordingT('home.heroExperiment.self_healing.demo.wasAt', { time: '11:30' })).toBe(
			'was 11:30'
		);
	});

	it('lists English as the only translated locale for now', () => {
		expect(HERO_TRANSLATED_LOCALES).toEqual([HERO_COPY_SOURCE_LOCALE]);
	});

	it.each(['de', 'de-AT', 'ja', 'PT-br', ''])(
		'reports English as the copy locale for %s until it is translated',
		(locale) => {
			expect(heroCopyLocale(locale)).toBe('en');
		}
	);
});

/**
 * The deferred-translation approach is only safe if i18next actually falls back.
 * Without this, a non-English visitor would see raw dotted keys in the hero.
 */
describe('English fallback for untranslated locales', () => {
	it('serves English hero copy to a locale that has no heroExperiment block', async () => {
		const instance = i18next.createInstance();
		await instance.init({
			lng: 'de',
			fallbackLng: 'en',
			resources: { en: { translation: en }, de: { translation: de } },
			interpolation: { escapeValue: false },
		});

		const key = 'home.heroExperiment.self_healing.titleLead';
		const value = instance.t(key);

		expect(value).not.toBe(key);
		expect(value).toBe(lookup(key));
	});

	it('still serves German for keys German does have', async () => {
		const instance = i18next.createInstance();
		await instance.init({
			lng: 'de',
			fallbackLng: 'en',
			resources: { en: { translation: en }, de: { translation: de } },
			interpolation: { escapeValue: false },
		});

		// Guards against a fallback misconfiguration that would silently make the
		// whole site English.
		expect(instance.t('home.hero.title')).not.toBe(lookup('home.hero.title'));
	});
});
