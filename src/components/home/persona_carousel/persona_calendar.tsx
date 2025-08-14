import React from 'react';
import { useEffect, useState } from 'react';
import { ScheduleSubCalendarEvent } from '../../../core/common/types/schedule';
import Calendar from '../../../core/common/components/calendar/calendar';
import TimeUtil from '../../../core/util/time';
import useCalendarView from '../../../core/common/hooks/useCalendarView';
import { scheduleService } from '@/services';

type PersonaCalendarProps = {
	scheduleId: string | null;
	expandedWidth: number;
};

function PersonaCalendar({ expandedWidth: width, scheduleId }: PersonaCalendarProps) {
	const [events, setEvents] = useState<Array<ScheduleSubCalendarEvent>>([]);
	const [eventsLoading, setEventsLoading] = useState(true);

	// Get a reference to the view container
	const viewRef = React.useRef<HTMLUListElement>(null);
	const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

	// Fetch schedule data
	async function fetchSchedule(id: string) {
		if (viewOptions.daysInView <= 0) return;
		const startRange = viewOptions.startDay.valueOf();
		const endRange = startRange + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');

		setEventsLoading(true);
		const scheduleLookup = await scheduleService.getScheduleLookupById(id, {
			startRange,
			endRange,
		});
		if (scheduleLookup) {
			setEvents(scheduleLookup.subCalendarEvents);
		}
		setEventsLoading(false);
	}

	useEffect(() => {
		if (scheduleId) {
			fetchSchedule(scheduleId);
		}
	}, [scheduleId, viewOptions.daysInView, viewOptions.startDay]);

	return (
		<Calendar
			viewOptions={viewOptions}
			setViewOptions={setViewOptions}
			events={events}
			eventsLoading={eventsLoading}
			viewRef={viewRef}
		/>
	);
}

export default PersonaCalendar;
