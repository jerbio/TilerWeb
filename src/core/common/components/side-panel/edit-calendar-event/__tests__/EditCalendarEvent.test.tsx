import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import EditCalendarEvent from '../EditCalendarEvent';
import { CalendarEvent } from '@/core/common/types/schedule';

// ── Mocks ──

const mockUpdateCalendarEvent = vi.fn();
const mockLookupCalendarEventById = vi.fn();
const mockLookupLocationById = vi.fn();
const mockSearchLocations = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		updateCalendarEvent: (...args: unknown[]) => mockUpdateCalendarEvent(...args),
		lookupCalendarEventById: (...args: unknown[]) => mockLookupCalendarEventById(...args),
		lookupLocationById: (...args: unknown[]) => mockLookupLocationById(...args),
		searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
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
	thirdpartyType: 'tiler',
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
		weekDays: '1,3,5',
		isForever: false,
		tileTimeline: { start: 1769925600000, end: 1770532200000, duration: 606600000, occupiedSlots: null },
		repetitionTimeline: { start: 1769925600000, end: 1779999960000, duration: 10074400000, occupiedSlots: null },
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

function renderComponent(event = mockEvent) {
	return render(
		<ThemeProvider theme={lightTheme}>
			<EditCalendarEvent event={event} onClose={mockOnClose} />
		</ThemeProvider>,
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
		mockLookupCalendarEventById.mockResolvedValue(mockEvent);
		mockLookupLocationById.mockResolvedValue({ address: '123 Main St', description: 'Near the park' });
		mockSearchLocations.mockResolvedValue([]);
	});

	it('renders header with back button and title', () => {
		renderComponent();
		expect(screen.getByText('calendarEvent.edit.title')).toBeInTheDocument();
		expect(screen.getByLabelText('calendarEvent.edit.back')).toBeInTheDocument();
	});

	it('calls onClose when back button is clicked', async () => {
		const user = setupUser();
		renderComponent();
		await user.click(screen.getByLabelText('calendarEvent.edit.back'));
		expect(mockOnClose).toHaveBeenCalledOnce();
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
		expect(screen.getByText('calendarEvent.edit.timeSection')).toBeInTheDocument();
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

	it('expands time section on click', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.timeSection'));
		expect(screen.getByText('calendarEvent.edit.start')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.end')).toBeInTheDocument();
		expect(screen.getByText('calendarEvent.edit.duration')).toBeInTheDocument();
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
		expect(screen.getByText('weekly')).toBeInTheDocument();
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

	it('expands repetition section and shows toggle + frequency', async () => {
		const user = setupUser();
		renderComponent();
		await waitForLoaded();
		await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));
		expect(screen.getByText('calendarEvent.edit.recurring')).toBeInTheDocument();
		const selects = screen.getAllByRole('combobox');
		const frequencySelect = selects.find((s) => (s as HTMLSelectElement).value === 'weekly');
		expect(frequencySelect).toBeDefined();
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
				'loading',
			);
		});

		await waitFor(() => {
			expect(mockUpdateNotification).toHaveBeenCalledWith(
				'update-evt-1',
				'calendarEvent.edit.saveSuccess',
				'success',
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
				'error',
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
			RepetitionStart: 1769925600000,
			RepetitionEnd: 1779999960000,
			DayOfWeekRepetitions: ['1', '3', '5'],
		});
	});

	it('omits RepetitionConfig when not recurring', async () => {
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
			mockLookupCalendarEventById.mockResolvedValueOnce(foreverEvent);
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
			mockLookupCalendarEventById.mockResolvedValueOnce(foreverEvent);
			renderComponent(foreverEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(screen.queryByLabelText('calendarEvent.edit.repetitionStart')).not.toBeInTheDocument();
			expect(screen.queryByLabelText('calendarEvent.edit.repetitionEnd')).not.toBeInTheDocument();
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

			// mockEvent has weekDays: '1,3,5' = Mon, Wed, Fri
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
			mockLookupCalendarEventById.mockResolvedValueOnce(dailyEvent);
			renderComponent(dailyEvent);
			await waitForLoaded();

			await user.click(screen.getByText('calendarEvent.edit.repetitionSection'));

			expect(screen.queryByLabelText('calendarEvent.edit.sun')).not.toBeInTheDocument();
		});

		it('populates repetition fields from fetched event', async () => {
			const user = setupUser();
			mockLookupCalendarEventById.mockResolvedValueOnce({
				...mockEvent,
				repetition: {
					...mockEvent.repetition!,
					frequency: 'weekly',
					isForever: false,
					weekDays: '2,4',
					repetitionTimeline: { start: 1770000000000, end: 1785000000000, duration: 15000000000, occupiedSlots: null },
				},
			});
			renderComponent();
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

	describe('fetch on mount', () => {
		const fetchedEvent: CalendarEvent = {
			...mockEvent,
			name: 'Fetched Name',
			address: '456 Oak Ave',
			addressDescription: 'By the lake',
			colorRed: 46,
			colorGreen: 204,
			colorBlue: 113,
			repetition: {
				id: 'rep-fetched',
				isEnabled: true,
				frequency: 'daily',
				weekDays: '0,6',
				isForever: true,
				tileTimeline: { start: 1769900000000, end: 1769903600000, duration: 3600000, occupiedSlots: null },
				repetitionTimeline: { start: 1769900000000, end: 1800000000000, duration: 100000000000, occupiedSlots: null },
			},
		};

		it('calls lookupCalendarEventById on mount with event id', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			renderComponent();

			await waitFor(() => {
				expect(mockLookupCalendarEventById).toHaveBeenCalledWith('evt-1');
			});
		});

		it('shows loading state while fetching', () => {
			mockLookupCalendarEventById.mockReturnValueOnce(new Promise(() => {})); // never resolves
			renderComponent();

			expect(screen.getByText('calendarEvent.edit.loading')).toBeInTheDocument();
		});

		it('hides form fields while loading', () => {
			mockLookupCalendarEventById.mockReturnValueOnce(new Promise(() => {}));
			renderComponent();

			// Name input should not be in the document while loading
			expect(screen.queryByDisplayValue('work out')).not.toBeInTheDocument();
			// Section headers should not be visible
			expect(screen.queryByText('calendarEvent.edit.timeSection')).not.toBeInTheDocument();
			expect(screen.queryByText('calendarEvent.edit.locationSection')).not.toBeInTheDocument();
			expect(screen.queryByText('calendarEvent.edit.colorSection')).not.toBeInTheDocument();
			// Save button should not be visible
			expect(screen.queryByText('calendarEvent.edit.save')).not.toBeInTheDocument();
		});

		it('shows form only after fetch completes', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			renderComponent();

			await waitFor(() => {
				expect(screen.queryByText('calendarEvent.edit.loading')).not.toBeInTheDocument();
			});

			// Now form should be visible with fetched data
			expect(screen.getByDisplayValue('Fetched Name')).toBeInTheDocument();
			expect(screen.getByText('calendarEvent.edit.timeSection')).toBeInTheDocument();
		});

		it('shows form with prop data after fetch fails', async () => {
			mockLookupCalendarEventById.mockRejectedValueOnce(new Error('fail'));
			renderComponent();

			await waitFor(() => {
				expect(screen.queryByText('calendarEvent.edit.loading')).not.toBeInTheDocument();
			});

			expect(screen.getByDisplayValue('work out')).toBeInTheDocument();
		});

		it('populates form with fetched data', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			renderComponent();

			await waitFor(() => {
				expect(screen.getByDisplayValue('Fetched Name')).toBeInTheDocument();
			});
		});

		it('shows fetched address in location preview when collapsed', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			mockLookupLocationById.mockResolvedValueOnce({ address: '456 Oak Ave', description: 'By the lake' });
			renderComponent();

			await waitFor(() => {
				expect(screen.getByText('456 Oak Ave · By the lake')).toBeInTheDocument();
			});
		});

		it('shows fetched repetition preview when collapsed', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			renderComponent();

			await waitFor(() => {
				expect(screen.getByText('daily')).toBeInTheDocument();
			});
		});

		it('falls back to prop event on fetch failure', async () => {
			mockLookupCalendarEventById.mockRejectedValueOnce(new Error('Network error'));
			renderComponent();

			// Should still render with the prop data
			await waitFor(() => {
				expect(screen.getByDisplayValue('work out')).toBeInTheDocument();
			});
		});

		it('hides loading state after fetch completes', async () => {
			mockLookupCalendarEventById.mockResolvedValueOnce(fetchedEvent);
			renderComponent();

			await waitFor(() => {
				expect(screen.queryByText('calendarEvent.edit.loading')).not.toBeInTheDocument();
			});
		});

		it('hides loading state after fetch fails', async () => {
			mockLookupCalendarEventById.mockRejectedValueOnce(new Error('fail'));
			renderComponent();

			await waitFor(() => {
				expect(screen.queryByText('calendarEvent.edit.loading')).not.toBeInTheDocument();
			});
		});
	});

