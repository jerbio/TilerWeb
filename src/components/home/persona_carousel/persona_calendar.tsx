import { useEffect, useRef, useState } from 'react';
import { ScheduleSubCalendarEvent } from '../../../types/schedule';
import Calendar from '../../shared/calendar/calendar';
import { ScheduleApi } from '../../../api/scheduleApi';
import TimeUtil from '../../../util/helpers/time';
import useCalendarView from '../../../hooks/useCalendarView';

type PersonaCalendarProps = {
	scheduleId: string;
	expandedWidth: number;
};

function PersonaCalendar({ expandedWidth: width, scheduleId }: PersonaCalendarProps) {
	const [events, setEvents] = useState<Array<ScheduleSubCalendarEvent>>([]);
	const [eventsLoading, setEventsLoading] = useState(true);

	// Get a reference to the view container
	const viewRef = useRef<HTMLUListElement>(null);
	const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

	// Fetch schedule data
	function fetchSchedule() {
		if (viewOptions.daysInView <= 0) return;

		const scheduleApi = new ScheduleApi();
		setEventsLoading(true);

		const startRange = viewOptions.startDay.valueOf();
		const endRange = startRange + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');

		scheduleApi
			.getScheduleLookupById(scheduleId, {
				startRange,
				endRange,
			})
			.then((scheduleLookup) => {
				if (scheduleLookup) {
					setEvents(scheduleLookup.subCalendarEvents);
				} else {
					console.error('No schedule found for the given ID');
				}
				setEventsLoading(false);
			});
	}
	useEffect(() => {
		fetchSchedule();
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
