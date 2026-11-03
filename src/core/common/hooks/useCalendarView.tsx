import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { CalendarViewOptions } from '../components/calendar/calendar.types';
import calendarConfig from '../../constants/calendar_config';

function useCalendarView(
	viewRef: React.RefObject<HTMLUListElement>,
	containerWidth: number,
	chatExpanded?: boolean
) {
	const hasInitializedView = useRef(false);
	// State to manage view options
	const [viewOptions, setViewOptions] = useState<CalendarViewOptions>({
		width: 0,
		startDay: dayjs().startOf('day'),
		daysInView: 0,
	});

	useEffect(() => {
		const viewWidth = viewRef.current?.offsetWidth || 0;
		const daysInView = Math.floor(viewWidth / parseInt(calendarConfig.MIN_CELL_WIDTH));
		const centerToday = !hasInitializedView.current && daysInView > 0;
		if (centerToday) hasInitializedView.current = true;

		setViewOptions((prev) => ({
			...prev,
			width: viewWidth,
			daysInView,
			startDay: centerToday
				? dayjs()
						.startOf('day')
						.subtract(Math.floor(daysInView / 2), 'day')
				: prev.startDay,
		}));
	}, [containerWidth, viewRef.current, chatExpanded]);

	return {
		viewOptions,
		setViewOptions,
	};
}

export default useCalendarView;
