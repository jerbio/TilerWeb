import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import CreateTileInfoInline from '../info_inline';
import { InitialCreateTileFormState } from '..';
import dayjs from 'dayjs';

vi.mock('@/services', () => ({
	scheduleService: {
		searchLocations: vi.fn(() => Promise.resolve([])),
	},
	userService: { getScheduleProfile: vi.fn(() => Promise.resolve(null)) },
}));

vi.mock('react-i18next', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-i18next')>();
	return {
		...actual,
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

vi.mock('../../date_picker', () => ({
	default: ({ value }: { value: string }) => (
		<input data-testid="date-picker" defaultValue={value} />
	),
}));

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

function renderInline(
	formOverrides: Partial<InitialCreateTileFormState> = {},
	predictionFeedback?: Parameters<typeof CreateTileInfoInline>[0]['predictionFeedback']
) {
	const handler = makeFormHandler(formOverrides) as Parameters<
		typeof CreateTileInfoInline
	>[0]['formHandler'];
	const result = render(
		<ThemeProvider defaultTheme="dark">
			<CreateTileInfoInline formHandler={handler} predictionFeedback={predictionFeedback} />
		</ThemeProvider>
	);
	return { handler, ...result };
}

describe('CreateTileInfoInline', () => {
	it('renders the inline description trans key', () => {
		renderInline();
		expect(screen.getByTestId('inline-trans')).toBeInTheDocument();
	});

	it('renders inline inputs for action, location, hours, minutes', () => {
		renderInline({ action: 'Run', location: 'Park', durationHours: 1, durationMins: 30 });
		const inputs = screen.getAllByRole('spinbutton').concat(screen.queryAllByRole('textbox'));
		expect(inputs.length).toBeGreaterThan(0);
	});

	it('does not render smart suggestion controls', () => {
		renderInline();
		expect(screen.queryByText(/smart suggestion/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /accept all/i })).not.toBeInTheDocument();
	});

	it('renders one prediction loading bar above the inline form while fetching', () => {
		renderInline(
			{},
			{
				isPredicting: true,
				highlightedFields: { duration: false, location: false },
			}
		);

		expect(screen.getAllByTestId('prediction-loading-bar')).toHaveLength(1);
	});
});
