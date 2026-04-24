import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import CreateTileSummary from '../summary';
import { InitialCreateTileFormState } from '..';
import dayjs from 'dayjs';
import { RGBColor } from '@/core/util/colors';
import {
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
	ScheduleRepeatType,
	ScheduleRepeatWeekday,
} from '@/core/common/types/schedule';
import { CreateTileRestrictionType } from '../../data';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({
		i18nKey,
		values,
	}: {
		i18nKey: string;
		values?: Record<string, unknown>;
		components?: Record<string, React.ReactNode>;
	}) => (
		<span data-testid={`trans-${i18nKey}`}>
			{i18nKey}
			{values && JSON.stringify(values)}
		</span>
	),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false }),
}));

function makeFormData(
	overrides: Partial<InitialCreateTileFormState> = {}
): InitialCreateTileFormState {
	return {
		action: 'Test Action',
		count: '1',
		location: 'Test Location',
		locationId: null,
		locationSource: '',
		locationIsVerified: false,
		locationTag: '',
		hasLocationNickname: false,
		locationNickname: '',
		durationHours: 1,
		durationMins: 30,
		isRecurring: false,
		start: dayjs('2026-04-20'),
		deadline: dayjs('2026-04-21'),
		color: new RGBColor({ r: 255, g: 159, b: 28 }),
		recurrenceType: ScheduleRepeatType.Daily,
		recurrenceFrequency: ScheduleRepeatFrequency.Daily,
		recurrenceWeeklyDays: [ScheduleRepeatWeekday.Sunday],
		recurrenceStartType: ScheduleRepeatStartType.Default,
		recurrenceStartDate: dayjs(),
		recurrenceEndType: ScheduleRepeatEndType.Never,
		recurrenceEndDate: dayjs().add(1, 'week'),
		isTimeRestricted: false,
		timeRestrictionType: CreateTileRestrictionType.Custom,
		customTimeRestrictionSchedule: [],
		timeRestrictionStart: '00:00',
		timeRestrictionEnd: '23:59',
		...overrides,
	};
}

function renderSummary(overrides: Partial<InitialCreateTileFormState> = {}) {
	const formData = makeFormData(overrides);
	render(
		<ThemeProvider theme={lightTheme}>
			<CreateTileSummary formData={formData} />
		</ThemeProvider>
	);
	return formData;
}

describe('CreateTileSummary – split display', () => {
	it('displays "once" when count is 1', () => {
		renderSummary({ count: '1', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.once');
		expect(splitTrans).toBeInTheDocument();
	});

	it('displays "twice" when count is 2', () => {
		renderSummary({ count: '2', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.twice');
		expect(splitTrans).toBeInTheDocument();
	});

	it('displays "3 times" when count is 3', () => {
		renderSummary({ count: '3', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.times');
		expect(splitTrans).toBeInTheDocument();
		expect(splitTrans.textContent).toContain('"count":3');
	});

	it('displays "5 times" when count is 5', () => {
		renderSummary({ count: '5', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.times');
		expect(splitTrans).toBeInTheDocument();
		expect(splitTrans.textContent).toContain('"count":5');
	});

	it('handles empty string count as 1 (once)', () => {
		renderSummary({ count: '', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.once');
		expect(splitTrans).toBeInTheDocument();
	});

	it('handles invalid count string as 1 (once)', () => {
		renderSummary({ count: 'invalid', isRecurring: false });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.once');
		expect(splitTrans).toBeInTheDocument();
	});

	it('displays split info when recurring', () => {
		renderSummary({ count: '3', isRecurring: true });
		const splitTrans = screen.getByTestId('trans-calendar.createTile.summary.split.times');
		expect(splitTrans).toBeInTheDocument();
		expect(splitTrans.textContent).toContain('"count":3');
	});
});

describe('CreateTileSummary – basic rendering', () => {
	it('renders the summary title', () => {
		renderSummary();
		expect(screen.getByText('calendar.createTile.summary.title')).toBeInTheDocument();
	});

	it('renders the description with action and location', () => {
		renderSummary({ action: 'Run Marathon', location: 'Central Park' });
		const descTrans = screen.getByTestId('trans-calendar.createTile.summary.description');
		expect(descTrans).toBeInTheDocument();
		expect(descTrans.textContent).toContain('"action":"Run Marathon"');
		expect(descTrans.textContent).toContain('"location":"Central Park"');
	});

	it('renders range when not recurring', () => {
		renderSummary({ isRecurring: false });
		const rangeTrans = screen.getByTestId('trans-calendar.createTile.summary.range');
		expect(rangeTrans).toBeInTheDocument();
	});

	it('renders recurrence info when recurring', () => {
		renderSummary({ isRecurring: true });
		const recurringTrans = screen.getByTestId('trans-calendar.createTile.summary.recurring');
		expect(recurringTrans).toBeInTheDocument();
	});
});
