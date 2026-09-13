import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ThemeProvider } from 'styled-components';
import React from 'react';

const trackCtaClicked = vi.fn();
vi.mock('@/core/analytics/funnel', () => ({
	trackCtaClicked: (...args: unknown[]) => trackCtaClicked(...args),
}));
vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return { ...actual, useTranslation: () => ({ t: (key: string) => key }) };
});

import { darkTheme } from '@/core/theme/dark';
import HeroNlScheduling from './hero_nl_scheduling';
import HeroStopDeciding from './hero_stop_deciding';
import HeroSelfHealing from './hero_self_healing';
import HeroTaskSplitting from './hero_task_splitting';
import HeroCapacityCheck from './hero_capacity_check';
import HeroBoundary from './hero_boundary';
import { HERO_COMPONENTS, getHeroComponent } from './index';
import { HERO_VARIANT_KEYS } from '@/core/experiments';

const HEROES_DIR = __dirname;

const CHALLENGERS = [
	['nl_scheduling', HeroNlScheduling],
	['stop_deciding', HeroStopDeciding],
	['self_healing', HeroSelfHealing],
	['task_splitting', HeroTaskSplitting],
	['capacity_check', HeroCapacityCheck],
] as const;

const draw = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

beforeEach(() => {
	trackCtaClicked.mockClear();
	window.scrollTo = vi.fn();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('hero registry', () => {
	it('binds every roster arm to a component', () => {
		HERO_VARIANT_KEYS.forEach((key) => {
			expect(HERO_COMPONENTS[key]).toBeTypeOf('function');
		});
	});

	it('falls back to the control hero for an unknown arm', () => {
		expect(getHeroComponent('not_a_variant' as never)).toBe(HERO_COMPONENTS.control);
	});
});

describe.each(CHALLENGERS)('%s hero', (variant, Hero) => {
	it('renders a headline', () => {
		draw(<Hero />);

		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('renders both CTAs', () => {
		draw(<Hero />);

		expect(screen.getByText(`home.heroExperiment.${variant}.primaryCta`)).toBeInTheDocument();
		expect(screen.getByText(`home.heroExperiment.${variant}.secondaryCta`)).toBeInTheDocument();
	});

	it('renders its demo, whatever composition the arm uses', () => {
		const { container } = draw(<Hero />);

		// Arms differ in layout — split or stacked — so this asserts the demo is
		// present rather than that a particular slot wrapper exists.
		expect(container.querySelector(`[data-demo="${variant}"]`)).not.toBeNull();
	});

	it('tracks the primary CTA with its arm and role', () => {
		draw(<Hero />);

		fireEvent.click(screen.getByText(`home.heroExperiment.${variant}.primaryCta`));

		expect(trackCtaClicked).toHaveBeenCalledWith(
			expect.objectContaining({ variant, ctaRole: 'primary', location: 'Hero Section' })
		);
	});

	it('tracks the secondary CTA with its arm and role', () => {
		draw(<Hero />);

		fireEvent.click(screen.getByText(`home.heroExperiment.${variant}.secondaryCta`));

		expect(trackCtaClicked).toHaveBeenCalledWith(
			expect.objectContaining({ variant, ctaRole: 'secondary' })
		);
	});
});

describe('HeroBoundary', () => {
	it('renders the arm while it is healthy', () => {
		draw(
			<HeroBoundary variant="self_healing" fallback={<p>control</p>}>
				<p>arm</p>
			</HeroBoundary>
		);

		expect(screen.getByText('arm')).toBeInTheDocument();
	});

	it('falls back to control when the arm throws', () => {
		const Boom = (): React.ReactElement => {
			throw new Error('variant exploded');
		};
		vi.spyOn(console, 'error').mockImplementation(() => {});

		draw(
			<HeroBoundary variant="self_healing" fallback={<p>control</p>}>
				<Boom />
			</HeroBoundary>
		);

		// A blank landing page is worse than a lost data point.
		expect(screen.getByText('control')).toBeInTheDocument();
	});
});

/**
 * Enforced statically rather than by review: a single hard-coded colour is what
 * turns a message test into an accidental design test.
 */
describe('theme conformance', () => {
	// Anchored on the first non-space character so `font-family: ${palette...}` is
	// not flagged by the whitespace matcher backtracking to zero width.
	const LITERALS = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|font-family:[ \t]*[^$\s]/;

	const heroFiles = readdirSync(HEROES_DIR).filter(
		(file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx')
	);

	it.each(heroFiles)('%s declares no raw colour or font literal', (file) => {
		const source = readFileSync(join(HEROES_DIR, file), 'utf8');
		const offending = source
			.split('\n')
			.filter((line) => LITERALS.test(line) && !line.trimStart().startsWith('*'));

		expect(offending).toEqual([]);
	});
});
