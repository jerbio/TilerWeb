import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import calendarConfig from './config';
import CalendarEvents from './calendar_events';
import dummySchedule from '../../../data/dummySchedule';
import { animated, useSpring } from '@react-spring/web';

const CalendarContainer = styled.div<{ mounted: boolean }>`
	position: relative;
	width: 100%;
	height: 100%;
	background-color: ${styles.colors.gray[900]};
	opacity: ${({ mounted }) => (mounted ? 1 : 0)};
	transition: opacity 0.3s 0.5s ease-in-out;
`;

const CalendarHeader = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: ${calendarConfig.HEADER_HEIGHT};
	background-color: ${styles.colors.gray[800]};

	display: flex;
`;

const CalendarHeaderActions = styled.div`
	width: ${calendarConfig.TIMELINE_WIDTH};
	height: 100%;
	display: flex;
	align-items: center;
	overflow: hidden;
	border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	border-top: 1px solid ${calendarConfig.BORDER_COLOR};
	border-radius: 0 ${styles.borderRadius.medium} 0 0;
	background-color: #1f1f1f;
`;

const ChangeViewButton = styled.button`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background-color: transparent;
	color: ${styles.colors.gray[400]};
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:hover {
		background-color: ${styles.colors.gray[800]};
		color: ${styles.colors.gray[200]};
	}

	&:active {
		background-color: ${styles.colors.gray[700]};
	}
`;

const CalendarHeaderDateList = styled.ul`
	display: flex;
	flex-direction: row;
	height: 100%;
	flex: 1;
`;

const CalendarHeaderDateItem = styled.li<{ today: boolean }>`
	flex: 1;
	font-family: ${styles.typography.fontFamily.urban};
	font-weight: ${styles.typography.fontWeight.bold};
	font-size: ${styles.typography.fontSize.lg};
	text-transform: uppercase;
	color: ${styles.colors.gray[400]};

	&:not(:last-child) {
		border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	}

	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5ch;

	span {
		color: ${({ today }) => (today ? styles.colors.brand[400] : styles.colors.gray[200])};
	}
`;

const CalendarContentContainer = styled.div`
	position: absolute;
	overflow-x: hidden;
	overflow-y: scroll;
	top: ${calendarConfig.HEADER_HEIGHT};
	bottom: 0;
	left: 0;
	width: 100%;
`;

const CalendarContent = styled(animated.div)`
	width: 100%;
	position: relative;
	isolation: isolate;
