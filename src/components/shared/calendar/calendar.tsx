import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const CALENDAR_HEADER_DATE_MIN_WIDTH = '150px';
const CALENDAR_HEADER_HEIGHT = '34px';
const CALENDAR_TIMELINE_WIDTH = '70px';
const CALENDAR_BORDER_COLOR = styles.colors.gray[700];

const CALENDAR_CELL_HEIGHT = '80px';

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
	height: ${CALENDAR_HEADER_HEIGHT};
	background-color: ${styles.colors.gray[800]};

	display: flex;
`;

const CalendarHeaderActions = styled.div`
	width: ${CALENDAR_TIMELINE_WIDTH};
	height: 100%;
	display: flex;
	align-items: center;
	overflow: hidden;
	border-right: 1px solid ${CALENDAR_BORDER_COLOR};
	border-top: 1px solid ${CALENDAR_BORDER_COLOR};
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
		border-right: 1px solid ${CALENDAR_BORDER_COLOR};
	}

	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5ch;

	span {
		color: ${({ today }) =>
			today ? styles.colors.brand[400] : styles.colors.gray[200]};
	}
`;

const CalendarContentContainer = styled.div`
	position: absolute;
	overflow-y: scroll;
	top: ${CALENDAR_HEADER_HEIGHT};
	bottom: 0;
	left: 0;
	width: 100%;
`;

const CalendarContent = styled.div<{ height: number }>`
	width: 100%;
	height: ${({ height }) => height}px;
	position: relative;
	isolation: isolate;
`;

const CalendarCellBg = styled.div<{
	width: number;
	dayIndex: number;
	hourIndex: number;
}>`
	position: absolute;
	width: ${({ width }) => width}px;
	height: ${CALENDAR_CELL_HEIGHT};
	top: ${({ hourIndex }) => hourIndex * parseInt(CALENDAR_CELL_HEIGHT)}px;
	left: calc(${({ dayIndex, width }) => dayIndex * width}px + ${CALENDAR_TIMELINE_WIDTH});
	z-index: -1;

	border-right: 1px solid ${CALENDAR_BORDER_COLOR};
	background-image: linear-gradient(
		to right,
		#2a2a2a 33%,
		rgba(255, 255, 255, 0) 0%
	);
	background-position: bottom;
	background-size: 12px 1px;
	background-repeat: repeat-x;
`;

const CalendarCellTime = styled.div<{ hourIndex: number }>`
	position: absolute;
	top: ${({ hourIndex }) => hourIndex * parseInt(CALENDAR_CELL_HEIGHT)}px;
	left: 0;
	width: ${CALENDAR_TIMELINE_WIDTH};
	height: ${CALENDAR_CELL_HEIGHT};

	border-right: 1px solid ${CALENDAR_BORDER_COLOR};
	background-color: #1f1f1f;
	background-image: linear-gradient(
		to right,
		#2a2a2a 33%,
		rgba(255, 255, 255, 0) 0%
	);
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
      top: 2px;
      right: 2px;
      font-size: ${styles.typography.fontSize.xs};
      color: ${styles.colors.gray[500]};
    }
	}
`;

type CalendarProps = {
	width: number;
};
const Calendar = ({ width }: CalendarProps) => {
	const [headerWidth, setHeaderWidth] = useState(0);
	const [startDay, setStartDay] = useState(dayjs().startOf('week'));
	const viewOptions = useMemo(() => {
    const daysInView = Math.floor(
      headerWidth / parseInt(CALENDAR_HEADER_DATE_MIN_WIDTH)
		);
    console.log('Days in view:', daysInView, headerWidth);
		return {
			startDay,
			daysInView,
		};
	}, [headerWidth, startDay]);

	const calendarHeaderDateListRef = useRef<HTMLUListElement>(null);
	useEffect(() => {
		if (calendarHeaderDateListRef.current) {
			setHeaderWidth(calendarHeaderDateListRef.current.offsetWidth);
		}
	}, [width, calendarHeaderDateListRef.current]);

	function changeDayView(dir: 'left' | 'right') {
		setStartDay((prev) => {
			return prev.add(
				(dir === 'left' ? -1 : 1) * viewOptions.daysInView,
				'day'
			);
		});
	}

  const isMounted = headerWidth > 0;

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
					{Array.from({ length: viewOptions.daysInView }).map(
						(_, index) => {
							const date = viewOptions.startDay.add(index, 'day');
							return (
								<CalendarHeaderDateItem
									key={index}
									today={date.isSame(dayjs(), 'day')}
								>
									{/* 3 letter day */}
									<h3>{date.format('ddd')}</h3>
									{/* 2 number date */}
									<span>{date.format('DD')}</span>
								</CalendarHeaderDateItem>
							);
						}
					)}
				</CalendarHeaderDateList>
			</CalendarHeader>
			<CalendarContentContainer>
				<CalendarContent height={parseInt(CALENDAR_CELL_HEIGHT) * 24}>
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
									hourIndex={hourIndex}
									width={headerWidth / viewOptions.daysInView}
								/>
							);
						});
					})}
					{/* Timeline */}
					{Array.from({ length: 24 }).map((_, hourIndex) => {
						return (
							<CalendarCellTime
								key={hourIndex}
								hourIndex={hourIndex}
							>
								<div>
									{/* eg. "8 AM" */}
									<span>
										{dayjs().hour(hourIndex).format('h A')}
									</span>
								</div>
							</CalendarCellTime>
						);
					})}
				</CalendarContent>
			</CalendarContentContainer>
		</CalendarContainer>
	);
};

export default Calendar;

