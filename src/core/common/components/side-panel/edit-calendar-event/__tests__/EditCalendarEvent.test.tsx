import { describe, it, expect, vi, beforeEach } from 'vitest';
import dayjs from 'dayjs';
import { act, render, screen, setupUser, waitFor, within } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import EditCalendarEvent, { isRepetitionConfigValid } from '../EditCalendarEvent';
import { CalendarEvent, ThirdPartyType } from '@/core/common/types/schedule';

// ── isRepetitionConfigValid unit tests ──────────────────────────────────────
describe('isRepetitionConfigValid', () => {
	const d = dayjs();

	it('returns true when frequency is empty (disabled)', () => {
		expect(
			isRepetitionConfigValid({
				frequency: '',
				isForever: false,
				repStartDate: null,
				repEndDate: null,
			})
		).toBe(true);
	});

	it('returns false when frequency set, not forever, missing start date', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'weekly',
				isForever: false,
				repStartDate: null,
				repEndDate: d,
			})
		).toBe(false);
	});

	it('returns false when frequency set, not forever, missing end date', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'weekly',
				isForever: false,
				repStartDate: d,
				repEndDate: null,
			})
		).toBe(false);
	});

	it('returns true when frequency set and isForever (no dates needed)', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'daily',
				isForever: true,
				repStartDate: null,
				repEndDate: null,
			})
		).toBe(true);
	});

	it('returns true when frequency set, not forever, and both dates set', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'weekly',
				isForever: false,
				repStartDate: d,
				repEndDate: d,
			})
		).toBe(true);
	});
});

// ── Mocks ──

const mockUpdateCalendarEvent = vi.fn();
const mockLookupCalendarEventById = vi.fn();
const mockLookupLocationById = vi.fn();
const mockSearchLocations = vi.fn();
const mockGetScheduleProfile = vi.fn();
const mockOpenNotes = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		updateCalendarEvent: (...args: unknown[]) => mockUpdateCalendarEvent(...args),
		lookupCalendarEventById: (...args: unknown[]) => mockLookupCalendarEventById(...args),
		lookupLocationById: (...args: unknown[]) => mockLookupLocationById(...args),
		searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
	},
	userService: {
		getScheduleProfile: (...args: unknown[]) => mockGetScheduleProfile(...args),
	},
}));

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
		Update: 'update',
	},
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
	useCalendarUI: vi.fn((selector: (s: unknown) => unknown) =>
		selector({ editNotes: { actions: { open: mockOpenNotes } } })
	),
}));

// ── Test Data ──

const mockEvent: CalendarEvent = {
	id: 'evt-1',
	start: 1769925600000,
	end: 1770532200000,
	name: 'work out',
	address: '123 Main St',
	addressDescription: 'Near the park',
	searchdDescription: '',
	splitCount: 4,
	completeCount: 0,
	deletionCount: 0,
	thirdpartyType: ThirdPartyType.Tiler,
	thirdPartyId: null,
	thirdPartyUserId: null,
	colorOpacity: 1,
	colorRed: 52,
	colorGreen: 152,
	colorBlue: 219,
	isComplete: false,
	isEnabled: true,
	isRecurring: true,
	locationId: 'loc-1',
	isReadOnly: false,
	isProcrastinateEvent: false,
	isRigid: false,
	uiConfig: { id: 'ui-1' } as CalendarEvent['uiConfig'],
	repetition: {
		id: 'rep-1',
		isEnabled: true,
		frequency: 'weekly',
		weekDays: 'Monday,Wednesday,Friday',
		isForever: false,
		tileTimeline: {
			start: 1769925600000,
			end: 1770532200000,
			duration: 606600000,
			occupiedSlots: null,
		},
		repetitionTimeline: {
			start: 1769925600000,
			end: 1779999960000,
			duration: 10074400000,
			occupiedSlots: null,
		},
	},
	eachTileDuration: 5400000,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: false,
	entityName: 'CalendarEvent',
	blob: { type: 0, note: '', id: 'blob-1' },
	subEvents: null,
};

const mockOnClose = vi.fn();

function renderComponent(
	event: CalendarEvent = mockEvent,
	workProfileId: string | null = null,
	personalProfileId: string | null = null,
	isLocationVerified = false
) {
	return render(
		<ThemeProvider theme={lightTheme}>
			<EditCalendarEvent
				event={event}
				workProfileId={workProfileId}
				personalProfileId={personalProfileId}
				isLocationVerified={isLocationVerified}
				onClose={mockOnClose}
			/>
		</ThemeProvider>
	);
}

// ── Tests ──

/** Wait for the fetch to finish and form to appear. */
async function waitForLoaded() {
	await waitFor(() => {
		expect(screen.queryByText('calendarEvent.edit.loading')).not.toBeInTheDocument();
	});
}

