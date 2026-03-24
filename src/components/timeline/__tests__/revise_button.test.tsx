import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import ReviseButton from '../revise_button';

const mockReviseSchedule = vi.fn();

// Mock the services module
vi.mock('@/services', () => ({
	scheduleService: {
		reviseSchedule: (...args: unknown[]) => mockReviseSchedule(...args),
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
		}
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
	},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				'timeline.revise.tooltip': 'Revise schedule',
				'timeline.revise.ariaLabel': 'Revise schedule',
				'timeline.revise.revising': 'Revising schedule...',
				'timeline.revise.success': 'Schedule revised!',
				'timeline.revise.error': 'Revise failed. Please try again.',
			};
			return translations[key] ?? key;
		},
		i18n: { language: 'en' },
	}),
}));

const renderReviseButton = () =>
	render(
		<ThemeProvider theme={lightTheme}>
			<ReviseButton />
		</ThemeProvider>
	);

describe('ReviseButton', () => {
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

	it('renders a revise button with correct aria-label', () => {
		renderReviseButton();
		const button = screen.getByRole('button', { name: 'Revise schedule' });
		expect(button).toBeInTheDocument();
	});

	it('shows loading notification and then success on successful revise', async () => {
		mockReviseSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderReviseButton();
		const button = screen.getByRole('button', { name: 'Revise schedule' });
		await user.click(button);

		await waitFor(() => {
			expect(mockShowNotification).toHaveBeenCalledWith(
				'revise-schedule-revise',
				'Revising schedule...',
				'loading'
			);
		});

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'revise-schedule-revise',
				'Schedule revised!',
				'success'
			);
		});
	});

	it('shows error notification when revise fails', async () => {
		mockReviseSchedule.mockRejectedValueOnce(new Error('Network error'));
		const user = setupUser();

		renderReviseButton();
		const button = screen.getByRole('button', { name: 'Revise schedule' });
		await user.click(button);

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'revise-schedule-revise',
				'Revise failed. Please try again.',
				'error'
			);
		});
	});

	it('sends correct params to reviseSchedule', async () => {
		mockReviseSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderReviseButton();
		await user.click(screen.getByRole('button', { name: 'Revise schedule' }));

		await waitFor(() => {
			expect(mockReviseSchedule).toHaveBeenCalledWith({
				UserLongitude: '-73.9857',
				UserLatitude: '40.7484',
				UserLocationVerified: 'true',
				MobileApp: true,
				SocketId: true,
				TimeZoneOffset: -5,
				Version: 'v2',
				TimeZone: 'America/New_York',
				IsTimeZoneAdjusted: 'true',
			});
		});
	});

	it('disables button while revise is in progress', async () => {
		let resolvePromise: (value: unknown) => void;
		const pending = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		mockReviseSchedule.mockReturnValueOnce(pending);
		const user = setupUser();

		renderReviseButton();
		const button = screen.getByRole('button', { name: 'Revise schedule' });
		await user.click(button);

		expect(button).toBeDisabled();

		// Resolve and verify re-enablement
		resolvePromise!({ subCalendarEvents: [] });
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('fetches location before revising', async () => {
		mockReviseSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderReviseButton();
		await user.click(screen.getByRole('button', { name: 'Revise schedule' }));

		await waitFor(() => {
			expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
			expect(mockToApiFormat).toHaveBeenCalledTimes(1);
		});
	});

	it('is disabled when disabled prop is true', () => {
		render(
			<ThemeProvider theme={lightTheme}>
				<ReviseButton disabled />
			</ThemeProvider>
		);
		expect(screen.getByRole('button', { name: 'Revise schedule' })).toBeDisabled();
	});

	it('calls onLoadingChange when loading state changes', async () => {
		mockReviseSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const onLoadingChange = vi.fn();
		const user = setupUser();

		render(
			<ThemeProvider theme={lightTheme}>
				<ReviseButton onLoadingChange={onLoadingChange} />
			</ThemeProvider>
		);
		await user.click(screen.getByRole('button', { name: 'Revise schedule' }));

		await waitFor(() => {
			expect(onLoadingChange).toHaveBeenCalledWith(true);
			expect(onLoadingChange).toHaveBeenCalledWith(false);
		});
	});
});
