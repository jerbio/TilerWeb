import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTileRestrictionType, initialCreateTileFormState } from '../../data';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { scheduleService, userService } from '@/services';
import { CalendarUIProvider } from '../../calendar-ui.provider';

// Mock dependencies
vi.mock('@/hooks/useFormHandler', () => () => ({
	formData: {},
	handleFormInputChange: vi.fn(() => vi.fn()),
	resetForm: vi.fn(),
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey, components }: { i18nKey: string; components?: Array<React.ReactNode> }) => (
		<span>
			{i18nKey}
			{components && Object.values(components)}
		</span>
	),
}));
vi.mock('@/services', () => ({
	scheduleService: { createEvent: vi.fn() },
	userService: { getScheduleProfile: vi.fn() },
}));
vi.mock('@/core/common/components/calendar/CalendarRequestProvider', () => ({
	useCalendarDispatch: () => vi.fn(),
}));

import CalendarCreateTile from '..';
import {
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
} from '@/core/common/types/schedule';
import dayjs from 'dayjs';

// ---- test utils ----
async function renderWithProviders(ui: React.ReactElement) {
	render(
		<ThemeProvider defaultTheme="dark">
			<CalendarUIProvider demoMode={false}>{ui}</CalendarUIProvider>
		</ThemeProvider>
	);
	// Open the create tile
	await userEvent.click(screen.getByTestId('open-create-tile'));
}

// Provide a mock initial form state for the component
const mockFormState = initialCreateTileFormState;
function getFormHandler(overrides = {}) {
	return {
		formData: { ...mockFormState, ...overrides },
		handleFormInputChange: vi.fn(() => vi.fn()),
		setFormData: vi.fn(),
		resetForm: vi.fn(),
	};
}

const mockInvalidFormState = { action: '', durationHours: 0, durationMins: 0 };
const mockValidFormState = { action: 'Study', durationHours: 1, durationMins: 0 };

// Provide a mock created tile response
const mockCreateTileResponse = {
	calendarEvent: {
		id: '123',
	},
} as Awaited<ReturnType<typeof scheduleService.createEvent>>;
const mockGetScheduleProfileResponse = {
	workHoursRestrictionProfile: { id: 'work-123' },
	personalHoursRestrictionProfile: { id: 'personal-123' },
} as Awaited<ReturnType<typeof userService.getScheduleProfile>>;