describe('location fetch by locationId', () => {
it('fetches location when event has a locationId', async () => {
mockLookupCalendarEventById.mockResolvedValueOnce(mockEvent);
mockLookupLocationById.mockResolvedValueOnce({
id: 'loc-1',
address: '789 Broadway',
description: 'Corner office',
longitude: -73.99,
latitude: 40.75,
isVerified: true,
isDefault: false,
isNull: false,
thirdPartyId: null,
userId: 'user-1',
source: 'none',
nickname: 'Office',
});
renderComponent();
await waitForLoaded();

expect(mockLookupLocationById).toHaveBeenCalledWith('loc-1');
});

it('populates address fields from fetched location', async () => {
mockLookupCalendarEventById.mockResolvedValueOnce(mockEvent);
mockLookupLocationById.mockResolvedValueOnce({
id: 'loc-1',
address: '789 Broadway',
description: 'Corner office',
longitude: -73.99,
latitude: 40.75,
isVerified: true,
isDefault: false,
isNull: false,
thirdPartyId: null,
userId: 'user-1',
source: 'none',
nickname: 'Office',
});
const user = setupUser();
renderComponent();
await waitForLoaded();

// Expand Location section to see values
await user.click(screen.getByText('calendarEvent.edit.locationSection'));
expect(screen.getByDisplayValue('789 Broadway')).toBeInTheDocument();
expect(screen.getByDisplayValue('Corner office')).toBeInTheDocument();
});

it('does not fetch location when locationId is null', async () => {
const eventWithoutLocation = { ...mockEvent, locationId: null };
mockLookupCalendarEventById.mockResolvedValueOnce(eventWithoutLocation);
renderComponent(eventWithoutLocation);
await waitForLoaded();

expect(mockLookupLocationById).not.toHaveBeenCalled();
});

it('keeps event address data when location fetch fails', async () => {
mockLookupCalendarEventById.mockResolvedValueOnce(mockEvent);
mockLookupLocationById.mockRejectedValueOnce(new Error('Location not found'));
const user = setupUser();
renderComponent();
await waitForLoaded();

// Should still have the address from the event
await user.click(screen.getByText('calendarEvent.edit.locationSection'));
expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
});
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
longitude: -105.10,
latitude: 40.00,
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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
      let resolveSearch!: (value: typeof savedLocation[]) => void;
      mockSearchLocations.mockImplementation(() => new Promise((r) => { resolveSearch = r; }));
      const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
      renderComponent();
      await waitForLoaded();
      await user.click(screen.getByText('calendarEvent.edit.locationSection'));

      const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
      await user.clear(addressInput);
      await user.type(addressInput, 'office');
      await vi.advanceTimersByTimeAsync(400);

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => { resolveSearch([savedLocation]); });

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

      const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

      const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
await user.clear(addressInput);
await user.type(addressInput, 'walmart');
await vi.advanceTimersByTimeAsync(400);

await waitFor(() => {
expect(screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa')).toBeInTheDocument();
});
await user.click(screen.getByText('Walmart Supercenter 745 us-287, lafayette, co 80026, usa'));
await user.click(screen.getByText('calendarEvent.edit.save'));

await waitFor(() => {
expect(mockUpdateCalendarEvent).toHaveBeenCalledOnce();
});

const params = mockUpdateCalendarEvent.mock.calls[0][0];
expect(params.LocationId).toBeUndefined();
expect(params.CalAddress).toBe('Walmart Supercenter 745 us-287, lafayette, co 80026, usa');
expect(params.CalAddressDescription).toBe('Walmart Supercenter');
vi.useRealTimers();
});

it('clears locationId when user manually edits address', async () => {
mockUpdateCalendarEvent.mockResolvedValueOnce(mockEvent);
const user = setupUser();
renderComponent();
await waitForLoaded();
await user.click(screen.getByText('calendarEvent.edit.locationSection'));

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
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

const addressInput = screen.getByPlaceholderText('calendarEvent.edit.locationSearchPlaceholder');
expect(addressInput).toHaveValue('123 Main St');

await user.click(screen.getByLabelText('calendarEvent.edit.clearLocation'));

expect(addressInput).toHaveValue('');
expect(screen.queryByDisplayValue('Near the park')).not.toBeInTheDocument();
});
});
});
