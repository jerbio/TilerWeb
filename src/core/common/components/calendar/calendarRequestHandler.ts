import React from 'react';
import dayjs from 'dayjs';
import {
	CalendarRequestEnvelope,
	CalendarEntityType,
	CalendarRequestStatus,
	CalendarRequestType,
	CalendarRequestResult,
} from './calendarRequestContext';
import { StyledEvent } from './calendar_events';
import { SubCalendarEvent } from '@/core/common/types/schedule';
import { CalendarViewOptions } from './calendar.types';
import { resolveEntityToTileId } from '@/core/util/entityResolution';
import { findEventDate } from '@/core/util/eventDateLookup';
import { scheduleService } from '@/services';
import calendarConfig from '@/core/constants/calendar_config';

// ── Types ──────────────────────────────────────────────────────────

/** Pending focus stored when navigating to a date, retried after events reload */
export interface PendingFocus {
	entityId: string;
	entityType: CalendarEntityType;
	onResult?: (result: CalendarRequestResult) => void;
}

/** All dependencies the handler needs from the Calendar component */
export interface CalendarRequestHandlerDeps {
	styledEventsRef: React.MutableRefObject<StyledEvent[]>;
	pendingFocusRef: React.MutableRefObject<PendingFocus | null>;
	contentContainerRef: React.RefObject<HTMLDivElement>;
	focusTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
	events: SubCalendarEvent[];
	allowEventLookup: boolean;
	setShowNonViableEvents: (val: dayjs.Dayjs | null) => void;
	setSelectedEventInfo: (val: StyledEvent | null) => void;
	setSelectedEvent: (val: string | null) => void;
	setViewOptions: React.Dispatch<React.SetStateAction<CalendarViewOptions>>;
	setFocusedEventId: (val: string | null) => void;
}

// ── Private helpers ────────────────────────────────────────────────

/** Scroll the calendar content container so the given event is visible */
function scrollToEvent(
	styledEvent: StyledEvent,
	contentContainerRef: React.RefObject<HTMLDivElement>
): void {
	if (!contentContainerRef.current) return;
	const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);
	const eventStart = dayjs(styledEvent.start);
	const hourFraction = eventStart.hour() + eventStart.minute() / 60 + eventStart.second() / 3600;
	const targetScroll = Math.max(0, (hourFraction - 1) * cellHeight);

	contentContainerRef.current.scrollTo({
		top: targetScroll,
		behavior: 'smooth',
	});
}

/** Select a styled event, scroll/open overlay, and trigger pulse animation */
function focusOnStyledEvent(
	styledEvent: StyledEvent,
	deps: Pick<
		CalendarRequestHandlerDeps,
		| 'contentContainerRef'
		| 'focusTimeoutRef'
		| 'setShowNonViableEvents'
		| 'setSelectedEventInfo'
		| 'setSelectedEvent'
		| 'setFocusedEventId'
	>
): void {
	if (styledEvent.isViable) {
		deps.setShowNonViableEvents(null);
		deps.setSelectedEvent(styledEvent.id);
		deps.setSelectedEventInfo(styledEvent);
		scrollToEvent(styledEvent, deps.contentContainerRef);
	} else {
		const eventDay = dayjs(styledEvent.start);
		deps.setShowNonViableEvents(eventDay);
		deps.setSelectedEvent(styledEvent.id);
		deps.setSelectedEventInfo(styledEvent);
	}

	// Trigger pulse animation
	if (deps.focusTimeoutRef.current) clearTimeout(deps.focusTimeoutRef.current);
	deps.setFocusedEventId(styledEvent.id);
	deps.focusTimeoutRef.current = setTimeout(() => {
		deps.setFocusedEventId(null);
	}, 2500);
}

// ── Exported handlers ──────────────────────────────────────────────

/**
 * Creates the handler callback for incoming CalendarRequestEnvelopes.
 * Designed to be used inside a `useCallback` in the Calendar component.
 */
