import React, { useRef } from 'react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, Info, TriangleAlert } from 'lucide-react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import calendarConfig from '@/core/constants/calendar_config';
import { StyledEvent } from '@/core/common/components/calendar/calendar_events';
import { ScheduleSubCalendarEvent } from '@/core/common/types/schedule';
import Spinner from '../loader';
import CalendarEvent from './calendar_event';
import Tooltip from '../tooltip';
import analytics from '@/core/util/analytics';
import TimeUtil from '@/core/util/time';
import CalendarEventInfo from './calendar_event_info';
import { a, useChain, useSpringRef, useTransition } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import CalendarContent from './calendar_content';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import CalendarContentDummy from './calendar_content_dummy';

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
	const viableEvents = events.filter((event) => event.isViable);
	const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
	const [selectedEventInfo, setSelectedEventInfo] = useState<StyledEvent | null>(null);

	const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
	const contentContainerRef = useRef<HTMLDivElement>(null);

	const [styledNonViableEvents, setStyledNonViableEvents] = useState<Array<StyledEvent>>([]);
	const [showNonViableEvents, setShowNonViableEvents] = useState<dayjs.Dayjs | null>(null);

	// Track calendar view mount
	useEffect(() => {
		analytics.trackCalendarEvent('View Loaded', {
			daysInView: viewOptions.daysInView,
			startDate: viewOptions.startDay.format('YYYY-MM-DD'),
		});
	}, []); // Only on mount

	useEffect(() => {
		// Reset selected event when events change
		setSelectedEvent(null);
	}, [events]);

	const contentMounted = viewOptions.width > 0;

	function changeDayView(dir: 'left' | 'right') {
		const changeAmount = dir === 'left' ? -1 : 1;

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
		const gridColor = palette.colors.gray[700];
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
	}, [viewOptions.width]);

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

	const calendarEventInfoModalRef = useRef<HTMLDivElement>(null);
	const [calendarEventInfoPos, setCalendarEventInfoPos] = useState<{ x: number; y: number }>({
		x: 100,
		y: 100,
	});
	useEffect(() => {
		if (selectedEventInfo) {
			calculateEventInfoCoordinates(selectedEventInfo!);
			contentContainerRef.current?.addEventListener(
				'click',
				(e) => {
					// Close the event info modal if clicking outside of it
					const modal = calendarEventInfoModalRef.current;
					if (modal && !modal.contains(e.target as Node)) {
						setSelectedEventInfo(null);
						setSelectedEvent(null);
					}
				},
				{ once: true }
			);
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

	const { t } = useTranslation();

	// Swiping logic
	const swiperRef = useRef<SwiperRef | null>(null);
	const isSwiperResetting = useRef(false);

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
											onClick={() =>
												setShowNonViableEvents((prev) =>
													prev?.isSame(day, 'day') ? null : day
												)
											}
										>
											<TriangleAlert
												size={18}
												color={palette.colors.brand[400]}
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
				return todaysNonViableEvents.length > 0 ? (
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
								<Info size={18} color={palette.colors.gray[500]} />
							</Tooltip>
						</header>

						{todaysNonViableEvents.map((event) => (
							<CalendarEvent
								event={event}
								key={event.id}
								selectedEvent={selectedEvent}
								setSelectedEvent={setSelectedEvent}
								setSelectedEventInfo={setSelectedEventInfo}
							/>
						))}
					</NonViableEventsContainer>
				) : null;
			})}

			{/* Loading Overlay */}
			<LoadingContainer $loading={eventsLoading}>
				<Spinner />
			</LoadingContainer>

			{/* Info Modal Overlay */}
			{calendarEventInfoTrans((style, item) => (
				<item.container style={style} key={item.key} ref={calendarEventInfoModalRef}>
					{item.content}
				</item.container>
			))}

			{/* Calendar Content */}
			<CalendarContentContainer id="calendar-content-container" ref={contentContainerRef}>
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
						}, 100);
					}}
					onSlidePrevTransitionStart={() => {
						if (isSwiperResetting.current || !swiperRef.current) return;
						changeDayView('left');

						isSwiperResetting.current = true;
						setTimeout(() => {
							swiperRef.current?.swiper.slideTo(1, 0, false);
							setTimeout(() => (isSwiperResetting.current = false), 0);
						}, 100);
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
							selectedEvent={selectedEvent}
							setSelectedEvent={setSelectedEvent}
							setSelectedEventInfo={setSelectedEventInfo}
							calendarGridCanvasRef={calendarGridCanvasRef}
							setStyledNonViableEvents={setStyledNonViableEvents}
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
	position: relative;
	width: 100%;
	height: 100%;
	background-color: ${palette.colors.gray[900]};
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
	background-color: ${palette.colors.gray[800]};
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
	color: ${palette.colors.gray[400]};
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:not(:disabled) {
		&:hover {
			background-color: ${palette.colors.gray[800]};
			color: ${palette.colors.gray[200]};
		}

		&:active {
			background-color: ${palette.colors.gray[700]};
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
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	font-size: ${palette.typography.fontSize.lg};
	text-transform: uppercase;
	color: ${({ $isToday }) => ($isToday ? palette.colors.white : palette.colors.gray[400])};

	&:not(:last-child) {
		border-right: 1px solid ${calendarConfig.BORDER_COLOR};
	}

	background-color: ${({ $isToday }) => ($isToday ? palette.colors.gray[700] : 'transparent')};
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5ch;

	span {
		color: ${({ $isToday }) =>
			$isToday ? palette.colors.brand[400] : palette.colors.gray[200]};
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
	background-color: rgba(0, 0, 0, 0.5);
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
	background-color: ${palette.colors.gray[200]};
	border-radius: 8px;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 10px;
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.black};
	pointer-events: none;
	user-select: none;
`;

const ShowNonViableEventsButton = styled.button<{ $active: boolean }>`
	width: 32px;
	height: 32px;
	background-color: transparent;
	box-shadow: 0 0 0 1px ${({ $active }) => ($active ? palette.colors.gray[500] : 'transparent')}
		inset;
	display: grid;
	place-items: center;
	border-radius: ${palette.borderRadius.xxLarge};

	&:hover {
		box-shadow: 0 0 0 1px ${palette.colors.gray[500]} inset;
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
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

	height: calc(100% - ${calendarConfig.HEADER_HEIGHT});
	width: ${({ $cellwidth }) => `${$cellwidth}px`};

	padding: 0.5rem;
	overflow-y: auto;
	background-color: ${palette.colors.glass};
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
		font-weight: ${palette.typography.fontWeight.bold};
		color: ${palette.colors.gray[300]};
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

export default Calendar;
