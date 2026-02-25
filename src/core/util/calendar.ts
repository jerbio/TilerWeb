import dayjs from 'dayjs';
import { CalendarViewOptions } from '@/core/common/components/calendar/calendar';
import calendarConfig from '@/core/constants/calendar_config';
import { ScheduleLookupTravelDetail, ScheduleSubCalendarEvent } from '@/core/common/types/schedule';

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

	/**
	 * Check if two calendar event bounding boxes intersect.
	 * @deprecated Use `isIntersecting` instead (correct spelling)
	 */
	static isInterseting(eventA: CalendarEventBox, eventB: CalendarEventBox): boolean {
		return CalendarUtil.isIntersecting(eventA, eventB);
	}

	/**
	 * Check if two calendar event bounding boxes intersect.
	 * Uses a 15px vertical overlap tolerance to avoid false positives for adjacent events.
	 */
	static isIntersecting(eventA: CalendarEventBox, eventB: CalendarEventBox): boolean {
		const verticalOverlapTolerance = 15;
		// Check if the bounding boxes of two events intersect
		const res = !(
			eventA.x + eventA.width <= eventB.x ||
			eventA.x >= eventB.x + eventB.width ||
			eventA.y + eventA.height <= eventB.y + verticalOverlapTolerance ||
			eventA.y >= eventB.y + eventB.height - verticalOverlapTolerance
		);
		return res;
	}

	static getEventLocationLink(event: ScheduleSubCalendarEvent) {
		if (event.location?.address) {
			return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
				event.location.address
			)}`;
		}
		return '#';
	}

	static getTravelDetailDirectionLink(detail: ScheduleLookupTravelDetail) {
		const startAddress = detail?.startLocation?.address;
		const endAddress = detail?.endLocation?.address;

		if (startAddress && endAddress) {
			return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
				startAddress
			)}&destination=${encodeURIComponent(endAddress)}`;
		} else if (endAddress) {
			return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endAddress)}`;
		} else if (startAddress) {
			return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(startAddress)}`;
		}
		return '#';
	}
}

export default CalendarUtil;
