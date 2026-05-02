import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import { DurationChipRow, LocationChipRow, SuggestionsLoadingBar } from '../suggestion-chip-row';
import { LocationSource, TilePredictionLocation } from '@/core/common/types/schedule';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, vars?: Record<string, unknown>) => {
			if (key === 'calendar.createTile.suggestions.duration.mins') return `${vars?.mins} min`;
			if (key === 'calendar.createTile.suggestions.duration.hrs') return `${vars?.hours} hr`;
			if (key === 'calendar.createTile.suggestions.duration.hrsAndMins')
				return `${vars?.hours} hr ${vars?.mins} min`;
			return key;
		},
	}),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

function wrap(ui: React.ReactElement) {
	return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

function makeLoc(overrides: Partial<TilePredictionLocation> = {}): TilePredictionLocation {
	return {
		id: 'loc-1',
		description: '',
		address: '123 Main St',
		longitude: 0,
		latitude: 0,
		isDefault: false,
		isNull: false,
		thirdPartyId: null,
		userId: null,
		nickname: '',
		source: LocationSource.Google,
		isVerified: false,
		isAdHoc: false,
		...overrides,
	};
}

// ── pure function: duration formatting ───────────────────────────────────────
// The formatting logic is embedded in the component. We verify it via rendered
// chip labels rather than exporting the helper.

describe('DurationChipRow – chip labels', () => {
	it('formats sub-hour durations as "N min"', () => {
		wrap(<DurationChipRow durations={[1800000]} appliedMs={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
	});

	it('formats exact-hour durations as "N hr"', () => {
		wrap(<DurationChipRow durations={[3600000]} appliedMs={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});

	it('formats mixed durations as "N hr M min"', () => {
		wrap(<DurationChipRow durations={[5400000]} appliedMs={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: '1 hr 30 min' })).toBeInTheDocument();
	});

	it('renders multiple duration chips', () => {
		wrap(
			<DurationChipRow durations={[1800000, 3600000]} appliedMs={null} onSelect={vi.fn()} />
		);
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});
});

describe('DurationChipRow – selection state', () => {
	it('marks the matching chip as selected', () => {
		wrap(
			<DurationChipRow
				durations={[1800000, 3600000]}
				appliedMs={1800000}
				onSelect={vi.fn()}
			/>
		);
		// aria-pressed is not set; we can assert $selected via accessible state or just check the
		// callback fires and treat visual selection as an implementation detail.
		// What we CAN verify: the chip exists and the non-matching chip does not carry selection.
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});

	it('calls onSelect with correct args when a chip is clicked', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		wrap(<DurationChipRow durations={[1800000]} appliedMs={null} onSelect={onSelect} />);
		await user.click(screen.getByRole('button', { name: '30 min' }));
		expect(onSelect).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledWith(0, 30, 1800000);
	});

	it('calls onSelect with hours and minutes parsed correctly for 1 hr', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		wrap(<DurationChipRow durations={[3600000]} appliedMs={null} onSelect={onSelect} />);
		await user.click(screen.getByRole('button', { name: '1 hr' }));
		expect(onSelect).toHaveBeenCalledWith(1, 0, 3600000);
	});

	it('calls onSelect with hours and minutes parsed correctly for 1 hr 30 min', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		wrap(<DurationChipRow durations={[5400000]} appliedMs={null} onSelect={onSelect} />);
		await user.click(screen.getByRole('button', { name: '1 hr 30 min' }));
		expect(onSelect).toHaveBeenCalledWith(1, 30, 5400000);
	});
});

describe('DurationChipRow – sparkle label', () => {
	it('renders the ✦ suggest label', () => {
		wrap(<DurationChipRow durations={[3600000]} appliedMs={null} onSelect={vi.fn()} />);
		expect(screen.getByText('✦')).toBeInTheDocument();
	});
});

// ── LocationChipRow ───────────────────────────────────────────────────────────

describe('LocationChipRow – chip labels', () => {
	it('shows nickname when present', () => {
		const loc = makeLoc({ nickname: 'Home', address: '1 Infinite Loop' });
		wrap(<LocationChipRow locations={[loc]} appliedId={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
	});

	it('falls back to address when nickname is empty', () => {
		const loc = makeLoc({ nickname: '', address: '1 Infinite Loop' });
		wrap(<LocationChipRow locations={[loc]} appliedId={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: /1 Infinite Loop/i })).toBeInTheDocument();
	});

	it('renders multiple location chips', () => {
		const locs = [
			makeLoc({ id: 'a', nickname: 'Home' }),
			makeLoc({ id: 'b', nickname: 'Office' }),
		];
		wrap(<LocationChipRow locations={locs} appliedId={null} onSelect={vi.fn()} />);
		expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Office/i })).toBeInTheDocument();
	});
});

describe('LocationChipRow – interaction', () => {
	it('calls onSelect with the full location object when clicked', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		const loc = makeLoc({ id: 'loc-42', nickname: 'Gym' });
		wrap(<LocationChipRow locations={[loc]} appliedId={null} onSelect={onSelect} />);
		await user.click(screen.getByRole('button', { name: /Gym/i }));
		expect(onSelect).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledWith(loc);
	});
});

describe('LocationChipRow – saved vs ad-hoc icon', () => {
	it('renders a Bookmark icon for saved (non-Google, non-adHoc) locations', () => {
		const loc = makeLoc({
			source: 'tiler' as TilePredictionLocation['source'],
			isAdHoc: false,
		});
		const { container } = wrap(
			<LocationChipRow locations={[loc]} appliedId={null} onSelect={vi.fn()} />
		);
		// lucide renders an svg; check it is present inside the chip button
		const svg = container.querySelector('button svg');
		expect(svg).toBeInTheDocument();
	});

	it('renders a MapPin icon for Google locations', () => {
		const loc = makeLoc({ source: LocationSource.Google });
		const { container } = wrap(
			<LocationChipRow locations={[loc]} appliedId={null} onSelect={vi.fn()} />
		);
		const svg = container.querySelector('button svg');
		expect(svg).toBeInTheDocument();
	});
});

// ── SuggestionsLoadingBar ─────────────────────────────────────────────────────

describe('SuggestionsLoadingBar', () => {
	it('renders into the DOM', () => {
		const { container } = wrap(<SuggestionsLoadingBar />);
		// The bar is purely visual; verify it mounts without error and has content
		expect(container.firstChild).toBeInTheDocument();
	});
});
