import { ScheduleSubCalendarEvent } from '../../types/schedule';

const calendarEventUtil = {
	isInterseting: (eventA?: ScheduleSubCalendarEvent, eventB?: ScheduleSubCalendarEvent) => {
		if (!eventA || !eventB) return false;

		const startA = new Date(eventA.start);
		const endA = new Date(eventA.end);
		const startB = new Date(eventB.start);
		const endB = new Date(eventB.end);

		return !(startA >= endB || startB >= endA);
	},
};

export default calendarEventUtil;
