import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

function renderInfo(overrides: Partial<InitialCreateTileFormState> = {}) {
	const handler = makeFormHandler(overrides);
	render(
		<ThemeProvider theme={lightTheme}>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			<CreateTileInfo formHandler={handler as any} />
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
