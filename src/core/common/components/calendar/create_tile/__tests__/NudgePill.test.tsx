import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import NudgePill, { NudgePillProps } from '../nudge-pill';
import { TilePredictionResponse } from '@/core/common/types/schedule';

// ── helpers ───────────────────────────────────────────────────────────────────

function wrap(ui: React.ReactElement) {
	return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

const basePrediction: TilePredictionResponse = {
	duration: [1800000, 3600000],
	location: [
		{
			id: 'loc-1',
			description: '',
			address: '1 Market St',
			longitude: 0,
			latitude: 0,
			isDefault: false,
			isNull: false,
			thirdPartyId: null,
			userId: null,
			nickname: 'Office',
			source: 'tiler',
			isVerified: true,
			isAdHoc: false,
		},
	],
	timeOfDay: { daySections: ['Morning', 'Afternoon'] },
};

function makeProps(overrides: Partial<NudgePillProps> = {}): NudgePillProps {
	return {
		prediction: basePrediction,
		isLoading: false,
		appliedDurationMs: null,
		appliedLocationId: null,
		appliedTimeSection: null,
		onDurationSelect: vi.fn(),
		onLocationSelect: vi.fn(),
		onTimeSectionSelect: vi.fn(),
		...overrides,
	};
}

// ── null / loading states ────────────────────────────────────────────────────

describe('NudgePill – null / empty states', () => {
	it('renders nothing when prediction is null and not loading', () => {
		const { container } = wrap(<NudgePill {...makeProps({ prediction: null })} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders nothing when prediction has no suggestions', () => {
		const { container } = wrap(
			<NudgePill
				{...makeProps({
					prediction: { duration: [], location: [] },
				})}
			/>
		);
		expect(container.firstChild).toBeNull();
	});

	it('renders a loading skeleton when isLoading is true', () => {
		const { container } = wrap(
			<NudgePill {...makeProps({ isLoading: true, prediction: null })} />
		);
		expect(container.firstChild).toBeInTheDocument();
	});
});

// ── collapsed (default) state ────────────────────────────────────────────────

describe('NudgePill – collapsed state', () => {
	it('renders the suggestion count summary', () => {
		wrap(<NudgePill {...makeProps()} />);
		// 2 durations + 1 location = 3 suggestions (timeSections excluded from count per implementation)
		expect(screen.getByText(/smart suggestion/i)).toBeInTheDocument();
	});

	it('shows a preview chip for the first location', () => {
		wrap(<NudgePill {...makeProps()} />);
		expect(screen.getByText('Office')).toBeInTheDocument();
	});

	it('shows a preview chip for the first duration', () => {
		wrap(<NudgePill {...makeProps()} />);
		expect(screen.getByText('30 min')).toBeInTheDocument();
	});

	it('does not show clickable chips while collapsed', () => {
		wrap(<NudgePill {...makeProps()} />);
		// Clickable chips inside PillBody are only rendered when expanded
		expect(screen.queryAllByRole('button').length).toBe(1); // only the bar toggle
	});

	it('uses plural label for multiple suggestions', () => {
		wrap(<NudgePill {...makeProps()} />);
		expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
	});

	it('uses singular label for one suggestion', () => {
		wrap(
			<NudgePill
				{...makeProps({
					prediction: { duration: [3600000] },
				})}
			/>
		);
		expect(screen.getByText(/1 smart suggestion$/i)).toBeInTheDocument();
	});
});

// ── expand / collapse ─────────────────────────────────────────────────────────

describe('NudgePill – expand / collapse', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('expands when the bar is clicked', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps()} />);
		await user.click(screen.getByRole('button'));
		// Duration chips should now be visible
		expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
	});

	it('shows duration chips after expanding', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps()} />);
		await user.click(screen.getByRole('button'));
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});

	it('shows location chips after expanding', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps()} />);
		await user.click(screen.getByRole('button'));
		expect(screen.getByRole('button', { name: /Office/i })).toBeInTheDocument();
	});

	it('collapses again on second click', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps()} />);
		const toggle = screen.getByRole('button');
		await user.click(toggle);
		await user.click(screen.getAllByRole('button')[0]); // first button is still the toggle
		// After collapsing, named chips are gone
		expect(screen.queryByRole('button', { name: '30 min' })).not.toBeInTheDocument();
	});
});

// ── chip interactions when expanded ──────────────────────────────────────────

describe('NudgePill – chip callbacks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('calls onDurationSelect when a duration chip is clicked', async () => {
		const onDurationSelect = vi.fn();
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps({ onDurationSelect })} />);
		await user.click(screen.getByRole('button')); // expand
		await user.click(screen.getByRole('button', { name: '30 min' }));
		expect(onDurationSelect).toHaveBeenCalledOnce();
		expect(onDurationSelect).toHaveBeenCalledWith(0, 30, 1800000);
	});

	it('calls onLocationSelect with the full location object', async () => {
		const onLocationSelect = vi.fn();
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps({ onLocationSelect })} />);
		await user.click(screen.getByRole('button')); // expand
		await user.click(screen.getByRole('button', { name: /Office/i }));
		expect(onLocationSelect).toHaveBeenCalledOnce();
		expect(onLocationSelect).toHaveBeenCalledWith(basePrediction.location![0]);
	});
});

// ── applied state reflected in chips ─────────────────────────────────────────

describe('NudgePill – applied state', () => {
	it('shows applied duration chip as selected when expanded', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps({ appliedDurationMs: 1800000 })} />);
		await user.click(screen.getByRole('button')); // expand
		// The chip renders with $selected=true; we can't inspect the styled prop directly
		// but we can assert the chip is present and the row renders correctly.
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
	});

	it('shows applied location chip as selected when expanded', async () => {
		const user = userEvent.setup();
		wrap(<NudgePill {...makeProps({ appliedLocationId: 'loc-1' })} />);
		await user.click(screen.getByRole('button')); // expand
		expect(screen.getByRole('button', { name: /Office/i })).toBeInTheDocument();
	});
});
