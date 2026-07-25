import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import dayjs from 'dayjs';
import { ChevronRight, Loader2 } from 'lucide-react';
import { scheduleService } from '@/services';
import { SubCalendarEvent } from '@/core/common/types/schedule';
import { Actions } from '@/core/constants/enums';
import {
	CalendarEntityType,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import { useOptionalCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import { normalizeRootId } from '@/core/common/utils/tilerEventUtils';
import { formatDurationShort } from '@/core/common/utils/timeUtils';

const BATCH_SIZE = 20;

type LoadStatus = 'loading' | 'ready' | 'error';

interface SubEventsSectionProps {
	/** Full calendar-event id; normalized to the root id used by the sub-events query. */
	eventId: string;
	/** Expected sub-event count (from the parent's split count) — drives header + skeleton. */
	splitCount?: number | null;
}

function isActive(sub: SubCalendarEvent): boolean {
	return sub.isComplete !== true && sub.isEnabled !== false;
}

/** Stable order: ascending start time, then id as a deterministic tiebreak. */
function byTimeThenId(a: SubCalendarEvent, b: SubCalendarEvent): number {
	if (a.start !== b.start) return a.start - b.start;
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Dedupe by id (first occurrence wins) and sort by start time. */
function orderAndDedupe(list: SubCalendarEvent[]): SubCalendarEvent[] {
	const seen = new Set<string>();
	const unique: SubCalendarEvent[] = [];
	for (const sub of list) {
		if (seen.has(sub.id)) continue;
		seen.add(sub.id);
		unique.push(sub);
	}
	return unique.sort(byTimeThenId);
}

/** Merge helper — append new items, skipping ids already present (order preserved). */
function appendUnique(prev: SubCalendarEvent[], next: SubCalendarEvent[]): SubCalendarEvent[] {
	if (next.length === 0) return prev;
	const seen = new Set(prev.map((s) => s.id));
	const fresh = next.filter((s) => !seen.has(s.id));
	return fresh.length ? [...prev, ...fresh] : prev;
}

/** Merge helper — prepend new items, skipping ids already present (order preserved). */
function prependUnique(prev: SubCalendarEvent[], next: SubCalendarEvent[]): SubCalendarEvent[] {
	if (next.length === 0) return prev;
	const seen = new Set(prev.map((s) => s.id));
	const fresh = next.filter((s) => !seen.has(s.id));
	return fresh.length ? [...fresh, ...prev] : prev;
}

const SubEventsSection: React.FC<SubEventsSectionProps> = ({ eventId, splitCount }) => {
	const { t, i18n } = useTranslation();
	const dispatch = useOptionalCalendarDispatch();
	const queryId = useMemo(() => normalizeRootId(eventId), [eventId]);

	const [subEvents, setSubEvents] = useState<SubCalendarEvent[]>([]);
	const [leftCursorId, setLeftCursorId] = useState<string | null>(null);
	const [rightCursorId, setRightCursorId] = useState<string | null>(null);
	const [hasMoreAfter, setHasMoreAfter] = useState(false);
	const [hasMoreBefore, setHasMoreBefore] = useState(false);
	const [status, setStatus] = useState<LoadStatus>('loading');
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [showCompleted, setShowCompleted] = useState(false);

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const bootstrap = useCallback(() => {
		let cancelled = false;
		setStatus('loading');
		scheduleService
			.getSubEventsOfCalendar(queryId, {
				batchSize: BATCH_SIZE,
				orderingEngine: 'ProximityToNow',
			})
			.then((items) => {
				if (cancelled) return;
				const list = items ?? [];
				setSubEvents(list);
				setLeftCursorId(list.length ? list[0].id : null);
				setRightCursorId(list.length ? list[list.length - 1].id : null);
				setHasMoreAfter(list.length >= BATCH_SIZE);
				setHasMoreBefore(list.length >= BATCH_SIZE);
				setStatus('ready');
			})
			.catch(() => {
				if (cancelled) return;
				setSubEvents([]);
				setStatus('error');
			});
		return () => {
			cancelled = true;
		};
	}, [queryId]);

	useEffect(() => bootstrap(), [bootstrap]);

	const loadAfter = useCallback(async () => {
		if (isLoadingMore || !hasMoreAfter || !rightCursorId) return;
		setIsLoadingMore(true);
		try {
			const items = await scheduleService.getSubEventsOfCalendar(queryId, {
				batchSize: BATCH_SIZE,
				orderingEngine: 'Id',
				afterSubEventId: rightCursorId,
			});
			const list = items ?? [];
			setSubEvents((prev) => appendUnique(prev, list));
			if (list.length) setRightCursorId(list[list.length - 1].id);
			setHasMoreAfter(list.length >= BATCH_SIZE);
		} catch {
			setHasMoreAfter(false);
		} finally {
			setIsLoadingMore(false);
		}
	}, [queryId, isLoadingMore, hasMoreAfter, rightCursorId]);

	const loadBefore = useCallback(async () => {
		if (isLoadingMore || !hasMoreBefore || !leftCursorId) return;
		setIsLoadingMore(true);
		try {
			const items = await scheduleService.getSubEventsOfCalendar(queryId, {
				batchSize: BATCH_SIZE,
				orderingEngine: 'Id',
				beforeSubEventId: leftCursorId,
			});
			const list = items ?? [];
			setSubEvents((prev) => prependUnique(prev, list));
			if (list.length) setLeftCursorId(list[0].id);
			setHasMoreBefore(list.length >= BATCH_SIZE);
		} catch {
			setHasMoreBefore(false);
		} finally {
			setIsLoadingMore(false);
		}
	}, [queryId, isLoadingMore, hasMoreBefore, leftCursorId]);

	// Auto-load the next page when the bottom sentinel scrolls into view.
	useEffect(() => {
		if (status !== 'ready' || !hasMoreAfter) return;
		if (typeof IntersectionObserver === 'undefined') return;
		const node = sentinelRef.current;
		if (!node) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) loadAfter();
			},
			{ root: scrollRef.current, rootMargin: '120px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [status, hasMoreAfter, loadAfter]);

	const handleNavigate = useCallback(
		(sub: SubCalendarEvent) => {
			if (!dispatch) return;
			dispatch({
				type: CalendarRequestType.FocusEvent,
				entityId: sub.id,
				entityType: CalendarEntityType.SubcalendarEvent,
				actionType: Actions.None,
			});
		},
		[dispatch]
	);

	const visibleSubEvents = useMemo(() => {
		const ordered = orderAndDedupe(subEvents);
		return showCompleted ? ordered : ordered.filter(isActive);
	}, [showCompleted, subEvents]);

	const headerCount = splitCount != null && splitCount > 0 ? splitCount : subEvents.length;

	return (
		<Wrapper data-testid="sub-events-section">
			<HeaderRow>
				<HeaderTitle>{t('calendarEvent.edit.subEvents.title')}</HeaderTitle>
				{status === 'loading' && (
					<HeaderSpinner data-testid="sub-events-spinner" size={14} />
				)}
			</HeaderRow>

			<FilterRow>
				<FilterLabel>
					<input
						type="checkbox"
						checked={showCompleted}
						onChange={(e) => setShowCompleted(e.target.checked)}
						data-testid="sub-events-filter-toggle"
					/>
					<span>{t('calendarEvent.edit.subEvents.showCompleted')}</span>
				</FilterLabel>
			</FilterRow>

			{status === 'loading' && (
				<SkeletonList data-testid="sub-events-skeleton">
					{Array.from({ length: Math.min(Math.max(headerCount || 3, 3), 6) }).map(
						(_, i) => (
							<SkeletonRow key={i} />
						)
					)}
				</SkeletonList>
			)}

			{status === 'error' && (
				<StateMessage data-testid="sub-events-error">
					<span>{t('calendarEvent.edit.subEvents.error')}</span>
					<RetryButton type="button" onClick={bootstrap}>
						{t('calendarEvent.edit.subEvents.retry')}
					</RetryButton>
				</StateMessage>
			)}

			{status === 'ready' && (
				<ScrollArea ref={scrollRef} data-testid="sub-events-scroll">
					{hasMoreBefore && (
						<EdgeButton
							type="button"
							onClick={loadBefore}
							disabled={isLoadingMore}
							data-testid="sub-events-load-earlier"
						>
							{isLoadingMore && <InlineSpinner size={14} />}
							{t('calendarEvent.edit.subEvents.loadEarlier')}
						</EdgeButton>
					)}

					{visibleSubEvents.length === 0 ? (
						<StateMessage data-testid="sub-events-empty">
							{t('calendarEvent.edit.subEvents.empty')}
						</StateMessage>
					) : (
						<List>
							{visibleSubEvents.map((sub) => {
								const complete = sub.isComplete === true;
								const removed = sub.isEnabled === false;
								return (
									<Row
										key={sub.id}
										type="button"
										onClick={() => handleNavigate(sub)}
										aria-label={t('calendarEvent.edit.subEvents.goTo')}
										data-testid={`sub-event-row-${sub.id}`}
									>
										<StatusDot
											$complete={complete}
											$removed={removed}
											aria-hidden
										/>
										<RowMain>
											<RowTop>
												<RowDate>
													{dayjs(sub.start).format('ddd, MMM D')}
												</RowDate>
												{complete && (
													<RowBadge>
														{t(
															'calendarEvent.edit.subEvents.completed'
														)}
													</RowBadge>
												)}
												{removed && (
													<RowBadge>
														{t('calendarEvent.edit.subEvents.removed')}
													</RowBadge>
												)}
											</RowTop>
											<RowBottom>
												<span>
													{dayjs(sub.start).format('h:mm A')}
													{' – '}
													{dayjs(sub.end).format('h:mm A')}
												</span>
												<RowDuration>
													{formatDurationShort(
														sub.end - sub.start,
														i18n.language
													)}
												</RowDuration>
											</RowBottom>
										</RowMain>
										<ChevronRight size={16} aria-hidden />
									</Row>
								);
							})}
						</List>
					)}

					{hasMoreAfter ? (
						<>
							<Sentinel ref={sentinelRef} aria-hidden />
							<EdgeButton
								type="button"
								onClick={loadAfter}
								disabled={isLoadingMore}
								data-testid="sub-events-load-more"
							>
								{isLoadingMore && <InlineSpinner size={14} />}
								{t('calendarEvent.edit.subEvents.loadMore')}
							</EdgeButton>
						</>
					) : (
						visibleSubEvents.length > 0 && (
							<EndChip data-testid="sub-events-end">
								{t('calendarEvent.edit.subEvents.allLoaded', {
									count: subEvents.length,
								})}
							</EndChip>
						)
					)}
				</ScrollArea>
			)}
		</Wrapper>
	);
};

export default SubEventsSection;

// ── Styled ─────────────────────────────────────────────────────────

const spin = keyframes`
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
`;

const pulse = keyframes`
	0%   { opacity: 0.45; }
	50%  { opacity: 0.9; }
	100% { opacity: 0.45; }
`;

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const HeaderTitle = styled.h3`
	margin: 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
`;

const HeaderSpinner = styled(Loader2)`
	animation: ${spin} 1s linear infinite;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const InlineSpinner = styled(Loader2)`
	animation: ${spin} 1s linear infinite;
`;

const FilterRow = styled.div`
	display: flex;
	align-items: center;
`;

const FilterLabel = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.8125rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
`;

const ScrollArea = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	max-height: min(48vh, 420px);
	overflow-y: auto;
	overscroll-behavior: contain;
	/* room so the last row's focus ring / shadow isn't clipped by the scrollbar */
	padding-right: 0.125rem;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const Row = styled.button`
	display: flex;
	align-items: center;
	gap: 0.625rem;
	width: 100%;
	text-align: left;
	padding: 0.5rem 0.625rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0.5rem;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	cursor: pointer;
	transition: background 0.15s ease;

	&:hover,
	&:focus-visible {
		background: ${({ theme }) => theme.colors.background.card2};
	}
`;

const StatusDot = styled.span<{ $complete: boolean; $removed: boolean }>`
	flex: 0 0 auto;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ theme, $complete, $removed }) =>
		$removed ? theme.colors.text.muted : $complete ? '#22c55e' : theme.colors.brand[500]};
`;

const RowMain = styled.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
`;

const RowTop = styled.div`
	display: flex;
	align-items: center;
	gap: 0.375rem;
`;

const RowDate = styled.span`
	font-size: 0.8125rem;
	font-weight: 600;
`;

const RowBadge = styled.span`
	font-size: 0.6875rem;
	padding: 0.05rem 0.35rem;
	border-radius: 0.375rem;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const RowBottom = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const RowDuration = styled.span`
	flex: 0 0 auto;
`;

const EdgeButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	align-self: center;
	padding: 0.375rem 0.875rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.8125rem;
	cursor: pointer;

	&:disabled {
		opacity: 0.6;
		cursor: default;
	}
`;

const EndChip = styled.div`
	align-self: center;
	padding: 0.25rem 0.75rem;
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.75rem;
`;

const StateMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0;
	font-size: 0.8125rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const RetryButton = styled.button`
	padding: 0.25rem 0.625rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0.375rem;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.75rem;
	cursor: pointer;
`;

const SkeletonList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const SkeletonRow = styled.div`
	height: 44px;
	border-radius: 0.5rem;
	background: ${({ theme }) => theme.colors.background.card2};
	animation: ${pulse} 1.4s ease-in-out infinite;
`;

const Sentinel = styled.div`
	height: 1px;
`;
