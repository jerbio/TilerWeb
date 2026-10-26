import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { scheduleService } from '@/services';
import useAppStore from '@/global_state';
import {
	CalendarEvent,
	CalendarSearchItem,
	CalendarSearchSource,
	CalendarSearchSourceStatus,
} from '@/core/common/types/schedule';
import { CalendarSearchUnavailableError } from '@/core/common/types/errors';
import { useCalendarUI } from '@/core/common/components/calendar/calendar-ui.provider';
import { useOptionalCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import { Actions } from '@/core/constants/enums';
import { getCalendarEventId } from '@/core/util/entityResolution';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { SearchResults } from './search_results';

export type SearchBarProps = {
	/** Called with search results when a search completes */
	onResults?: (results: CalendarEvent[]) => void;
	/** Called with the current query string on each (debounced) input change */
	onSearch?: (query: string) => void;
	/** Debounce delay in ms (default: 300) */
	debounceMs?: number;
	/** Number of results per page (default: 10) */
	pageSize?: number;
	/** Optional UTC epoch-millisecond overlap window; supply both bounds. */
	start?: number;
	end?: number;
};

/** Map a multi-source search item to the shape the edit path / onResults expect. */
const searchItemToCalendarEvent = (item: CalendarSearchItem): CalendarEvent => ({
	id: item.id,
	start: item.start,
	end: item.end,
	name: item.name,
	address: null,
	addressDescription: null,
	searchdDescription: null,
	splitCount: null,
	completeCount: null,
	deletionCount: null,
	// Forward third-party routing metadata so the edit path can dispatch to the
	// correct provider (S4-6).
	thirdpartyType: item.source,
	thirdPartyId: item.thirdPartyEventId ?? null,
	thirdPartyUserId: item.thirdPartyUserId ?? null,
	colorOpacity: null,
	colorRed: null,
	colorGreen: null,
	colorBlue: null,
	isComplete: null,
	isEnabled: null,
	isRecurring: null,
	locationId: null,
	isReadOnly: item.isReadOnly ?? null,
	isProcrastinateEvent: null,
	isRigid: null,
	uiConfig: null,
	repetition: null,
	eachTileDuration: null,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: null,
	entityName: null,
	blob: null,
	subEvents: null,
});

const SearchBar: React.FC<SearchBarProps> = ({
	onResults,
	onSearch,
	debounceMs = 300,
	pageSize = 10,
	start,
	end,
}) => {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [nextIndex, setNextIndex] = useState<number | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
	const [confirmingAction, setConfirmingAction] = useState<{
		eventId: string;
		action: 'complete' | 'delete';
	} | null>(null);
	/** Multi-source row that triggered a pending delete, if any (third-party routing). */
	const [confirmingItem, setConfirmingItem] = useState<CalendarSearchItem | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchSeqRef = useRef(0);
	const invalidateSearch = useCallback(() => {
		searchSeqRef.current++;
	}, []);
	const loadingMoreRef = useRef(false);
	const [msItems, setMsItems] = useState<CalendarSearchItem[]>([]);
	const [msSources, setMsSources] = useState<CalendarSearchSourceStatus[]>([]);
	const [searchUnavailable, setSearchUnavailable] = useState<Error | null>(null);
	const [correlationId, setCorrelationId] = useState<string | null>(null);
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const openCreateSelection = useCalendarUI((state) => state.createSelection.actions.open);
	const openEditTile = useCalendarUI((state) => state.editTile.actions.open);
	const dispatchCalendarRequest = useOptionalCalendarDispatch();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const performSearch = useCallback(
		async (searchQuery: string, index = 0, append = false) => {
			const token = ++searchSeqRef.current;
			if (!searchQuery.trim() || !authenticatedUser) {
				setMsItems([]);
				setMsSources([]);
				setSearchUnavailable(null);
				setHasSearched(false);
				setShowDropdown(false);
				setIsLoading(false);
				setIsLoadingMore(false);
				setHasMore(false);
				setNextIndex(null);
				loadingMoreRef.current = false;
				onResults?.([]);
				return;
			}
			if (append) {
				loadingMoreRef.current = true;
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
				setIsLoadingMore(false);
				loadingMoreRef.current = false;
				setMsItems([]);
				setMsSources([]);
				setHasMore(false);
				setNextIndex(null);
				setHasSearched(false);
				setShowDropdown(false);
			}
			setSearchUnavailable(null);
			try {
				const envelope = await scheduleService.searchCalendarEventsMultiSource(
					searchQuery,
					undefined,
					{ batchSize: pageSize, index, start, end }
				);
				if (token !== searchSeqRef.current) return;
				const combined = append ? [...msItems, ...envelope.items] : envelope.items;
				const seen = new Set<string>();
				const items = combined.filter((item) => {
					const key = JSON.stringify([
						item.source,
						item.thirdPartyUserId,
						item.thirdPartyEventId ?? item.id,
						item.start,
					]);
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
				setCorrelationId(envelope.correlationId);
				setMsItems(items);
				setMsSources(envelope.sources);
				setHasMore(envelope.hasMore === true && envelope.nextIndex != null);
				setNextIndex(envelope.nextIndex ?? null);
				setHasSearched(true);
				setShowDropdown(true);
				onResults?.(items.map(searchItemToCalendarEvent));
			} catch (error) {
				if (token !== searchSeqRef.current) return;
				if (error instanceof CalendarSearchUnavailableError) {
					setCorrelationId(error.correlationId);
					setSearchUnavailable(error);
				} else {
					console.error('Calendar search failed:', error);
					setSearchUnavailable(new Error(t('timeline.multiSource.unavailable')));
				}
				if (!append) {
					setMsItems([]);
					setMsSources([]);
					onResults?.([]);
				}
				setHasSearched(true);
				setShowDropdown(true);
			} finally {
				if (token === searchSeqRef.current) {
					setIsLoading(false);
					setIsLoadingMore(false);
					loadingMoreRef.current = false;
				}
			}
		},
		[authenticatedUser, onResults, pageSize, start, end, msItems, t]
	);

	/**
	 * Open the edit path from a multi-source result and emit
	 * `calendar_search_edit_opened` (S4-6).
	 *
	 * - Tiler rows open the classic edit panel (`openEditTile`) with the row
	 *   mapped to the `CalendarEvent` shape.
	 * - Third-party rows (google / microsoft) dispatch a `FocusEvent` calendar
	 *   request carrying the provider routing metadata; the calendar handler
	 *   navigates to the tile and hands `CalendarEventInfo` the metadata it
	 *   needs to dispatch edits to the correct provider.
	 */
	const handleMultiSourceEdit = useCallback(
		(item: CalendarSearchItem) => {
			if (item.source === CalendarSearchSource.Tiler) {
				openEditTile(searchItemToCalendarEvent(item));
			} else if (dispatchCalendarRequest) {
				dispatchCalendarRequest({
					type: CalendarRequestType.FocusEvent,
					entityId: item.id,
					entityType: CalendarEntityType.SubcalendarEvent,
					actionType: Actions.None,
					startHint: item.start,
					thirdPartyType: item.source,
					thirdPartyId: item.thirdPartyEventId ?? undefined,
					thirdPartyUserId: item.thirdPartyUserId ?? undefined,
				});
			} else {
				// No calendar bus (isolated mount) — degrade to the classic
				// edit panel, which still receives the third-party fields.
				openEditTile(searchItemToCalendarEvent(item));
			}
			invalidateSearch();
			loadingMoreRef.current = false;
			setIsLoading(false);
			setIsLoadingMore(false);
			setShowDropdown(false);
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('calendar_search_edit_opened', {
						detail: {
							correlationId,
							source: item.source,
							capabilities: item.capabilities,
						},
					})
				);
			}
		},
		[dispatchCalendarRequest, openEditTile, correlationId, invalidateSearch]
	);

	const loadMore = useCallback(() => {
		if (
			!query.trim() ||
			!authenticatedUser ||
			isLoading ||
			loadingMoreRef.current ||
			!hasMore ||
			nextIndex == null
		)
			return;
		void performSearch(query, nextIndex, true);
	}, [query, authenticatedUser, isLoading, hasMore, nextIndex, performSearch]);

	const resetSearch = useCallback(() => {
		invalidateSearch();
		loadingMoreRef.current = false;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setQuery('');
		setMsItems([]);
		setMsSources([]);
		setSearchUnavailable(null);
		setCorrelationId(null);
		setHasSearched(false);
		setShowDropdown(false);
		setNextIndex(null);
		setHasMore(false);
		setIsLoading(false);
		setIsLoadingMore(false);
		onSearch?.('');
		onResults?.([]);
	}, [onSearch, onResults, invalidateSearch]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Invalidate immediately, including the debounce interval and whitespace queries.
		invalidateSearch();
		loadingMoreRef.current = false;
		setIsLoading(false);
		setIsLoadingMore(false);
		setHasMore(false);
		setNextIndex(null);
		setShowDropdown(false);
		setConfirmingAction(null);
		setConfirmingItem(null);
		setQuery(value);
		onSearch?.(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => void performSearch(value), debounceMs);
	};

	const handleClear = () => {
		resetSearch();
		setActionLoading({});
		setConfirmingAction(null);
		setConfirmingItem(null);
	};

	// A new timeline, user or page size restarts the current query at the first batch.
	// Keep the query/callback in refs so result updates never resubmit a search.
	const queryRef = useRef(query);
	queryRef.current = query;
	const performSearchRef = useRef(performSearch);
	performSearchRef.current = performSearch;
	useEffect(() => {
		invalidateSearch();
		loadingMoreRef.current = false;
		setIsLoading(false);
		setIsLoadingMore(false);
		setHasMore(false);
		setNextIndex(null);
		setShowDropdown(false);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (queryRef.current.trim()) {
			debounceRef.current = setTimeout(
				() => void performSearchRef.current(queryRef.current),
				debounceMs
			);
		}
		return () => {
			invalidateSearch();
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [start, end, pageSize, authenticatedUser?.id, debounceMs, invalidateSearch]);

	const handleDismissNotFound = () => {
		setShowDropdown(false);
		setHasSearched(false);
	};

	const handleCreate = () => {
		openCreateSelection();
		setShowDropdown(false);
	};

	const handleSetAsNow = useCallback(
		async (eventId: string) => {
			setActionLoading((prev) => ({ ...prev, [eventId]: 'now' }));
			const notifId = notificationId(NotificationAction.SetAsNow, eventId);
			showNotification(notifId, t('calendarEvent.notifications.settingAsNow'), 'loading');
			// Dismiss search bar immediately â€” don't wait for the request
			resetSearch();
			try {
				await scheduleService.setCalendarEventAsNow(eventId);
				updateNotification(
					notifId,
					t('calendarEvent.notifications.setAsNowSuccess'),
					'success'
				);
			} catch (error) {
				console.error('Set as now failed:', error);
				updateNotification(notifId, t('calendarEvent.notifications.actionFailed'), 'error');
			} finally {
				setActionLoading((prev) => {
					const next = { ...prev };
					delete next[eventId];
					return next;
				});
			}
		},
		[showNotification, updateNotification, t, resetSearch]
	);

	const handleMarkComplete = useCallback((eventId: string) => {
		setConfirmingAction({ eventId, action: 'complete' });
	}, []);

	const handleDelete = useCallback((eventId: string, item?: CalendarSearchItem) => {
		setConfirmingAction({ eventId, action: 'delete' });
		// Remember the multi-source row (if any) so the confirmed delete
		// can route third-party events through `DELETE /api/Schedule/Event`.
		setConfirmingItem(item ?? null);
	}, []);

	const handleConfirmAction = useCallback(async () => {
		if (!confirmingAction) return;
		const { eventId, action } = confirmingAction;
		const confirmItem = confirmingItem;
		setConfirmingAction(null);
		setConfirmingItem(null);
		setActionLoading((prev) => ({ ...prev, [eventId]: action }));
		const notifAction =
			action === 'complete' ? NotificationAction.Complete : NotificationAction.Delete;
		const notifId = notificationId(notifAction, eventId);
		const loadingMsg =
			action === 'complete'
				? t('calendarEvent.notifications.completing')
				: t('calendarEvent.notifications.deleting');
		const successMsg =
			action === 'complete'
				? t('calendarEvent.notifications.completeSuccess')
				: t('calendarEvent.notifications.deleteSuccess');
		showNotification(notifId, loadingMsg, 'loading');
		// Dismiss search bar immediately â€” don't wait for the request
		resetSearch();
		try {
			if (action === 'complete') {
				await scheduleService.markCalendarEventComplete(eventId);
			} else if (confirmItem && confirmItem.source !== CalendarSearchSource.Tiler) {
				// Third-party rows delete through the schedule service so the
				// provider event is removed from its source system.
				await scheduleService.deleteScheduleEvent(
					getCalendarEventId(confirmItem.id),
					confirmItem.source,
					confirmItem.thirdPartyEventId ?? '',
					confirmItem.thirdPartyUserId ?? ''
				);
			} else {
				await scheduleService.deleteCalendarEvent(eventId);
			}
			updateNotification(notifId, successMsg, 'success');
		} catch (error) {
			console.error(`${action} failed:`, error);
			updateNotification(notifId, t('calendarEvent.notifications.actionFailed'), 'error');
		} finally {
			setActionLoading((prev) => {
				const next = { ...prev };
				delete next[eventId];
				return next;
			});
		}
	}, [confirmingAction, confirmingItem, showNotification, updateNotification, t, resetSearch]);

	const handleCancelConfirm = useCallback(() => {
		setConfirmingAction(null);
		setConfirmingItem(null);
	}, []);

	// Click-outside handler to dismiss dropdown
	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!showDropdown) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showDropdown]);

	const isAnyActionInProgress = Object.keys(actionLoading).length > 0;
	const isInteractionBlocked = isAnyActionInProgress || !!confirmingAction;
	const hasPartialFailure = msSources.some(
		(s) => s.status === 'partial' || s.status === 'failed'
	);
	const showResults = showDropdown && hasSearched && (msItems.length > 0 || hasPartialFailure);
	const showUnavailable = showDropdown && !!searchUnavailable;
	const showNotFound =
		showDropdown &&
		hasSearched &&
		msItems.length === 0 &&
		!searchUnavailable &&
		!hasPartialFailure;

	return (
		<SearchContainer ref={containerRef}>
			<SearchIconWrapper data-testid="search-icon">
				<Search size={16} />
			</SearchIconWrapper>
			<SearchInput
				type="text"
				placeholder={t('timeline.searchPlaceholder')}
				value={query}
				onChange={handleChange}
				aria-label={t('timeline.searchAriaLabel')}
			/>
			{query && (
				<ClearButton
					data-testid="search-clear"
					onClick={handleClear}
					aria-label={t('timeline.clearSearch')}
				>
					<X size={14} />
				</ClearButton>
			)}
			{isLoading && <LoadingIndicator data-testid="search-loading" />}

			<SearchResults
				query={query}
				showResults={showResults}
				showNotFound={showNotFound}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				confirmingAction={confirmingAction}
				isInteractionBlocked={isInteractionBlocked}
				onSetAsNow={handleSetAsNow}
				onMarkComplete={handleMarkComplete}
				onDelete={handleDelete}
				onConfirmAction={handleConfirmAction}
				onCancelConfirm={handleCancelConfirm}
				onLoadMore={loadMore}
				showUnavailable={showUnavailable}
				msItems={msItems}
				msSources={msSources}
				searchUnavailable={searchUnavailable}
				onMultiSourceEdit={handleMultiSourceEdit}
				onRetrySearch={() => performSearch(query)}
				onDismissNotFound={handleDismissNotFound}
				onCreate={handleCreate}
			/>
		</SearchContainer>
	);
};

const SearchContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	flex: 1;
	max-width: 400px;
`;

const SearchIconWrapper = styled.div`
	position: absolute;
	left: 12px;
	display: flex;
	align-items: center;
	color: ${({ theme }) => theme.colors.text.muted};
	pointer-events: none;
`;

const SearchInput = styled.input`
	width: 100%;
	height: 36px;
	padding: 0 36px 0 36px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background-color: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 14px;
	outline: none;
	transition: border-color 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.text.secondary};
	}
`;

const ClearButton = styled.button`
	position: absolute;
	right: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: none;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.border.default};
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	padding: 0;

	&:hover {
		background: ${({ theme }) => theme.colors.border.strong};
	}
`;

const LoadingIndicator = styled.div`
	position: absolute;
	right: 12px;
	width: 14px;
	height: 14px;
	border: 2px solid ${({ theme }) => theme.colors.border.default};
	border-top-color: ${({ theme }) => theme.colors.text.secondary};
	border-radius: 50%;
	animation: spin 0.6s linear infinite;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

export default SearchBar;
