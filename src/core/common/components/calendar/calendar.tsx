import React, { useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, Info, TriangleAlert } from 'lucide-react';
import styled, { useTheme } from 'styled-components';
import calendarConfig from '@/core/constants/calendar_config';
import {
  CalendarBackgroundClickInfo,
  StyledEvent,
} from '@/core/common/components/calendar/calendar_events';
import {
  ScheduleRepeatEndType,
  ScheduleRepeatFrequency,
  ScheduleRepeatStartType,
  ScheduleRepeatType,
  ScheduleRepeatWeekday,
  ScheduleSubCalendarEvent,
} from '@/core/common/types/schedule';
import Loader from '../loader';
import CalendarEvent from './calendar_event';
import Tooltip from '../tooltip';
import analytics from '@/core/util/analytics';
import TimeUtil from '@/core/util/time';
import CalendarEventInfo from './calendar_event_info';
import { a, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import CalendarContent from './calendar_content';
import { useCalendarRequestListener } from './CalendarRequestProvider';
import {
  createCalendarRequestHandler,
  retryPendingFocus,
  PendingFocus,
} from './calendarRequestHandler';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import CalendarContentDummy from './calendar_content_dummy';
import useIsMobile from '../../hooks/useIsMobile';
import CalendarCreateTile, { InitialCreateTileFormState } from './create_tile';
import { RGBColor } from '@/core/util/colors';
import useFormHandler from '@/hooks/useFormHandler';
import { createPortal } from 'react-dom';

import { CalendarViewOptions } from './calendar.types';
import { useCalendarUI } from './calendar-ui.provider';
import { eventColorOptions } from './data';
export type { CalendarViewOptions } from './calendar.types';

type CalendarProps = {
  events: Array<ScheduleSubCalendarEvent>;
  eventsLoading: boolean;
  viewRef: React.RefObject<HTMLUListElement>;
  viewOptions: CalendarViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<CalendarViewOptions>>;
  refetchEvents: () => Promise<void>;
  /** When false, skip REST-based event lookup (Phase 4) and fall back to cached-event search only. Defaults to true. */
  allowEventLookup?: boolean;
};

const Calendar = ({
  events,
  eventsLoading,
  viewRef,
  viewOptions,
  setViewOptions,
  refetchEvents,
  allowEventLookup = true,
}: CalendarProps) => {
  const { t } = useTranslation();
  const viableEvents = events.filter((event) => event.isViable);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventInfo, setSelectedEventInfo] = useState<StyledEvent | null>(null);
  const theme = useTheme();
  const { createTile } = useCalendarUI((state) => state);

  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const [styledNonViableEvents, setStyledNonViableEvents] = useState<Array<StyledEvent>>([]);
  const [showNonViableEvents, setShowNonViableEvents] = useState<dayjs.Dayjs | null>(null);

  // Ref holding all styled events (populated by CalendarEvents)
  const styledEventsRef = useRef<StyledEvent[]>([]);

  // Focused event state — drives the pulse animation, auto-clears after timeout
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Phase 4: Pending focus after navigation ───────────────────
  // Stores the request to retry once events finish reloading after a date navigation
  const pendingFocusRef = useRef<PendingFocus | null>(null);

  // ── Calendar Request Listener ──────────────────────────────────
  const handleCalendarRequest = useCallback(
    createCalendarRequestHandler({
      styledEventsRef,
      pendingFocusRef,
      contentContainerRef,
      focusTimeoutRef,
      events,
      allowEventLookup,
      setShowNonViableEvents,
      setSelectedEventInfo,
      setSelectedEvent,
      setViewOptions,
      setFocusedEventId,
    }),
    []
  );

  useCalendarRequestListener(handleCalendarRequest);

  // ── Phase 4: Retry pending focus after events reload ──────────
  useEffect(() => {
    if (eventsLoading || !pendingFocusRef.current) return;

    // Give styled events a tick to render after new data arrives
    const retryTimer = setTimeout(() => {
      retryPendingFocus({
        styledEventsRef,
        pendingFocusRef,
        contentContainerRef,
        focusTimeoutRef,
        setShowNonViableEvents,
        setSelectedEventInfo,
        setSelectedEvent,
        setFocusedEventId,
      });
    }, 150);

    return () => clearTimeout(retryTimer);
  }, [eventsLoading, events]);

  // Track calendar view mount
  useEffect(() => {
    analytics.trackCalendarEvent('View Loaded', {
      daysInView: viewOptions.daysInView,
      startDate: viewOptions.startDay.format('YYYY-MM-DD'),
    });
  }, []); // Only on mount

  useEffect(() => {
    // EVENTS_RELOADED — reset selection & event info (data may be stale)
    setSelectedEvent(null);
    setSelectedEventInfo(null);
  }, [events]);

  const contentMounted = viewOptions.width > 0;

  function changeDayView(dir: 'left' | 'right') {
    const changeAmount = dir === 'left' ? -1 : 1;
    // DAY_NAVIGATED — dismiss all overlays
    setShowNonViableEvents(null);
    setSelectedEventInfo(null);
    setSelectedEvent(null);

    setViewOptions((prev) => {
      const newStartDay = prev.startDay.add(changeAmount * prev.daysInView, 'day');
      // Track navigation
      analytics.trackCalendarEvent('Navigate Days', {
        direction: dir,
        daysChanged: changeAmount * prev.daysInView,
        newStartDate: newStartDay.format('YYYY-MM-DD'),
      });
      return {
        ...prev,
        startDay: newStartDay,
      };
    });
  }

  const calendarGridCanvasRef = useRef<HTMLCanvasElement>(null);
  const calendarGridPrevCanvasRef = useRef<HTMLCanvasElement>(null);
  const calendarGridNextCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const gridColor = theme.colors.calendar.grid;
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
    [calendarGridCanvasRef, calendarGridPrevCanvasRef, calendarGridNextCanvasRef].forEach(
      (ref) => {
        if (ref.current) {
          const canvas = ref.current;
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
      }
    );
  }, [viewOptions.width, theme]);

  // Auto-scroll to first event or current time on initial load
  useEffect(() => {
    if (!contentMounted || hasAutoScrolled || eventsLoading || !contentContainerRef.current) {
      return;
    }

    const scrollToPosition = (scrollTop: number) => {
      if (contentContainerRef.current) {
        contentContainerRef.current.scrollTop = scrollTop;
        setHasAutoScrolled(true);
      }
    };

    // Find the earliest event in the current view
    const viewStart = viewOptions.startDay.startOf('day');
    const viewEnd = viewOptions.startDay.add(viewOptions.daysInView, 'day').endOf('day');

    const eventsInView = viableEvents.filter((event) => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      return eventStart.isBefore(viewEnd) && eventEnd.isAfter(viewStart);
    });

    if (eventsInView.length > 0) {
      // Find the earliest event
      const earliestEvent = eventsInView.reduce((earliest, current) => {
        return dayjs(current.start).isBefore(dayjs(earliest.start)) ? current : earliest;
      });

      const eventStart = dayjs(earliestEvent.start);
      const hourFraction =
        eventStart.hour() + eventStart.minute() / 60 + eventStart.second() / 3600;
      const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);

      // Scroll to 1 hour before the first event (or to the event if it's in the first hour)
      const scrollTop = Math.max(0, (hourFraction - 1) * cellHeight);
      scrollToPosition(scrollTop);
    } else {
      // No events in view, scroll to current time
      const now = TimeUtil.nowDayjs();
      const hourFraction = now.hour() + now.minute() / 60 + now.second() / 3600;
      const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);

      // Scroll to 1 hour before current time (or to current time if in first hour)
      const scrollTop = Math.max(0, (hourFraction - 1) * cellHeight);
      scrollToPosition(scrollTop);
    }
  }, [
    contentMounted,
    hasAutoScrolled,
    eventsLoading,
    viableEvents,
    viewOptions.startDay,
    viewOptions.daysInView,
  ]);

  // Reset auto-scroll flag when view changes (date navigation)
  useEffect(() => {
    setHasAutoScrolled(false);
  }, [viewOptions.startDay]);

  const calendarEventInfo = [
    {
      key: 'info',
      container: CalendarEventInfoModalContainer,
      content: (
        <CalendarEventInfo
          event={selectedEventInfo}
          onClose={() => {
            setSelectedEventInfo(null);
            setSelectedEvent(null);
          }}
        />
      ),
    },
  ];

  const calculateEventInfoCoordinates = (event: StyledEvent) => {
    const INFO_MODAL_HEIGHT = parseInt(calendarConfig.INFO_MODAL_HEIGHT);
    const INFO_MODAL_WIDTH = parseInt(calendarConfig.INFO_MODAL_WIDTH);
    const INFO_MODAL_GAP = parseInt(calendarConfig.INFO_MODAL_GAP);

    const vScrollOffset = contentContainerRef.current?.scrollTop || 0;
    const innerAbsoluteX = event.springStyles.x + parseInt(calendarConfig.TIMELINE_WIDTH);
    const innerAbsoluteY = event.springStyles.y + parseInt(calendarConfig.HEADER_HEIGHT);
    const innerAbsoluteWidth = event.springStyles.width;

    const containerRect = contentContainerRef.current?.getBoundingClientRect();
    const containerWidth = containerRect?.width || 0;
    const containerHeight = containerRect?.height || 0;

    // Position to the right of the event by default
    // If not enough space, position to the left
    let calculatedX = innerAbsoluteX + innerAbsoluteWidth + INFO_MODAL_GAP;
    if (calculatedX + INFO_MODAL_WIDTH > containerWidth) {
      // Not enough space on the right, position to the left
      calculatedX = innerAbsoluteX - INFO_MODAL_WIDTH - INFO_MODAL_GAP; // 12px gap
      if (calculatedX < 0) {
        // Still not enough space, clamp to left edge
        calculatedX = 0;
      }
    }

    // Position vertically aligned to the top of the event by default
    // If not enough space at the bottom, adjust upwards
    let calculatedY = innerAbsoluteY - vScrollOffset;
    if (event.isViable === false) {
      calculatedY = 71;
      // calculate the index of the event in the non-viable events list for that day
      const dayStart = dayjs(event.start).startOf('day');
      const eventsForTheDay = styledNonViableEvents.filter((e) =>
        dayjs(e.start).isSame(dayStart, 'day')
      );
      const eventIndex = eventsForTheDay.findIndex((e) => e.id === event.id);
      calculatedY += eventIndex * 66;
    }
    if (calculatedY + INFO_MODAL_HEIGHT > containerHeight) {
      // Not enough space at the bottom, adjust upwards
      calculatedY =
        containerHeight + parseInt(calendarConfig.HEADER_HEIGHT) - INFO_MODAL_HEIGHT;
    }
    if (calculatedY < parseInt(calendarConfig.HEADER_HEIGHT)) {
      // Still not enough space, clamp to top edge
      calculatedY = parseInt(calendarConfig.HEADER_HEIGHT) + INFO_MODAL_GAP;
    }

    setCalendarEventInfoPos({ x: calculatedX, y: calculatedY });
  };

  const [calendarEventInfoPos, setCalendarEventInfoPos] = useState<{ x: number; y: number }>({
    x: 100,
    y: 100,
  });
  useEffect(() => {
    if (selectedEventInfo) {
      calculateEventInfoCoordinates(selectedEventInfo!);
      contentContainerRef.current?.addEventListener('scroll', () => {
        setSelectedEventInfo((prev) => {
          if (prev) {
            // Return a new object to trigger re-render
            return { ...prev };
          }
          return null;
        });
      });
    }
  }, [selectedEventInfo]);
  const calendarEventInfoTransRef = useSpringRef();
  const calendarEventInfoTrans = useTransition(selectedEventInfo ? calendarEventInfo : [], {
    keys: (item) => `${item.key}-${calendarEventInfoPos.x}-${calendarEventInfoPos.y}`,
    ref: calendarEventInfoTransRef,
    from: {
      x: calendarEventInfoPos.x - 12,
      y: calendarEventInfoPos.y,
      opacity: 0,
    },
    enter: {
      x: calendarEventInfoPos.x,
      y: calendarEventInfoPos.y,
      opacity: 1,
      delay: 100,
    },
    leave: { opacity: 0, pointerEvents: 'none' },
    config: { tension: 300, friction: 30, duration: 150 },
  });

  useChain([calendarEventInfoTransRef], [0], 0);

  const calendarCreateEventSpring = useSpring({
    from: {
      opacity: 0,
      scale: 0.9,
      y: 0,
    },
    to: {
      opacity: createTile.state.isOpen ? 1 : 0,
      scale: createTile.state.isOpen ? 1 : 0.9,
      y: createTile.state.isOpen ? 0 : 100,
    },
    config: {
      duration: 200,
    },
  });

  // Swiping logic
  const swiperRef = useRef<SwiperRef | null>(null);
  const isSwiperResetting = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (swiperRef.current) {
      if (!isMobile) {
        swiperRef.current.swiper.disable();
      } else {
        swiperRef.current.swiper.enable();
      }
    }
  }, [isMobile]);

  // Create Tile State
  const initialCreateTileFormState: InitialCreateTileFormState = {
		start: dayjs(),
    action: '',
    location: '',
    durationHours: 0,
    durationMins: 0,
    deadline: dayjs(),
    color: new RGBColor(eventColorOptions[0]),
    isRecurring: false,
    recurrenceType: ScheduleRepeatType.Daily,
    recurrenceFrequency: ScheduleRepeatFrequency.Daily,
    recurrenceWeeklyDays: [ScheduleRepeatWeekday.Sunday],
    recurrenceStartType: ScheduleRepeatStartType.Default,
		recurrenceStartDate: dayjs(),
		recurrenceEndType: ScheduleRepeatEndType.Never,
    recurrenceEndDate: dayjs().add(1, 'week'),
    timeRestrictionType: null,
    isTimeRestricted: false,
    timeRestrictionStart: '00:00',
    timeRestrictionEnd: '23:59',
    hasLocationNickname: false,
    locationNickname: '',
  };
  const createTileFormHandler = useFormHandler(initialCreateTileFormState);
  const createTileModalContainerRef = useRef<HTMLDivElement>(null);
  const createTileModalPortalTarget = createTile.state.isExpanded
    ? document.body
    : createTileModalContainerRef.current;

  function onBackgroundClick(info: CalendarBackgroundClickInfo) {
    // CONTENT_CLICK_OUTSIDE
    if (!selectedEvent) {
      const { formData, setFormData } = createTileFormHandler;
			// Set Create Tile Form Based on day clicked
			const clickedDay = dayjs(info.day);
			const clickedDayValue = clickedDay.day();
			let recurrenceDefaultWeeklyDay: ScheduleRepeatWeekday;

			if (clickedDayValue === 1) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Monday;
			else if (clickedDayValue === 2) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Tuesday;
			else if (clickedDayValue === 3) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Wednesday;
			else if (clickedDayValue === 4) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Thursday;
			else if (clickedDayValue === 5) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Friday;
			else if (clickedDayValue === 6) recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Saturday;
			else recurrenceDefaultWeeklyDay = ScheduleRepeatWeekday.Sunday;

      setFormData({
        ...formData,
				start: clickedDay,
        deadline: clickedDay,
				recurrenceStartDate: clickedDay,
				recurrenceWeeklyDays: [recurrenceDefaultWeeklyDay],
      });
      createTile.actions.open();
    } else {
      setSelectedEvent(null);
      setSelectedEventInfo(null);
    }
    setShowNonViableEvents(null);
  }

  return (
    <CalendarContainer id="calendar-grid-container" $isMounted={contentMounted}>
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
        <CalendarHeaderDateList ref={viewRef} data-onboarding-calendar-header>
          {Array.from({ length: viewOptions.daysInView }).map((_, index) => {
            const day = viewOptions.startDay.add(index, 'day');
            const todaysNonViableEvents = styledNonViableEvents.filter((event) =>
              dayjs(event.start).isSame(day, 'day')
            );
            return (
              <CalendarHeaderDateItem
                key={index}
                $isToday={day.isSame(dayjs(), 'day')}
              >
                {/* 3 letter day */}
                <h3>{day.format('ddd')}</h3>
                {/* 2 number date */}
                <span>{day.format('DD')}</span>
                <ShowNonViableEventsButtonContainer
                  $visible={todaysNonViableEvents.length > 0}
                >
                  <ShowNonViableEventsButtonWrapper>
                    <ShowNonViableEventsButton
                      $active={
                        showNonViableEvents?.isSame(day, 'day') ?? false
                      }
                      title="Show Non-Viable Events"
                      onClick={() => {
                        const isClosing =
                          showNonViableEvents?.isSame(day, 'day') ??
                          false;
                        setShowNonViableEvents(isClosing ? null : day);
                        // TOGGLE_NON_VIABLE_OVERLAY — dismiss event info when opening
                        if (!isClosing) {
                          setSelectedEventInfo(null);
                          setSelectedEvent(null);
                        }
                      }}
                    >
                      <TriangleAlert
                        size={18}
                        color={theme.colors.brand[400]}
                      />
                    </ShowNonViableEventsButton>
                    <NonViableEventsCount>
                      {todaysNonViableEvents.length}
                    </NonViableEventsCount>
                  </ShowNonViableEventsButtonWrapper>
                </ShowNonViableEventsButtonContainer>
              </CalendarHeaderDateItem>
            );
          })}
        </CalendarHeaderDateList>
      </CalendarHeader>
      {/* Non-Viable Events Overlays */}
      {Array.from({ length: viewOptions.daysInView }).map((_, index) => {
        const day = viewOptions.startDay.add(index, 'day');
        const todaysNonViableEvents = styledNonViableEvents.filter((event) =>
          dayjs(event.start).isSame(day, 'day')
        );
        return todaysNonViableEvents.length > 0 &&
          showNonViableEvents?.isSame(day, 'day') ? (
          <NonViableEventsContainer
            key={index}
            $index={index}
            $visible={showNonViableEvents?.isSame(day, 'day') ?? false}
            $cellwidth={viewOptions.width / viewOptions.daysInView}
          >
            <header>
              <h2>{t('calendar.nonViable.title')}</h2>
              <Tooltip
                text={t('calendar.nonViable.infoTooltip')}
                maxWidth={150}
                position="left"
              >
                <Info size={18} color={theme.colors.text.secondary} />
              </Tooltip>
            </header>
            {todaysNonViableEvents.map((event) => (
              <CalendarEvent
                event={event}
                key={event.id}
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                setSelectedEventInfo={setSelectedEventInfo}
                focused={focusedEventId === event.id}
              />
            ))}
          </NonViableEventsContainer>
        ) : null;
      })}

      {/* Loading Overlay */}
      <LoadingContainer $loading={eventsLoading}>
        <Loader />
      </LoadingContainer>

      {/* Info Modal Overlay */}
      {calendarEventInfoTrans((style, item) => (
        <item.container style={style} key={item.key}>
          {item.content}
        </item.container>
      ))}

      {/* Create Modal Overlay */}
      <CalendarCreateEventModalBackdrop
        $visible={createTile.state.isOpen}
        onClick={createTile.actions.close}
      >
        <CalendarCreateEventModalWrapper>
          <CalendarCreateEventModalContainer
            ref={createTileModalContainerRef}
            $expanded={createTile.state.isExpanded}
            style={{
              scale: calendarCreateEventSpring.scale,
              opacity: calendarCreateEventSpring.opacity,
              transform: calendarCreateEventSpring.y.to(
                (y) => `translate(-50%, calc(${y}px - 50%))`
              ),
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </CalendarCreateEventModalWrapper>
      </CalendarCreateEventModalBackdrop>
      {createTileModalPortalTarget &&
        createPortal(
          <CalendarCreateTile
            refetchEvents={refetchEvents}
            formHandler={createTileFormHandler}
          />,
          createTileModalPortalTarget
        )}

      {/* Calendar Content */}
      <CalendarContentContainer
        id="calendar-content-container"
        ref={contentContainerRef}
        data-onboarding-calendar-view
      >
        <Swiper
          loop={false}
          ref={swiperRef}
          initialSlide={1}
          onSlideNextTransitionStart={() => {
            if (isSwiperResetting.current || !swiperRef.current) return;
            changeDayView('right');

            isSwiperResetting.current = true;
            setTimeout(() => {
              swiperRef.current?.swiper.slideTo(1, 0, false);
              setTimeout(() => (isSwiperResetting.current = false), 0);
            }, 300);
          }}
          onSlidePrevTransitionStart={() => {
            if (isSwiperResetting.current || !swiperRef.current) return;
            changeDayView('left');
            isSwiperResetting.current = true;
            setTimeout(() => {
              swiperRef.current?.swiper.slideTo(1, 0, false);
              setTimeout(() => (isSwiperResetting.current = false), 0);
            }, 300);
          }}
          allowTouchMove={true}
          slidesPerView={1}
          speed={300}
          resistanceRatio={0.1}
          threshold={10}
        >
          <SwiperSlide>
            <CalendarContentDummy
              viewOptions={viewOptions}
              calendarGridCanvasRef={calendarGridPrevCanvasRef}
            />
          </SwiperSlide>
          <SwiperSlide>
            <CalendarContent
              events={events}
              viewOptions={viewOptions}
              styledEventsRef={styledEventsRef}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              setSelectedEventInfo={setSelectedEventInfo}
              calendarGridCanvasRef={calendarGridCanvasRef}
              setStyledNonViableEvents={setStyledNonViableEvents}
              onBackgroundClick={(info) => {
                onBackgroundClick(info);
              }}
              focusedEventId={focusedEventId}
              onViableEventClicked={() => setShowNonViableEvents(null)}
            />
          </SwiperSlide>
          <SwiperSlide>
            <CalendarContentDummy
              viewOptions={viewOptions}
              calendarGridCanvasRef={calendarGridNextCanvasRef}
            />
          </SwiperSlide>
        </Swiper>
      </CalendarContentContainer>
    </CalendarContainer>
  );
};

const CalendarContainer = styled.div<{ $isMounted: boolean }>`
	overflow: hidden;
	border-radius: 0 ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large} 0;
	position: relative;
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.colors.calendar.bg};
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
	background-color: ${({ theme }) => theme.colors.calendar.headerBg};
	display: flex;
`;

const CalendarHeaderActions = styled.div`
	width: ${calendarConfig.TIMELINE_WIDTH};
	height: 100%;
	display: flex;
	align-items: center;
	overflow: hidden;
	border-right: 1px solid ${({ theme }) => theme.colors.calendar.border};
	background-color: ${({ theme }) => theme.colors.calendar.sidebarBg};
`;

const ChangeViewButton = styled.button`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background-color: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:not(:disabled) {
		&:hover {
			background-color: ${({ theme }) => theme.colors.calendar.sidebarButtonHover};
			color: ${({ theme }) => theme.colors.text.primary};
		}

		&:active {
			background-color: ${({ theme }) => theme.colors.calendar.sidebarButtonActive};
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
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-size: ${({ theme }) => theme.typography.fontSize.lg};
	text-transform: uppercase;
	color: ${({ $isToday, theme }) =>
    $isToday ? theme.colors.calendar.headerDayTodayText : theme.colors.calendar.headerDayText};

	border-bottom: 1px solid ${({ theme }) => theme.colors.calendar.border};

	&:not(:last-child) {
		border-right: 1px solid ${({ theme }) => theme.colors.calendar.border};
	}

	background-color: ${({ $isToday, theme }) =>
    $isToday ? theme.colors.calendar.headerTodayBg : theme.colors.calendar.headerBg};
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5ch;

	span {
		color: ${({ $isToday, theme }) =>
    $isToday
      ? theme.colors.calendar.headerDateTodayText
      : theme.colors.calendar.headerDateText};
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
	background-color: ${({ theme }) => theme.colors.backdrop.default};
	z-index: 1000;
	transition: opacity 0.3s ease-in-out;
`;

const ShowNonViableEventsButtonContainer = styled.div<{ $visible?: boolean }>`
	margin-left: 8px;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
`;

const ShowNonViableEventsButtonWrapper = styled.div`
	position: relative;
`;

const NonViableEventsCount = styled.div`
	position: absolute;
	transform: translate(50%, -50%);
	top: 25%;
	right: 0;
	min-width: 14px;
	height: 14px;
	padding: 0 4px;
	background-color: ${({ theme }) => theme.colors.calendar.headerNonViableDateBg};
	color: ${({ theme }) => theme.colors.calendar.headerNonViableDateText};
	border-radius: 8px;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 10px;
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	pointer-events: none;
	user-select: none;
`;

const ShowNonViableEventsButton = styled.button<{ $active: boolean }>`
	width: 32px;
	height: 32px;
	background-color: transparent;
	box-shadow: 0 0 0 1px
		${({ $active, theme }) => ($active ? theme.colors.calendar.headerDayText : 'transparent')}
		inset;
	display: grid;
	place-items: center;
	border-radius: ${({ theme }) => theme.borderRadius.xxLarge};

	&:hover {
		box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.calendar.headerDayText} inset;
	}

	transition: box-shadow 0.2s ease-in-out;
`;

const NonViableEventsContainer = styled.div<{
  $visible: boolean;
  $index: number;
  $cellwidth: number;
}>`
	position: absolute;
	top: calc(${calendarConfig.HEADER_HEIGHT});
	left: ${({ $cellwidth, $index }) =>
    `${$index * $cellwidth + parseInt(calendarConfig.TIMELINE_WIDTH)}px`};
	pacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

	height: calc(100% - ${calendarConfig.HEADER_HEIGHT});
	width: ${({ $cellwidth }) => `${$cellwidth}px`};

	padding: 0.5rem;
	overflow-y: auto;
	background-color: ${({ theme }) => theme.colors.backdrop.glass};
	backdrop-filter: blur(6px);
	z-index: 20;

	header {
		padding-inline: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	h2 {
		font-size: 14px;
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		color: ${({ theme }) => theme.colors.text.primary};
	}

	transition: opacity 0.2s ease-in-out;
`;

const CalendarEventInfoModalContainer = styled(a.div)`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1000;
	width: ${calendarConfig.INFO_MODAL_WIDTH};
	height: fit-content;
	max-height: ${calendarConfig.INFO_MODAL_HEIGHT};
`;

const CalendarCreateEventModalBackdrop = styled.div<{ $visible: boolean }>`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 2;
	isolation: isolate;
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.colors.backdrop.glass};
	backdrop-filter: blur(4px);
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
	transition: opacity 0.3s ease-in-out;
`;

const CalendarCreateEventModalWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
`;

const CalendarCreateEventModalContainer = styled(a.div) <{ $expanded: boolean }>`
	${(props) =>
    props.$expanded
      ? `
position: fixed;
		top: -5rem;
		`
      : `
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 1001;
	width: calc(100% - 32px);
	max-width: ${calendarConfig.CREATE_EVENT_MODAL_WIDTH};
`}
`;

export default Calendar;
