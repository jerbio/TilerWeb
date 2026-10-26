import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimulationModeBanner from '../SimulationModeBanner';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import type { SimulationDiffCounts } from '@/core/util/simulationDiff';
import type { KindFilter } from '@/core/state/simulationOverlayStore';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_k: string, opts?: { defaultValue?: string } | string) =>
			typeof opts === 'string' ? opts : (opts?.defaultValue ?? _k),
		i18n: { language: 'en' },
	}),
}));

const baseCounts: SimulationDiffCounts = {
	added: 0,
	removed: 0,
	edited: 0,
	shifted: 0,
	conflicts: 0,
};

function renderBanner(
	counts: Partial<SimulationDiffCounts> = {},
	activeKindFilter: KindFilter | null = null,
	onKindFilterChange = vi.fn()
) {
	return render(
		<ThemeProvider>
			<SimulationModeBanner
				counts={{ ...baseCounts, ...counts }}
				comparisonView="simulation"
				onComparisonViewChange={vi.fn()}
				onExitReview={vi.fn()}
				activeKindFilter={activeKindFilter}
				onKindFilterChange={onKindFilterChange}
			/>
		</ThemeProvider>
	);
}

describe('SimulationModeBanner — updated glyphs and filter chips', () => {
	it('shows "+" chip for added tiles with correct count', () => {
		renderBanner({ added: 3 });
		expect(screen.getByTestId('filter-chip-new')).toHaveTextContent('+3');
	});

	it('shows "×" chip for removed tiles', () => {
		renderBanner({ removed: 5 });
		expect(screen.getByTestId('filter-chip-removed')).toHaveTextContent('×5');
	});

	it('shows "→" chip for updated+shifted tiles combined', () => {
		renderBanner({ edited: 2, shifted: 1 });
		expect(screen.getByTestId('filter-chip-updated')).toHaveTextContent('→3');
	});

	it('shows "⚠" chip for conflict tiles', () => {
		renderBanner({ conflicts: 2 });
		expect(screen.getByTestId('filter-chip-conflict')).toHaveTextContent('⚠2');
	});

	it('hides the "+" chip when added count is 0', () => {
		renderBanner({ added: 0, removed: 2 });
		expect(screen.queryByTestId('filter-chip-new')).not.toBeInTheDocument();
	});

	it('hides the "×" chip when removed count is 0', () => {
		renderBanner({ added: 1, removed: 0 });
		expect(screen.queryByTestId('filter-chip-removed')).not.toBeInTheDocument();
	});

	it('hides the "→" chip when edited+shifted is 0', () => {
		renderBanner({ added: 1, edited: 0, shifted: 0 });
		expect(screen.queryByTestId('filter-chip-updated')).not.toBeInTheDocument();
	});

	it('hides the "⚠" chip when conflicts is 0', () => {
		renderBanner({ added: 1, conflicts: 0 });
		expect(screen.queryByTestId('filter-chip-conflict')).not.toBeInTheDocument();
	});

	it('calls onKindFilterChange("new") when "+" chip is clicked', () => {
		const onChange = vi.fn();
		renderBanner({ added: 2 }, null, onChange);
		fireEvent.click(screen.getByTestId('filter-chip-new'));
		expect(onChange).toHaveBeenCalledWith('new');
	});

	it('calls onKindFilterChange("removed") when "×" chip is clicked', () => {
		const onChange = vi.fn();
		renderBanner({ removed: 2 }, null, onChange);
		fireEvent.click(screen.getByTestId('filter-chip-removed'));
		expect(onChange).toHaveBeenCalledWith('removed');
	});

	it('calls onKindFilterChange("updated") when "→" chip is clicked', () => {
		const onChange = vi.fn();
		renderBanner({ edited: 1 }, null, onChange);
		fireEvent.click(screen.getByTestId('filter-chip-updated'));
		expect(onChange).toHaveBeenCalledWith('updated');
	});

	it('calls onKindFilterChange("conflict") when "⚠" chip is clicked', () => {
		const onChange = vi.fn();
		renderBanner({ conflicts: 1 }, null, onChange);
		fireEvent.click(screen.getByTestId('filter-chip-conflict'));
		expect(onChange).toHaveBeenCalledWith('conflict');
	});

	it('marks the active filter chip as aria-pressed="true"', () => {
		renderBanner({ added: 2 }, 'new');
		expect(screen.getByTestId('filter-chip-new')).toHaveAttribute('aria-pressed', 'true');
	});

	it('marks inactive chips as aria-pressed="false"', () => {
		renderBanner({ added: 2, removed: 1 }, 'new');
		expect(screen.getByTestId('filter-chip-removed')).toHaveAttribute('aria-pressed', 'false');
	});

	it('renders the micro-legend element', () => {
		renderBanner({ added: 1 });
		expect(screen.getByTestId('kind-legend')).toBeInTheDocument();
	});

	it('legend contains all four glyph labels', () => {
		renderBanner({ added: 1 });
		const legend = screen.getByTestId('kind-legend');
		expect(legend).toHaveTextContent('+');
		expect(legend).toHaveTextContent('×');
		expect(legend).toHaveTextContent('→');
		expect(legend).toHaveTextContent('⚠');
	});
});
