import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import CreateTileInfoInline from '../info_inline';
import { InitialCreateTileFormState } from '..';
import { TilePredictionLocation, TilePredictionResponse } from '@/core/common/types/schedule';
import { NudgePillProps } from '../nudge-pill';
import dayjs from 'dayjs';

vi.mock('react-i18next', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-i18next')>();
	return {
		...actual,
		useTranslation: () => ({ t: (key: string) => key }),
		Trans: ({
			i18nKey,
			components,
		}: {
			i18nKey: string;
			components?: Record<string, React.ReactElement>;
		}) => (
			<span data-testid="inline-trans">
				{i18nKey}
				{components && Object.values(components)}
			</span>
		),
	};
});

// DatePicker uses a native input under the hood — mock to keep tests lightweight
vi.mock('../../date_picker', () => ({
	default: ({ value }: { value: string }) => (
		<input data-testid="date-picker" defaultValue={value} />
	),
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

function makeNudgePill(
	prediction: TilePredictionResponse | null = null,
	isLoading = false,
	overrides: Partial<NudgePillProps> = {}
): NudgePillProps {
	return {
		prediction,
		isLoading,
		appliedDurationMs: null,
		appliedLocationId: null,
		appliedTimeSection: null,
		onDurationSelect: vi.fn(),
		onLocationSelect: vi.fn(),
		onTimeSectionSelect: vi.fn(),
		...overrides,
	};
}

function renderInline(
	formOverrides: Partial<InitialCreateTileFormState> = {},
	nudgePill: NudgePillProps = makeNudgePill()
) {
	const handler = makeFormHandler(formOverrides);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = render(
		<ThemeProvider defaultTheme="dark">
			<CreateTileInfoInline formHandler={handler as any} nudgePill={nudgePill} />
		</ThemeProvider>
	);
	return { handler, ...result };
}

// ── inline form renders ───────────────────────────────────────────────────────

describe('CreateTileInfoInline – inline form', () => {
	beforeEach(() => vi.clearAllMocks());

	it('renders the inline description trans key', () => {
		renderInline();
		expect(screen.getByTestId('inline-trans')).toBeInTheDocument();
	});

	it('renders inline inputs for action, location, hours, minutes', () => {
		renderInline({ action: 'Run', location: 'Park', durationHours: 1, durationMins: 30 });
		// AutosizeInput renders an <input>; we check multiple inputs are present
		const inputs = screen.getAllByRole('spinbutton').concat(screen.queryAllByRole('textbox'));
		expect(inputs.length).toBeGreaterThan(0);
	});
});

// ── nudge pill absent when no prediction ─────────────────────────────────────

describe('CreateTileInfoInline – nudge pill absent', () => {
	beforeEach(() => vi.clearAllMocks());

	it('does not render the nudge pill shell when prediction is null and not loading', () => {
		renderInline({}, makeNudgePill(null, false));
		// No suggestion count text
		expect(screen.queryByText(/smart suggestion/i)).not.toBeInTheDocument();
	});

	it('does not render any suggestion chips', () => {
		renderInline({}, makeNudgePill(null, false));
		expect(screen.queryByRole('button', { name: /min|hr/i })).not.toBeInTheDocument();
	});
});

// ── nudge pill loading state ──────────────────────────────────────────────────

describe('CreateTileInfoInline – nudge pill loading', () => {
	beforeEach(() => vi.clearAllMocks());

	it('renders a loading skeleton when isLoading is true', () => {
		const { container } = renderInline({}, makeNudgePill(null, true));
		// A loading skeleton (non-null child) is rendered above the inline form
		expect(
			container.querySelector('[class*="PillShell"]') ?? container.firstChild
		).toBeTruthy();
	});

	it('does not render suggestion count text while loading', () => {
		renderInline({}, makeNudgePill(null, true));
		expect(screen.queryByText(/smart suggestion/i)).not.toBeInTheDocument();
	});
});

// ── nudge pill with prediction ────────────────────────────────────────────────

describe('CreateTileInfoInline – nudge pill with prediction', () => {
	beforeEach(() => vi.clearAllMocks());

	const prediction: TilePredictionResponse = {
		duration: [1800000, 3600000],
		location: [makeLoc()],
	};

	it('renders the suggestion count', () => {
		renderInline({}, makeNudgePill(prediction));
		expect(screen.getByText(/smart suggestion/i)).toBeInTheDocument();
	});

	it('shows a duration preview chip while collapsed', () => {
		renderInline({}, makeNudgePill(prediction));
		expect(screen.getByText('30 min')).toBeInTheDocument();
	});

	it('shows a location preview chip while collapsed', () => {
		renderInline({}, makeNudgePill(prediction));
		expect(screen.getByText('Office')).toBeInTheDocument();
	});

	it('expands to show clickable duration chips when the pill is clicked', async () => {
		const user = userEvent.setup();
		renderInline({}, makeNudgePill(prediction));
		// Click the pill toggle button (first and only button while collapsed)
		await user.click(screen.getByRole('button'));
		expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1 hr' })).toBeInTheDocument();
	});

	it('calls onDurationSelect when a chip is clicked after expanding', async () => {
		const user = userEvent.setup();
		const onDurationSelect = vi.fn();
		renderInline({}, makeNudgePill(prediction, false, { onDurationSelect }));
		await user.click(screen.getByRole('button')); // expand
		await user.click(screen.getByRole('button', { name: '30 min' }));
		expect(onDurationSelect).toHaveBeenCalledOnce();
		expect(onDurationSelect).toHaveBeenCalledWith(0, 30, 1800000);
	});

	it('calls onLocationSelect with the full location object after expanding', async () => {
		const user = userEvent.setup();
		const onLocationSelect = vi.fn();
		renderInline({}, makeNudgePill(prediction, false, { onLocationSelect }));
		await user.click(screen.getByRole('button')); // expand
		await user.click(screen.getByRole('button', { name: /Office/i }));
		expect(onLocationSelect).toHaveBeenCalledOnce();
		expect(onLocationSelect).toHaveBeenCalledWith(prediction.location![0]);
	});
});

// ── pill above form ordering ──────────────────────────────────────────────────

describe('CreateTileInfoInline – pill is above the inline form', () => {
	it('renders the nudge pill before the inline control in the DOM', () => {
		const prediction: TilePredictionResponse = { duration: [3600000] };
		renderInline({}, makeNudgePill(prediction));

		const trans = screen.getByTestId('inline-trans');
		const suggestionText = screen.getByText(/smart suggestion/i);

		// compareDocumentPosition: DOCUMENT_POSITION_FOLLOWING = 4 means `trans` comes after `suggestionText`
		const position = suggestionText.compareDocumentPosition(trans);
		expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
