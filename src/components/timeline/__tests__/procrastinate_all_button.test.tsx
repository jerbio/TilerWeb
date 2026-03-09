import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import ProcrastinateAllButton from '../procrastinate_all_button';

const mockProcrastinateAllSchedule = vi.fn();

// Mock the services module
vi.mock('@/services', () => ({
	scheduleService: {
		procrastinateAllSchedule: (...args: unknown[]) => mockProcrastinateAllSchedule(...args),
	},
}));

// Mock the locationService
const mockGetCurrentLocation = vi.fn();
const mockToApiFormat = vi.fn();
vi.mock('@/services/locationService', () => ({
	__esModule: true,
	default: {
		getCurrentLocation: (...args: unknown[]) => mockGetCurrentLocation(...args),
		toApiFormat: (...args: unknown[]) => mockToApiFormat(...args),
	},
}));

// Mock the global state
vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = {
				getActivePersonaSession: () => ({
					userInfo: {
						id: 'user-id-123',
						username: 'testuser',
						timeZoneDifference: -5,
						timeZone: 'America/New_York',
					},
				}),
			};
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({
				getActivePersonaSession: () => ({
					userInfo: {
						id: 'user-id-123',
						username: 'testuser',
						timeZoneDifference: -5,
						timeZone: 'America/New_York',
					},
				}),
			}),
		},
	),
}));

// Mock notification store
const mockShowNotification = vi.fn();
const mockUpdateNotification = vi.fn();
vi.mock('@/core/ui', () => ({
	useUiStore: (selector?: (state: unknown) => unknown) => {
		const state = {
			notification: {
				items: [],
				show: mockShowNotification,
				update: mockUpdateNotification,
				dismiss: vi.fn(),
				clear: vi.fn(),
			},
		};
		return selector ? selector(state) : state;
	},
	notificationId: (action: string, entityId: string) => `${action}-${entityId}`,
	NotificationAction: {
		SetAsNow: 'set-now',
		Complete: 'complete',
		Delete: 'delete',
		Shuffle: 'shuffle',
		Revise: 'revise',
		ProcrastinateAll: 'procrastinate-all',
	},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				'timeline.procrastinateAll.tooltip': 'Defer all events',
				'timeline.procrastinateAll.ariaLabel': 'Defer all events',
				'timeline.procrastinateAll.deferring': 'Deferring all events...',
				'timeline.procrastinateAll.success': 'All events deferred!',
				'timeline.procrastinateAll.error': 'Defer failed. Please try again.',
				'timeline.procrastinateAll.pickerTitle': 'Defer Duration',
				'timeline.procrastinateAll.days': 'Days',
				'timeline.procrastinateAll.hours': 'Hours',
				'timeline.procrastinateAll.minutes': 'Minutes',
				'timeline.procrastinateAll.daysShort': 'd',
				'timeline.procrastinateAll.hoursShort': 'h',
				'timeline.procrastinateAll.minutesShort': 'm',
				'timeline.procrastinateAll.confirm': 'Confirm',
				'timeline.procrastinateAll.cancel': 'Cancel',
			};
			return translations[key] ?? key;
		},
		i18n: { language: 'en' },
	}),
}));

const renderProcrastinateAllButton = (props?: { disabled?: boolean; onLoadingChange?: (l: boolean) => void }) =>
	render(
		<ThemeProvider theme={lightTheme}>
			<ProcrastinateAllButton {...props} />
		</ThemeProvider>,
	);

/** Helper: open the overlay, fill inputs, and confirm */
const openAndConfirm = async (
	user: ReturnType<typeof setupUser>,
	opts: { days?: number; hours?: number; minutes?: number } = {},
) => {
	// Click the hourglass button to open overlay
	await user.click(screen.getByRole('button', { name: 'Defer all events' }));

	// Fill duration inputs
	const daysInput = screen.getByRole('spinbutton', { name: 'Days' });
	const hoursInput = screen.getByRole('spinbutton', { name: 'Hours' });
	const minutesInput = screen.getByRole('spinbutton', { name: 'Minutes' });

	if (opts.days) {
		await user.clear(daysInput);
		await user.type(daysInput, String(opts.days));
	}
	if (opts.hours) {
		await user.clear(hoursInput);
		await user.type(hoursInput, String(opts.hours));
	}
	if (opts.minutes) {
		await user.clear(minutesInput);
		await user.type(minutesInput, String(opts.minutes));
	}

	// Click confirm (✓)
	await user.click(screen.getByRole('button', { name: 'Confirm' }));
};

