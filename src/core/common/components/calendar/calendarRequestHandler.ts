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
	/**
	 * Number of retry attempts already made. Used to bound the self-re-arming
	 * retry loop so a tile that renders a tick late (slow fetch, Swiper slide
	 * transition) still lands, without spinning forever if it truly never comes.
	 */
	attempts?: number;
}

/**
 * Maximum number of times `retryPendingFocus` re-resolves a pending focus
 * before reporting NotFound. Combined with {@link FOCUS_RETRY_DELAY_MS} this
 * gives roughly a one-second window for late-rendering tiles to appear.
 */
const MAX_FOCUS_RETRY_ATTEMPTS = 6;

/** Delay between self-re-armed focus retries (ms). */
const FOCUS_RETRY_DELAY_MS = 200;

/** All dependencies the handler needs from the Calendar component */
export interface CalendarRequestHandlerDeps {
	styledEventsRef: React.MutableRefObject<StyledEvent[]>;
	pendingFocusRef: React.MutableRefObject<PendingFocus | null>;
	contentContainerRef: React.RefObject<HTMLDivElement>;
	focusTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
	/**
	 * Separate timeout ref driving the self-re-arming focus retry loop in
	 * {@link retryPendingFocus}. Kept distinct from `focusTimeoutRef` (which
	 * powers the tile pulse) so the two never clobber each other. Optional so
	 * callers that don't wire it degrade to a single effect-driven attempt.
	 */
	focusRetryTimeoutRef?: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
	/**
	 * Ref-wrapped events pool for cache-before-fetch lookup. Using a ref
	 * (instead of a captured value) keeps the handler stable across renders
	 * while still seeing the latest events array — including the simulation
	 * overlay's `subCalendarEvents` during tilecast review, so clicking a
	 * preview action resolves from memory instead of hitting `/CalendarEvent`.
	 */
	eventsRef: React.MutableRefObject<SubCalendarEvent[]>;
	allowEventLookup: boolean;
	setShowNonViableEvents: (val: dayjs.Dayjs | null) => void;
	setSelectedEventInfo: (val: StyledEvent | null) => void;
	setSelectedEvent: (val: string | null) => void;
	setViewOptions: React.Dispatch<React.SetStateAction<CalendarViewOptions>>;
	setFocusedEventId: (val: string | null) => void;
	/**
	 * Pixel height of any UI overlay (e.g. mobile review bottom sheet) that
	 * occludes the bottom of the visible calendar area. `scrollToEvent` uses
	 * this so the focused tile is positioned above the overlay rather than
	 * underneath it. Read at call time via a ref to stay current as the
	 * sheet stop changes without rebuilding the handler.
	 */
	bottomInsetPxRef?: React.MutableRefObject<number>;
}

// ── Private helpers ────────────────────────────────────────────────

/** Scroll the calendar content container so the given event is visible.
 *
 * `bottomInsetPx` accounts for any overlay (e.g. the mobile review bottom
 * sheet) that occludes the lower portion of the visible area. When set,
 * the target shifts up so the event sits above the overlay rather than
 * behind it.
 */
