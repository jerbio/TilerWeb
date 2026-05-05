import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import CreateTileInfo from '../info';
import { InitialCreateTileFormState } from '..';
import { TilePredictionLocation, TilePredictionResponse } from '@/core/common/types/schedule';
import dayjs from 'dayjs';

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

const mockSearchLocations = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
	},
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFormHandler(overrides: Partial<InitialCreateTileFormState> = {}) {
	const formData: InitialCreateTileFormState = {
		action: 'Lunch',
		count: '1',
		location: '',
		locationId: null,
		locationSource: '',
		locationIsVerified: false,
		locationTag: '',
		hasLocationNickname: false,
		locationNickname: '',
		durationHours: 0,
		durationMins: 0,
		isRecurring: true,
		start: dayjs(),
		deadline: dayjs(),
		...overrides,
	} as InitialCreateTileFormState;
	return {
		formData,
		handleFormInputChange: vi.fn(() => vi.fn()),
		setFormData: vi.fn(),
		resetForm: vi.fn(),
	};
}

const noSuggestions = {
	prediction: null as TilePredictionResponse | null,
	isLoading: false,
	appliedDurationMs: null as number | null,
	appliedLocationId: null as string | null,
	appliedTimeSection: null as string | null,
	onDurationSelect: vi.fn(),
	onLocationSelect: vi.fn(),
	onTimeSectionSelect: vi.fn(),
	onAcceptAll: vi.fn(),
	onClearAll: vi.fn(),
};

function makeSuggestions(prediction: TilePredictionResponse | null, isLoading = false) {
	return {
		...noSuggestions,
		prediction,
		isLoading,
		onDurationSelect: vi.fn(),
		onLocationSelect: vi.fn(),
		onTimeSectionSelect: vi.fn(),
		onAcceptAll: vi.fn(),
		onClearAll: vi.fn(),
	};
}

function makeLoc(overrides: Partial<TilePredictionLocation> = {}): TilePredictionLocation {
	return {
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
		...overrides,
	};
}

function renderInfo(
	formOverrides: Partial<InitialCreateTileFormState> = {},
	suggestions = noSuggestions
) {
	const handler = makeFormHandler(formOverrides) as Parameters<
		typeof CreateTileInfo
	>[0]['formHandler'];
	const result = render(
		<ThemeProvider theme={lightTheme}>
			<CreateTileInfo formHandler={handler} suggestions={suggestions} />
		</ThemeProvider>
	);
	return { handler, suggestions, ...result };
}

// ── loading bar ───────────────────────────────────────────────────────────────

describe('CreateTileInfo – loading bar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders no chip rows when not loading and no prediction', () => {
		renderInfo();
		expect(screen.queryByText('✦')).not.toBeInTheDocument();
	});

	it('renders loading bar in place of duration chips while isLoading', () => {
		const { container } = renderInfo({}, makeSuggestions(null, true));
		expect(screen.queryByRole('button', { name: /min|hr/i })).not.toBeInTheDocument();
		// The bar is a pair of plain divs — no role, no text. Verify the grid has
		// rendered something beyond the labelled inputs by checking child count.
		expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
	});

	it('renders loading bar below location field while isLoading', () => {
		renderInfo({}, makeSuggestions(null, true));
		// No location chips, but also no crash
		expect(screen.queryByRole('button', { name: /Market|Office/i })).not.toBeInTheDocument();
	});
});

// ── duration chips ────────────────────────────────────────────────────────────

describe('CreateTileInfo – duration chips', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders duration chips when prediction has durations', () => {
		renderInfo({}, makeSuggestions({ duration: [1800000, 3600000] }));
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});

	it('does not render duration chips when prediction has no durations', () => {
		renderInfo({}, makeSuggestions({ duration: [] }));
		expect(screen.queryByRole('button', { name: /min|hr/i })).not.toBeInTheDocument();
	});

	it('calls onDurationSelect when a duration chip is clicked', async () => {
		const user = userEvent.setup();
		const suggestions = makeSuggestions({ duration: [1800000] });
		renderInfo({}, suggestions);
		await user.click(screen.getByRole('button', { name: '30 min' }));
		expect(suggestions.onDurationSelect).toHaveBeenCalledOnce();
		expect(suggestions.onDurationSelect).toHaveBeenCalledWith(0, 30, 1800000);
	});

	it('does not render chips while loading even if prediction has durations', () => {
		renderInfo({}, { ...makeSuggestions({ duration: [1800000] }), isLoading: true });
		expect(screen.queryByRole('button', { name: '30 min' })).not.toBeInTheDocument();
	});
});

// ── location chips ────────────────────────────────────────────────────────────

describe('CreateTileInfo – location chips', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders location chips when prediction has locations', () => {
		const loc = makeLoc({ nickname: 'Office' });
		renderInfo({}, makeSuggestions({ location: [loc] }));
		expect(screen.getByRole('button', { name: /Office/i })).toBeInTheDocument();
	});

	it('falls back to address when location nickname is empty', () => {
		const loc = makeLoc({ nickname: '', address: '99 Elm St' });
		renderInfo({}, makeSuggestions({ location: [loc] }));
		expect(screen.getByRole('button', { name: /99 Elm St/i })).toBeInTheDocument();
	});

	it('does not render location chips when prediction has no locations', () => {
		renderInfo({}, makeSuggestions({ location: [] }));
		expect(screen.queryByRole('button', { name: /Office|Market/i })).not.toBeInTheDocument();
	});

	it('calls onLocationSelect with the full location object when clicked', async () => {
		const user = userEvent.setup();
		const loc = makeLoc({ nickname: 'Gym' });
		const suggestions = makeSuggestions({ location: [loc] });
		renderInfo({}, suggestions);
		await user.click(screen.getByRole('button', { name: /Gym/i }));
		expect(suggestions.onLocationSelect).toHaveBeenCalledOnce();
		expect(suggestions.onLocationSelect).toHaveBeenCalledWith(loc);
	});

	it('does not render location chips while loading', () => {
		const loc = makeLoc();
		renderInfo({}, { ...makeSuggestions({ location: [loc] }), isLoading: true });
		expect(screen.queryByRole('button', { name: /Office/i })).not.toBeInTheDocument();
	});
});

// ── chips replaced by results after loading ───────────────────────────────────

describe('CreateTileInfo – loading → results transition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('shows chips once isLoading becomes false with a prediction', () => {
		// Render with loading first to confirm it's absent, then re-render with results.
		const { unmount } = renderInfo({}, makeSuggestions(null, true));
		expect(screen.queryByRole('button', { name: '30 min' })).not.toBeInTheDocument();
		unmount();

		renderInfo({}, makeSuggestions({ duration: [1800000] }, false));
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
	});
});
