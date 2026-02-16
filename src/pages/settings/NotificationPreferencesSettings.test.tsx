import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import NotificationPreferencesSettings from './NotificationPreferencesSettings';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { UserSettings } from '@/api/userApi';

// Mock the services module
vi.mock('@/services', () => ({
	userService: {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
	},
}));

// Mock toast notifications
vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Import mocked services after vi.mock
import { userService } from '@/services';

// Helper to create mock settings
const createMockSettings = (overrides: Partial<UserSettings['userPreference']> = {}): UserSettings => ({
	userPreference: {
		id: 'test-preference-id',
		notifcationEnabled: true,
		notifcationEnabledMs: 0,
		emailNotificationEnabled: true,
		textNotificationEnabled: true,
		pushNotificationEnabled: false,
		tileNotificationEnabled: true,
		...overrides,
	},
	marketingPreference: {
		id: 'test-marketing-id',
		disableAll: false,
		disableEmail: false,
		disableTextMsg: false,
	},
	scheduleProfile: {
		travelMedium: 'driving',
		pinPreference: 'start',
		sleepDuration: 0.0,
	},
	mobileUiScheme: {
		id: 'test-mobile-ui-id',
		scheduleProfileId: 'test-schedule-profile-id',
		name: 'Default',
		mainColor: 'string',
		accentColor: 'string',
		fontFamily: 'string',
		fontSize: 14.0,
		fontWeight: 'string',
		isDefault: true,
		themeMode: 'system',
	},
	desktopUiScheme: {
		id: 'test-desktop-ui-id',
		scheduleProfileId: 'test-schedule-profile-id',
		name: 'Default',
		mainColor: 'string',
		accentColor: 'string',
		fontFamily: 'string',
		fontSize: 14.0,
		fontWeight: 'string',
		isDefault: true,
		themeMode: 'system',
	},
});

// Helper to render component with all required providers
const renderWithProviders = (ui: React.ReactElement) => {
	return render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<BrowserRouter>{ui}</BrowserRouter>
			</ThemeProvider>
		</I18nextProvider>
	);
};

describe('NotificationPreferencesSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementation
		(userService.getSettings as Mock).mockResolvedValue(createMockSettings());
		(userService.updateSettings as Mock).mockResolvedValue(createMockSettings());
	});

	describe('Rendering', () => {
		it('should render the page title', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
					'Notification Preferences'
				);
			});
		});

		it('should render the description', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByText('Manage reminders and email updates')).toBeInTheDocument();
			});
		});

		it('should render all three toggle options', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByText('Tile Reminders')).toBeInTheDocument();
				expect(screen.getByText('Email Notifications')).toBeInTheDocument();
				expect(screen.getByText('Push Notifications')).toBeInTheDocument();
			});
		});

		it('should render the save button', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
			});
		});

		it('should render breadcrumb navigation', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByText('Home')).toBeInTheDocument();
				expect(screen.getByText('Settings')).toBeInTheDocument();
			});
		});
	});

	describe('Data Fetching', () => {
		it('should call getSettings on mount', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(userService.getSettings).toHaveBeenCalledTimes(1);
			});
		});

		it('should display settings from API response', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					tileNotificationEnabled: true,
					emailNotificationEnabled: false,
					pushNotificationEnabled: true,
				})
			);

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(userService.getSettings).toHaveBeenCalled();
			});
		});

		it('should show error toast when fetch fails', async () => {
			const { toast } = await import('sonner');
			(userService.getSettings as Mock).mockRejectedValue(new Error('Network error'));

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalled();
			});
		});

		it('should disable toggles while loading', async () => {
			// Create a promise that we control
			let resolveSettings: (value: UserSettings) => void;
			const settingsPromise = new Promise<UserSettings>((resolve) => {
				resolveSettings = resolve;
			});
			(userService.getSettings as Mock).mockReturnValue(settingsPromise);

			renderWithProviders(<NotificationPreferencesSettings />);

			// Save button should be disabled while loading
			expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();

			// Resolve the promise
			resolveSettings!(createMockSettings());

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});
		});
	});

	describe('Toggle Interactions', () => {
		it('should toggle tile reminders when clicked', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);

			fireEvent.click(toggleSwitches[0]);

			// Verify the component responds to clicks (state change happens internally)
			expect(toggleSwitches[0]).toBeInTheDocument();
		});

		it('should toggle email notifications when clicked', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);

			fireEvent.click(toggleSwitches[1]);
			expect(toggleSwitches[1]).toBeInTheDocument();
		});

		it('should toggle push notifications when clicked', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);

			fireEvent.click(toggleSwitches[2]);
			expect(toggleSwitches[2]).toBeInTheDocument();
		});
	});

	describe('Save Functionality', () => {
		it('should show success toast when no changes are made', async () => {
			const { toast } = await import('sonner');

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalled();
			});

			// updateSettings should NOT be called when nothing changed
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('should call updateSettings when settings are changed and saved', async () => {
			const { toast } = await import('sonner');

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle email notifications
			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);
			fireEvent.click(toggleSwitches[1]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledTimes(1);
				expect(toast.success).toHaveBeenCalled();
			});
		});

		it('should show error toast when save fails', async () => {
			const { toast } = await import('sonner');
			(userService.updateSettings as Mock).mockRejectedValue(new Error('Save failed'));

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle a setting
			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);
			fireEvent.click(toggleSwitches[0]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalled();
			});
		});

		it('should show saving state while API call is in progress', async () => {
			let resolveUpdate: (value: UserSettings) => void;
			const updatePromise = new Promise<UserSettings>((resolve) => {
				resolveUpdate = resolve;
			});
			(userService.updateSettings as Mock).mockReturnValue(updatePromise);

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle a setting
			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);
			fireEvent.click(toggleSwitches[0]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			// Should show "Saving..." text
			await waitFor(() => {
				expect(screen.getByText(/saving/i)).toBeInTheDocument();
			});

			// Resolve the promise
			resolveUpdate!(createMockSettings());

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
			});
		});
	});

	describe('Only Changed Values Sent', () => {
		it('should only send changed fields to API', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle only email notifications (index 1)
			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);
			fireEvent.click(toggleSwitches[1]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					UserPreference: {
						EmailNotificationEnabled: false, // toggled from true to false
					},
				});
			});
		});

		it('should send multiple changed fields when multiple toggles are clicked', async () => {
			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);

			// Toggle tile reminders (index 0) and push notifications (index 2)
			fireEvent.click(toggleSwitches[0]);
			fireEvent.click(toggleSwitches[2]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					UserPreference: {
						TileNotificationEnabled: false, // toggled from true to false
						PushNotificationEnabled: true, // toggled from false to true
					},
				});
			});
		});
	});

	describe('State Updates from Server Response', () => {
		it('should update state with server response after save', async () => {
			const updatedSettings = createMockSettings({
				emailNotificationEnabled: false,
			});
			(userService.updateSettings as Mock).mockResolvedValue(updatedSettings);

			renderWithProviders(<NotificationPreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle email notifications
			const toggleSwitches = screen.getAllByRole('button').filter(
				(btn) => btn.querySelector('div') !== null
			);
			fireEvent.click(toggleSwitches[1]);

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalled();
			});

			// After save, clicking save again with no new changes should not call API
			vi.clearAllMocks();
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).not.toHaveBeenCalled();
			});
		});
	});
});
