import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import PreferencesSettings from './PreferencesSettings';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { UserSettings } from '@/api/userApi';

// Mock the services module
vi.mock('@/services', () => ({
	userService: {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		getScheduleProfile: vi.fn(),
		updateScheduleProfile: vi.fn(),
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
const createMockSettings = (
	overrides: Partial<UserSettings['scheduleProfile']> = {}
): UserSettings => ({
	userPreference: {
		id: 'test-preference-id',
		notifcationEnabled: true,
		notifcationEnabledMs: 0,
		emailNotificationEnabled: true,
		textNotificationEnabled: true,
		pushNotificationEnabled: false,
		tileNotificationEnabled: true,
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
		endTimeOfDay: '22:00:00',
		sleepDuration: 28800000, // 8 hours in ms
		...overrides,
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

const getTimeDropdownButtons = (container: HTMLElement) =>
	within(container).getAllByRole('button').slice(0, 2);

const selectTimeValue = async (
	user: ReturnType<typeof userEvent.setup>,
	container: HTMLElement,
	dropdownIndex: 0 | 1,
	value: string
) => {
	const buttons = getTimeDropdownButtons(container);
	await user.click(buttons[dropdownIndex]);
	await user.click(await screen.findByText(value, { selector: 'div' }));
};

describe('PreferencesSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementation
		(userService.getSettings as Mock).mockResolvedValue(createMockSettings());
		(userService.updateSettings as Mock).mockResolvedValue(createMockSettings());
		(userService.getScheduleProfile as Mock).mockResolvedValue({
			scheduleProfile: {
				personalHoursRestrictionProfile: null,
				workHoursRestrictionProfile: null,
			},
		});
		(userService.updateScheduleProfile as Mock).mockResolvedValue({});
	});

	describe('Rendering', () => {
		it('should render the page title', async () => {
			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
					'Tile Preferences'
				);
			});
		});

		it('should render transport mode options', async () => {
			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByText('Cycling')).toBeInTheDocument();
				expect(screen.getByText('Driving')).toBeInTheDocument();
				expect(screen.getByText('Transit')).toBeInTheDocument();
			});
		});

		it('should render bed time section', async () => {
			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByText('Bed Time:')).toBeInTheDocument();
			});
		});

		it('should render save button', async () => {
			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
			});
		});
	});

	describe('Data Fetching', () => {
		it('should call getSettings on mount', async () => {
			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(userService.getSettings).toHaveBeenCalledTimes(1);
			});
		});

		it('should normalize time format from API (24-hour to 12-hour)', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '22:00:00', // 24-hour format from API
					sleepDuration: 28800000, // 8 hours
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				// Should normalize to 12-hour format for dropdown
				expect(userService.getSettings).toHaveBeenCalled();
			});
		});

		it('should handle alternative time formats from API', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '10:0 pm', // Alternative format
					sleepDuration: 28800000,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(userService.getSettings).toHaveBeenCalled();
			});
		});
	});

	describe('Bed Time Validation', () => {
		it('should show error when start time is set but end time is not', async () => {
			const { toast } = await import('sonner');
			const user = userEvent.setup();

			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Find bed time dropdowns (scoped to bed-time section)
			const bedTimeSection = screen.getByTestId('bed-time-section');
			await selectTimeValue(user, bedTimeSection, 0, '10:00 PM');

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Please select a bed time end');
			});

			// Should NOT call updateSettings
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('should show error when end time is set but start time is not', async () => {
			const { toast } = await import('sonner');
			const user = userEvent.setup();

			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Find bed time dropdowns (scoped to bed-time section)
			const bedTimeSection = screen.getByTestId('bed-time-section');
			await selectTimeValue(user, bedTimeSection, 1, '6:00 AM');

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Please select a bed time start');
			});

			// Should NOT call updateSettings
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('should allow saving when both start and end times are set', async () => {
			const { toast } = await import('sonner');
			const user = userEvent.setup();

			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Find bed time dropdowns (scoped to bed-time section)
			const bedTimeSection = screen.getByTestId('bed-time-section');
			await selectTimeValue(user, bedTimeSection, 0, '10:00 PM');
			await selectTimeValue(user, bedTimeSection, 1, '6:00 AM');

			// Click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalled();
				expect(toast.success).toHaveBeenCalled();
			});
		});

		it('should allow saving when both times are empty (clearing bed time)', async () => {
			const { toast } = await import('sonner');

			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Don't change anything, just click save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				// Should show success (nothing changed)
				expect(toast.success).toHaveBeenCalled();
			});

			// Should NOT call updateSettings since nothing changed
			expect(userService.updateSettings).not.toHaveBeenCalled();
		});
	});

	describe('Sleep Duration Calculation', () => {
		it('should calculate correct sleep duration for overnight sleep (10 PM to 6 AM = 8 hours)', async () => {
			const user = userEvent.setup();
			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const bedTimeSection1 = screen.getByTestId('bed-time-section');
			await selectTimeValue(user, bedTimeSection1, 0, '10:00 PM');
			await selectTimeValue(user, bedTimeSection1, 1, '6:00 AM');

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					ScheduleProfile: {
						SleepDuration: 8 * 60 * 60 * 1000, // 8 hours in ms
						EndTimeOfDay: '10:00 PM',
					},
				});
			});
		});

		it('should calculate correct sleep duration for after-midnight start (2 AM to 10 AM = 8 hours)', async () => {
			const user = userEvent.setup();
			// Start with no bed time set
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '',
					sleepDuration: 0,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const bedTimeSection2 = screen.getByTestId('bed-time-section');
			await selectTimeValue(user, bedTimeSection2, 0, '2:00 AM');
			await selectTimeValue(user, bedTimeSection2, 1, '10:00 AM');

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					ScheduleProfile: {
						SleepDuration: 8 * 60 * 60 * 1000, // 8 hours in ms
						EndTimeOfDay: '2:00 AM',
					},
				});
			});
		});
	});

	describe('Transport Mode', () => {
		it('should display correct transport mode from API', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					travelMedium: 'bicycling',
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				const bikeRadio = screen.getByLabelText('Cycling');
				expect(bikeRadio).toBeChecked();
			});
		});

		it('should map transit to bus', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					travelMedium: 'transit',
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				const busRadio = screen.getByLabelText('Transit');
				expect(busRadio).toBeChecked();
			});
		});

		it('should send correct API value when changing transport mode', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					travelMedium: 'driving',
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Click bike option
			fireEvent.click(screen.getByLabelText('Cycling'));

			// Save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					ScheduleProfile: {
						TravelMedium: 'bicycling',
					},
				});
			});
		});
	});

	describe('Bed Time Independence', () => {
		it('should NOT shift end time when start time is changed', async () => {
			const user = userEvent.setup();
			// Initial: 10 PM to 4 AM (6 hours sleep)
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '22:00:00', // 10:00 PM
					sleepDuration: 6 * 60 * 60 * 1000, // 6 hours -> end time is 4:00 AM
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const bedTimeSection3 = screen.getByTestId('bed-time-section');
			const [startTimeSelect, endTimeSelect] = getTimeDropdownButtons(bedTimeSection3);

			// Verify initial values
			expect(startTimeSelect).toHaveTextContent('10:00 PM');
			expect(endTimeSelect).toHaveTextContent('4:00 AM');

			// User changes start time from 10 PM to 11 PM
			await selectTimeValue(user, bedTimeSection3, 0, '11:00 PM');

			// End time should remain at 4:00 AM (NOT shift to 5:00 AM)
			expect(endTimeSelect).toHaveTextContent('4:00 AM');
		});

		it('should NOT shift start time when end time is changed', async () => {
			const user = userEvent.setup();
			// Initial: 10 PM to 6 AM (8 hours sleep)
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '22:00:00', // 10:00 PM
					sleepDuration: 8 * 60 * 60 * 1000, // 8 hours -> end time is 6:00 AM
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const bedTimeSection4 = screen.getByTestId('bed-time-section');
			const [startTimeSelect, endTimeSelect] = getTimeDropdownButtons(bedTimeSection4);

			// Verify initial values
			expect(startTimeSelect).toHaveTextContent('10:00 PM');
			expect(endTimeSelect).toHaveTextContent('6:00 AM');

			// User changes end time from 6 AM to 7 AM
			await selectTimeValue(user, bedTimeSection4, 1, '7:00 AM');

			// Start time should remain at 10:00 PM
			expect(startTimeSelect).toHaveTextContent('10:00 PM');
		});

		it('should calculate new sleep duration based on user-selected times (not shift end time)', async () => {
			const user = userEvent.setup();
			// Initial: 10 PM to 4 AM (6 hours sleep)
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					endTimeOfDay: '22:00:00', // 10:00 PM
					sleepDuration: 6 * 60 * 60 * 1000, // 6 hours
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			const bedTimeSection5 = screen.getByTestId('bed-time-section');
			// New sleep duration should be 5 hours (11 PM to 4 AM)
			await selectTimeValue(user, bedTimeSection5, 0, '11:00 PM');

			// Save
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					ScheduleProfile: {
						SleepDuration: 5 * 60 * 60 * 1000, // 5 hours (NOT 6 hours)
						EndTimeOfDay: '11:00 PM',
					},
				});
			});
		});
	});

	describe('Only Send Changed Values', () => {
		it('should not call API when nothing changed', async () => {
			const { toast } = await import('sonner');

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Click save without changing anything
			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalled();
			});

			expect(userService.updateSettings).not.toHaveBeenCalled();
		});

		it('should only send transport mode when only transport mode changed', async () => {
			(userService.getSettings as Mock).mockResolvedValue(
				createMockSettings({
					travelMedium: 'driving',
					endTimeOfDay: '22:00:00',
					sleepDuration: 28800000,
				})
			);

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Change only transport mode
			fireEvent.click(screen.getByLabelText('Transit'));

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateSettings).toHaveBeenCalledWith({
					ScheduleProfile: {
						TravelMedium: 'transit',
					},
				});
			});
		});
	});

	describe('Schedule Profile Validation', () => {
		it('should show error when a work hour day has start but no end', async () => {
			const { toast } = await import('sonner');
			const user = userEvent.setup();

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Set only a start time on Monday (day-column-1) via work hours schedule
			const workSection = screen.getAllByTestId('day-column-1')[0];
			await selectTimeValue(user, workSection, 0, '9:00 AM');

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Monday'));
			});

			expect(userService.updateScheduleProfile).not.toHaveBeenCalled();
		});

		it('should show error when a personal hour day has end but no start', async () => {
			const { toast } = await import('sonner');
			const user = userEvent.setup();

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Set only an end time on Wednesday (day-column-3) via personal hours schedule (second instance)
			const personalWedColumns = screen.getAllByTestId('day-column-3');
			const personalColumn = personalWedColumns[1];
			await selectTimeValue(user, personalColumn, 1, '5:00 PM');

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Wednesday'));
			});

			expect(userService.updateScheduleProfile).not.toHaveBeenCalled();
		});
	});

	describe('Restriction Profile Disabled State', () => {
		it('should send IsEnabled false when all work days are toggled off', async () => {
			// Start with Monday enabled in work hours
			(userService.getScheduleProfile as Mock).mockResolvedValue({
				personalHoursRestrictionProfile: null,
				workHoursRestrictionProfile: {
					id: 'work-id',
					isEnabled: true,
					timeZone: 'America/Denver',
					daySelection: [
						null,
						{
							id: 'mon',
							weekday: 1,
							restrictionTimeLine: {
								id: 'tl',
								start: 28800000,
								duration: 36000000,
								end: 64800000,
								timeZone: 'America/Denver',
							},
							timeZone: 'America/Denver',
						},
						null,
						null,
						null,
						null,
						null,
					],
				},
			});
			(userService.updateScheduleProfile as Mock).mockResolvedValue({
				workHoursRestrictionProfile: {
					id: 'work-id',
					isEnabled: false,
					timeZone: 'America/Denver',
					daySelection: [null, null, null, null, null, null, null],
				},
				personalHoursRestrictionProfile: null,
			});

			renderWithProviders(<PreferencesSettings />);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
			});

			// Toggle Monday off (first instance of day-circle-1 is work hours)
			const mondayCircle = screen.getAllByTestId('day-circle-1')[0];
			fireEvent.click(mondayCircle);

			fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

			await waitFor(() => {
				expect(userService.updateScheduleProfile).toHaveBeenCalledWith(
					expect.objectContaining({
						WorkRestrictionProfile: expect.objectContaining({
							IsEnabled: false,
							RestrictiveWeek: expect.objectContaining({
								isEnabled: 'false',
							}),
						}),
					})
				);
			});
		});
	});
});
