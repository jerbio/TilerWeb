import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarUIProvider, useCalendarUI } from '../calendar-ui.provider';
import { CalendarWrapper } from '../calendar_wrapper';
import { CalendarViewOptions } from '../calendar.types';
import { SubCalendarEvent } from '@/core/common/types/schedule';

const mocks = vi.hoisted(() => ({
	calendar: vi.fn(),
	refetchEvents: vi.fn(),
	setViewOptions: vi.fn(),
	useCalendarView: vi.fn(),
	usePrefetchedCalendarData: vi.fn(),
	useScheduleSocket: vi.fn(),
}));

vi.mock('@/core/common/components/calendar/calendar', () => ({
	default: (props: unknown) => {
		mocks.calendar(props);
		return null;
	},
}));

vi.mock('@/core/common/hooks/useCalendarView', () => ({
	default: (...args: unknown[]) => mocks.useCalendarView(...args),
}));

vi.mock('@/core/common/hooks/usePrefetchedCalendarEvents', () => ({
	default: (...args: unknown[]) => mocks.usePrefetchedCalendarData(...args),
}));

vi.mock('@/hooks/useScheduleSocket', () => ({
	useScheduleSocket: (...args: unknown[]) => mocks.useScheduleSocket(...args),
}));

function ViewInfoProbe() {
	const viewInfo = useCalendarUI((state) => state.viewInfo);
	return (
		<div data-testid="view-info">
			{viewInfo.startDay.format('YYYY-MM-DD')}:{viewInfo.daysInView}
		</div>
	);
}

function renderWrapper() {
	return render(
		<CalendarUIProvider demoMode={false}>
			<CalendarWrapper chatExpanded userId="user-1" width={720} allowEventLookup={false} />
			<ViewInfoProbe />
		</CalendarUIProvider>
	);
}

describe('CalendarWrapper', () => {
	const viewOptions: CalendarViewOptions = {
		width: 720,
		startDay: dayjs('2026-05-05'),
		daysInView: 3,
	};
	const events: SubCalendarEvent[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useCalendarView.mockReturnValue({
			viewOptions,
			setViewOptions: mocks.setViewOptions,
		});
		mocks.usePrefetchedCalendarData.mockReturnValue({
			events,
			loading: true,
			refetchEvents: mocks.refetchEvents,
		});
	});

	it('wires calendar hooks into Calendar and publishes view info', async () => {
		renderWrapper();

		expect(mocks.useCalendarView).toHaveBeenCalledWith(expect.any(Object), 720, true);
		expect(mocks.usePrefetchedCalendarData).toHaveBeenCalledWith({
			userId: 'user-1',
			viewOptions,
			daysInView: 3,
		});
		expect(mocks.useScheduleSocket).toHaveBeenCalledWith(mocks.refetchEvents);
		expect(mocks.calendar).toHaveBeenCalledWith(
			expect.objectContaining({
				allowEventLookup: false,
				events,
				eventsLoading: true,
				refetchEvents: mocks.refetchEvents,
				setViewOptions: mocks.setViewOptions,
				viewOptions,
			})
		);

		await waitFor(() => {
			expect(screen.getByTestId('view-info')).toHaveTextContent('2026-05-05:3');
		});
	});
});
