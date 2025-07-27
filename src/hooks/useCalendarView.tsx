import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { CalendarViewOptions } from '../components/shared/calendar/calendar';
import calendarConfig from '../components/shared/calendar/config';

function useCalendarView(viewRef: React.RefObject<HTMLUListElement>, containerWidth: number) {
	// State to manage view options
	const [viewOptions, setViewOptions] = useState<CalendarViewOptions>({
		width: 0,
		startDay: dayjs().startOf('day'),
		daysInView: 0,
	});

	useEffect(() => {
		const viewWidth = viewRef.current?.offsetWidth || 0;
		const daysInView = Math.floor(viewWidth / parseInt(calendarConfig.MIN_CELL_WIDTH));
		setViewOptions((prev) => ({
			...prev,
			width: viewWidth,
			daysInView,
		}));
	}, [containerWidth, viewRef.current]);

	return {
		viewOptions,
		setViewOptions,
	};
}

export default useCalendarView;