export function createCalendarRequestHandler(
	deps: CalendarRequestHandlerDeps
): (envelope: CalendarRequestEnvelope) => void {
	return (envelope) => {
		const { request, onResult } = envelope;

		if (request.type === CalendarRequestType.FocusEvent) {
			const { entityId, entityType } = request;

			// Resolve the entity to a concrete tile ID on the calendar grid
			const resolvedTileId = resolveEntityToTileId(
				entityId,
				entityType,
				deps.styledEventsRef.current
			);

			const styledEvent = resolvedTileId
				? deps.styledEventsRef.current.find((e) => e.id === resolvedTileId)
				: undefined;

			if (!styledEvent) {
				// ── Phase 4: Tile not in view ──────────────────────────

				// First, try to find the event in the already-loaded events array
				// (covers the full fetched date range, not just what's rendered)
				const cachedTileId = resolveEntityToTileId(entityId, entityType, deps.events);
				const cachedEvent = cachedTileId
					? deps.events.find((e) => e.id === cachedTileId)
					: undefined;

				if (cachedEvent) {
					// Found in cache — navigate without an API call (NAVIGATE_TO_DATE)
					deps.setShowNonViableEvents(null);
					deps.setSelectedEventInfo(null);
					deps.setSelectedEvent(null);
					onResult?.({ status: CalendarRequestStatus.Navigating, entityId });
					deps.pendingFocusRef.current = { entityId, entityType, onResult };
					deps.setViewOptions((prev) => ({
						...prev,
						startDay: dayjs(cachedEvent.start).startOf('day'),
					}));
					return;
				}

				// Not in cache — if event lookup is disabled (anonymous / demo),
				// surface a friendly demo_mode result instead of calling the API
				if (!deps.allowEventLookup) {
					onResult?.({ status: CalendarRequestStatus.DemoMode, entityId });
					return;
				}

				// Authenticated path — look up date via REST & navigate (NAVIGATE_TO_DATE)
				deps.setShowNonViableEvents(null);
				deps.setSelectedEventInfo(null);
				deps.setSelectedEvent(null);
				onResult?.({ status: CalendarRequestStatus.Navigating, entityId });

				findEventDate({
					entityId,
					entityType,
					lookupSubCalEvent: async (id) => {
						try {
							return await scheduleService.lookupSubCalendarEventById(id);
						} catch {
							return null;
						}
					},
					lookupCalEvent: async (id) => {
						try {
							const [calEvent, subEvents] = await Promise.all([
								scheduleService.lookupCalendarEventById(id),
								scheduleService.getSubEventsOfCalendar(id),
							]);
							if (!calEvent || calEvent.start == null) return null;
							return {
								start: calEvent.start,
								subEvents: (subEvents ?? []).map((s) => ({
									id: s.id,
									start: s.start,
								})),
							};
						} catch {
							return null;
						}
					},
				}).then((startMs) => {
					if (startMs == null) {
						onResult?.({ status: CalendarRequestStatus.NotFound, entityId });
						return;
					}

					// Store the pending focus so it retries after events reload
					deps.pendingFocusRef.current = { entityId, entityType, onResult };

					// Navigate the calendar view to the event's date
					deps.setViewOptions((prev) => ({
						...prev,
						startDay: dayjs(startMs).startOf('day'),
					}));
				});

				return;
			}

			// Event found in current view — focus on it
			focusOnStyledEvent(styledEvent, deps);
			onResult?.({ status: CalendarRequestStatus.Found, entityId });
		}

		if (request.type === CalendarRequestType.NavigateToDate) {
			const targetDay = dayjs(request.date).startOf('day');
			deps.setShowNonViableEvents(null);
			deps.setSelectedEventInfo(null);
			deps.setSelectedEvent(null);
			deps.setViewOptions((prev) => ({
				...prev,
				startDay: targetDay,
			}));
		}

		if (request.type === CalendarRequestType.GoToToday) {
			deps.setShowNonViableEvents(null);
			deps.setSelectedEventInfo(null);
			deps.setSelectedEvent(null);
			deps.setViewOptions((prev) => ({
				...prev,
				startDay: dayjs().startOf('day'),
			}));
		}

		if (request.type === CalendarRequestType.NavigateWeek) {
			const offset = request.direction === 'back' ? -7 : 7;
			deps.setShowNonViableEvents(null);
			deps.setSelectedEventInfo(null);
			deps.setSelectedEvent(null);
			deps.setViewOptions((prev) => ({
				...prev,
				startDay: prev.startDay.add(offset, 'day'),
			}));
		}
	};
}

/**
 * Retries a pending focus request after events have reloaded following
 * a date navigation. Called from a useEffect in the Calendar component.
 */
export function retryPendingFocus(
	deps: Pick<
		CalendarRequestHandlerDeps,
		| 'styledEventsRef'
		| 'pendingFocusRef'
		| 'contentContainerRef'
		| 'focusTimeoutRef'
		| 'setShowNonViableEvents'
		| 'setSelectedEventInfo'
		| 'setSelectedEvent'
		| 'setFocusedEventId'
	>
): void {
	const { entityId, entityType, onResult } = deps.pendingFocusRef.current!;
	deps.pendingFocusRef.current = null;

	const resolvedTileId = resolveEntityToTileId(
		entityId,
		entityType,
		deps.styledEventsRef.current
	);

	const styledEvent = resolvedTileId
		? deps.styledEventsRef.current.find((e) => e.id === resolvedTileId)
		: undefined;

	if (!styledEvent) {
		onResult?.({ status: CalendarRequestStatus.NotFound, entityId });
		return;
	}

	focusOnStyledEvent(styledEvent, deps);
	onResult?.({ status: CalendarRequestStatus.Found, entityId });
}