describe('EditCalendarEvent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders header with back button and title', () => {
		renderComponent();
		expect(screen.getByText('calendarEvent.edit.titleTile')).toBeInTheDocument();
		expect(screen.getByLabelText('calendarEvent.edit.back')).toBeInTheDocument();
	});

	it('calls onClose when back button is clicked', async () => {
		const user = setupUser();
		renderComponent();
		await user.click(screen.getByLabelText('calendarEvent.edit.back'));
		expect(mockOnClose).toHaveBeenCalledOnce();
	});

	describe('notes button', () => {
		it('renders the open notes button', () => {
			renderComponent();
			expect(screen.getByLabelText('calendarEvent.edit.openNotes')).toBeInTheDocument();
		});

		it('calls openNotes with the event when clicked', () => {
			renderComponent();
			screen.getByLabelText('calendarEvent.edit.openNotes').click();
			expect(mockOpenNotes).toHaveBeenCalledOnce();
			expect(mockOpenNotes).toHaveBeenCalledWith(mockEvent);
		});

		it('passes a different event object through to openNotes', () => {
			const other = { ...mockEvent, id: 'evt-2', name: 'yoga' };
			renderComponent(other as CalendarEvent);
			screen.getByLabelText('calendarEvent.edit.openNotes').click();
			expect(mockOpenNotes).toHaveBeenCalledWith(other);
		});
	});

	it('renders name field with event name after loading', async () => {
		renderComponent();
		await waitForLoaded();
		const nameInput = screen.getByDisplayValue('work out');
		expect(nameInput).toBeInTheDocument();
	});

	it('renders all collapsible section headers after loading', async () => {
		renderComponent();
		await waitForLoaded();
		// mockEvent is recurring, so the time section is labelled "Occurrence"
		expect(screen.getByText('calendarEvent.edit.occurrenceSection')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.repetitionSection')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.locationSection')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.colorSection')).toBeInTheDocument();
	});

	it('sections start collapsed — time fields not visible', async () => {
		renderComponent();
		await waitForLoaded();
		expect(screen.queryByText('calendarEvent.edit.start')).not.toBeInTheDocument();
		expect(screen.queryByText('calendarEvent.edit.end')).not.toBeInTheDocument();
		expect(screen.queryByText('calendarEvent.edit.duration')).not.toBeInTheDocument();
	});

	it('expands occurrence section on click (recurring event shows duration + split only)', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.occurrenceSection'));
		// Start and End are hidden for recurring events
		expect(screen.queryByText('calendarEvent.edit.start')).not.toBeInTheDocument();
		expect(screen.queryByText('calendarEvent.edit.end')).not.toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.duration')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.split')).toBeInTheDocument();
	});

	it('expands location section and shows address + description', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.locationSection'));
		const addressInput = screen.getByDisplayValue('123 Main St');
		const descInput = screen.getByDisplayValue('Near the park');
		expect(addressInput).toBeInTheDocument();
		expect(descInput).toBeInTheDocument();
	});

	it('shows location preview when collapsed', async () => {
		renderComponent();
		await waitForLoaded();
		expect(screen.getByText('123 Main St · Near the park')).toBeInTheDocument();
	});

	it('shows repetition frequency preview when collapsed', async () => {
		renderComponent();
		await waitForLoaded();
		expect(screen.getByText('calendarEvent.edit.weekly')).toBeInTheDocument();
	});

	it('expands color section and shows swatches', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.colorSection'));
		const swatches = screen.getAllByLabelText(/^Color \d+$/);
		expect(swatches).toHaveLength(12);
	});

	it('allows selecting a different color swatch', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.colorSection'));
		const swatch5 = screen.getByLabelText('Color 5');
		await user.click(swatch5);
		expect(swatch5).toBeInTheDocument();
	});

	it('expands repetition section and shows frequency dropdown with Disabled option', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		// Expand the body to see the frequency select
		await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
		const frequencySelect = screen.getByRole('combobox') as HTMLSelectElement;
		expect(frequencySelect).toBeDefined();
		expect(frequencySelect.value).toBe('weekly');
		// Disabled is the first option
		expect(frequencySelect.options[0].value).toBe('');
	});

	it('disables save button when name is empty', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		const nameInput = screen.getByDisplayValue('work out');
		await user.clear(nameInput);
		const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
		expect(saveBtn).toBeDisabled();
	});

	it('enables save button when name has content', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');
		const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
		expect(saveBtn).not.toBeDisabled();
	});

	it('calls scheduleService.updateCalendarEvent on save', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
		});

		const params = mockUpdateCalendarEvent.mock.calls[0][0];
		expect(params.EventID).toBe('evt-1');
		expect(params.EventName).toBe('work out!');
		expect(params.MobileApp).toBe(true);
		expect(params.Version).toBe('v2');
		expect(params.ColorConfig).toEqual({
			IsEnabled: true,
			Red: '52',
			Green: '152',
			Blue: '219',
			Opacity: '1',
		});
	});

	it('shows notification on save and success', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockShowNotification).toHaveBeenCalledWith(
				'update-evt-1',
				'calendarEvent.edit.saving',
				'loading'
			);
		});

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'update-evt-1',
				'calendarEvent.edit.saveSuccess',
				'success'
			);
		});
	});

	it('calls onClose after successful save', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalledOnce();
		});
	});

	it('shows error notification on save failure', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockRejectedValueOnce(new Error('Network error'));
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'update-evt-1',
				'calendarEvent.edit.saveFailed',
				'error'
			);
		});
	});

	it('does not call onClose on save failure', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockRejectedValueOnce(new Error('Network error'));
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalled();
		});
		expect(mockOnClose).not.toHaveBeenCalled();
	});

	it('includes RepetitionConfig when recurring is enabled', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		renderComponent();
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
		});

		const params = mockUpdateCalendarEvent.mock.calls[0][0];
		expect(params.RepetitionConfig).toEqual({
			IsEnabled: true,
			Frequency: 'weekly',
			IsForever: false,
			RepetitionStart: dayjs(mockEvent.repetition!.repetitionTimeline!.start!)
				.startOf('day')
				.valueOf(),
			RepetitionEnd: dayjs(mockEvent.repetition!.repetitionTimeline!.end!)
				.startOf('day')
				.valueOf(),
			DayOfWeekRepetitions: ['Monday', 'Wednesday', 'Friday'],
		});
	});

	it('omits RepetitionConfig when event was never recurring', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		const nonRecurringEvent = {
			...mockEvent,
			repetition: null,
			isRecurring: false,
		};
		mockLookupCalendarEventById.mockResolvedValueOnce(nonRecurringEvent);
		renderComponent(nonRecurringEvent);
		await waitForLoaded();

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
		});

		const params = mockUpdateCalendarEvent.mock.calls[0][0];
		expect(params.RepetitionConfig).toBeUndefined();
	});

	it('sends IsEnabled: false when user disables repetition on a previously recurring event', async () => {
		const user = setupUser();
		mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
		renderComponent(); // mockEvent has repetition.isEnabled: true, frequency: 'weekly'
		await waitForLoaded();

		// Open repetition section to access the frequency dropdown
		await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

		const frequencySelect = screen.getByRole('combobox') as HTMLSelectElement;
		expect(frequencySelect.value).toBe('weekly');

		// Disable repetition by selecting the empty option
		await user.selectOptions(frequencySelect, '');
		expect(frequencySelect.value).toBe('');

		const nameInput = screen.getByDisplayValue('work out');
		await user.type(nameInput, '!');

		await user.click(screen.getByText('calendarEvent.edit.save'));

		await waitFor(() => {
			expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
		});

		const params = mockUpdateCalendarEvent.mock.calls[0][0];
		expect(params.RepetitionConfig).toEqual({ IsEnabled: false });
	});

	describe('repetition fields', () => {
		it('shows forever checkbox when recurring is enabled', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();

			// Open repetition section
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(screen.getByLabelText('calendarEvent.edit.forever')).toBeInTheDocument();
		});

		it('pre-checks forever checkbox from event data', async () => {
			const user = setupUser();
			const foreverEvent = {
				...mockEvent,
				repetition: { ...mockEvent.repetition!, isForever: true },
			};
			renderComponent(foreverEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			const cb = screen.getByLabelText('calendarEvent.edit.forever') as HTMLInputElement;
			expect(cb).toBeChecked();
		});

		it('shows repetition date range when not forever', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(screen.getByLabelText('calendarEvent.edit.repetitionStart')).toBeInTheDocument();
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd')).toBeInTheDocument();
		});

		it('hides repetition date range when forever is checked', async () => {
			const user = setupUser();
			const foreverEvent = {
				...mockEvent,
				repetition: { ...mockEvent.repetition!, isForever: true },
			};
			renderComponent(foreverEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(
				screen.queryByLabelText('calendarEvent.edit.repetitionStart')
			).not.toBeInTheDocument();
			expect(
				screen.queryByLabelText('calendarEvent.edit.repetitionEnd')
			).not.toBeInTheDocument();
		});

		it('shows weekday checkboxes when frequency is weekly', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
			days.forEach((day) => {
				expect(screen.getByLabelText('calendarEvent.edit.' + day)).toBeInTheDocument();
			});
		});

		it('pre-selects weekdays from event data', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			// mockEvent has weekDays: 'Monday,Wednesday,Friday'
			const mon = screen.getByLabelText('calendarEvent.edit.mon');
			const wed = screen.getByLabelText('calendarEvent.edit.wed');
			const fri = screen.getByLabelText('calendarEvent.edit.fri');
			const tue = screen.getByLabelText('calendarEvent.edit.tue');
			expect(mon).toHaveAttribute('aria-checked', 'true');
			expect(wed).toHaveAttribute('aria-checked', 'true');
			expect(fri).toHaveAttribute('aria-checked', 'true');
			expect(tue).toHaveAttribute('aria-checked', 'false');
		});

		it('hides weekday checkboxes for non-weekly frequency', async () => {
			const user = setupUser();
			const dailyEvent = {
				...mockEvent,
				repetition: { ...mockEvent.repetition!, frequency: 'daily' },
			};
			renderComponent(dailyEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(screen.queryByLabelText('calendarEvent.edit.sun')).not.toBeInTheDocument();
		});

		it('populates repetition fields from event prop', async () => {
			const user = setupUser();
			const tueThuEvent = {
				...mockEvent,
				repetition: {
					...mockEvent.repetition!,
					frequency: 'weekly',
					isForever: false,
					weekDays: 'Tuesday,Thursday',
					repetitionTimeline: {
						start: 1770000000000,
						end: 1785000000000,
						duration: 15000000000,
						occupiedSlots: null,
					},
				},
			};
			renderComponent(tueThuEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			// Weekdays should reflect fetched data (Tue=2, Thu=4)
			const tue = screen.getByLabelText('calendarEvent.edit.tue');
			const thu = screen.getByLabelText('calendarEvent.edit.thu');
			const mon = screen.getByLabelText('calendarEvent.edit.mon');
			expect(tue).toHaveAttribute('aria-checked', 'true');
			expect(thu).toHaveAttribute('aria-checked', 'true');
			expect(mon).toHaveAttribute('aria-checked', 'false');
		});
	});
	it('updates name field on user input', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		const nameInput = screen.getByDisplayValue('work out');
		await user.clear(nameInput);
		await user.type(nameInput, 'gym session');
		expect(screen.getByDisplayValue('gym session')).toBeInTheDocument();
	});

	describe('location autocomplete', () => {
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

		it('calls searchLocations when typing in address field', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');

			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(mockSearchLocations).toHaveBeenCalledWith('office');
			});
			vi.useRealTimers();
		});

		it('shows saved locations with bookmark icon', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByLabelText('saved')).toBeInTheDocument();
			});
			expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			vi.useRealTimers();
		});

		it('shows google results with map pin icon and attribution', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([googleLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'walmart');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByLabelText('google')).toBeInTheDocument();
			});
			expect(screen.getByText('calendarEvent.edit.poweredByGoogle')).toBeInTheDocument();
			vi.useRealTimers();
		});

		it('shows both saved and google icons when mixed', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation, googleLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'wal');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByLabelText('saved')).toBeInTheDocument();
				expect(screen.getByLabelText('google')).toBeInTheDocument();
			});
			vi.useRealTimers();
		});

		it('populates address and description when selecting a result', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			});

			await user.click(screen.getByText('100 Office Blvd'));

			expect(addressInput).toHaveValue('100 Office Blvd');
			expect(screen.getByDisplayValue('My Office')).toBeInTheDocument();

			mockSearchLocations.mockClear();
			await vi.advanceTimersByTimeAsync(400);
			expect(mockSearchLocations).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('description field is a single-line input', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const descField = screen.getByDisplayValue('Near the park');
			expect(descField.tagName).toBe('INPUT');
		});

		it('shows a loading spinner while searching', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			let resolveSearch!: (value: (typeof savedLocation)[]) => void;
			mockSearchLocations.mockImplementation(
				() =>
					new Promise((r) => {
						resolveSearch = r;
					})
			);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			expect(screen.getByRole('status')).toBeInTheDocument();

			await act(async () => {
				resolveSearch([savedLocation]);
			});

			expect(screen.queryByRole('status')).not.toBeInTheDocument();
			vi.useRealTimers();
		});

		it('does not search on initial load', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();

			await vi.advanceTimersByTimeAsync(400);

			expect(mockSearchLocations).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('does not search when selecting a location result', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			});

			mockSearchLocations.mockClear();
			await user.click(screen.getByText('100 Office Blvd'));
			await vi.advanceTimersByTimeAsync(400);

			expect(mockSearchLocations).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('does not search when expanding the location section', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();

			mockSearchLocations.mockClear();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));
			await vi.advanceTimersByTimeAsync(400);

			expect(mockSearchLocations).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('does not search when input is empty', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await vi.advanceTimersByTimeAsync(400);

			expect(mockSearchLocations).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('sends LocationId when selecting a saved location', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			});
			await user.click(screen.getByText('100 Office Blvd'));
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBe('saved-1');
			expect(params.CalAddress).toBeUndefined();
			expect(params.CalAddressDescription).toBeUndefined();
			expect(params.IsLocationCleared).toBeUndefined();
			vi.useRealTimers();
		});

		it('does not send LocationId when selecting a Google location', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([googleLocation]);
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'walmart');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(
					screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa')
				).toBeInTheDocument();
			});
			await user.click(
				screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa')
			);
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBeUndefined();
			expect(params.CalAddress).toBe(
				'Walmart Supercenter 745 us-287, lafayette, co 80026, usa'
			);
			expect(params.CalAddressDescription).toBe('Walmart Supercenter');
			vi.useRealTimers();
		});

		it('clears locationId when user manually edits address', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'Custom address');
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBeUndefined();
			expect(params.CalAddress).toBe('Custom address');
		});

		it('sends IsLocationCleared when user clears location', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			await user.click(screen.getByLabelText('calendarEvent.edit.clearLocation'));
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.IsLocationCleared).toBe('true');
			expect(params.LocationId).toBeUndefined();
			expect(params.CalAddress).toBeUndefined();
		});

		it('clears address and description fields when clicking clear button', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			expect(addressInput).toHaveValue('123 Main St');

			await user.click(screen.getByLabelText('calendarEvent.edit.clearLocation'));

			expect(addressInput).toHaveValue('');
			expect(screen.queryByDisplayValue('Near the park')).not.toBeInTheDocument();
		});

		it('copies only the address and keeps the existing nickname', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			});

			await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));

			// Address is copied over; the existing nickname is preserved.
			expect(addressInput).toHaveValue('100 Office Blvd');
			expect(screen.getByDisplayValue('Near the park')).toBeInTheDocument();
			vi.useRealTimers();
		});

		it('omits LocationId and sends address + nickname after copy address only', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([savedLocation]);
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'office');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
			});

			await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBeUndefined();
			expect(params.CalAddress).toBe('100 Office Blvd');
			expect(params.CalAddressDescription).toBe('Near the park');
			vi.useRealTimers();
		});

		it('does not include the nickname when copying address only from a Google result', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			mockSearchLocations.mockResolvedValue([googleLocation]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'walmart');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(
					screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa')
				).toBeInTheDocument();
			});

			await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));

			// Address copied over, but the Google result's description is not applied.
			expect(addressInput).toHaveValue(
				'Walmart Supercenter 745 us-287, lafayette, co 80026, usa'
			);
			expect(screen.getByDisplayValue('Near the park')).toBeInTheDocument();
			expect(screen.queryByDisplayValue('Walmart Supercenter')).not.toBeInTheDocument();
			vi.useRealTimers();
		});

		it('omits LocationId and sends address + nickname when the nickname is edited', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const descInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationDescriptionPlaceholder'
			);
			await user.clear(descInput);
			await user.type(descInput, 'Home base');
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBeUndefined();
			expect(params.CalAddress).toBe('123 Main St');
			expect(params.CalAddressDescription).toBe('Home base');
		});

		it('keeps LocationId and omits address fields when the nickname is unchanged', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent();
			await waitForLoaded();

			const nameInput = screen.getByDisplayValue('work out');
			await user.clear(nameInput);
			await user.type(nameInput, 'morning run');
			await user.click(screen.getByText('calendarEvent.edit.save'));

			await waitFor(() => {
				expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
			});

			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.LocationId).toBe('loc-1');
			expect(params.CalAddress).toBeUndefined();
			expect(params.CalAddressDescription).toBeUndefined();
		});
	});

	describe('location verified badge', () => {
		it('shows verified badge when location is pre-loaded with isVerified=true', async () => {
			const user = setupUser();
			renderComponent(mockEvent, null, null, true);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));
			expect(screen.getByTestId('location-verified-badge')).toBeInTheDocument();
		});

		it('does not show verified badge when location is not verified', async () => {
			// default mock has no isVerified field (treated as false)
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));
			expect(screen.queryByTestId('location-verified-badge')).not.toBeInTheDocument();
		});

		it('shows verified badge after selecting a verified location from dropdown', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			const googleResult = {
				id: 'g1',
				address: '456 Google Pl',
				description: 'Some Place',
				source: 'google',
				isVerified: true,
				isDefault: false,
				isNull: false,
				thirdPartyId: null,
				userId: null,
				longitude: 0,
				latitude: 0,
				nickname: '',
			};
			mockSearchLocations.mockResolvedValue([googleResult]);
			const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const addressInput = screen.getByPlaceholderText(
				'calendarEvent.edit.locationSearchPlaceholder'
			);
			await user.clear(addressInput);
			await user.type(addressInput, 'google');
			await vi.advanceTimersByTimeAsync(400);

			await waitFor(() => {
				expect(screen.getByText('456 Google Pl')).toBeInTheDocument();
			});
			await user.click(screen.getByText('456 Google Pl'));

			expect(screen.getByTestId('location-verified-badge')).toBeInTheDocument();
			vi.useRealTimers();
		});

		it('removes verified badge when user manually edits address', async () => {
			const user = setupUser();
			renderComponent(mockEvent, null, null, true);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			expect(screen.getByTestId('location-verified-badge')).toBeInTheDocument();

			const addressInput = screen.getByDisplayValue('123 Main St');
			await user.type(addressInput, ' extra');

			expect(screen.queryByTestId('location-verified-badge')).not.toBeInTheDocument();
		});

		it('removes verified badge when location is cleared', async () => {
			const user = setupUser();
			renderComponent(mockEvent, null, null, true);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			expect(screen.getByTestId('location-verified-badge')).toBeInTheDocument();

			await user.click(screen.getByLabelText('calendarEvent.edit.clearLocation'));

			expect(screen.queryByTestId('location-verified-badge')).not.toBeInTheDocument();
		});

		it('verified badge has tooltip title attribute', async () => {
			const user = setupUser();
			renderComponent(mockEvent, null, null, true);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.locationSection'));

			const badge = screen.getByTestId('location-verified-badge');
			expect(badge).toHaveAttribute('title', 'location.verified.tooltip');
		});
	});

	describe('restriction profile section', () => {
		const workProfileId = 'work-profile-id';
		const personalProfileId = 'personal-profile-id';
		// Monday 09:00–17:00, Friday 10:00–18:00
		const mockEventWithCustomRestriction: CalendarEvent = {
			...mockEvent,
			restrictionProfile: {
				id: 'custom-rp-1',
				isEnabled: true,
				timeZone: 'UTC',
				daySelection: [
					null, // Sun
					{
						id: 'ds-1',
						weekday: 1,
						restrictionTimeLine: {
							id: 'rt-1',
							start: 32400000, // 09:00 UTC
							end: 61200000, // 17:00 UTC
							duration: 28800000,
							timeZone: 'UTC',
						},
						timeZone: 'UTC',
					},
					null, // Tue
					null, // Wed
					null, // Thu
					{
						id: 'ds-5',
						weekday: 5,
						restrictionTimeLine: {
							id: 'rt-5',
							start: 36000000, // 10:00 UTC
							end: 64800000, // 18:00 UTC
							duration: 28800000,
							timeZone: 'UTC',
						},
						timeZone: 'UTC',
					},
					null, // Sat
				],
			},
		};

		const mockEventWithWorkRestriction: CalendarEvent = {
			...mockEvent,
			restrictionProfile: {
				id: workProfileId,
				isEnabled: true,
				timeZone: null,
				daySelection: null,
			},
		};

		const mockEventWithPersonalRestriction: CalendarEvent = {
			...mockEvent,
			restrictionProfile: {
				id: personalProfileId,
				isEnabled: true,
				timeZone: null,
				daySelection: null,
			},
		};

		const openRestrictionSection = async (user: ReturnType<typeof setupUser>) => {
			await user.click(screen.getByText('calendarEvent.edit.restrictionSection'));
		};

		it('renders restriction section header after loading', async () => {
			renderComponent();
			await waitForLoaded();
			expect(screen.getByText('calendarEvent.edit.restrictionSection')).toBeInTheDocument();
		});

		it('restriction section starts collapsed', async () => {
			renderComponent();
			await waitForLoaded();
			expect(
				screen.queryByLabelText('calendarEvent.edit.restrictionEnabled')
			).not.toBeInTheDocument();
		});

		it('expands restriction section on click', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			expect(
				screen.getByLabelText('calendarEvent.edit.restrictionEnabled')
			).toBeInTheDocument();
		});

		it('enable toggle is off by default when event has no restriction profile', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			const toggle = screen.getByLabelText(
				'calendarEvent.edit.restrictionEnabled'
			) as HTMLInputElement;
			expect(toggle.checked).toBe(false);
		});

		it('enable toggle is on when event has an active restriction profile', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			const toggle = screen.getByLabelText(
				'calendarEvent.edit.restrictionEnabled'
			) as HTMLInputElement;
			expect(toggle.checked).toBe(true);
		});

		it('shows restriction type radios when toggle is enabled', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			expect(
				screen.getByLabelText('calendarEvent.edit.restrictionTypeWork')
			).toBeInTheDocument();
			expect(
				screen.getByLabelText('calendarEvent.edit.restrictionTypePersonal')
			).toBeInTheDocument();
			expect(
				screen.getByLabelText('calendarEvent.edit.restrictionTypeCustom')
			).toBeInTheDocument();
		});

		it('hides restriction type radios when toggle is off', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			expect(
				screen.queryByLabelText('calendarEvent.edit.restrictionTypeWork')
			).not.toBeInTheDocument();
		});

		it('shows custom day schedule when toggle is enabled (Custom is default)', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			// Custom is the default type — day schedule shows immediately
			expect(screen.getByTestId('restriction-day-schedule')).toBeInTheDocument();
		});

		it('hides day schedule when Work type is selected', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionTypeWork'));
			expect(screen.queryByTestId('restriction-day-schedule')).not.toBeInTheDocument();
		});

		it('shows settings info link when Work hours is selected', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionTypeWork'));
			expect(
				screen.getByText('calendarEvent.edit.restrictionGoToPreferences')
			).toBeInTheDocument();
		});

		it('shows settings info link when Personal hours is selected', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionTypePersonal'));
			expect(
				screen.getByText('calendarEvent.edit.restrictionGoToPreferences')
			).toBeInTheDocument();
		});

		it('deselecting a Custom day clears its times', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Monday (index 1) is selected — click its toggle to deselect
			const monToggle = screen.getByTestId('restriction-day-toggle-1');
			expect(monToggle).toHaveAttribute('data-selected', 'true');
			await user.click(monToggle);
			expect(monToggle).toHaveAttribute('data-selected', 'false');
		});

		it('selecting a deselected Custom day sets default times', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Sunday (index 0) is deselected
			const sunToggle = screen.getByTestId('restriction-day-toggle-0');
			expect(sunToggle).toHaveAttribute('data-selected', 'false');
			await user.click(sunToggle);
			expect(sunToggle).toHaveAttribute('data-selected', 'true');
		});

		it('save sends isRestricted false when toggle is off', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			// Make form dirty by changing name
			const nameInput = screen.getByDisplayValue('work out');
			await user.type(nameInput, '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.isRestricted).toBe('false');
			expect(params.RestrictiveWeek).toEqual({ isEnabled: 'false' });
		});

		it('save sends RestrictionProfileId when Work hours is selected', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent(mockEvent, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionTypeWork'));
			const nameInput = screen.getByDisplayValue('work out');
			await user.type(nameInput, '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.isRestricted).toBe('true');
			expect(params.RestrictionProfileId).toBe(workProfileId);
		});

		it('save sends RestrictionProfileId when Personal hours is selected', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent(mockEvent, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionEnabled'));
			await user.click(screen.getByLabelText('calendarEvent.edit.restrictionTypePersonal'));
			const nameInput = screen.getByDisplayValue('work out');
			await user.type(nameInput, '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.isRestricted).toBe('true');
			expect(params.RestrictionProfileId).toBe(personalProfileId);
		});

		it('save sends RestrictiveWeek when Custom type has selected days', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEventWithCustomRestriction);
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			const nameInput = screen.getByDisplayValue('work out');
			await user.type(nameInput, '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.isRestricted).toBe('true');
			expect(params.RestrictiveWeek).toBeDefined();
			expect(params.RestrictiveWeek.WeekDayOption).toHaveLength(2); // Mon + Fri
		});

		it('populates Work type when event restriction matches work profile id', async () => {
			const user = setupUser();
			renderComponent(mockEventWithWorkRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			const workRadio = screen.getByLabelText(
				'calendarEvent.edit.restrictionTypeWork'
			) as HTMLInputElement;
			expect(workRadio.checked).toBe(true);
		});

		it('populates Personal type when event restriction matches personal profile id', async () => {
			const user = setupUser();
			renderComponent(mockEventWithPersonalRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			const personalRadio = screen.getByLabelText(
				'calendarEvent.edit.restrictionTypePersonal'
			) as HTMLInputElement;
			expect(personalRadio.checked).toBe(true);
		});

		it('shows restriction preview text when collapsed', async () => {
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			expect(
				screen.getByText('calendarEvent.edit.restrictionPreviewCustom')
			).toBeInTheDocument();
		});

		it('shows "Off" label for each disabled day in Custom mode', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Sun=0, Tue=2, Wed=3, Thu=4, Sat=6 are disabled → 5 "Off" labels
			const offLabels = screen.getAllByText('calendarEvent.edit.restrictionDayOff');
			expect(offLabels).toHaveLength(5);
		});

		it('does not show "Off" label for enabled days in Custom mode', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Mon (1) and Fri (5) are enabled — their rows must not contain the "Off" label
			const monRow = screen.getByTestId('restriction-day-row-1');
			const friRow = screen.getByTestId('restriction-day-row-5');
			expect(
				within(monRow).queryByText('calendarEvent.edit.restrictionDayOff')
			).not.toBeInTheDocument();
			expect(
				within(friRow).queryByText('calendarEvent.edit.restrictionDayOff')
			).not.toBeInTheDocument();
		});

		it('renders two disabled time dropdowns for each disabled day in Custom mode', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Sunday (0) is disabled — its row should have 2 disabled dropdown trigger buttons
			const sunRow = screen.getByTestId('restriction-day-row-0');
			const allButtons = within(sunRow).getAllByRole('button');
			const disabledButtons = allButtons.filter((b) => b.hasAttribute('disabled'));
			expect(disabledButtons).toHaveLength(2);
		});

		it('renders two enabled time dropdowns for each selected day in Custom mode', async () => {
			const user = setupUser();
			renderComponent(mockEventWithCustomRestriction, workProfileId, personalProfileId);
			await waitForLoaded();
			await openRestrictionSection(user);
			// Monday (1) is enabled — none of its buttons should be disabled
			const monRow = screen.getByTestId('restriction-day-row-1');
			const allButtons = within(monRow).getAllByRole('button');
			const disabledButtons = allButtons.filter((b) => b.hasAttribute('disabled'));
			expect(disabledButtons).toHaveLength(0);
		});
	});

	describe('adaptive time section label and fields (Phase 1)', () => {
		const nonRecurringEvent: CalendarEvent = {
			...mockEvent,
			repetition: null,
			isRecurring: false,
		};

		it('shows "Occurrence" section label when event is recurring', async () => {
			renderComponent(mockEvent);
			await waitForLoaded();
			expect(screen.getByText('calendarEvent.edit.occurrenceSection')).toBeInTheDocument();
			expect(screen.queryByText('calendarEvent.edit.timeSection')).not.toBeInTheDocument();
		});

		it('shows "Time & Duration" section label when event is not recurring', async () => {
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			expect(screen.getByText('calendarEvent.edit.timeSection')).toBeInTheDocument();
			expect(
				screen.queryByText('calendarEvent.edit.occurrenceSection')
			).not.toBeInTheDocument();
		});

		it('hides Start and End fields when recurring and section is expanded', async () => {
			const user = setupUser();
			renderComponent(mockEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.occurrenceSection'));
			expect(screen.queryByText('calendarEvent.edit.start')).not.toBeInTheDocument();
			expect(screen.queryByText('calendarEvent.edit.end')).not.toBeInTheDocument();
		});

		it('shows Start and End fields when not recurring and section is expanded', async () => {
			const user = setupUser();
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.timeSection'));
			expect(screen.getByText('calendarEvent.edit.start')).toBeInTheDocument();
			expect(screen.getByText('calendarEvent.edit.end')).toBeInTheDocument();
		});

		it('still shows Duration and Split when recurring and section is expanded', async () => {
			const user = setupUser();
			renderComponent(mockEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.occurrenceSection'));
			expect(screen.getByText('calendarEvent.edit.duration')).toBeInTheDocument();
			expect(screen.getByText('calendarEvent.edit.split')).toBeInTheDocument();
		});

		it('sends Start and End as undefined when recurring on save', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			const user = setupUser();
			renderComponent(mockEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.Start).toBeUndefined();
			expect(params.End).toBeUndefined();
		});

		it('sends Start and End values when not recurring on save', async () => {
			mockUpdateCalendarEvent.mockResolvedValueOnce(nonRecurringEvent);
			const user = setupUser();
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			expect(params.Start).toBeDefined();
			expect(params.End).toBeDefined();
		});
	});

	describe('Phase 3: date-only repetition range', () => {
		it('rep date range shows no time-picker buttons', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// No TimeDropdown (aria-haspopup="listbox") buttons should exist in the rep range section
			const timePickers = document.querySelectorAll('[aria-haspopup="listbox"]');
			expect(timePickers).toHaveLength(0);
		});

		it('RepetitionStart is sent as start-of-day timestamp', async () => {
			const user = setupUser();
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			renderComponent();
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			const repStart = mockEvent.repetition!.repetitionTimeline!.start!;
			expect(params.RepetitionConfig.RepetitionStart).toBe(
				dayjs(repStart).startOf('day').valueOf()
			);
		});

		it('RepetitionEnd is sent as start-of-day timestamp', async () => {
			const user = setupUser();
			mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
			renderComponent();
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			await user.click(screen.getByText('calendarEvent.edit.save'));
			await waitFor(() => expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce());
			const params = mockUpdateCalendarEvent.mock.calls[0][0];
			const repEnd = mockEvent.repetition!.repetitionTimeline!.end!;
			expect(params.RepetitionConfig.RepetitionEnd).toBe(
				dayjs(repEnd).startOf('day').valueOf()
			);
		});
	});

	describe('repetition save validation', () => {
		it('enables save when frequency is empty (disabled) regardless of rep fields', async () => {
			const user = setupUser();
			const noFreqEvent = {
				...mockEvent,
				isRecurring: false,
				repetition: null,
			};
			renderComponent(noFreqEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
			expect(saveBtn).not.toBeDisabled();
		});

		it('disables save when recurring, has frequency, not forever, and no start date', async () => {
			const user = setupUser();
			const noStartEvent = {
				...mockEvent,
				repetition: {
					...mockEvent.repetition!,
					isForever: false,
					repetitionTimeline: {
						...mockEvent.repetition!.repetitionTimeline!,
						start: null as unknown as number,
					},
				},
			};
			renderComponent(noStartEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
			expect(saveBtn).toBeDisabled();
		});

		it('disables save when recurring, has frequency, not forever, and no end date', async () => {
			const user = setupUser();
			const noEndEvent = {
				...mockEvent,
				repetition: {
					...mockEvent.repetition!,
					isForever: false,
					repetitionTimeline: {
						...mockEvent.repetition!.repetitionTimeline!,
						end: null as unknown as number,
					},
				},
			};
			renderComponent(noEndEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
			expect(saveBtn).toBeDisabled();
		});

		it('enables save when recurring with frequency and isForever (no dates needed)', async () => {
			const user = setupUser();
			const foreverEvent = {
				...mockEvent,
				repetition: { ...mockEvent.repetition!, isForever: true },
			};
			renderComponent(foreverEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
			expect(saveBtn).not.toBeDisabled();
		});

		it('enables save when not recurring regardless of repetition fields', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.type(screen.getByDisplayValue('work out'), '!');
			const saveBtn = screen.getByText('calendarEvent.edit.save').closest('button');
			expect(saveBtn).not.toBeDisabled();
		});
	});

	describe('repetition section redesign', () => {
		it('frequency dropdown includes Disabled as first option', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.options[0].value).toBe('');
			expect(select.options[0].text).toBe('calendarEvent.edit.repetitionDisabled');
		});

		it('header shows Disabled preview when no frequency', async () => {
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			expect(screen.getByText('calendarEvent.edit.repetitionDisabled')).toBeInTheDocument();
		});

		it('header shows translated frequency in preview when recurring', async () => {
			renderComponent();
			await waitForLoaded();
			expect(screen.getByText('calendarEvent.edit.weekly')).toBeInTheDocument();
		});

		it('selecting a frequency shows the forever checkbox', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// Forever checkbox should not be visible initially (frequency = '')
			expect(screen.queryByLabelText('calendarEvent.edit.forever')).not.toBeInTheDocument();
			// Select weekly
			await user.selectOptions(screen.getByRole('combobox'), 'weekly');
			// Forever checkbox now visible
			expect(screen.getByLabelText('calendarEvent.edit.forever')).toBeInTheDocument();
		});

		it('selecting Disabled hides the forever checkbox and date range', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// Currently weekly — forever checkbox is visible
			expect(screen.getByLabelText('calendarEvent.edit.forever')).toBeInTheDocument();
			// Switch to Disabled
			await user.selectOptions(screen.getByRole('combobox'), '');
			expect(screen.queryByLabelText('calendarEvent.edit.forever')).not.toBeInTheDocument();
		});

		it('selecting daily sets default end date 2 weeks out when no existing dates', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			await user.selectOptions(screen.getByRole('combobox'), 'daily');
			const expectedEnd = dayjs().add(2, 'week').startOf('day');
			const endTrigger = screen.getByLabelText('calendarEvent.edit.repetitionEnd');
			expect(endTrigger.textContent).toContain(expectedEnd.format('MMM D, YYYY'));
		});

		it('selecting weekly sets default end date 8 weeks out when no existing dates', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			await user.selectOptions(screen.getByRole('combobox'), 'weekly');
			const expectedEnd = dayjs().add(8, 'week').startOf('day');
			const endTrigger = screen.getByLabelText('calendarEvent.edit.repetitionEnd');
			expect(endTrigger.textContent).toContain(expectedEnd.format('MMM D, YYYY'));
		});

		it('selecting monthly sets default end date 12 months out when no existing dates', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			await user.selectOptions(screen.getByRole('combobox'), 'monthly');
			const expectedEnd = dayjs().add(12, 'month').startOf('day');
			const endTrigger = screen.getByLabelText('calendarEvent.edit.repetitionEnd');
			expect(endTrigger.textContent).toContain(expectedEnd.format('MMM D, YYYY'));
		});

		it('replaces bogus DateTime.MinValue rep dates with frequency defaults when enabling', async () => {
			const user = setupUser();
			// Server returns repetition.isEnabled=false but the timeline carries
			// DateTimeOffset.MinValue (Unix ms: -62135596800000) — the .NET sentinel.
			const bogusEvent: CalendarEvent = {
				...mockEvent,
				isRecurring: false,
				repetition: {
					...mockEvent.repetition!,
					isEnabled: false,
					frequency: '',
					repetitionTimeline: {
						start: -62135596800000,
						end: -62135596800000,
						duration: 0,
						occupiedSlots: null,
					},
				},
			};
			renderComponent(bogusEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			await user.selectOptions(screen.getByRole('combobox'), 'weekly');

			const startTrigger = screen.getByLabelText('calendarEvent.edit.repetitionStart');
			const endTrigger = screen.getByLabelText('calendarEvent.edit.repetitionEnd');
			const expectedStart = dayjs().startOf('day');
			const expectedEnd = dayjs().add(8, 'week').startOf('day');
			expect(startTrigger.textContent).toContain(expectedStart.format('MMM D, YYYY'));
			expect(endTrigger.textContent).toContain(expectedEnd.format('MMM D, YYYY'));
			// Critically, it must NOT show the 0001-01-01 sentinel
			expect(startTrigger.textContent).not.toContain('Jan 1, 0001');
			expect(endTrigger.textContent).not.toContain('Jan 1, 0001');
		});

		it('preserves server-loaded valid rep dates through disable → re-enable cycle', async () => {
			const user = setupUser();
			renderComponent(); // mockEvent has weekly repetition with valid dates
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			const originalStart = screen.getByLabelText(
				'calendarEvent.edit.repetitionStart'
			).textContent;
			const originalEnd = screen.getByLabelText(
				'calendarEvent.edit.repetitionEnd'
			).textContent;
			// Disable
			await user.selectOptions(screen.getByRole('combobox'), '');
			// Re-enable a different frequency
			await user.selectOptions(screen.getByRole('combobox'), 'daily');
			expect(screen.getByLabelText('calendarEvent.edit.repetitionStart').textContent).toBe(
				originalStart
			);
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).toBe(
				originalEnd
			);
		});

		it('preserves previously seeded rep dates through disable → re-enable cycle', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// First enable: seeds today / today+2w
			await user.selectOptions(screen.getByRole('combobox'), 'daily');
			const seededStart = screen.getByLabelText(
				'calendarEvent.edit.repetitionStart'
			).textContent;
			const seededEnd = screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent;
			// Disable
			await user.selectOptions(screen.getByRole('combobox'), '');
			// Re-enable with a different frequency — should NOT reseed end to monthly's +12m
			await user.selectOptions(screen.getByRole('combobox'), 'monthly');
			expect(screen.getByLabelText('calendarEvent.edit.repetitionStart').textContent).toBe(
				seededStart
			);
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).toBe(
				seededEnd
			);
		});

		it('selecting yearly sets default end date 10 years out when no existing dates', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			await user.selectOptions(screen.getByRole('combobox'), 'yearly');
			const expectedEnd = dayjs().add(10, 'year').startOf('day');
			const endTrigger = screen.getByLabelText('calendarEvent.edit.repetitionEnd');
			expect(endTrigger.textContent).toContain(expectedEnd.format('MMM D, YYYY'));
		});

		it('switching frequency while enabled updates end date to new frequency default', async () => {
			const user = setupUser();
			// mockEvent has server-loaded weekly dates (never manually picked by user)
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// Switch weekly → monthly
			await user.selectOptions(screen.getByRole('combobox'), 'monthly');
			const expectedEnd = dayjs().add(12, 'month').startOf('day');
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).toContain(
				expectedEnd.format('MMM D, YYYY')
			);
		});

		it('switching frequency preserves end date when user has manually picked it', async () => {
			const user = setupUser();
			const nonRecurringEvent = { ...mockEvent, isRecurring: false, repetition: null };
			renderComponent(nonRecurringEvent);
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// Enable weekly — seeds end to today+8w
			await user.selectOptions(screen.getByRole('combobox'), 'weekly');
			// Open the rep end date picker and pick day 15 from the calendar
			await user.click(screen.getByLabelText('calendarEvent.edit.repetitionEnd'));
			await user.click(screen.getByRole('button', { name: '15' }));
			// Capture what the user picked
			const pickedDateText = screen.getByLabelText(
				'calendarEvent.edit.repetitionEnd'
			).textContent;
			// Switch to monthly — user-picked date should be preserved, not replaced
			await user.selectOptions(screen.getByRole('combobox'), 'monthly');
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).toBe(
				pickedDateText
			);
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).not.toBe(
				dayjs().add(12, 'month').startOf('day').format('MMM D, YYYY')
			);
		});

		it('switching frequency does NOT update end date when isForever is checked', async () => {
			const user = setupUser();
			// mockEvent has weekly with valid server-loaded dates
			renderComponent();
			await waitForLoaded();
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			// Record end date before toggling forever
			const originalEndText = screen.getByLabelText(
				'calendarEvent.edit.repetitionEnd'
			).textContent;
			// Check isForever (hides date pickers)
			await user.click(screen.getByLabelText('calendarEvent.edit.forever'));
			// Switch to monthly while forever is checked
			await user.selectOptions(screen.getByRole('combobox'), 'monthly');
			// Uncheck forever to reveal pickers again
			await user.click(screen.getByLabelText('calendarEvent.edit.forever'));
			// End date should not have been clobbered
			expect(screen.getByLabelText('calendarEvent.edit.repetitionEnd').textContent).toBe(
				originalEndText
			);
		});

		it('clicking section header opens and closes the body', async () => {
			const user = setupUser();
			renderComponent();
			await waitForLoaded();
			// Open
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			expect(screen.getByRole('combobox')).toBeInTheDocument();
			// Close
			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
			expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
		});
	});

	describe('end date default', () => {
		const expectedEndOfMonth = dayjs().endOf('month').startOf('day');

		async function openTimeSection(user: ReturnType<typeof setupUser>) {
			await user.click(screen.getByText('calendarEvent.edit.timeSection'));
		}

		it('defaults end date to end of current month when event.end is null', async () => {
			const user = setupUser();
			const noEndEvent = {
				...mockEvent,
				isRecurring: false,
				repetition: null,
				end: null,
			};
			renderComponent(noEndEvent);
			await waitForLoaded();
			await openTimeSection(user);
			const endTrigger = screen.getByLabelText('calendarEvent.edit.end');
			expect(endTrigger.textContent).toContain(expectedEndOfMonth.format('MMM D, YYYY'));
		});

		it('defaults end date to end of current month when event.end is 0 (server sentinel)', async () => {
			const user = setupUser();
			const noEndEvent = {
				...mockEvent,
				isRecurring: false,
				repetition: null,
				end: 0,
			};
			renderComponent(noEndEvent);
			await waitForLoaded();
			await openTimeSection(user);
			const endTrigger = screen.getByLabelText('calendarEvent.edit.end');
			expect(endTrigger.textContent).toContain(expectedEndOfMonth.format('MMM D, YYYY'));
		});

		it('shows actual end date when event.end is a valid timestamp', async () => {
			const user = setupUser();
			const specificEnd = dayjs('2026-09-20T18:00:00').valueOf();
			const endEvent = {
				...mockEvent,
				isRecurring: false,
				repetition: null,
				end: specificEnd,
			};
			renderComponent(endEvent);
			await waitForLoaded();
			await openTimeSection(user);
			const endTrigger = screen.getByLabelText('calendarEvent.edit.end');
			expect(endTrigger.textContent).toContain('Sep 20, 2026');
		});
	});
});
