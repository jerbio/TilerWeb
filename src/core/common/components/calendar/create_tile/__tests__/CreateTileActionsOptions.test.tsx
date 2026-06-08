import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import dayjs from 'dayjs';

import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarUIProvider } from '../../calendar-ui.provider';
import CreateTileActionsOptions from '../options.actions';
import type { OptionsFormController } from '../options';
import { CreateTileRestrictionType, initialCreateTileFormState } from '../../data';
import {
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
	type DaySchedule,
} from '@/core/common/types/schedule';
import { RGBColor } from '@/core/util/colors';

// NOTE: `t` is intentionally a module-level stable reference. The bug being
// guarded against is a stale closure over `controller.customTimeRestrictionSchedule`
// inside `useCallback` handlers whose deps included only `[t]` (or were empty).
// If `t` were re-created each render (as a naive mock would do) the callback
// would be re-built every render and the stale-closure bug would be hidden.
const stableT = (key: string) => key;
vi.mock('react-i18next', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-i18next')>();
	return {
		...actual,
		useTranslation: () => ({ t: stableT }),
		Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
	};
});

const initialSchedule: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
	dayIndex: i,
	startTime: '',
	endTime: '',
}));

/**
 * Stateful test harness that mirrors how `CalendarCreateTile` wires the
 * `OptionsFormController` via `useFormHandler` — including the fact that
 * `setCustomTimeRestrictionSchedule` is a plain value setter (no functional
 * update support). This is critical for reproducing the stale-closure bug
 * where toggling a second day wiped the first day's selection.
 */
const Harness: React.FC<{
	initial?: DaySchedule[];
	onScheduleChange?: (schedule: DaySchedule[]) => void;
}> = ({ initial = initialSchedule, onScheduleChange }) => {
	const [schedule, setSchedule] = useState<DaySchedule[]>(initial);

	const controller: OptionsFormController = {
		start: dayjs(),
		color: new RGBColor({ r: 0, g: 0, b: 0 }),
		setColor: () => {},
		recurring: false,
		setRecurring: () => {},
		recurrenceType: ScheduleRepeatType.Daily,
		setRecurrenceType: () => {},
		recurrenceFrequency: ScheduleRepeatFrequency.Daily,
		setRecurrenceFrequency: () => {},
		recurrenceWeeklyDays: [],
		setRecurrenceWeeklyDays: () => {},
		recurrenceStartType: ScheduleRepeatStartType.Default,
		setRecurrenceStartType: () => {},
		recurrenceStartDate: dayjs(),
		setRecurrenceStartDate: () => {},
		recurrenceEndType: ScheduleRepeatEndType.Never,
		setRecurrenceEndType: () => {},
		recurrenceEndDate: dayjs().add(1, 'week'),
		setRecurrenceEndDate: () => {},
		timeRestricted: true,
		setTimeRestricted: () => {},
		timeRestrictionType: CreateTileRestrictionType.Custom,
		setTimeRestrictionType: () => {},
		customTimeRestrictionSchedule: schedule,
		setCustomTimeRestrictionSchedule: (next) => {
			setSchedule(next);
			onScheduleChange?.(next);
		},
	};

	return (
		<>
			<CreateTileActionsOptions controller={controller} />
			<div data-testid="schedule-snapshot">{JSON.stringify(schedule)}</div>
		</>
	);
};

function renderHarness(props: React.ComponentProps<typeof Harness> = {}) {
	return render(
		<ThemeProvider defaultTheme="dark">
			<CalendarUIProvider demoMode={false}>
				<Harness {...props} />
			</CalendarUIProvider>
		</ThemeProvider>
	);
}

function readSchedule(): DaySchedule[] {
	return JSON.parse(screen.getByTestId('schedule-snapshot').textContent || '[]');
}

describe('CreateTileActionsOptions - custom restriction day selection', () => {
	it('keeps previously selected days selected when a new day is toggled on', async () => {
		const user = userEvent.setup();
		renderHarness();

		// Toggle Monday (index 1) on.
		await user.click(screen.getByTestId('day-circle-1'));
		let snapshot = readSchedule();
		expect(snapshot[1].startTime).not.toBe('');
		expect(snapshot[1].endTime).not.toBe('');

		// Toggle Wednesday (index 3) on. Monday must remain selected.
		await user.click(screen.getByTestId('day-circle-3'));
		snapshot = readSchedule();
		expect(snapshot[1].startTime).not.toBe('');
		expect(snapshot[1].endTime).not.toBe('');
		expect(snapshot[3].startTime).not.toBe('');
		expect(snapshot[3].endTime).not.toBe('');

		// Toggle Friday (index 5) on. All three must remain selected.
		await user.click(screen.getByTestId('day-circle-5'));
		snapshot = readSchedule();
		[1, 3, 5].forEach((i) => {
			expect(snapshot[i].startTime).not.toBe('');
			expect(snapshot[i].endTime).not.toBe('');
		});

		// Untouched days must remain empty.
		[0, 2, 4, 6].forEach((i) => {
			expect(snapshot[i].startTime).toBe('');
			expect(snapshot[i].endTime).toBe('');
		});
	});

	it('toggles a previously selected day off without affecting other days', async () => {
		const user = userEvent.setup();
		renderHarness();

		await user.click(screen.getByTestId('day-circle-1'));
		await user.click(screen.getByTestId('day-circle-3'));
		await user.click(screen.getByTestId('day-circle-1')); // toggle Monday off

		const snapshot = readSchedule();
		expect(snapshot[1].startTime).toBe('');
		expect(snapshot[1].endTime).toBe('');
		expect(snapshot[3].startTime).not.toBe('');
		expect(snapshot[3].endTime).not.toBe('');
	});
});

