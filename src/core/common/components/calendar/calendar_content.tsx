import calendarConfig from '@/core/constants/calendar_config';
import React from 'react';
import styled from 'styled-components';
import CalendarEvents, { StyledEvent } from './calendar_events';
import dayjs from 'dayjs';
import { CalendarViewOptions } from './calendar';
import { ScheduleSubCalendarEvent } from '@/core/common/types/schedule';
import palette from '@/core/theme/palette';

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
	/** Ref populated with all styled events for Calendar request handling */
	styledEventsRef?: React.MutableRefObject<StyledEvent[]>;
	/** Currently focused event ID (chat → calendar highlight) */
	focusedEventId?: string | null;
};

const CalendarContent: React.FC<CalendarContentProps> = ({
	events,
	viewOptions,
	selectedEvent,
	setSelectedEvent,
	setSelectedEventInfo,
	calendarGridCanvasRef,
	setStyledNonViableEvents,
	styledEventsRef,
	focusedEventId,
}) => {
  return (
    <Container>
      <StyledCalendarContent $cellwidth={viewOptions.width / viewOptions.daysInView}>
        {/* Background */}
        <CalendarBg ref={calendarGridCanvasRef} $width={viewOptions.width} />
        {/* Timeline */}
        {Array.from({ length: 24 }).map((_, hourIndex) => {
          return (
            <CalendarCellTime key={hourIndex} $hourindex={hourIndex}>
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
          headerWidth={viewOptions.width}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          setSelectedEventInfo={setSelectedEventInfo}
          onNonViableEventsChange={(events) => setStyledNonViableEvents(events)}
          styledEventsRef={styledEventsRef}
          focusedEventId={focusedEventId}
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
	height: ${parseInt(calendarConfig.CELL_HEIGHT) * 24}px; /* 24 hours */
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
			font-size: ${palette.typography.fontSize.xs};
			color: ${palette.colors.gray[500]};
		}
	}
`;
export default CalendarContent;