describe('ProcrastinateAllButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCurrentLocation.mockResolvedValue({
			location: 'Empire State Building, New York, NY',
			longitude: -73.9857,
			latitude: 40.7484,
			verified: true,
		});
		mockToApiFormat.mockReturnValue({
			userLongitude: '-73.9857',
			userLatitude: '40.7484',
			userLocationVerified: 'true',
		});
	});

	it('renders a defer-all button with correct aria-label', () => {
		renderProcrastinateAllButton();
		const button = screen.getByRole('button', { name: 'Defer all events' });
		expect(button).toBeInTheDocument();
	});

	it('opens the duration overlay when clicked', async () => {
		const user = setupUser();
		renderProcrastinateAllButton();

		// Overlay not visible initially
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Defer all events' }));

		// Overlay now visible with inputs and action buttons
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('spinbutton', { name: 'Days' })).toBeInTheDocument();
		expect(screen.getByRole('spinbutton', { name: 'Hours' })).toBeInTheDocument();
		expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('closes the overlay when cancel is clicked', async () => {
		const user = setupUser();
		renderProcrastinateAllButton();

		await user.click(screen.getByRole('button', { name: 'Defer all events' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows loading notification and then success on confirm', async () => {
		mockProcrastinateAllSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderProcrastinateAllButton();
		await openAndConfirm(user, { hours: 2 });

		await waitFor(() => {
			expect(mockShowNotification).toHaveBeenCalledWith(
				'procrastinate-all-schedule-procrastinate-all',
				'Deferring all events...',
				'loading',
			);
		});

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'procrastinate-all-schedule-procrastinate-all',
				'All events deferred!',
				'success',
			);
		});
	});

	it('shows error notification when procrastinate fails', async () => {
		mockProcrastinateAllSchedule.mockRejectedValueOnce(new Error('Network error'));
		const user = setupUser();

		renderProcrastinateAllButton();
		await openAndConfirm(user);

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'procrastinate-all-schedule-procrastinate-all',
				'Defer failed. Please try again.',
				'error',
			);
		});
	});

	it('sends correct duration params to procrastinateAllSchedule', async () => {
		mockProcrastinateAllSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderProcrastinateAllButton();
		await openAndConfirm(user, { days: 1, hours: 2, minutes: 30 });

		await waitFor(() => {
			expect(mockProcrastinateAllSchedule).toHaveBeenCalledWith({
				UserLongitude: '-73.9857',
				UserLatitude: '40.7484',
				UserLocationVerified: 'true',
				Version: 'v2',
				TimeZone: 'America/New_York',
				DurationDays: 1,
				DurationHours: 2,
				DurationMins: 30,
				DurationInMs: (1 * 24 * 60 + 2 * 60 + 30) * 60 * 1000,
			});
		});
	});

	it('sends zero duration when confirmed without changing inputs', async () => {
		mockProcrastinateAllSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderProcrastinateAllButton();
		await openAndConfirm(user);

		await waitFor(() => {
			expect(mockProcrastinateAllSchedule).toHaveBeenCalledWith(
				expect.objectContaining({
					DurationDays: 0,
					DurationHours: 0,
					DurationMins: 0,
					DurationInMs: 0,
				}),
			);
		});
	});

	it('fetches location before deferring', async () => {
		mockProcrastinateAllSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderProcrastinateAllButton();
		await openAndConfirm(user);

		await waitFor(() => {
			expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
			expect(mockToApiFormat).toHaveBeenCalledTimes(1);
		});
	});

	it('is disabled when disabled prop is true', () => {
		renderProcrastinateAllButton({ disabled: true });
		expect(screen.getByRole('button', { name: 'Defer all events' })).toBeDisabled();
	});

	it('does not open overlay when disabled', async () => {
		const user = setupUser();
		renderProcrastinateAllButton({ disabled: true });

		await user.click(screen.getByRole('button', { name: 'Defer all events' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('calls onLoadingChange when loading state changes', async () => {
		mockProcrastinateAllSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const onLoadingChange = vi.fn();
		const user = setupUser();

		renderProcrastinateAllButton({ onLoadingChange });
		await openAndConfirm(user);

		await waitFor(() => {
			expect(onLoadingChange).toHaveBeenCalledWith(true);
			expect(onLoadingChange).toHaveBeenCalledWith(false);
		});
	});
});
