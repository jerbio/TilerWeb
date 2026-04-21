import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import calendarConfig from '@/core/constants/calendar_config';
import { CalendarViewOptions } from './calendar.types';
import TimeUtil from '@/core/util/time';

type CurrentTimeIndicatorProps = {
	viewOptions: CalendarViewOptions;
};

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({ viewOptions }) => {
	const [now, setNow] = useState(TimeUtil.nowDayjs());

	useEffect(() => {
		const interval = setInterval(() => setNow(TimeUtil.nowDayjs()), 60_000);
		return () => clearInterval(interval);
	}, []);

	const viewStart = viewOptions.startDay.startOf('day');
	const viewEnd = viewStart.add(viewOptions.daysInView, 'day');

	// Only show if today falls within the visible range
	if (!now.isAfter(viewStart.subtract(1, 'second')) || !now.isBefore(viewEnd)) {
		return null;
	}

	const dayIndex = now.diff(viewStart, 'day');
	const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);
	const timelineWidth = parseInt(calendarConfig.TIMELINE_WIDTH);
	const hourFraction = now.hour() + now.minute() / 60;
	const top = hourFraction * cellHeight;
	const cellWidth = viewOptions.width / viewOptions.daysInView;
	const left = timelineWidth + dayIndex * cellWidth;

	return (
		<Indicator $top={top} $left={left} $width={cellWidth}>
			<Dot />
			<Line />
		</Indicator>
	);
};

const Indicator = styled.div<{ $top: number; $left: number; $width: number }>`
	position: absolute;
	top: ${({ $top }) => $top}px;
	left: ${({ $left }) => $left}px;
	width: ${({ $width }) => $width}px;
	z-index: 997;
	pointer-events: none;
	display: flex;
	align-items: center;
`;

const Dot = styled.div`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: ${({ theme }) => theme.colors.brand[400]};
	flex-shrink: 0;
	margin-left: -5px;
`;

const Line = styled.div`
	height: 2px;
	flex: 1;
	background-color: ${({ theme }) => theme.colors.brand[400]};
`;

export default CurrentTimeIndicator;
