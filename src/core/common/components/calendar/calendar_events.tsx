import React, { useEffect, useMemo } from 'react';
import { CalendarViewOptions } from './calendar.types';
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
import { computeStaggerLayout } from './layout/event_layout';
import { LayoutEvent } from './layout/event_layout.types';
import {
	getStaggerIncrement,
	getMinEventHeight,
	MAX_STAGGER_RATIO,
} from './layout/event_layout.constants';
import { ScheduleLookupTravelDetail, SubCalendarEvent } from '@/core/common/types/schedule';
import CalendarEvent from './calendar_event';
import analytics from '@/core/util/analytics';
import { splitEventByDay } from '@/core/util/eventSplitting';
import { isLongDurationEvent } from '@/core/util/eventFilters';
import { TypeDefaults } from '../../types/typeDefaults';

type CalendarEventsProps = {
	viewOptions: CalendarViewOptions;
	events: Array<SubCalendarEvent>;
	headerWidth: number;
	selectedEvent: string | null;
	setSelectedEvent: (id: string | null) => void;
	setSelectedEventInfo: React.Dispatch<React.SetStateAction<StyledEvent | null>>;
	onNonViableEventsChange?: (events: Array<StyledEvent>) => void;
	onLongDurationEventsChange?: (events: Array<StyledEvent>) => void;
	onBackgroundClick?: (info: CalendarBackgroundClickInfo) => void;
	/** Ref populated with all styled events so Calendar can look up by ID */
	styledEventsRef?: React.MutableRefObject<StyledEvent[]>;
	/** Currently focused event ID (from chat action pill click) */
	focusedEventId?: string | null;
	/** Called when a viable event tile on the grid is clicked */
	onViableEventClicked?: () => void;
};
type CurrentViewEvent = SubCalendarEvent & { key: string };
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
	/** Z-index computed by stagger layout engine */
	_staggerZIndex?: number;
};
export type StyledTravelDetail = CurrentViewTravelDetail & {
	springStyles: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
};
export type CalendarBackgroundClickInfo = {
	day: Date;
	hour: number;
	minute: number;
	second: number;
};

