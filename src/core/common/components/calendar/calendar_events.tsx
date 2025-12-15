import React, { useEffect, useMemo } from 'react';
import { CalendarViewOptions } from './calendar';
import dayjs from 'dayjs';
import { animated, useTransition } from '@react-spring/web';
import { Bike, CarFront, DotIcon, Route } from 'lucide-react';
import styled from 'styled-components';
import { v4 } from 'uuid';
import TimeUtil from '@/core/util/time';
import palette from '@/core/theme/palette';
import CalendarUtil from '@/core/util/calendar';
import colorUtil, { RGB } from '@/core/util/colors';
import calendarConfig from '@/core/constants/calendar_config';
import { ScheduleLookupTravelDetail, ScheduleSubCalendarEvent } from '@/core/common/types/schedule';
import CalendarEvent from './calendar_event';
import analytics from '@/core/util/analytics';

type CalendarEventsProps = {
  viewOptions: CalendarViewOptions;
  events: Array<ScheduleSubCalendarEvent>;
  headerWidth: number;
  selectedEvent: string | null;
  setSelectedEvent: (id: string | null) => void;
	setSelectedEventInfo: React.Dispatch<React.SetStateAction<StyledEvent | null>>;
	onNonViableEventsChange?: (events: Array<StyledEvent>) => void;
};
type CurrentViewEvent = ScheduleSubCalendarEvent & { key: string };
type CurrentViewTravelDetail = ScheduleLookupTravelDetail & {
  key: string;
  colorRed: number;
  colorGreen: number;
  colorBlue: number;
  isViable: boolean;
};
export type StyledEvent = CurrentViewEvent & {
  properties: {
    eventChainKey: string;
    eventChainIndex: number;
    eventChainLength: number;
    startHourFraction: number;
    endHourFraction: number;
  };
  springStyles: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
export type StyledTravelDetail = CurrentViewTravelDetail & {
  springStyles: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

const CalendarEvents = ({
  events,
  viewOptions,
  headerWidth,
  selectedEvent,
  setSelectedEvent,
	onNonViableEventsChange,
	setSelectedEventInfo,
}: CalendarEventsProps) => {
	const handleEventClick = (event: StyledEvent) => {
		// Track event selection
		analytics.trackCalendarEvent('Event Selected', {
			eventId: event.id,
			eventName: event.name,
			isRigid: event.isRigid,
			isTardy: event.isTardy,
			hasLocation: !!event.location?.address,
			duration: dayjs(event.end, 'unix').diff(dayjs(event.start, 'unix'), 'minute'),
			startTime: dayjs(event.start, 'unix').format('HH:mm'),
		});
		
		setSelectedEvent(event.id);
	};

	const handleTravelDetailClick = (detail: StyledTravelDetail) => {
		// Track travel detail interaction
		analytics.trackCalendarEvent('Travel Detail Clicked', {
			travelMedium: detail.travelMedium,
			duration: dayjs(detail.end, 'unix').diff(dayjs(detail.start, 'unix'), 'minute'),
			hasStartLocation: !!detail.startLocation,
			hasEndLocation: !!detail.endLocation,
		});
	};

	const { currentViewEvents, currentViewTravelDetails } = useMemo(() => {
		const currentViewEvents: Array<CurrentViewEvent> = [];
		const currentViewTravelDetails: Array<CurrentViewTravelDetail> = [];

    const viewStart = viewOptions.startDay;
    const viewEnd = dayjs(viewOptions.startDay)
      .add(viewOptions.daysInView - 1, 'day')
      .endOf('day');

    // Filter and process events to only include those in the current view
    for (const event of events) {
      const start = dayjs(event.start);
      let end = dayjs(event.end);
      if (start.isAfter(viewEnd) || end.isBefore(viewStart)) continue;

      // 💡 Treat midnight as still part of previous day
      if (end.hour() === 0 && end.minute() === 0 && end.second() === 0) {
        end = end.subtract(1, 'millisecond');
      }

      // Split events that span multiple days
      if (!start.isSame(end, 'day')) {
        const days = end.endOf('day').diff(start.startOf('day'), 'day') + 1;
        for (let i = 0; i < days; i++) {
          const day = start.add(i, 'day');
          currentViewEvents.push({
            ...event,
            key: `${event.id}-${i}`,
            start: i === 0 ? start.unix() * 1000 : day.startOf('day').unix() * 1000,
            end: i === days - 1 ? end.unix() * 1000 : day.endOf('day').unix() * 1000,
          });
        }
      } else {
        currentViewEvents.push({
          ...event,
          key: event.id,
        });
      }
    }

    // Process travel details of all events in the current view
    for (const event of currentViewEvents) {
      const travelDetails = event.travelDetail;
      for (const detail of Object.values(travelDetails)) {
        if (!detail) continue;
        if (detail.end - detail.start <= 0) continue;

        const start = dayjs(detail.start, 'unix');
        const end = dayjs(detail.end, 'unix');

        if (start.isAfter(viewEnd) || end.isBefore(viewStart)) continue;

        currentViewTravelDetails.push({
          ...detail,
          key: v4(),
          colorRed: event.colorRed,
          colorGreen: event.colorGreen,
          colorBlue: event.colorBlue,
          isViable: event.isViable,
        });
      }
    }
    return { currentViewEvents, currentViewTravelDetails };
  }, [events, viewOptions]);

  const styledEvents = useMemo(() => {
    const result = [] as Array<StyledEvent>;

    // sort by start time
    currentViewEvents.sort((a, b) => {
      return dayjs(a.start, 'unix').diff(dayjs(b.start, 'unix'));
    });

		// Calculate chains of intersected events
		for (let i = 0; i < currentViewEvents.length; i++) {
			const event = currentViewEvents[i];

      const s = dayjs(event.start, 'unix');
      const e = dayjs(event.end, 'unix');
      const eventBox = CalendarUtil.getBoundingBox(s, e, viewOptions, headerWidth);
      const { x, y, width, height } = eventBox;
      const eventStartInHours = s.hour() + s.minute() / 60; // 11:30PM -> 23.5
      const eventEndInHours = e.hour() + e.minute() / 60; // 11:45AM -> 11.75

      const prevEvent = result[result.length - 1] as StyledEvent | undefined;
      const isEventSameDayAsPrev = dayjs(event.start, 'unix').isSame(
        dayjs(prevEvent?.start, 'unix'),
        'day'
      );

      const isIntersectingWithPrev =
        prevEvent &&
				prevEvent.isViable &&
        isEventSameDayAsPrev &&
        CalendarUtil.isInterseting(eventBox, prevEvent.springStyles);

			let styledEvent: StyledEvent;
			if (prevEvent && isIntersectingWithPrev && event.isViable) {
				const eventChainKey = prevEvent.properties.eventChainKey;
				const eventChainIndex = prevEvent.properties.eventChainIndex + 1;

				// Update event chain length of previously chained events
				for (let eci = 0; eci < eventChainIndex; eci++) {
					const chainedEvent = result[result.length - 1 - eci];
					chainedEvent.properties.eventChainLength++;
				}

				styledEvent = {
					...event,
					properties: {
						startHourFraction: eventStartInHours,
						endHourFraction: eventEndInHours,
						eventChainKey,
						eventChainIndex,
						eventChainLength: eventChainIndex + 1,
					},
					springStyles: { x, y, width, height },
				};
			} else {
				styledEvent = {
					...event,
					properties: {
						startHourFraction: eventStartInHours,
						endHourFraction: eventEndInHours,
						eventChainKey: event.key,
						eventChainIndex: 0,
						eventChainLength: 1,
					},
					springStyles: { x, y, width, height },
				};
			}

      result.push(styledEvent);
    };

		let currentChainKey = '';
		let currentChainFirstEnd = 0;

		// Break chains if they are too long
    for (let i = 0; i < result.length; i++) {
      const event = result[i];
			const chainKey = event.properties.eventChainKey;
      const chainLength = event.properties.eventChainLength;
			const chainIndex = event.properties.eventChainIndex;

			// Check new chain
			if (chainKey !== currentChainKey) {
        currentChainKey = chainKey;
        currentChainFirstEnd = event.end;
				continue;
      }

      if (chainLength > 2) {
				// Skip if last event of chain
				if (chainIndex === chainLength - 1) continue;
				const breakingCondition = event.start > currentChainFirstEnd;
				if (breakingCondition) {
					const oldChainKey = currentChainKey;
					currentChainKey = event.key;
					currentChainFirstEnd = event.end;
					let n = i;
					let newChainLength = 0;
					// Assign new chain keys
					while (result[n].properties.eventChainKey === oldChainKey) {
						result[n].properties.eventChainKey = event.key;
						result[n].properties.eventChainIndex = n - i;
						n++;
						newChainLength++;
					}
					let l = i;
					// Assign new chain lengths
					while (result[l].properties.eventChainKey === event.key) {
						result[l].properties.eventChainLength = newChainLength;
						l++;
					}
					// Update old chain lengths
					let o = i - 1;
					while (result[o].properties.eventChainKey === oldChainKey) {
						result[o].properties.eventChainLength -= newChainLength;
						o--;
					}
					console.log('chain broken, new start event:', event.name);
				}
			}
		}

		// Divide width of chained events
		for (let i = 0; i < result.length; i++) {
			const event = result[i];
			const chainIndex = event.properties.eventChainIndex;
			const chainLength = event.properties.eventChainLength;
      if (event.properties.eventChainLength > 1) {
        const fullWidth = event.springStyles.width;
        event.springStyles.x += chainIndex * (fullWidth / chainLength);
        const lastChainEventWidth = fullWidth / chainLength;
        const chainEventWidth = (lastChainEventWidth * 7) / 6;
        event.springStyles.width =
          chainIndex === chainLength - 1 ? lastChainEventWidth : chainEventWidth;
      }
    }

    return result;
  }, [currentViewEvents]);

  const styledTravelDetails = useMemo(() => {
    const result = [] as Array<StyledTravelDetail>;

    currentViewTravelDetails.forEach((detail) => {
      const s = dayjs(detail.start);
      const e = dayjs(detail.end);
      const { x, y, width, height } = CalendarUtil.getBoundingBox(
        s,
        e,
        viewOptions,
        headerWidth,
        { minCellHeight: 18 }
      );

      result.push({
        ...detail,
        springStyles: { left: x, top: y, width, height },
      });
    });

    return result;
  }, [styledEvents]);

	useEffect(() => {
		if (onNonViableEventsChange) {
			const nonViableEvents = styledEvents.filter((event) => !event.isViable);
			onNonViableEventsChange(nonViableEvents);
		}
	}, [styledEvents]);


  const eventTransition = useTransition(
    styledEvents.filter((event) => event.isViable),
    {
      keys: (event) => event.key,
      from: ({ springStyles }) => ({
        opacity: 0,
        scale: 0.9,
        ...springStyles,
      }),
      leave: ({ springStyles }) => ({
        opacity: 0,
        ...springStyles,
        config: { duration: 100 },
      }),
      enter: ({ springStyles }) => ({
        opacity: 1,
        scale: 1,
        ...springStyles,
      }),
      update: ({ springStyles }) => ({ ...springStyles }),
      config: { tension: 500, friction: 40 },
    }
  );

  const travelTransition = useTransition(
    styledTravelDetails.filter((detail) => detail.isViable),
    {
      keys: (detail) => detail.key,
      from: () => ({ opacity: 0, scale: 0.9 }),
      leave: () => ({ opacity: 0, scale: 0.9, config: { duration: 100 } }),
      enter: () => ({ opacity: 1, scale: 1 }),
      config: { tension: 500, friction: 40 },
    }
  );

  return (
    <Container id="calendar-events-container">
      <Wrapper>
        {eventTransition((style, event) => (
          <EventPositioner
            key={event.key}
            style={style}
            $selected={selectedEvent === event.id}
          >
            <CalendarEvent
              event={event}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
							setSelectedEventInfo={setSelectedEventInfo}
              onClick={() => handleEventClick(event)}
            />
          </EventPositioner>
        ))}
        {travelTransition((style, detail) => {
          const travelMediumIconMap: Record<string, React.ReactNode> = {
            driving: <CarFront size={16} />,
            biking: <Bike size={16} />,
            transit: <Route size={16} />,
          };
          return (
            <TravelDetailContent
              href={CalendarUtil.getTravelDetailDirectionLink(detail)}
              target="_blank"
              rel="noopener noreferrer"
              key={detail.key}
              style={{
                ...detail.springStyles,
                ...style,
              }}
              $colors={{
                r: detail.colorRed,
                g: detail.colorGreen,
                b: detail.colorBlue,
              }}
              onClick={() => handleTravelDetailClick(detail)}
            >
              <span>
                {travelMediumIconMap[detail.travelMedium] || <DotIcon size={16} />}
                {detail.travelMedium}
              </span>
              {TimeUtil.rangeDuration(
                dayjs(detail.start, 'unix'),
                dayjs(detail.end, 'unix')
              )}
            </TravelDetailContent>
          );
        })}

      </Wrapper>
    </Container>
  );
};

const Container = styled.div`
	position: absolute;
	top: 0;
	left: ${calendarConfig.TIMELINE_WIDTH};
	height: 100%;
	width: calc(100% - ${calendarConfig.TIMELINE_WIDTH});
`;

const Wrapper = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border: 1px solid red inset;
`;

const EventPositioner = styled(animated.div) <{ $selected: boolean }>`
	position: absolute;
	top: 0;
	left: 0;
	z-index: ${({ $selected }) => ($selected ? 999 : 'auto')};
	display: flex;

	&:hover {
		z-index: 10;
		pointer-events: auto;
	}
`;

const TravelDetailContent = styled(animated.a) <{ $colors: RGB }>`
	position: absolute;
	display: flex;
	gap: 0.5ch;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background: ${({ $colors }) => {
    const newColor = colorUtil.setLightness($colors, 0.7);
    return `repeating-linear-gradient(
			45deg,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.1),
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.1) 8px,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.2) 8px,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.2) 9px
)`;
  }};
	color: ${({ $colors }) => {
    const newColor = colorUtil.setLightness($colors, 0.5);
    return `rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.75)`;
  }};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};

	span {
		display: flex;
		align-items: center;
		gap: 0.5ch;
	}
`;

export default CalendarEvents;
