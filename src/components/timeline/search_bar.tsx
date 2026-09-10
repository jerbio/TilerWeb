import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { scheduleService } from '@/services';
import useAppStore from '@/global_state';
import {
	CalendarEvent,
	CalendarSearchItem,
	CalendarSearchSourceStatus,
} from '@/core/common/types/schedule';
import { CalendarSearchUnavailableError } from '@/core/common/types/errors';
import { useCalendarUI } from '@/core/common/components/calendar/calendar-ui.provider';
import { useFlag } from '@/hooks/useFlag';
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
}) => {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<CalendarEvent[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
	const [confirmingAction, setConfirmingAction] = useState<{
		eventId: string;
		action: 'complete' | 'delete';
	} | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchSeqRef = useRef(0);
	const isMultiSource = useFlag('calendarSearchMultiSource');
	const [msItems, setMsItems] = useState<CalendarSearchItem[]>([]);
	const [msSources, setMsSources] = useState<CalendarSearchSourceStatus[]>([]);
	const [searchUnavailable, setSearchUnavailable] =
		useState<CalendarSearchUnavailableError | null>(null);
	const [correlationId, setCorrelationId] = useState<string | null>(null);
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const openCreateSelection = useCalendarUI((state) => state.createSelection.actions.open);
	const openEditTile = useCalendarUI((state) => state.editTile.actions.open);
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);

	const performSearch = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim() || !authenticatedUser) {
				setResults([]);
				setHasSearched(false);
				setShowDropdown(false);
				setCurrentPage(0);
				setHasMore(false);
				onResults?.([]);
				return;
			}

			setIsLoading(true);
			try {
				const searchResults = await scheduleService.searchCalendarEventsByName(
					searchQuery,
					authenticatedUser.username,
					authenticatedUser.id,
					{ batchSize: pageSize, index: 0 }
				);
				setResults(searchResults);
				setHasSearched(true);
				setShowDropdown(true);
				setCurrentPage(0);
				setHasMore(searchResults.length >= pageSize);
				onResults?.(searchResults);
			} catch (error) {
				console.error('Search failed:', error);
				setResults([]);
				setHasSearched(true);
				setShowDropdown(true);
				setCurrentPage(0);
				setHasMore(false);
				onResults?.([]);
			} finally {
				setIsLoading(false);
			}
		},
		[authenticatedUser, onResults, pageSize]
	);

	/**
	 * Multi-source (Phase 4) search. Non-paginated. Uses a monotonically
	 * increasing sequence token so stale / out-of-order responses are discarded
	 * (S4-2) â€” a slow earlier query can never flash over a newer one.
	 */
	const performMultiSourceSearch = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim() || !authenticatedUser) {
				setMsItems([]);
				setMsSources([]);
				setSearchUnavailable(null);
				setHasSearched(false);
				setShowDropdown(false);
				onResults?.([]);
				return;
			}

			const token = ++searchSeqRef.current;
			setIsLoading(true);
			setSearchUnavailable(null);
			try {
				const envelope = await scheduleService.searchCalendarEventsMultiSource(searchQuery);

				// Stale / out-of-order response â€” discard silently.
				if (token !== searchSeqRef.current) return;

				if (envelope === null) {
					// Plain 404 (flag off server-side) â€” treat as no results.
					setMsItems([]);
					setMsSources([]);
					setHasSearched(true);
					setShowDropdown(true);
					onResults?.([]);
					return;
				}

				setCorrelationId(envelope.correlationId);
				setMsItems(envelope.items);
				setMsSources(envelope.sources);
				setHasSearched(true);
				setShowDropdown(true);
				onResults?.(envelope.items.map(searchItemToCalendarEvent));
			} catch (error) {
				if (token !== searchSeqRef.current) return; // stale â€” discard

				if (error instanceof CalendarSearchUnavailableError) {
					// Total failure (502) â€” typed unavailable state, never "no matches".
					setCorrelationId(error.correlationId);
					setMsItems([]);
					setMsSources([]);
					setSearchUnavailable(error);
				} else {
					console.error('Multi-source search failed:', error);
					setMsItems([]);
					setMsSources([]);
				}
				setHasSearched(true);
				setShowDropdown(true);
				onResults?.([]);
			} finally {
				if (token === searchSeqRef.current) setIsLoading(false);
			}
		},
		[authenticatedUser, onResults]
	);

	/**
	 * Open the edit path from a multi-source result, forwarding third-party
	 * routing metadata (S4-6) and emitting `calendar_search_edit_opened`.
	 */
	const handleMultiSourceEdit = useCallback(
		(item: CalendarSearchItem) => {
			openEditTile(searchItemToCalendarEvent(item));
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
		[openEditTile, correlationId]
	);

	const loadMore = useCallback(async () => {
		if (!query.trim() || !authenticatedUser || isLoadingMore) return;

		const nextPage = currentPage + 1;
		setIsLoadingMore(true);
		try {
			const moreResults = await scheduleService.searchCalendarEventsByName(
				query,
				authenticatedUser.username,
				authenticatedUser.id,
				{ batchSize: pageSize, index: nextPage * pageSize }
			);
			setResults((prev) => [...prev, ...moreResults]);
			setCurrentPage(nextPage);
			setHasMore(moreResults.length >= pageSize);
			onResults?.([...results, ...moreResults]);
		} catch (error) {
			console.error('Load more failed:', error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [query, authenticatedUser, currentPage, isLoadingMore, pageSize, onResults, results]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setQuery(value);
		onSearch?.(value);

		// Debounce the API search
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			if (isMultiSource) {
				performMultiSourceSearch(value);
			} else {
				performSearch(value);
			}
		}, debounceMs);
	};

	const handleClear = () => {
		setQuery('');
		setResults([]);
		setHasSearched(false);
		setShowDropdown(false);
		setCurrentPage(0);
		setHasMore(false);
		setActionLoading({});
		setConfirmingAction(null);
		// Reset multi-source (Phase 4) state and invalidate any in-flight search.
		searchSeqRef.current++;
		setMsItems([]);
		setMsSources([]);
		setSearchUnavailable(null);
		setCorrelationId(null);
		onSearch?.('');
		onResults?.([]);
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
	};

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
			setQuery('');
			setResults([]);
			setHasSearched(false);
			setShowDropdown(false);
			setCurrentPage(0);
			setHasMore(false);
			onSearch?.('');
			onResults?.([]);
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
		[showNotification, updateNotification, t, onSearch, onResults]
	);

	const handleMarkComplete = useCallback((eventId: string) => {
		setConfirmingAction({ eventId, action: 'complete' });
	}, []);

	const handleDelete = useCallback((eventId: string) => {
		setConfirmingAction({ eventId, action: 'delete' });
	}, []);

	const handleConfirmAction = useCallback(async () => {
		if (!confirmingAction) return;
		const { eventId, action } = confirmingAction;
		setConfirmingAction(null);
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
		setQuery('');
		setResults([]);
		setHasSearched(false);
		setShowDropdown(false);
		setCurrentPage(0);
		setHasMore(false);
		onSearch?.('');
		onResults?.([]);
		try {
			if (action === 'complete') {
				await scheduleService.markCalendarEventComplete(eventId);
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
	}, [confirmingAction, showNotification, updateNotification, t, onSearch, onResults]);

	const handleCancelConfirm = useCallback(() => {
		setConfirmingAction(null);
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

	const showResults = !isMultiSource && showDropdown && hasSearched && results.length > 0;
	const showNotFound = !isMultiSource && showDropdown && hasSearched && results.length === 0;
	const isAnyActionInProgress = Object.keys(actionLoading).length > 0;
	const isInteractionBlocked = isAnyActionInProgress || !!confirmingAction;

	// Multi-source (Phase 4) derived state.
	const showMsResults =
		isMultiSource && showDropdown && hasSearched && msItems.length > 0 && !searchUnavailable;
	const showMsUnavailable = isMultiSource && showDropdown && !!searchUnavailable;
	const showMsNotFound =
		isMultiSource &&
		showDropdown &&
		hasSearched &&
		msItems.length === 0 &&
		!searchUnavailable &&
		!msSources.some((s) => s.status === 'partial' || s.status === 'failed');

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
				results={results}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				actionLoading={actionLoading}
				confirmingAction={confirmingAction}
				isInteractionBlocked={isInteractionBlocked}
				onEdit={(event) => {
					openEditTile(event);
					setShowDropdown(false);
				}}
				onSetAsNow={handleSetAsNow}
				onMarkComplete={handleMarkComplete}
				onDelete={handleDelete}
				onConfirmAction={handleConfirmAction}
				onCancelConfirm={handleCancelConfirm}
				onLoadMore={loadMore}
				isMultiSource={isMultiSource}
				showMsResults={showMsResults}
				showMsUnavailable={showMsUnavailable}
				showMsNotFound={showMsNotFound}
				msItems={msItems}
				msSources={msSources}
				searchUnavailable={searchUnavailable}
				onMultiSourceEdit={handleMultiSourceEdit}
				onRetrySearch={() => performMultiSourceSearch(query)}
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
