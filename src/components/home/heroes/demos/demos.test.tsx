import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
import DemoNlScheduling from './demo_nl_scheduling';
import DemoStopDeciding from './demo_stop_deciding';
import DemoSelfHealing from './demo_self_healing';
import DemoTaskSplitting from './demo_task_splitting';
import DemoCapacityCheck from './demo_capacity_check';
import { DEMO_TOTAL_MS } from './use_demo_scenario';

const DEMOS = [
	['nl_scheduling', DemoNlScheduling],
	['stop_deciding', DemoStopDeciding],
	['self_healing', DemoSelfHealing],
	['task_splitting', DemoTaskSplitting],
	['capacity_check', DemoCapacityCheck],
] as const;

const draw = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

const setReducedMotion = (reduce: boolean) => {
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockImplementation((query: string) => ({
			matches: reduce && query.includes('reduce'),
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
			onchange: null,
		}))
	);
};

/**
 * One step per `act`. Each step's timeout is only scheduled by the effect that
 * runs after React commits the previous step, so advancing the whole scenario in
 * a single `act` would only ever move it forward once.
 *
 * Advances exactly the shared budget in total, which is what proves every arm
 * reaches its nudge in the same wall-clock time.
 */
const runToCompletion = (steps = 12) => {
	const slice = Math.ceil(DEMO_TOTAL_MS / steps);
	for (let i = 0; i < steps; i += 1) {
		act(() => {
			vi.advanceTimersByTime(slice);
		});
	}
};

beforeEach(() => {
	// The scenario derives its step from elapsed time, so the clock must advance
	// with the timers or nothing ever progresses.
	vi.useFakeTimers({
		toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
	});
	trackCtaClicked.mockClear();
	setReducedMotion(false);
	Object.defineProperty(window, 'location', {
		value: { origin: 'https://tiler.app', href: '' },
		writable: true,
		configurable: true,
	});
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe.each(DEMOS)('%s demo', (variant, Demo) => {
	it('renders its panel immediately', () => {
		const { container } = draw(<Demo />);

		expect(container.querySelector(`[data-demo="${variant}"]`)).not.toBeNull();
	});

	it('reaches its signup nudge', () => {
		draw(<Demo />);
		runToCompletion();

		const nudge = screen.getByTestId(`nudge-${variant}`);
		expect(nudge).toBeInTheDocument();
		expect(nudge).toHaveAttribute('tabIndex', '0');
	});

	it('keeps the nudge out of the tab order until the scenario completes', () => {
		draw(<Demo />);

		expect(screen.getByTestId(`nudge-${variant}`)).toHaveAttribute('tabIndex', '-1');
	});

	it('fires cta_clicked with the demo role when the nudge is used', () => {
		draw(<Demo />);
		runToCompletion();

		const nudge = screen.getByTestId(`nudge-${variant}`);
		// Asserted first: a tabIndex=-1 button still receives clicks, so clicking
		// alone would pass even if the scenario never completed.
		expect(nudge).toHaveAttribute('tabIndex', '0');
		fireEvent.click(nudge);

		expect(trackCtaClicked).toHaveBeenCalledWith(
			expect.objectContaining({ variant, ctaRole: 'demo', destination: '/signin' })
		);
	});

	it('carries the scenario into signup so the visitor need not retype it', () => {
		draw(<Demo />);
		runToCompletion();

		fireEvent.click(screen.getByTestId(`nudge-${variant}`));

		expect(window.location.href).toMatch(/^\/signin\?scenario=.+/);
	});

	it('reaches the nudge immediately under prefers-reduced-motion', () => {
		setReducedMotion(true);

		draw(<Demo />);

		// No timers advanced: an animation-free visitor must still get the ask.
		expect(screen.getByTestId(`nudge-${variant}`)).toHaveAttribute('tabIndex', '0');
	});

	it('does not advance while inactive', () => {
		draw(<Demo active={false} />);
		runToCompletion();

		expect(screen.getByTestId(`nudge-${variant}`)).toHaveAttribute('tabIndex', '-1');
	});

	it('renders product tiles rather than bespoke shapes', () => {
		const { container } = draw(<Demo />);
		runToCompletion();

		expect(container.querySelectorAll('[data-tile-state]').length).toBeGreaterThan(0);
	});

	it('reaches its nudge within the shared pacing budget', () => {
		draw(<Demo />);

		// Normalised so no arm gets more nudge exposure than another purely because
		// its story needs fewer steps.
		runToCompletion();

		expect(screen.getByTestId(`nudge-${variant}`)).toHaveAttribute('tabIndex', '0');
	});
});
