import React, { useEffect, useMemo } from 'react';
import calendarConfig from './config';
import { DummyScheduleEventType, DummyScheduleTravelDetailType } from '../../../data/dummySchedule';
import { CalendarViewOptions } from './calendar';
import dayjs from 'dayjs';
import styles from '../../../util/styles';
import { animated, useTransition } from '@react-spring/web';
import formatter from '../../../util/helpers/formatter';
import colorUtil from '../../../util/helpers/colors';
import { Bike, CarFront, Clock, DotIcon, LockKeyhole, Route } from 'lucide-react';
import calendarEventUtil from '../../../util/helpers/calendar_events';
import styled, { keyframes } from 'styled-components';
import { v4 } from 'uuid';

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

const EventContainer = styled(animated.div)<{
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
				const newColor = colorUtil.setLightness(colors, 0.7);
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
		const newColor = colorUtil.setLightness(colors, 0.325);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	color: ${({ colors }) => {
		const newColor = colorUtil.setLightness(colors, 0.85);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	border: 1px solid
		${({ colors, variant }) => {
			const blockColor = colorUtil.setLightness(colors, 0.6);
			const tileColor = colorUtil.setLightness(colors, 0.1);
			return variant === 'block'
				? `rgb(${blockColor.r}, ${blockColor.g}, ${blockColor.b})`
				: `rgb(${tileColor.r}, ${tileColor.g}, ${tileColor.b})`;
		}};
	height: 100%;
	padding: 8px;
	border-radius: 10px;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;

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
			display: ${({ variant }) => (variant === 'block' ? 'block' : 'none')};
		}
	}

	.duration {
		display: flex;
		align-items: center;
		font-size: ${styles.typography.fontSize.xs};
		font-weight: ${styles.typography.fontWeight.semibold};

		color: ${({ colors }) => {
			const newColor = colorUtil.setLightness(colors, 0.7);
			return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
		}};

		.clock {
			height: 18px;
			display: flex;
			gap: 0.5ch;
			align-items: center;
			border-radius: 6px;
			font-size: 11px;
			padding-inline: 4px;
		}

		.clock.highlight {
			margin-right: 0.5ch;
			color: ${({ colors }) => {
				const newColor = colorUtil.setLightness(colors, 0.2);
				return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
			}};
			background-color: ${({ colors }) => {
				const newColor = colorUtil.setLightness(colors, 0.7);
				return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
			}};
		}
	}
`;

const TravelDetailContent = styled(animated.div)<{ colors: { r: number; g: number; b: number } }>`
	position: absolute;
	display: flex;
	gap: 0.5ch;
	align-items: center;
	justify-content: center;
	background: ${({ colors }) => {
		const newColor = colorUtil.setLightness(colors, 0.7);
		return `repeating-linear-gradient(
			45deg,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.1),
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.1) 8px,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.2) 8px,
			rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.2) 9px
)`;
	}};
	color: ${({ colors }) => {
		const newColor = colorUtil.setLightness(colors, 0.5);
		return `rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, 0.75)`;
	}};
	font-size: ${styles.typography.fontSize.xs};
	font-weight: ${styles.typography.fontWeight.semibold};

	span {
		display: flex;
		align-items: center;
		gap: 0.5ch;
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
	scrollToTime: (time: dayjs.Dayjs, cellHeight: number) => void;
};

const CalendarEvents = ({
	events,
	viewOptions,
	headerWidth,
	selectedEvent,
	setSelectedEvent,
	cellHeight,
	setCellHeight,
	scrollToTime,
}: CalendarEventsProps) => {
	type CurrentViewEvent = DummyScheduleEventType & { key: string };
	type CurrentViewTravelDetail = DummyScheduleTravelDetailType & {
		key: string;
		colorRed: number;
		colorGreen: number;
		colorBlue: number;
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

			// Skip events that are not in the current view
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
				});
			}
		}
		return { currentViewEvents, currentViewTravelDetails };
	}, [events, viewOptions]);

	useEffect(() => {
		if (currentViewEvents.length > 0) {
			// Set Cell Height based on the event with minimum duration
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
			const newCellHeight = minCellHeight * (60 / minDurationInMinutes);

			setCellHeight(newCellHeight);

			// Scroll to the earliest event whenever the current events change
			const earliestEvent = currentViewEvents.reduce((earliest, event) => {
				const start = dayjs(event.start, 'unix');
				const startTime = start.hour() + start.minute() / 60;
				const earliestTime = earliest.hour() + earliest.minute() / 60;
				return startTime < earliestTime ? start : earliest;
			}, dayjs('9999-12-31').endOf('day'));

			if (earliestEvent.isValid()) {
				setTimeout(() => {
					scrollToTime(earliestEvent, newCellHeight);
				}, 0);
			}
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

	type StyledTravelDetail = CurrentViewTravelDetail & {
		springStyles: {
			left: number;
			top: number;
			width: number;
			height: number;
		};
	};

	function getBoundingBox(
		s: dayjs.Dayjs,
		e: dayjs.Dayjs
	): { x: number; y: number; width: number; height: number } {
		const startHourFraction = s.hour() + s.minute() / 60;
		const endHourFraction = e.hour() + e.minute() / 60;
		const dayIndex = s.diff(viewOptions.startDay.startOf('day'), 'day');

		// Positioning the event based on the day index and width
		const height = cellHeight * (endHourFraction - startHourFraction);
		const width = headerWidth / viewOptions.daysInView;
		const x = dayIndex * width;
		const y = cellHeight * startHourFraction;

		return { x, y, width, height };
	}

	const styledEvents = useMemo(() => {
		const result = [] as Array<StyledEvent>;

		// sort by start time
		currentViewEvents.sort((a, b) => {
			return dayjs(a.start, 'unix').diff(dayjs(b.start, 'unix'));
		});

		currentViewEvents.forEach((event) => {
			const s = dayjs(event.start, 'unix');
			const e = dayjs(event.end, 'unix');
			const { x, y, width, height } = getBoundingBox(s, e);
			const startHourFraction = s.hour() + s.minute() / 60;
			const endHourFraction = e.hour() + e.minute() / 60;

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

	const styledTravelDetails = useMemo(() => {
		const result = [] as Array<StyledTravelDetail>;

		currentViewTravelDetails.forEach((detail) => {
			const s = dayjs(detail.start);
			const e = dayjs(detail.end);
			const { x, y, width, height } = getBoundingBox(s, e);

			result.push({
				...detail,
				springStyles: { left: x, top: y, width, height },
			});
		});

		return result;
	}, [styledEvents]);

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
			config: { duration: 100 },
		}),
		enter: ({ springStyles }) => ({
			opacity: 1,
			scale: 1,
			...springStyles,
		}),
		update: ({ springStyles }) => ({ ...springStyles }),
		config: { tension: 500, friction: 40 },
		onRest: () => {
			console.log('rested');
		},
	});

	const travelTransition = useTransition(styledTravelDetails, {
		keys: (detail) => detail.key,
		from: () => ({ opacity: 0, scale: 0.9 }),
		leave: () => ({ opacity: 0, scale: 0.9, config: { duration: 100 } }),
		enter: () => ({ opacity: 1, scale: 1 }),
		config: { tension: 500, friction: 40 },
	});

	return (
		<Container id="calendar-events-container">
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
									<div className={`clock ${event.isTardy ? 'highlight' : ''}`}>
										<Clock size={14} />
										{event.isTardy && <span>Late</span>}
									</div>
									<span>
										{formatter.timeDuration(
											dayjs(event.start, 'unix'),
											dayjs(event.end, 'unix')
										)}
									</span>
								</div>
							</EventContent>
							{/* Border SVG for styling */}
							<svg
								viewBox="0 0 1 4"
								preserveAspectRatio="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									x="0"
									y="0"
									rx="0.08"
									ry="0.08"
									width="1"
									height="4"
									vectorEffect="non-scaling-stroke"
								/>
							</svg>
						</EventContainer>
					);
				})}

				{travelTransition((style, detail) => {
					const travelMediumIconMap: Record<string, React.ReactNode> = {
						driving: <CarFront size={16} />,
						biking: <Bike size={16} />,
						transit: <Route size={16} />,
					};
					return (
						<TravelDetailContent
							key={detail.key}
							style={{
								...detail.springStyles,
								...style,
							}}
							colors={{
								r: detail.colorRed,
								g: detail.colorGreen,
								b: detail.colorBlue,
							}}
						>
							<span>
								{travelMediumIconMap[detail.travelMedium] || <DotIcon size={16} />}
								{detail.travelMedium}
							</span>
							{formatter.timeDuration(
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

export default CalendarEvents;
