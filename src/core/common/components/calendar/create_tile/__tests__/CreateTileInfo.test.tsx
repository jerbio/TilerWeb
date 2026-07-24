import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import CreateTileInfo from '../info';
import { InitialCreateTileFormState } from '..';
import dayjs from 'dayjs';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const mockSearchLocations = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
	},
}));

function makeFormHandler(overrides: Partial<InitialCreateTileFormState> = {}) {
	const formData = {
		action: '',
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

function renderInfo(
	overrides: Partial<InitialCreateTileFormState> = {},
	predictionFeedback?: Parameters<typeof CreateTileInfo>[0]['predictionFeedback']
) {
	const handler = makeFormHandler(overrides) as Parameters<
		typeof CreateTileInfo
	>[0]['formHandler'];
	render(
		<ThemeProvider theme={lightTheme}>
			<CreateTileInfo formHandler={handler} predictionFeedback={predictionFeedback} />
		</ThemeProvider>
	);
	return handler;
}

describe('CreateTileInfo – location verified badge', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('does not show verified badge when locationIsVerified is false', () => {
		renderInfo({ locationIsVerified: false, location: '123 Main St' });
		expect(screen.queryByTestId('location-verified-badge')).not.toBeInTheDocument();
	});

	it('shows verified badge when locationIsVerified is true and location is non-empty', () => {
		renderInfo({ locationIsVerified: true, location: '123 Main St' });
		expect(screen.getByTestId('location-verified-badge')).toBeInTheDocument();
	});

	it('does not show verified badge when location is empty even if locationIsVerified is true', () => {
		renderInfo({ locationIsVerified: true, location: '' });
		expect(screen.queryByTestId('location-verified-badge')).not.toBeInTheDocument();
	});

	it('verified badge has tooltip title attribute', () => {
		renderInfo({ locationIsVerified: true, location: '123 Main St' });
		const badge = screen.getByTestId('location-verified-badge');
		expect(badge).toHaveAttribute('title', 'location.verified.tooltip');
	});

	it('renders prediction loading bars around location and duration while fetching', () => {
		renderInfo(
			{},
			{
				isPredicting: true,
				highlightedFields: { duration: false, location: false },
			}
		);

		expect(screen.getAllByTestId('prediction-loading-bar')).toHaveLength(2);
	});
});

describe('CreateTileInfo – Tile Split input', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders Tile Split input with correct label', () => {
		renderInfo({ count: '1' });
		expect(screen.getByText('calendar.createTile.info.tileSplit.label')).toBeInTheDocument();
	});

	it('renders Tile Split input with correct placeholder', () => {
		renderInfo({ count: '1' });
		const input = screen.getByPlaceholderText('calendar.createTile.info.tileSplit.placeholder');
		expect(input).toBeInTheDocument();
	});

	it('displays the count value in the input', () => {
		renderInfo({ count: '5' });
		const input = screen.getByPlaceholderText('calendar.createTile.info.tileSplit.placeholder');
		expect(input).toHaveValue(5);
	});

	it('displays default count value of 1', () => {
		renderInfo({ count: '1' });
		const input = screen.getByPlaceholderText('calendar.createTile.info.tileSplit.placeholder');
		expect(input).toHaveValue(1);
	});
});

describe('CreateTileInfo – location nickname uniqueness flow', () => {
	const savedLocation = {
		id: 'saved-1',
		description: 'My Office',
		address: '100 Office Blvd',
		longitude: 0,
		latitude: 0,
		isVerified: false,
		isDefault: false,
		isNull: false,
		thirdPartyId: '',
		userId: 'user-123',
		source: 'none',
		nickname: 'office',
	};

	const googleLocation = {
		id: 'ChIJ123',
		description: 'Walmart Supercenter',
		address: 'Walmart Supercenter 745 us-287, lafayette, co 80026, usa',
		longitude: -105.1,
		latitude: 40.0,
		isVerified: true,
		isDefault: false,
		isNull: false,
		thirdPartyId: 'ChIJ123',
		userId: null,
		source: 'google',
		nickname: 'walmart supercenter',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	function StatefulInfo({ initial = {} }: { initial?: Partial<InitialCreateTileFormState> }) {
		const [formData, setFormData] = React.useState<InitialCreateTileFormState>({
			action: '',
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
			...initial,
		} as InitialCreateTileFormState);

		const handler = {
			formData,
			setFormData,
			resetForm: vi.fn(),
			handleFormInputChange:
				(field: keyof InitialCreateTileFormState) =>
				(eventOrValue: { target?: { value: unknown } } | unknown) => {
					const value =
						eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
							? (eventOrValue.target as { value: unknown }).value
							: eventOrValue;
					setFormData((prev) => ({ ...prev, [field]: value }));
				},
		} as unknown as Parameters<typeof CreateTileInfo>[0]['formHandler'];

		return (
			<ThemeProvider theme={lightTheme}>
				<CreateTileInfo formHandler={handler} />
				<div data-testid="state-locationId">{String(formData.locationId)}</div>
				<div data-testid="state-locationTag">{formData.locationTag}</div>
				<div data-testid="state-location">{formData.location}</div>
			</ThemeProvider>
		);
	}

	async function openDropdown(user: ReturnType<typeof userEvent.setup>, query: string) {
		const locationInput = screen.getByPlaceholderText(
			'calendar.createTile.info.location.placeholder'
		);
		await user.clear(locationInput);
		await user.type(locationInput, query);
		await vi.advanceTimersByTimeAsync(400);
		await waitFor(() => {
			expect(mockSearchLocations).toHaveBeenCalled();
		});
	}

	it('clears the locationId when the nickname (locationTag) is edited', async () => {
		const user = userEvent.setup();
		render(<StatefulInfo initial={{ locationId: 'saved-1', locationTag: 'office' }} />);

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('saved-1');

		const tagInput = screen.getByPlaceholderText(
			'calendar.createTile.info.locationTag.placeholder'
		);
		await user.type(tagInput, '2');

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('null');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('office2');
	});

	it('keeps the locationId when selecting a saved result from the picker', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockSearchLocations.mockResolvedValue([savedLocation]);
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<StatefulInfo />);

		await openDropdown(user, 'office');
		await waitFor(() => {
			expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
		});

		await user.click(screen.getByText('100 Office Blvd'));

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('saved-1');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('office');
		expect(screen.getByTestId('state-location')).toHaveTextContent('100 Office Blvd');
		vi.useRealTimers();
	});

	it('copies only the address and clears the locationId without adopting the nickname', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockSearchLocations.mockResolvedValue([savedLocation]);
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<StatefulInfo />);

		await openDropdown(user, 'office');
		await waitFor(() => {
			expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
		});

		await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));

		expect(screen.getByTestId('state-location')).toHaveTextContent('100 Office Blvd');
		expect(screen.getByTestId('state-locationId')).toHaveTextContent('null');
		// nickname is NOT adopted from the result
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('');
		vi.useRealTimers();
	});

	it('copies only the address from a Google result and keeps locationId null', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockSearchLocations.mockResolvedValue([googleLocation]);
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<StatefulInfo />);

		await openDropdown(user, 'walmart');
		await waitFor(() => {
			expect(
				screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa')
			).toBeInTheDocument();
		});

		await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));

		expect(screen.getByTestId('state-location')).toHaveTextContent(
			'Walmart Supercenter 745 us-287, lafayette, co 80026, usa'
		);
		expect(screen.getByTestId('state-locationId')).toHaveTextContent('null');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('');
		vi.useRealTimers();
	});
});