describe('CalendarCreateTile UI', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it('renders the default create tile UI', () => {
		renderWithProviders(
			<CalendarCreateTile formHandler={getFormHandler()} refetchEvents={vi.fn()} />
		);
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
			'calendar.createTile.title'
		);
		expect(
			screen.getByRole('button', { name: /calendar.createTile.buttons.submit/i })
		).toBeInTheDocument();
	});

	it('shows all options when the More Options button is clicked', async () => {
		renderWithProviders(
			<CalendarCreateTile formHandler={getFormHandler()} refetchEvents={vi.fn()} />
		);
		const moreOptionsBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.expand/i,
		});
		await userEvent.click(moreOptionsBtn);
		expect(
			await screen.findByText('calendar.createTile.sections.tileColor')
		).toBeInTheDocument();
		expect(
			await screen.findByText('calendar.createTile.sections.tileActions')
		).toBeInTheDocument();
	});

	it('disables submit when form is invalid', () => {
		renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler(mockInvalidFormState)}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});

		expect(submitBtn).toBeDisabled();
	});

	it('enables submit when form is valid', () => {
		renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler(mockValidFormState)}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});

		expect(submitBtn).toBeEnabled();
	});

	it('submits when form is valid', async () => {
		const createEventMock = scheduleService.createEvent as ReturnType<typeof vi.fn>;
		createEventMock.mockResolvedValue(mockCreateTileResponse);

		const refetchEvents = vi.fn();

		renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler(mockValidFormState)}
				refetchEvents={refetchEvents}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});

		await userEvent.click(submitBtn);

		expect(createEventMock).toHaveBeenCalled();
		expect(refetchEvents).toHaveBeenCalled();
	});

	it('submits the form when Enter key is pressed', async () => {
		const createEventMock = scheduleService.createEvent as ReturnType<typeof vi.fn>;
		createEventMock.mockResolvedValue(mockCreateTileResponse);
		const refetchEvents = vi.fn();

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler(mockValidFormState)}
				refetchEvents={refetchEvents}
			/>
		);

		// simulate pressing Enter anywhere (listener is on document)
		fireEvent.keyDown(document, { key: 'Enter' });

		expect(createEventMock).toHaveBeenCalled();
	});

	// REPETITION TESTS
	it('does not include recurrence fields when not recurring', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: false,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});
		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];
		expect(payload.RepeatType).toBeUndefined();
		expect(payload.RepeatFrequency).toBeUndefined();
		expect(payload.RepeatWeeklyData).toBeUndefined();
	});

	it('sets time window fields correctly when not recurring', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		const start = dayjs('2026-03-20');
		const end = dayjs('2026-03-21');

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: false,
					start,
					deadline: end,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});

		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];

		expect(payload.StartYear).toBe('2026');
		expect(payload.StartMonth).toBe('03');
		expect(payload.StartDay).toBe('20');
		expect(payload.StartHour).toBe('00');
		expect(payload.StartMinute).toBe('00');

		expect(payload.EndYear).toBe('2026');
		expect(payload.EndMonth).toBe('03');
		expect(payload.EndDay).toBe('21');
		expect(payload.EndHour).toBe('23');
		expect(payload.EndMinute).toBe('59');
	});

	it('does not include time window fields when recurring', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: true,
					start: dayjs(),
					deadline: dayjs().add(1, 'day'),
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});

		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];

		expect(payload.StartYear).toBeUndefined();
		expect(payload.EndYear).toBeUndefined();
	});

	it('sets weekly recurrence fields correctly', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: true,
					recurrenceType: ScheduleRepeatType.Weekly,
					recurrenceFrequency: ScheduleRepeatFrequency.Weekly,
					recurrenceWeeklyDays: [
						ScheduleRepeatWeekday.Sunday,
						ScheduleRepeatWeekday.Monday,
						ScheduleRepeatWeekday.Thursday,
					],
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});
		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];
		expect(payload.RepeatType).toBe(ScheduleRepeatType.Weekly);
		expect(payload.RepeatFrequency).toBe(ScheduleRepeatFrequency.Weekly);
		expect(payload.RepeatWeeklyData).toBe('0,1,4');
	});

	it('sets recurrence end date fields when end type is On', async () => {
		const endDate = dayjs('2020-12-31');

		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: true,
					recurrenceEndType: ScheduleRepeatEndType.On,
					recurrenceEndDate: endDate,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});
		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];

		expect(payload.RepeatEndDay).toBe('31');
		expect(payload.RepeatEndMonth).toBe('12');
		expect(payload.RepeatEndYear).toBe('2020');
	});

	it('sets recurrence start date fields when start type is On', async () => {
		const startDate = dayjs('2020-01-02');

		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isRecurring: true,
					recurrenceStartType: ScheduleRepeatStartType.On,
					recurrenceStartDate: startDate,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		const submitBtn = screen.getByRole('button', {
			name: /calendar.createTile.buttons.submit/i,
		});
		await userEvent.click(submitBtn);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalled();
		});

		const payload = createMock.mock.calls[0][0];

		expect(payload.RepeatStartDay).toBe('02');
		expect(payload.RepeatStartMonth).toBe('01');
		expect(payload.RepeatStartYear).toBe('2020');
	});

	it('sets isRestricted to False when restriction type is Anytime', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isTimeRestricted: true,
					timeRestrictionType: CreateTileRestrictionType.Anytime,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];

		expect(payload.isRestricted).toBe('false');
	});

	it('sets work restriction profile id', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);
		const getScheduleProfileMock = vi
			.spyOn(userService, 'getScheduleProfile')
			.mockResolvedValue(mockGetScheduleProfileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isTimeRestricted: true,
					timeRestrictionType: CreateTileRestrictionType.WorkHours,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		// expand to trigger profile loading
		await userEvent.click(screen.getByRole('button', { name: /expand/i }));

		expect(getScheduleProfileMock).toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];

		expect(payload.RestrictionProfileId).toBe(
			mockGetScheduleProfileResponse.workHoursRestrictionProfile!.id
		);
	});

	it('sets personal restriction profile id', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);
		const getScheduleProfileMock = vi
			.spyOn(userService, 'getScheduleProfile')
			.mockResolvedValue(mockGetScheduleProfileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isTimeRestricted: true,
					timeRestrictionType: CreateTileRestrictionType.PersonalHours,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		// expand to trigger profile loading
		await userEvent.click(screen.getByRole('button', { name: /expand/i }));

		expect(getScheduleProfileMock).toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];

		expect(payload.RestrictionProfileId).toBe(
			mockGetScheduleProfileResponse.personalHoursRestrictionProfile!.id
		);
	});

	it('throws error if restriction profile (id) is missing', async () => {
		const createMock = vi.spyOn(scheduleService, 'createEvent');

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isTimeRestricted: true,
					timeRestrictionType: CreateTileRestrictionType.WorkHours,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			expect(createMock).not.toHaveBeenCalled();
		});
	});

	it('sets custom restrictive week schedule', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		const customSchedule = [
			{ dayIndex: 1, startTime: '08:00', endTime: '12:00' },
			{ dayIndex: 3, startTime: '14:00', endTime: '18:00' },
		];

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					isTimeRestricted: true,
					timeRestrictionType: CreateTileRestrictionType.Custom,
					customTimeRestrictionSchedule: customSchedule,
				})}
				refetchEvents={vi.fn()}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];

		expect(payload.RestrictiveWeek).toEqual({
			isEnabled: 'true',
			WeekDayOption: [
				{ Start: '08:00', End: '12:00', Index: '1' },
				{ Start: '14:00', End: '18:00', Index: '3' },
			],
		});
	});

	// TILE SPLIT / COUNT TESTS
	it('includes Count field in API payload with default value', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					count: '1',
				})}
				refetchEvents={vi.fn()}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];
		expect(payload.Count).toBe('1');
	});

	it('includes Count field in API payload with custom value', async () => {
		const createMock = vi
			.spyOn(scheduleService, 'createEvent')
			.mockResolvedValue(mockCreateTileResponse);

		await renderWithProviders(
			<CalendarCreateTile
				formHandler={getFormHandler({
					...mockValidFormState,
					count: '3',
				})}
				refetchEvents={vi.fn()}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => expect(createMock).toHaveBeenCalled());

		const payload = createMock.mock.calls[0][0];
		expect(payload.Count).toBe('3');
	});
});
