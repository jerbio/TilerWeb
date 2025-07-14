import { DummyScheduleEventType } from '../../data/dummySchedule';

const calendarEventUtil = {
	isInterseting: (eventA?: DummyScheduleEventType, eventB?: DummyScheduleEventType) => {
		if (!eventA || !eventB) return false;

		const startA = new Date(eventA.start);
		const endA = new Date(eventA.end);
		const startB = new Date(eventB.start);
		const endB = new Date(eventB.end);

		return !(startA >= endB || startB >= endA);
	},
};

export default calendarEventUtil;
