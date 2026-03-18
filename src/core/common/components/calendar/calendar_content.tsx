import calendarConfig from '@/core/constants/calendar_config';
import { HOURS_IN_DAY } from '@/core/common/utils/timeUtils';
import React from 'react';
import styled from 'styled-components';
import CalendarEvents, { CalendarBackgroundClickInfo, StyledEvent } from './calendar_events';
import dayjs from 'dayjs';
import { CalendarViewOptions } from './calendar.types';
import { ScheduleSubCalendarEvent } from '@/core/common/types/schedule';
import CurrentTimeIndicator from './current_time_indicator';

type CalendarContentProps = {
	// Events to display in the calendar
	events: ScheduleSubCalendarEvent[];
	// View options for the calendar
	viewOptions: CalendarViewOptions;
	// Selected event state
	selectedEvent: string | null;
	setSelectedEvent: React.Dispatch<React.SetStateAction<string | null>>;
	setSelectedEventInfo: React.Dispatch<React.SetStateAction<StyledEvent | null>>;
	// Ref for the calendar grid canvas
	calendarGridCanvasRef: React.RefObject<HTMLCanvasElement>;
	// Function to set styled non-viable events
	setStyledNonViableEvents: (events: StyledEvent[]) => void;
	// Function to provide background click info
	onBackgroundClick?: (info: CalendarBackgroundClickInfo) => void;
	/** Ref populated with all styled events for Calendar request handling */
	styledEventsRef?: React.MutableRefObject<StyledEvent[]>;
	/** Currently focused event ID (chat → calendar highlight) */
	focusedEventId?: string | null;
	/** Called when a viable event tile on the grid is clicked */
	onViableEventClicked?: () => void;
};

const CalendarContent: React.FC<CalendarContentProps> = ({
	events,
	viewOptions,
	selectedEvent,
	setSelectedEvent,
	setSelectedEventInfo,
	calendarGridCanvasRef,
	setStyledNonViableEvents,
	onBackgroundClick,
	styledEventsRef,
	focusedEventId,
	onViableEventClicked,
}) => {
	return (
		<Container>
			<StyledCalendarContent $cellwidth={viewOptions.width / viewOptions.daysInView}>
				{/* Background */}
				<CalendarBg ref={calendarGridCanvasRef} $width={viewOptions.width} />
				{/* Timeline */}
				{Array.from({ length: HOURS_IN_DAY }).map((_, hourIndex) => {
					return (
						<CalendarCellTime key={hourIndex} $hourindex={hourIndex}>
							<div>
								{/* eg. "8 AM" */}
								<span>{dayjs().hour(hourIndex).format('h A')}</span>
							</div>
						</CalendarCellTime>
					);
				})}
				{/* Current Time Indicator */}
				<CurrentTimeIndicator viewOptions={viewOptions} />
				{/* Events */}
				<CalendarEvents
					events={events}
					viewOptions={viewOptions}
					headerWidth={viewOptions.width}
					selectedEvent={selectedEvent}
					setSelectedEvent={setSelectedEvent}
					setSelectedEventInfo={setSelectedEventInfo}
					onNonViableEventsChange={(events) => setStyledNonViableEvents(events)}
					onBackgroundClick={onBackgroundClick}
					styledEventsRef={styledEventsRef}
					focusedEventId={focusedEventId}
					onViableEventClicked={onViableEventClicked}
				/>
			</StyledCalendarContent>
		</Container>
	);
};

const Container = styled.div`
	overflow-x: hidden;
	overflow-y: scroll;
	height: 100%;
	width: 100%;
`;

const StyledCalendarContent = styled.div<{ $cellwidth: number }>`
	width: 100%;
	height: ${parseInt(calendarConfig.CELL_HEIGHT) * HOURS_IN_DAY}px;
	position: relative;
	isolation: isolate;
`;

const CalendarBg = styled.canvas<{ $width: number }>`
	position: absolute;
	top: 0;
	left: ${calendarConfig.TIMELINE_WIDTH};
	width: ${({ $width }) => `${$width}px`};
	height: 100%;
	z-index: -1;
`;

const CalendarCellTime = styled.div<{ $hourindex: number }>`
	position: absolute;
	top: 0;
	left: 0;
	width: ${calendarConfig.TIMELINE_WIDTH};
	height: ${calendarConfig.CELL_HEIGHT};
	transform: translateY(${({ $hourindex: h }) => h * parseInt(calendarConfig.CELL_HEIGHT)}px);

	border-right: 1px solid ${({ theme }) => theme.colors.calendar.border};
	background-color: ${({ theme }) => theme.colors.calendar.sidebarBg};
	background-image: linear-gradient(
		to right,
		${({ theme }) => theme.colors.calendar.grid} 33%,
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
			top: 4px;
			right: 2px;
			font-size: ${({ theme }) => theme.typography.fontSize.xs};
			color: ${({ theme }) => theme.colors.gray[500]};
		}
	}
`;
export default CalendarContent;
