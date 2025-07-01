import React, { useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import calendarConfig from './config';
import { DummyScheduleEventType } from '../../../data/dummySchedule';
import { CalendarViewOptions } from './calendar';
import dayjs from 'dayjs';
import styles from '../../../util/styles';
import { animated, useTransition } from '@react-spring/web';
import formatter from '../../../util/helpers/formatter';
import colorUtil from '../../../util/helpers/colors';
import { Clock, LockKeyhole } from 'lucide-react';
import calendarEventUtil from '../../../util/helpers/calendar_events';

const dashRotate = keyframes`
  0% {
    stroke-dashoffset: 0;
  }
 100% {
    stroke-dashoffset: 12;
  }
`;

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

const EventContainer = styled(animated.div) <{
	$selected: boolean;
	colors: { r: number; g: number; b: number };
}>`
	position: absolute;
	top: 0;
	left: 0;
	padding: 4px;
	z-index: ${({ $selected }) => ($selected ? 999 : 'auto')};

	> svg {
		position: absolute;
		top: 0px;
		left: 0px;
		height: 100%;
		width: 100%;
		pointer-events: none;

		rect {
			fill: transparent;
			stroke-width: 2;
			stroke: ${({ colors, $selected }) => {
		const newColor = colorUtil.darken(colors, 0.1);
		return $selected
			? `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`
			: 'transparent';
	}};
			stroke-dasharray: 6, 6;
			stroke-linecap: round;
			transition: stroke 0.2s ease-in-out;
			animation: ${dashRotate} 2s linear infinite;
		}
	}
`;

const EventLockIcon = styled(LockKeyhole)`
	margin-top: 4px;
	margin-left: 4px;
	min-width: 14px;
`;

const EventContent = styled.div<{
	colors: { r: number; g: number; b: number };
	height: number;
	variant: 'block' | 'tile';
}>`
	position: relative;
	background-color: ${({ colors }) => {
		const newColor = colorUtil.darken(colors, 0.45);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	color: ${({ colors }) => {
		const newColor = colorUtil.lighten(colors, 0.4);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	border: 1px solid
		${({ colors, variant }) => {
		const newColor = colorUtil.darken(colors, 0.2);
		return variant === 'block'
			? `rgb(${colors.r}, ${colors.g}, ${colors.b})`
			: `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	height: 100%;
	padding: 8px;
	border-radius: 10px;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: space-between;

	header {
		display: flex;

		h3 {
			flex: 1;
			display: -webkit-box;
			line-height: 21px;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: ${({ height }) => Math.floor((height - 46) / 21)};
			max-height: calc(${({ height }) => height}px - 46px);
			text-overflow: ellipsis;
			overflow: hidden;
			font-weight: ${styles.typography.fontWeight.medium};
			font-size: ${styles.typography.fontSize.sm};
		}

		${EventLockIcon} {
			display: ${({ variant }) => (variant === 'block' ? 'block' : 'block')};
		}
	}

	.duration {
		display: flex;
		align-items: center;
		gap: 0.5ch;
		font-size: ${styles.typography.fontSize.xs};
		font-weight: ${styles.typography.fontWeight.bold};
		font-family: ${styles.typography.fontFamily.urban};

		color: ${({ colors }) => {
		const newColor = colorUtil.lighten(colors, 0.1);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	}
`;

type CalendarEventsProps = {
	viewOptions: CalendarViewOptions;
	events: Array<DummyScheduleEventType>;
	headerWidth: number;
	selectedEvent: string | null;
	setSelectedEvent: (id: string | null) => void;
	cellHeight: number;
	setCellHeight: React.Dispatch<React.SetStateAction<number>>;
};

const CalendarEvents = ({
	events,
	viewOptions,
	headerWidth,
	selectedEvent,
	setSelectedEvent,
	cellHeight,
	setCellHeight,
}: CalendarEventsProps) => {
	type CurrentViewEvent = DummyScheduleEventType & { key: string };
	const currentViewEvents = useMemo(() => {
		return events.reduce((acc, event) => {
			const viewStart = viewOptions.startDay;
			const viewEnd = dayjs(viewOptions.startDay)
				.add(viewOptions.daysInView - 1, 'day')
				.endOf('day');

			// If the event is not in the current view, skip it
			function filteredPush(event: CurrentViewEvent) {
				const start = dayjs(event.start, 'unix');
				const end = dayjs(event.end, 'unix');
				if (start.isBefore(viewStart) || end.isAfter(viewEnd)) {
					return;
				}
				acc.push(event);
			}

			// Split events that span multiple days
			const start = dayjs(event.start);
			let end = dayjs(event.end);
			// 💡 Treat midnight as still part of previous day
			if (end.hour() === 0 && end.minute() === 0 && end.second() === 0) {
				end = end.subtract(1, 'millisecond');
			}

			if (!start.isSame(end, 'day')) {
				const days = end.endOf('day').diff(start.startOf('day'), 'day') + 1;
				for (let i = 0; i < days; i++) {
					const day = start.add(i, 'day');
					filteredPush({
						...event,
						key: `${event.id}-${i}`,
						start: i === 0 ? start.unix() * 1000 : day.startOf('day').unix() * 1000,
						end: i === days - 1 ? end.unix() * 1000 : day.endOf('day').unix() * 1000,
					});
				}
			} else {
				filteredPush({
					...event,
					key: event.id,
				});
			}

			return acc;
		}, [] as Array<CurrentViewEvent>);
	}, [events, viewOptions]);

	// Set Cell Height based on the event with minimum duration
	useEffect(() => {
		if (currentViewEvents.length > 0) {
			const minDurationEvent = currentViewEvents.reduce(
				(minEvent, event) => {
					const duration = dayjs(event.end, 'unix').diff(
						dayjs(event.start, 'unix'),
						'minute'
					);
					return duration < minEvent.duration ? { event, duration } : minEvent;
				},
				{ event: currentViewEvents[0], duration: Infinity }
			);

			const minCellHeight = parseInt(calendarConfig.MIN_CELL_HEIGHT);
			const minDurationInMinutes = minDurationEvent.duration;

			setCellHeight(minCellHeight * (60 / minDurationInMinutes));
		}
	}, [currentViewEvents, setCellHeight]);

	type StyledEvent = CurrentViewEvent & {
		properties: {
			layerGroupKey: string;
			layerIndex: number;
			layerGroupLength: number;
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
	const styledEvents = useMemo(() => {
		const result = [] as Array<StyledEvent>;

		// sort by start time
		currentViewEvents.sort((a, b) => {
			return dayjs(a.start, 'unix').diff(dayjs(b.start, 'unix'));
		});

		currentViewEvents.forEach((event) => {
			const start = dayjs(event.start, 'unix');
			const end = dayjs(event.end, 'unix');
			const startHourFraction = start.hour() + start.minute() / 60;
			const endHourFraction = end.hour() + end.minute() / 60;
			const dayIndex = start.diff(viewOptions.startDay.startOf('day'), 'day');

			// Positioning the event based on the day index and width
			const height = cellHeight * (endHourFraction - startHourFraction);
			const width = headerWidth / viewOptions.daysInView;
			const x = dayIndex * width;
			const y = cellHeight * startHourFraction;

			// Layering intersected events
			const lastEvent = result[result.length - 1] as StyledEvent | undefined;
			const isOverlapping = calendarEventUtil.isInterseting(event, lastEvent);
			const layerGroupKey =
				isOverlapping && lastEvent ? lastEvent.properties.layerGroupKey || '' : event.key;

			const styledEvent = {
				...event,
				properties: {
					startHourFraction,
					endHourFraction,
					layerGroupKey,
					layerIndex: 0,
					layerGroupLength: 1,
				},
				springStyles: { x, y, width, height },
			};
			result.push(styledEvent);
		});

		// Sort by start time ascending
		// If events have the same layerGroupKey, sort descending by duration
		result.sort((a, b) => {
			if (a.properties.layerGroupKey === b.properties.layerGroupKey) {
				return (
					dayjs(b.end, 'unix').diff(dayjs(b.start, 'unix')) -
					dayjs(a.end, 'unix').diff(dayjs(a.start, 'unix'))
				);
			}
			return dayjs(a.start, 'unix').diff(dayjs(b.start, 'unix'));
		});

		// Calculating the layerGroupLength and and layerIndex
		const layerEventMap = new Map<string, Array<string>>();
		result.forEach((event) => {
			const layerGroupKey = event.properties.layerGroupKey;
			if (!layerEventMap.has(layerGroupKey)) {
				layerEventMap.set(layerGroupKey, []);
			}
			layerEventMap.get(layerGroupKey)?.push(event.key);
		});

		// Assigning layerGroupLength and layerIndex / updating springStyles
		result.forEach((event) => {
			const layerGroupKey = event.properties.layerGroupKey;
			const layerEvents = layerEventMap.get(layerGroupKey) || [];
			const layerIndex = layerEvents.indexOf(event.key);
			const layerGroupLength = layerEvents.length;
			if (layerGroupLength > 1) {
				event.properties.layerIndex = layerIndex;
				event.properties.layerGroupLength = layerGroupLength;

				// Update springStyles
				const fullWidth = event.springStyles.width;
				event.springStyles.x += layerIndex * (fullWidth / layerGroupLength);
				const lastGroupItemWidth = fullWidth / layerGroupLength;
				const groupItemWidth = (lastGroupItemWidth * 3) / 2;
				event.springStyles.width =
					layerIndex === layerGroupLength - 1 ? lastGroupItemWidth : groupItemWidth;
			}
		});

		return result;
	}, [currentViewEvents, cellHeight]);

	const eventTransition = useTransition(styledEvents, {
		keys: (event) => event.key,
		from: ({ springStyles }) => ({
			opacity: 0,
			scale: 0.9,
			...springStyles,
		}),
		leave: ({ springStyles }) => ({
			opacity: 0,
			...springStyles,
		}),
		enter: ({ springStyles }) => ({
			opacity: 1,
			scale: 1,
			...springStyles,
		}),
		update: ({ springStyles }) => ({ ...springStyles }),
		config: { tension: 300, friction: 30 },
	});

	return (
		<Container>
			<Wrapper>
				{eventTransition((style, event) => {
					return (
						<EventContainer
							style={style}
							key={event.id}
							$selected={selectedEvent === event.id}
							colors={{ r: event.colorRed, g: event.colorGreen, b: event.colorBlue }}
						>
							<EventContent
								height={
									cellHeight *
									(event.properties.endHourFraction -
										event.properties.startHourFraction)
								}
								colors={{
									r: event.colorRed,
									g: event.colorGreen,
									b: event.colorBlue,
								}}
								onClick={() => setSelectedEvent(event.id)}
								variant={event.isRigid ? 'block' : 'tile'}
							>
								<header>
									<h3>{event.name}</h3>
									<EventLockIcon className="lock-icon" size={14} />
								</header>
								<div className="duration">
									<span>
										{formatter.timeDuration(
											dayjs(event.start, 'unix'),
											dayjs(event.end, 'unix')
										)}
									</span>
									<Clock size={14} />
								</div>
							</EventContent>
							{/* Border SVG for styling */}
							<svg
								viewBox="0 0 1 2"
								preserveAspectRatio="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									x="0"
									y="0"
									rx="0.08"
									ry="0.08"
									width="1"
									height="2"
									vectorEffect="non-scaling-stroke"
								/>
							</svg>
						</EventContainer>
					);
				})}
			</Wrapper>
		</Container>
	);
};

export default CalendarEvents;
