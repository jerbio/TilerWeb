import React, { useRef } from 'react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import calendarConfig from './config';
import CalendarEvents from './calendar_events';
import { ScheduleSubCalendarEvent } from '../../../types/schedule';
import Spinner from '../loader';

const CalendarContainer = styled.div<{ $isMounted: boolean }>`
	position: relative;
	width: 100%;
	height: 100%;
	background-color: ${styles.colors.gray[900]};
	opacity: ${({ $isMounted }) => ($isMounted ? 1 : 0)};
	transition: opacity 0.3s 0.5s ease-in-out;
	user-select: none;
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

	&:not(:disabled) {
		&:hover {
			background-color: ${styles.colors.gray[800]};
			color: ${styles.colors.gray[200]};
		}

		&:active {
			background-color: ${styles.colors.gray[700]};
		}
	}
`;

const CalendarHeaderDateList = styled.ul`
	display: flex;
	flex-direction: row;
	height: 100%;
	flex: 1;
`;

const CalendarHeaderDateItem = styled.li<{ $isToday: boolean }>`
	flex: 1;
	font-family: ${styles.typography.fontFamily.urban};
	font-weight: ${styles.typography.fontWeight.bold};
	font-size: ${styles.typography.fontSize.lg};
	text-transform: uppercase;
	color: ${({ $isToday }) => ($isToday ? styles.colors.white : styles.colors.gray[400])};

	&:not(:last-child) {
		border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	}

	background-color: ${({ $isToday }) => ($isToday ? styles.colors.gray[700] : 'transparent')};
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5ch;

	span {
		color: ${({ $isToday }) => ($isToday ? styles.colors.brand[400] : styles.colors.gray[200])};
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

const CalendarContent = styled.div<{ $cellwidth: number }>`
	width: 100%;
	height: ${parseInt(calendarConfig.CELL_HEIGHT) * 24}px; /* 24 hours */
	position: relative;
	isolation: isolate;
`;

const CalendarBg = styled.canvas`
	position: absolute;
	top: 0;
	left: ${calendarConfig.TIMELINE_WIDTH};
	width: calc(100% - ${calendarConfig.TIMELINE_WIDTH});
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
			font-size: ${styles.typography.fontSize.xs};
			color: ${styles.colors.gray[500]};
		}
	}
`;

const LoadingContainer = styled.div<{ $loading: boolean }>`
	position: absolute;
	top: ${calendarConfig.HEADER_HEIGHT};
	bottom: 0;
	left: 0;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	opacity: ${({ $loading }) => ($loading ? 1 : 0)};
	pointer-events: ${({ $loading }) => ($loading ? 'auto' : 'none')};
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	transition: opacity 0.3s ease-in-out;
`;

export type CalendarViewOptions = {
  width: number;
  startDay: dayjs.Dayjs;
  daysInView: number;
};

type CalendarProps = {
  events: Array<ScheduleSubCalendarEvent>;
  eventsLoading: boolean;
  viewRef: React.RefObject<HTMLUListElement>;
  viewOptions: CalendarViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<CalendarViewOptions>>;
};

const Calendar = ({
  events,
  eventsLoading,
  viewRef,
  viewOptions,
  setViewOptions,
}: CalendarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  useEffect(() => {
    // Reset selected event when events change
    setSelectedEvent(null);
  }, [events]);

  const contentMounted = viewOptions.width > 0;

  function changeDayView(dir: 'left' | 'right') {
    const changeAmount = dir === 'left' ? -1 : 1;
    setViewOptions((prev) => {
      const newStartDay = prev.startDay.add(changeAmount * prev.daysInView, 'day');
      return {
        ...prev,
        startDay: newStartDay,
      };
    });
  }

  const calendarGridCanvasRef = useRef<HTMLCanvasElement>(null);
  function resizeCanvas(canvas: HTMLCanvasElement, width: number) {
    canvas.width = width;
    canvas.height = parseInt(calendarConfig.CELL_HEIGHT) * 24;
  }
  function drawCalendarGrid(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    daysInView: number,
    cellHeight: number
  ) {
    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellWidth = width / daysInView;
    const gridColor = styles.colors.gray[700];
    const dashLength = 4;
    const dashGap = 8;
    const thickness = 0.5;

    // Draw solid vertical lines
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
		ctx.lineWidth = thickness;
    for (let x = cellWidth; x < canvas.width; x += cellWidth) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();

    // Draw dashed horizontal lines
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
		ctx.lineWidth = thickness;
    ctx.setLineDash([dashLength, dashGap]);
    for (let y = cellHeight; y < canvas.height; y += cellHeight) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    // Reset the line dash to solid for any future drawing
    ctx.setLineDash([]);
  }

  useEffect(() => {
    if (calendarGridCanvasRef.current) {
      const canvas = calendarGridCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        resizeCanvas(canvas, viewOptions.width);
        drawCalendarGrid(
          canvas,
          ctx,
          viewOptions.width,
          viewOptions.daysInView,
          parseInt(calendarConfig.CELL_HEIGHT)
        );
      }
    }
  }, [viewOptions.width]);

  return (
    <CalendarContainer $isMounted={contentMounted}>
      <CalendarHeader>
        <CalendarHeaderActions>
          <ChangeViewButton
            disabled={eventsLoading}
            onClick={() => changeDayView('left')}
          >
            <ChevronLeftIcon size={16} />
          </ChangeViewButton>
          <ChangeViewButton
            disabled={eventsLoading}
            onClick={() => changeDayView('right')}
          >
            <ChevronRightIcon size={16} />
          </ChangeViewButton>
        </CalendarHeaderActions>
        <CalendarHeaderDateList ref={viewRef}>
          {Array.from({ length: viewOptions.daysInView }).map((_, index) => {
            const day = viewOptions.startDay.add(index, 'day');
            return (
              <CalendarHeaderDateItem
                key={index}
                $isToday={day.isSame(dayjs(), 'day')}
              >
                {/* 3 letter day */}
                <h3>{day.format('ddd')}</h3>
                {/* 2 number date */}
                <span>{day.format('DD')}</span>
              </CalendarHeaderDateItem>
            );
          })}
        </CalendarHeaderDateList>
      </CalendarHeader>

      <LoadingContainer $loading={eventsLoading}>
        <Spinner />
      </LoadingContainer>
      <CalendarContentContainer id="calendar-content-container">
        <CalendarContent $cellwidth={viewOptions.width / viewOptions.daysInView}>
          {/* Background */}
          <CalendarBg ref={calendarGridCanvasRef} />
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
          />
        </CalendarContent>
      </CalendarContentContainer>
    </CalendarContainer>
  );
};

export default Calendar;
