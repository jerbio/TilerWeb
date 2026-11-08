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
		const view = viewRef.current;
		if (!view) return;
		const measure = () => {
			// The header reserves the same scrollbar gutter as the grid. Measure
			// its usable width so tiles, travel bands and day headings agree.
			const viewWidth = view.clientWidth;
			if (viewWidth <= 0) return;
			const daysInView = Math.max(
				1,
				Math.floor(viewWidth / parseInt(calendarConfig.MIN_CELL_WIDTH))
			);
			const centerToday = !hasInitializedView.current;
			if (centerToday) hasInitializedView.current = true;

			setViewOptions((prev) => {
				if (prev.width === viewWidth && prev.daysInView === daysInView && !centerToday)
					return prev;
				return {
					...prev,
					width: viewWidth,
					daysInView,
					startDay: centerToday
						? dayjs()
								.startOf('day')
								.subtract(Math.floor(daysInView / 2), 'day')
						: prev.startDay,
				};
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(view);
		return () => observer.disconnect();
	}, [containerWidth, viewRef, chatExpanded]);

	return {
		viewOptions,
		setViewOptions,
	};
}

export default useCalendarView;
