import React, { useEffect, useMemo, useCallback } from 'react';
import Calendar from '@/core/common/components/calendar/calendar';
import usePrefetchedCalendarData from '@/core/common/hooks/usePrefetchedCalendarEvents';
import useCalendarView from '@/core/common/hooks/useCalendarView';
import { useScheduleSocket } from '@/hooks/useScheduleSocket';
import { useCalendarUI } from './calendar-ui.provider';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import { buildSimulationDiff, entityKey } from '@/core/util/simulationDiff';
import { buildSimulationActionLookups } from '@/core/util/simulationSelectors';
import SimulationModeBanner from './SimulationModeBanner';
import { SubCalendarEvent } from '@/core/common/types/schedule';
import { CalendarEntityType, CalendarRequestType } from './calendarRequestContext';
import { useCalendarDispatch } from './CalendarRequestProvider';

export function CalendarWrapper({
	chatExpanded,
	userId,
	width,
	allowEventLookup = true,
}: {
	chatExpanded?: boolean;
	userId: string | null;
	width: number;
	allowEventLookup?: boolean;
}) {
	const viewRef = React.useRef<HTMLUListElement>(null);

	const { viewOptions, setViewOptions } = useCalendarView(viewRef, width, chatExpanded);

	const setViewInfo = useCalendarUI((s) => s.setViewInfo);
	useEffect(() => {
		setViewInfo({ startDay: viewOptions.startDay, daysInView: viewOptions.daysInView });
	}, [viewOptions.startDay, viewOptions.daysInView, setViewInfo]);

	const { events, loading, refetchEvents } = usePrefetchedCalendarData({
		userId,
		viewOptions,
		daysInView: viewOptions.daysInView,
	});

	// Auto-refetch calendar events when a schedule change is detected via WebSocket
	useScheduleSocket(refetchEvents);

	// ---- Phase 5: simulation overlay subscription -----------------------
	// `chat.tsx` publishes review state to the overlay store; we react by
	// swapping the events array for the simulated overlay and rendering a
	// banner above the grid. Live cache stays warm via `usePrefetchedCalendarData`.
	const inReview = useSimulationOverlayStore((s) => s.inReview);
	const simulation = useSimulationOverlayStore((s) => s.simulation);
	const simulationResult = useSimulationOverlayStore((s) => s.simulationResult);
	const comparisonView = useSimulationOverlayStore((s) => s.comparisonView);
	const setComparisonView = useSimulationOverlayStore((s) => s.setComparisonView);
	const exitReview = useSimulationOverlayStore((s) => s.exitReview);
	const selectedActionId = useSimulationOverlayStore((s) => s.selectedActionId);
	const setSelectedActionId = useSimulationOverlayStore((s) => s.setSelectedActionId);

	const overlayEvents = useMemo<SubCalendarEvent[]>(() => {
		// Server returns `subCalendarEvents` (matching `/api/Schedule`); the
		// older `subEvents` key from the spec draft does not exist on the wire.
		const subs = simulationResult?.preview?.subCalendarEvents;
		return Array.isArray(subs) ? (subs as SubCalendarEvent[]) : [];
	}, [simulationResult]);

	const diff = useMemo(() => {
		if (!inReview || !simulation || !simulationResult) return null;
		const startMs = viewOptions.startDay.startOf('day').valueOf();
		const endMs = viewOptions.startDay
			.add(viewOptions.daysInView, 'day')
			.endOf('day')
			.valueOf();
		return buildSimulationDiff({
			liveEvents: events,
			overlayEvents,
			actions: simulation.previewActions ?? [],
			window: { startMs, endMs },
		});
		// `events` is recomputed on every fetch; intentional re-diff on change.
	}, [
		inReview,
		simulation,
		simulationResult,
		events,
		overlayEvents,
		viewOptions.startDay,
		viewOptions.daysInView,
	]);

	const showOverlay = inReview && comparisonView === 'simulation' && diff !== null;
	const renderedEvents = showOverlay ? diff!.events : events;

	// Plan §5.3 — bidirectional selection. Build the lookups once per
	// simulation and route tile clicks back to `selectedActionId`.
	const lookups = useMemo(
		() => (simulation ? buildSimulationActionLookups(simulation) : null),
		[simulation]
	);

	const calendarDispatch = useCalendarDispatch();
	const onSimulatedTileClick = useCallback(
		(entityId: string, entityType: CalendarEntityType) => {
			if (!lookups) return;
			const action = lookups.byEntityKey[entityKey(entityType, entityId)];
			if (!action) return;
			// Backend `PreviewAction.ToJson` may omit `actionId`; fall back to
			// the embedded `action.id` so the chip↔tile round-trip still works.
			const aid = action.actionId ?? action.action?.id ?? null;
			if (aid) setSelectedActionId(aid);
			// Always dispatch FocusEvent for the direct user gesture so the
			// preview popout opens even when this id is already the current
			// `selectedActionId` (in which case the store-driven debounced
			// effect in chat.tsx would short-circuit on equality).
			calendarDispatch({
				type: CalendarRequestType.FocusEvent,
				entityId,
				entityType,
				actionType: action.action?.type ?? 'none',
			});
		},
		[lookups, setSelectedActionId, calendarDispatch]
	);

	const selectedSimulationKey = useMemo(() => {
		if (!showOverlay || !lookups || !selectedActionId) return null;
		const action = lookups.byActionId[selectedActionId];
		if (!action || !action.entityId || !action.entityType) return null;
		return entityKey(action.entityType, action.entityId);
	}, [showOverlay, lookups, selectedActionId]);

	return (
		<>
			{inReview && diff && (
				<SimulationModeBanner
					counts={diff.counts}
					comparisonView={comparisonView}
					onComparisonViewChange={setComparisonView}
					onExitReview={exitReview}
				/>
			)}
			<Calendar
				viewOptions={viewOptions}
				setViewOptions={setViewOptions}
				events={renderedEvents}
				eventsLoading={loading}
				viewRef={viewRef}
				refetchEvents={refetchEvents}
				allowEventLookup={allowEventLookup}
				simulationClassification={showOverlay ? diff!.classification : undefined}
				onSimulatedTileClick={showOverlay ? onSimulatedTileClick : undefined}
				selectedSimulationKey={selectedSimulationKey}
			/>
		</>
	);
}