`;

const CalendarCellBg = styled(animated.div)<{
	width: number;
	dayIndex: number;
}>`
	position: absolute;
	width: ${({ width }) => width}px;
	top: 0;
	left: calc(${({ dayIndex, width }) => dayIndex * width}px + ${calendarConfig.TIMELINE_WIDTH});
	z-index: -1;

	border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	background-image: linear-gradient(to right, #2a2a2a 33%, rgba(255, 255, 255, 0) 0%);
	background-position: bottom;
	background-size: 12px 1px;
	background-repeat: repeat-x;
`;

const CalendarCellTime = styled(animated.div)`
	position: absolute;
	top: 0;
	left: 0;
	width: ${calendarConfig.TIMELINE_WIDTH};

	border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	background-color: #1f1f1f;
	background-image: linear-gradient(to right, #2a2a2a 33%, rgba(255, 255, 255, 0) 0%);
	background-position: bottom;
	background-size: 12px 1px;
	background-repeat: repeat-x;

	div {
		height: 100%;
		width: 100%;
		position: relative;

		span {
			position: absolute;
			line-height: 1;
			top: 4px;
			right: 2px;
			font-size: ${styles.typography.fontSize.xs};
			color: ${styles.colors.gray[500]};
		}
	}
`;

export type CalendarViewOptions = {
	startDay: dayjs.Dayjs;
	daysInView: number;
};
type CalendarProps = {
	width: number;
};
const Calendar = ({ width }: CalendarProps) => {
	// State to manage the width of the header
	const [headerWidth, setHeaderWidth] = useState(0);
	const calendarHeaderDateListRef = useRef<HTMLUListElement>(null);
	useEffect(() => {
		if (calendarHeaderDateListRef.current) {
			setHeaderWidth(calendarHeaderDateListRef.current.offsetWidth);
		}
	}, [width, calendarHeaderDateListRef.current]);

	// State to manage view options
	const [startDay, setStartDay] = useState(dayjs());
	const viewOptions = useMemo<CalendarViewOptions>(() => {
		const daysInView = Math.floor(headerWidth / parseInt(calendarConfig.HEADER_DATE_MIN_WIDTH));
		return {
			startDay,
			daysInView,
		};
	}, [headerWidth, startDay]);
	function changeDayView(dir: 'left' | 'right') {
    
		setStartDay((prev) => {
			return prev.add((dir === 'left' ? -1 : 1) * viewOptions.daysInView, 'day');
		});
	}

	const [cellHeight, setCellHeight] = useState(parseInt(calendarConfig.MIN_CELL_HEIGHT));
	const { height: cellHeightAnimated } = useSpring({
		height: cellHeight,
		config: { tension: 300, friction: 30 },
	});

	const isMounted = headerWidth > 0;
	const events = useMemo(() => {
		// TODO: Fetch events from an API or state management
		// For now, we will use dummy data
		const events = dummySchedule.Content.subCalendarEvents;
		return events;
	}, []);
	const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

	return (
		<CalendarContainer mounted={isMounted}>
			<CalendarHeader>
				<CalendarHeaderActions>
					<ChangeViewButton onClick={() => changeDayView('left')}>
						<ChevronLeftIcon size={16} />
					</ChangeViewButton>
					<ChangeViewButton onClick={() => changeDayView('right')}>
						<ChevronRightIcon size={16} />
					</ChangeViewButton>
				</CalendarHeaderActions>
				<CalendarHeaderDateList ref={calendarHeaderDateListRef}>
					{Array.from({ length: viewOptions.daysInView }).map((_, index) => {
						const date = viewOptions.startDay.add(index, 'day');
						return (
							<CalendarHeaderDateItem key={index} today={date.isSame(dayjs(), 'day')}>
								{/* 3 letter day */}
								<h3>{date.format('ddd')}</h3>
								{/* 2 number date */}
								<span>{date.format('DD')}</span>
							</CalendarHeaderDateItem>
						);
					})}
				</CalendarHeaderDateList>
			</CalendarHeader>
			<CalendarContentContainer>
				<CalendarContent style={{ height: cellHeightAnimated.to((h) => `${h * 24}px`) }}>
					{/* Background */}
					{(
						Array.from({ length: viewOptions.daysInView }).fill(
							Array.from({ length: 24 }).fill(null)
						) as null[][]
					).map((day, dayIndex) => {
						return day.map((_, hourIndex) => {
							return (
								<CalendarCellBg
									key={`${dayIndex}-${hourIndex}`}
									dayIndex={dayIndex}
									width={headerWidth / viewOptions.daysInView}
									style={{
										height: cellHeightAnimated,
										y: cellHeightAnimated.to((h) => `${hourIndex * h}px`),
									}}
								/>
							);
						});
					})}
					{/* Timeline */}
					{Array.from({ length: 24 }).map((_, hourIndex) => {
						return (
							<CalendarCellTime
								key={hourIndex}
								style={{
									height: cellHeightAnimated,
									y: cellHeightAnimated.to((h) => `${hourIndex * h}px`),
								}}
							>
								<div>
									{/* eg. "8 AM" */}
									<span>{dayjs().hour(hourIndex).format('h A')}</span>
								</div>
							</CalendarCellTime>
						);
					})}
					{/* Events */}
					<CalendarEvents
						events={events}
						viewOptions={viewOptions}
						headerWidth={headerWidth}
						selectedEvent={selectedEvent}
						setSelectedEvent={setSelectedEvent}
            cellHeight={cellHeight}
            cellHeightAnimated={cellHeightAnimated}
            setCellHeight={setCellHeight}
					/>
				</CalendarContent>
			</CalendarContentContainer>
		</CalendarContainer>
	);
};

export default Calendar;

