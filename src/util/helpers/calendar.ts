import dayjs from 'dayjs';
import { CalendarViewOptions } from '../../components/shared/calendar/calendar';
import calendarConfig from '../../components/shared/calendar/config';

type CalendarEventBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

class CalendarUtil {
	static getBoundingBox(
		s: dayjs.Dayjs,
		e: dayjs.Dayjs,
		viewOptions: CalendarViewOptions,
		headerWidth: number,
		options: {
			minCellHeight?: number;
		} = {}
	): CalendarEventBox {
		const viewBox: CalendarEventBox = {
			x: 0,
			y: 0,
			width: headerWidth,
			height: parseInt(calendarConfig.CELL_HEIGHT) * 24, // 24 hours
		};

		const startHourFraction = s.hour() + s.minute() / 60;
		const endHourFraction = e.hour() + e.minute() / 60;
		const dayIndex = s.diff(viewOptions.startDay.startOf('day'), 'day');

		// Positioning the event based on the day index and width
		const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);
		const minCellHeight = options.minCellHeight || parseInt(calendarConfig.MIN_CELL_HEIGHT);
		const width = headerWidth / viewOptions.daysInView;
		const x = dayIndex * width;
		const y = cellHeight * startHourFraction;
		const maxCellHeight = viewBox.height - y;
		const height = Math.min(
			maxCellHeight,
			Math.max(cellHeight * (endHourFraction - startHourFraction), minCellHeight)
		);

		return { x, y, width, height };
	}

	static isInterseting(eventA: CalendarEventBox, eventB: CalendarEventBox): boolean {
		// Check if the bounding boxes of two events intersect
		return !(
			eventA.x + eventA.width <= eventB.x ||
			eventA.x >= eventB.x + eventB.width ||
			eventA.y + eventA.height <= eventB.y ||
			eventA.y >= eventB.y + eventB.height
		);
	}
}

export default CalendarUtil;