const CalendarEvents = ({
	events,
	viewOptions,
	headerWidth,
	selectedEvent,
	setSelectedEvent,
	onNonViableEventsChange,
	onLongDurationEventsChange,
	setSelectedEventInfo,
	styledEventsRef,
	focusedEventId,
	onViableEventClicked,
	onBackgroundClick,
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
		// VIABLE_EVENT_CLICKED — dismiss non-viable overlay
		onViableEventClicked?.();
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
			const end = dayjs(event.end);
			if (start.isAfter(viewEnd) || end.isBefore(viewStart)) continue;

			// Split multi-day events and preserve original times
			const segments = splitEventByDay(event);
			currentViewEvents.push(...segments);
		}

		// Process travel details of all events in the current view
		for (const event of currentViewEvents) {
			const travelDetails = event.travelDetail ?? [];
			for (const detail of Object.values(travelDetails)) {
				if (!detail) continue;
				if (detail.end - detail.start <= 0) continue;

				const start = dayjs(detail.start, 'unix');
				const end = dayjs(detail.end, 'unix');

				if (start.isAfter(viewEnd) || end.isBefore(viewStart)) continue;

				currentViewTravelDetails.push({
					...detail,
					key: v4(),
					colorRed: event.colorRed ?? TypeDefaults.RGBColor.red,
					colorGreen: event.colorGreen ?? TypeDefaults.RGBColor.green,
					colorBlue: event.colorBlue ?? TypeDefaults.RGBColor.blue,
					isViable: event.isViable ?? true,
				});
			}
		}
		return { currentViewEvents, currentViewTravelDetails };
	}, [events, viewOptions]);

	const styledEvents = useMemo(() => {
		// Compute bounding boxes for all events
		const eventBoxes = currentViewEvents.map((event) => {
			const s = dayjs(event.start, 'unix');
			const e = dayjs(event.end, 'unix');
			const box = CalendarUtil.getBoundingBox(s, e, viewOptions, headerWidth);
			return { event, box, s, e };
		});

		// Build layout inputs for viable events
		const layoutEvents: LayoutEvent[] = [];
		const layoutIndexMap = new Map<string, number>(); // event.key -> index in eventBoxes

		for (let i = 0; i < eventBoxes.length; i++) {
			const { event, box } = eventBoxes[i];
			if (event.isViable) {
				layoutEvents.push({
					id: event.key,
					start: event.start,
					end: event.end,
					x: box.x,
					y: box.y,
					width: box.width,
					height: box.height,
				});
			}
			layoutIndexMap.set(event.key, i);
		}

		// Compute stagger layout
		const viewportWidth = window.innerWidth;
		const staggerResults = computeStaggerLayout(layoutEvents, {
			staggerIncrement: getStaggerIncrement(viewportWidth),
			maxStaggerRatio: MAX_STAGGER_RATIO,
			minEventHeight: getMinEventHeight(viewportWidth),
		});
		const staggerMap = new Map(staggerResults.map((r) => [r.id, r]));

		// Build StyledEvent array
		const result: Array<StyledEvent> = eventBoxes.map(({ event, box, s, e }) => {
			const eventStartInHours = s.hour() + s.minute() / 60;
			const eventEndInHours = e.hour() + e.minute() / 60;
			const stagger = staggerMap.get(event.key);

			return {
				...event,
				properties: {
					startHourFraction: eventStartInHours,
					endHourFraction: eventEndInHours,
					eventChainKey: event.key,
					eventChainIndex: stagger?.staggerLevel ?? 0,
					eventChainLength: 1,
				},
				springStyles: {
					x: stagger?.x ?? box.x,
					y: box.y,
					width: stagger?.width ?? box.width,
					height: stagger?.height ?? box.height,
				},
				_staggerZIndex: stagger?.zIndex ?? 0,
			};
		});

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
		if (onLongDurationEventsChange) {
			const longDurationEvents = styledEvents.filter(
				(event) => event.isViable && isLongDurationEvent(event)
			);
			onLongDurationEventsChange(longDurationEvents);
		}
	}, [styledEvents]);

	// Expose all styled events via ref for Calendar request handling
	useEffect(() => {
		if (styledEventsRef) {
			styledEventsRef.current = styledEvents;
		}
	}, [styledEvents, styledEventsRef]);

	const eventTransition = useTransition(
		styledEvents.filter((event) => event.isViable && !isLongDurationEvent(event)),
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

	const backgroundClickHandler = (
		event: React.MouseEvent<HTMLDivElement>
	): CalendarBackgroundClickInfo => {
		const background = event.target as HTMLDivElement;
		const dimensions = background.getBoundingClientRect();
		const timelineHeight = dimensions.height;
		const timelineWidth = dimensions.width;

		// click position relative to timeline
		const clickX = event.clientX - dimensions.left;
		const clickY = event.clientY - dimensions.top;

		const dayClicked = viewOptions.startDay
			.startOf('day')
			.add(Math.floor((clickX / timelineWidth) * viewOptions.daysInView), 'day')
			.toDate();
		const ratio = clickY / timelineHeight;
		const totalSeconds = Math.min(Math.floor(ratio * 86400), 86399);

		const hourClicked = Math.floor(totalSeconds / 3600);
		const minuteClicked = Math.floor((totalSeconds % 3600) / 60);
		const secondClicked = totalSeconds % 60;

		const info: CalendarBackgroundClickInfo = {
			day: dayClicked,
			hour: hourClicked,
			minute: minuteClicked,
			second: secondClicked,
		};
		return info;
	};

	return (
		<Container
			id="calendar-events-container"
			onClick={(e) => {
				const info = backgroundClickHandler(e);
				onBackgroundClick?.(info);
			}}
		>
			<Wrapper>
				{eventTransition((style, event) => (
					<EventPositioner
						key={event.key}
						style={style}
						$selected={selectedEvent === event.id}
						$focused={focusedEventId === event.id}
						$zIndex={event._staggerZIndex ?? 0}
					>
						<CalendarEvent
							event={event}
							selectedEvent={selectedEvent}
							setSelectedEvent={setSelectedEvent}
							setSelectedEventInfo={setSelectedEventInfo}
							onClick={() => handleEventClick(event)}
							focused={focusedEventId === event.id}
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
							onClick={(e) => {
								e.stopPropagation();
								handleTravelDetailClick(detail);
							}}
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

const EventPositioner = styled(animated.div)<{
	$selected: boolean;
	$focused: boolean;
	$zIndex: number;
}>`
	position: absolute;
	top: 0;
	left: 0;
	z-index: ${({ $selected, $focused, $zIndex }) =>
		$selected || $focused ? 999 : $zIndex || 'auto'};
	display: flex;

	&:hover {
		z-index: 998;
		pointer-events: auto;
	}
`;

const TravelDetailContent = styled(animated.a)<{ $colors: RGB }>`
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