function scrollToEvent(
	styledEvent: StyledEvent,
	contentContainerRef: React.RefObject<HTMLDivElement>,
	bottomInsetPx = 0
): void {
	if (!contentContainerRef.current) {
		return;
	}
	const container = contentContainerRef.current;
	const cellHeight = parseInt(calendarConfig.CELL_HEIGHT);
	const eventStart = dayjs(styledEvent.start);
	const hourFraction = eventStart.hour() + eventStart.minute() / 60 + eventStart.second() / 3600;
	// Position the event roughly one third down inside the *visible* area
	// (container height minus any overlay inset), so the popout has room
	// to render below it without sliding under the bottom sheet.
	const visibleHeight = Math.max(0, container.clientHeight - bottomInsetPx);
	const offsetWithinVisible =
		visibleHeight > 0 ? Math.min(visibleHeight / 3, cellHeight) : cellHeight;
	const targetScroll = Math.max(0, hourFraction * cellHeight - offsetWithinVisible);

	container.scrollTo({
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
		| 'bottomInsetPxRef'
	>
): void {
	const bottomInset = deps.bottomInsetPxRef?.current ?? 0;
	if (styledEvent.isViable) {
		deps.setShowNonViableEvents(null);
		deps.setSelectedEvent(styledEvent.id);
		deps.setSelectedEventInfo(styledEvent);
		scrollToEvent(styledEvent, deps.contentContainerRef, bottomInset);
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
				// (covers the full fetched date range, not just what's rendered).
				// Read through the ref so we always see the current pool — during
				// tilecast review this includes the simulation overlay's events.
				const currentEvents = deps.eventsRef.current;
				const cachedTileId = resolveEntityToTileId(entityId, entityType, currentEvents);
				const cachedEvent = cachedTileId
					? currentEvents.find((e) => e.id === cachedTileId)
					: undefined;

				if (cachedEvent) {
					// Found in cache — navigate without an API call (NAVIGATE_TO_DATE)
					const targetStartDay = dayjs(cachedEvent.start).startOf('day');
					deps.setShowNonViableEvents(null);
					deps.setSelectedEventInfo(null);
					deps.setSelectedEvent(null);
					onResult?.({ status: CalendarRequestStatus.Navigating, entityId });
					deps.pendingFocusRef.current = { entityId, entityType, onResult };
					deps.setViewOptions((prev) => ({
						...prev,
						startDay: targetStartDay,
					}));
					return;
				}

				// Not in cache — if the caller supplied an authoritative start
				// (e.g. the sub-events side panel), navigate straight to that day.
				// This bypasses the `/SubCalendarEvent` date lookup, which can
				// return a start that diverges from the grid's own value and aim
				// navigation at the wrong (often already-loaded) day.
				if (request.startHint != null) {
					const targetStartDay = dayjs(request.startHint).startOf('day');
					deps.setShowNonViableEvents(null);
					deps.setSelectedEventInfo(null);
					deps.setSelectedEvent(null);
					onResult?.({ status: CalendarRequestStatus.Navigating, entityId });
					deps.pendingFocusRef.current = { entityId, entityType, onResult };
					deps.setViewOptions((prev) => ({
						...prev,
						startDay: targetStartDay,
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

				// Track completion / deletion state from within the lookup callbacks
				let isEventComplete = false;
				let isEventDeleted = false;

				findEventDate({
					entityId,
					entityType,
					lookupSubCalEvent: async (id) => {
						try {
							const event = await scheduleService.lookupSubCalendarEventById(id);
							if (event.isEnabled === false) isEventDeleted = true;
							if (event.isComplete) isEventComplete = true;
							return event;
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
							if (calEvent.isEnabled === false) isEventDeleted = true;
							if (calEvent.isComplete) isEventComplete = true;
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
						onResult?.({ status: CalendarRequestStatus.Deleted, entityId });
						return;
					}

					if (isEventDeleted) {
						onResult?.({ status: CalendarRequestStatus.Deleted, entityId });
						return;
					}

					if (isEventComplete) {
						onResult?.({ status: CalendarRequestStatus.Completed, entityId });
						return;
					}

					// Store the pending focus so it retries after events reload
					deps.pendingFocusRef.current = { entityId, entityType, onResult };

					// Navigate the calendar view to the event's date
					const targetStartDay = dayjs(startMs).startOf('day');
					deps.setViewOptions((prev) => ({
						...prev,
						startDay: targetStartDay,
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
 *
 * Hardening: a single pass can miss because the target tile hasn't rendered
 * yet — the new day's events may still be settling, or a Swiper slide
 * transition is mid-flight. Rather than immediately reporting NotFound (which
 * silently drops the navigation), this self-re-arms up to
 * {@link MAX_FOCUS_RETRY_ATTEMPTS} times via {@link FOCUS_RETRY_DELAY_MS},
 * only giving up once the tile is confirmed absent across the whole window.
 */
export function retryPendingFocus(
	deps: Pick<
		CalendarRequestHandlerDeps,
		| 'styledEventsRef'
		| 'pendingFocusRef'
		| 'contentContainerRef'
		| 'focusTimeoutRef'
		| 'focusRetryTimeoutRef'
		| 'setShowNonViableEvents'
		| 'setSelectedEventInfo'
		| 'setSelectedEvent'
		| 'setFocusedEventId'
		| 'bottomInsetPxRef'
	>
): void {
	const pending = deps.pendingFocusRef.current;
	if (!pending) return;

	const { entityId, entityType, onResult, attempts = 0 } = pending;

	const resolvedTileId = resolveEntityToTileId(
		entityId,
		entityType,
		deps.styledEventsRef.current
	);

	const styledEvent = resolvedTileId
		? deps.styledEventsRef.current.find((e) => e.id === resolvedTileId)
		: undefined;

	if (styledEvent) {
		deps.pendingFocusRef.current = null;
		if (deps.focusRetryTimeoutRef?.current) {
			clearTimeout(deps.focusRetryTimeoutRef.current);
			deps.focusRetryTimeoutRef.current = null;
		}
		focusOnStyledEvent(styledEvent, deps);
		onResult?.({ status: CalendarRequestStatus.Found, entityId });
		return;
	}

	// Tile not rendered yet — re-arm rather than give up, so a late render
	// (slow fetch or slide transition) still lands on the target.
	if (attempts + 1 < MAX_FOCUS_RETRY_ATTEMPTS) {
		deps.pendingFocusRef.current = { entityId, entityType, onResult, attempts: attempts + 1 };
		if (deps.focusRetryTimeoutRef) {
			if (deps.focusRetryTimeoutRef.current) clearTimeout(deps.focusRetryTimeoutRef.current);
			deps.focusRetryTimeoutRef.current = setTimeout(
				() => retryPendingFocus(deps),
				FOCUS_RETRY_DELAY_MS
			);
		}
		return;
	}

	deps.pendingFocusRef.current = null;
	if (deps.focusRetryTimeoutRef?.current) {
		clearTimeout(deps.focusRetryTimeoutRef.current);
		deps.focusRetryTimeoutRef.current = null;
	}
	onResult?.({ status: CalendarRequestStatus.NotFound, entityId });
}
