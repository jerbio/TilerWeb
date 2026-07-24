import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, ThemeMode } from '@/core/theme/ThemeProvider';
import i18n from '@/i18n/config';
import AccountSettings from './AccountSettings';
import { UserSettings } from '@/api/userApi';

// ---------------------------------------------------------------------------
// Mock navigation so tests don't need a real router history stack
// ---------------------------------------------------------------------------
vi.mock('@/hooks/useNavigateHome', () => ({
	default: () => vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @/global_state
// ---------------------------------------------------------------------------
const mockAuthenticatedUser = {
	id: 'user-1',
	username: 'testuser',
	fullName: 'Test User',
	email: 'test@example.com',
	phoneNumber: '1234567890',
	countryCode: '1',
	dateOfBirth: null as string | null,
	firstName: 'Test',
	lastName: 'User',
	endOfDay: null as string | null,
	timeZone: 'UTC',
	timeZoneDifference: 0,
};

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = {
				authenticatedUser: mockAuthenticatedUser,
				isAuthenticated: true,
			};
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({
				authenticatedUser: mockAuthenticatedUser,
				isAuthenticated: true,
			}),
		}
	),
}));

// ---------------------------------------------------------------------------
// Mock @/services
// ---------------------------------------------------------------------------
vi.mock('@/services', () => ({
	userService: {
		updateUser: vi.fn(),
		updateSettings: vi.fn(),
	},
}));

import { userService } from '@/services';

// ---------------------------------------------------------------------------
// Mock toast
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createMockSettings = (): UserSettings => ({
	userPreference: {
		id: 'p1',
		notifcationEnabled: true,
		notifcationEnabledMs: 0,
		emailNotificationEnabled: true,
		textNotificationEnabled: false,
		pushNotificationEnabled: false,
		tileNotificationEnabled: true,
	},
	marketingPreference: {
		id: 'm1',
		disableAll: false,
		disableEmail: false,
		disableTextMsg: false,
	},
	scheduleProfile: {
		travelMedium: 'driving',
		pinPreference: 'start',
		sleepDuration: 0,
		endTimeOfDay: '',
	},
	mobileUiScheme: {
		id: 'mob1',
		scheduleProfileId: '',
		name: '',
		mainColor: '',
		accentColor: '',
		fontFamily: '',
		fontSize: 14,
		fontWeight: '',
		isDefault: true,
		themeMode: 'dark',
	},
	desktopUiScheme: {
		id: 'desk1',
		scheduleProfileId: '',
		name: '',
		mainColor: '',
		accentColor: '',
		fontFamily: '',
		fontSize: 14,
		fontWeight: '',
		isDefault: true,
		themeMode: 'dark',
	},
});

const renderAccountSettings = (defaultTheme: ThemeMode = ThemeMode.Dark) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme={defaultTheme}>
				<BrowserRouter>
					<AccountSettings />
				</BrowserRouter>
			</ThemeProvider>
		</I18nextProvider>
	);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AccountSettings — Color theme section', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(userService.updateUser as Mock).mockResolvedValue(undefined);
		(userService.updateSettings as Mock).mockResolvedValue(createMockSettings());
	});

	// -- Rendering -----------------------------------------------------------
	describe('rendering', () => {
		it('renders the Color theme section heading', () => {
			renderAccountSettings();
			expect(screen.getByText('Color theme')).toBeInTheDocument();
		});

		it('renders all three radio options', () => {
			renderAccountSettings();
			expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument();
			expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument();
			expect(screen.getByRole('radio', { name: 'Use device setting' })).toBeInTheDocument();
		});

		it('pre-selects Dark when ThemeProvider defaults to dark', () => {
			renderAccountSettings(ThemeMode.Dark);
			expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
			expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
			expect(screen.getByRole('radio', { name: 'Use device setting' })).not.toBeChecked();
		});

		it('pre-selects Light when ThemeProvider defaults to light', () => {
			renderAccountSettings(ThemeMode.Light);
			expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
			expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
		});

		it('pre-selects Use device setting when ThemeProvider defaults to system', () => {
			renderAccountSettings(ThemeMode.System);
			expect(screen.getByRole('radio', { name: 'Use device setting' })).toBeChecked();
		});
	});

	// -- Interactivity -------------------------------------------------------
	describe('radio selection', () => {
		it('allows switching to Light', () => {
			renderAccountSettings(ThemeMode.Dark);
			fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
			expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
			expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
		});

		it('allows switching to Use device setting', () => {
			renderAccountSettings(ThemeMode.Dark);
			fireEvent.click(screen.getByRole('radio', { name: 'Use device setting' }));
			expect(screen.getByRole('radio', { name: 'Use device setting' })).toBeChecked();
		});

		it('allows switching back to Dark', () => {
			renderAccountSettings(ThemeMode.Light);
			fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
			expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
		});
	});

	// -- Save behaviour ------------------------------------------------------
	describe('save behaviour', () => {
		it('does not call updateSettings when theme is unchanged on save', async () => {
			renderAccountSettings(ThemeMode.Dark); // Dark is pre-selected
			// Don't change the radio — click Save immediately
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateUser).toHaveBeenCalledTimes(1);
			});
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('calls updateSettings with DesktopUiScheme when theme changes', async () => {
			renderAccountSettings(ThemeMode.Dark); // starts as 'dark'
			fireEvent.click(screen.getByRole('radio', { name: 'Light' })); // change to 'light'
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					DesktopUiScheme: { ThemeMode: 'light' },
				});
			});
		});

		it('saves system mode correctly', async () => {
			renderAccountSettings(ThemeMode.Dark);
			fireEvent.click(screen.getByRole('radio', { name: 'Use device setting' }));
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					DesktopUiScheme: { ThemeMode: 'system' },
				});
			});
		});

		it('shows a success toast after a successful save', async () => {
			renderAccountSettings();
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledTimes(1);
			});
		});

		it('shows an error toast when updateUser fails', async () => {
			(userService.updateUser as Mock).mockRejectedValue(new Error('Network error'));
			renderAccountSettings();
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledTimes(1);
			});
			// updateSettings must NOT have been called
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('does not call updateSettings when updateUser fails', async () => {
			(userService.updateUser as Mock).mockRejectedValue(new Error('Server error'));
			renderAccountSettings(ThemeMode.Dark);
			fireEvent.click(screen.getByRole('radio', { name: 'Light' })); // change theme
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalled();
			});
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});
	});
});