// ── Weekly recurrence day selection ───────────────────────────────────────────

/**
 * Harness for the weekly-days picker.
 * Mirrors how CalendarCreateTile wires setRecurrenceWeeklyDays through
 * useFormHandler — a plain value setter, not a functional updater.
 */
const WeeklyHarness: React.FC<{
	initialDays?: ScheduleRepeatWeekday[];
	onDaysChange?: (days: ScheduleRepeatWeekday[]) => void;
}> = ({ initialDays = [], onDaysChange }) => {
	const [days, setDays] = useState<ScheduleRepeatWeekday[]>(initialDays);

	const controller: OptionsFormController = {
		start: dayjs(),
		color: new RGBColor({ r: 0, g: 0, b: 0 }),
		setColor: () => {},
		recurring: true,
		setRecurring: () => {},
		recurrenceType: ScheduleRepeatType.Weekly,
		setRecurrenceType: () => {},
		recurrenceFrequency: ScheduleRepeatFrequency.Weekly,
		setRecurrenceFrequency: () => {},
		recurrenceWeeklyDays: days,
		setRecurrenceWeeklyDays: (next) => {
			setDays(next);
			onDaysChange?.(next);
		},
		recurrenceStartType: ScheduleRepeatStartType.Default,
		setRecurrenceStartType: () => {},
		recurrenceStartDate: dayjs(),
		setRecurrenceStartDate: () => {},
		recurrenceEndType: ScheduleRepeatEndType.Never,
		setRecurrenceEndType: () => {},
		recurrenceEndDate: dayjs().add(1, 'week'),
		setRecurrenceEndDate: () => {},
	};

	return (
		<>
			<CreateTileActionsOptions controller={controller} />
			<div data-testid="days-snapshot">{JSON.stringify(days)}</div>
		</>
	);
};

function renderWeeklyHarness(props: React.ComponentProps<typeof WeeklyHarness> = {}) {
	return render(
		<ThemeProvider defaultTheme="dark">
			<CalendarUIProvider demoMode={false}>
				<WeeklyHarness {...props} />
			</CalendarUIProvider>
		</ThemeProvider>
	);
}

function readDays(): ScheduleRepeatWeekday[] {
	return JSON.parse(screen.getByTestId('days-snapshot').textContent || '[]');
}

// The weekday buttons carry a `title` attribute equal to the translated label.
// With `t: (key) => key` the label key for Monday is the full i18n key; we
// match on the suffix via regex.
const dayTitle = (suffix: string) => new RegExp(`recurrenceWeeklyDays\\.${suffix}$`);

describe('initialCreateTileFormState', () => {
	it('starts with no pre-selected recurrence weekdays', () => {
		expect(initialCreateTileFormState.recurrenceWeeklyDays).toEqual([]);
	});
});

describe('CreateTileActionsOptions - recurrence weekly days', () => {
	it('renders no day as pre-selected when weeklyDays is empty', async () => {
		renderWeeklyHarness({ initialDays: [] });
		expect(readDays()).toEqual([]);
	});

	it('user can select a weekday', async () => {
		const user = userEvent.setup();
		renderWeeklyHarness({ initialDays: [] });

		await user.click(screen.getByTitle(dayTitle('monday')));

		expect(readDays()).toContain(ScheduleRepeatWeekday.Monday);
	});

	it('user can select multiple weekdays independently', async () => {
		const user = userEvent.setup();
		renderWeeklyHarness({ initialDays: [] });

		await user.click(screen.getByTitle(dayTitle('monday')));
		await user.click(screen.getByTitle(dayTitle('wednesday')));
		await user.click(screen.getByTitle(dayTitle('friday')));

		const days = readDays();
		expect(days).toContain(ScheduleRepeatWeekday.Monday);
		expect(days).toContain(ScheduleRepeatWeekday.Wednesday);
		expect(days).toContain(ScheduleRepeatWeekday.Friday);
	});

	it('user can deselect a day when multiple are selected', async () => {
		const user = userEvent.setup();
		renderWeeklyHarness({
			initialDays: [ScheduleRepeatWeekday.Monday, ScheduleRepeatWeekday.Wednesday],
		});

		await user.click(screen.getByTitle(dayTitle('monday')));

		const days = readDays();
		expect(days).not.toContain(ScheduleRepeatWeekday.Monday);
		expect(days).toContain(ScheduleRepeatWeekday.Wednesday);
	});

	it('user can deselect the last remaining selected day (array becomes empty)', async () => {
		const user = userEvent.setup();
		renderWeeklyHarness({ initialDays: [ScheduleRepeatWeekday.Monday] });

		await user.click(screen.getByTitle(dayTitle('monday')));

		expect(readDays()).toEqual([]);
	});
});
