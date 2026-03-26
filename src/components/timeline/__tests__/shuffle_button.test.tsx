import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import ShuffleButton from '../shuffle_button';

const mockShuffleSchedule = vi.fn();

// Mock the services module
vi.mock('@/services', () => ({
	scheduleService: {
		shuffleSchedule: (...args: unknown[]) => mockShuffleSchedule(...args),
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
	},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				'timeline.shuffle.tooltip': 'Shuffle schedule',
				'timeline.shuffle.ariaLabel': 'Shuffle schedule',
				'timeline.shuffle.shuffling': 'Shuffling schedule...',
				'timeline.shuffle.success': 'Schedule shuffled!',
				'timeline.shuffle.error': 'Shuffle failed. Please try again.',
			};
			return translations[key] ?? key;
		},
		i18n: { language: 'en' },
	}),
}));

const renderShuffleButton = () =>
	render(
		<ThemeProvider theme={lightTheme}>
			<ShuffleButton />
		</ThemeProvider>
	);

describe('ShuffleButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders a shuffle button with correct aria-label', () => {
		renderShuffleButton();
		const button = screen.getByRole('button', { name: 'Shuffle schedule' });
		expect(button).toBeInTheDocument();
	});

	it('shows loading notification and then success on successful shuffle', async () => {
		mockShuffleSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderShuffleButton();
		const button = screen.getByRole('button', { name: 'Shuffle schedule' });
		await user.click(button);

		await waitFor(() => {
			expect(mockShowNotification).toHaveBeenCalledWith(
				'shuffle-schedule-shuffle',
				'Shuffling schedule...',
				'loading'
			);
		});

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'shuffle-schedule-shuffle',
				'Schedule shuffled!',
				'success'
			);
		});
	});

	it('shows error notification when shuffle fails', async () => {
		mockShuffleSchedule.mockRejectedValueOnce(new Error('Network error'));
		const user = setupUser();

		renderShuffleButton();
		const button = screen.getByRole('button', { name: 'Shuffle schedule' });
		await user.click(button);

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'shuffle-schedule-shuffle',
				'Shuffle failed. Please try again.',
				'error'
			);
		});
	});

	it('sends correct params to shuffleSchedule', async () => {
		mockShuffleSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const user = setupUser();

		renderShuffleButton();
		await user.click(screen.getByRole('button', { name: 'Shuffle schedule' }));

		await waitFor(() => {
			expect(mockShuffleSchedule).toHaveBeenCalledWith({
				MobileApp: true,
				SocketId: true,
				TimeZoneOffset: -5,
				Version: 'v2',
				TimeZone: 'America/New_York',
				IsTimeZoneAdjusted: 'true',
			});
		});
	});

	it('disables button while shuffle is in progress', async () => {
		let resolvePromise: (value: unknown) => void;
		const pending = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		mockShuffleSchedule.mockReturnValueOnce(pending);
		const user = setupUser();

		renderShuffleButton();
		const button = screen.getByRole('button', { name: 'Shuffle schedule' });
		await user.click(button);

		expect(button).toBeDisabled();

		// Resolve and verify re-enablement
		resolvePromise!({ subCalendarEvents: [] });
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('is disabled when disabled prop is true', () => {
		render(
			<ThemeProvider theme={lightTheme}>
				<ShuffleButton disabled />
			</ThemeProvider>
		);
		expect(screen.getByRole('button', { name: 'Shuffle schedule' })).toBeDisabled();
	});

	it('calls onLoadingChange when loading state changes', async () => {
		mockShuffleSchedule.mockResolvedValueOnce({ subCalendarEvents: [] });
		const onLoadingChange = vi.fn();
		const user = setupUser();

		render(
			<ThemeProvider theme={lightTheme}>
				<ShuffleButton onLoadingChange={onLoadingChange} />
			</ThemeProvider>
		);
		await user.click(screen.getByRole('button', { name: 'Shuffle schedule' }));

		await waitFor(() => {
			expect(onLoadingChange).toHaveBeenCalledWith(true);
			expect(onLoadingChange).toHaveBeenCalledWith(false);
		});
	});
});
