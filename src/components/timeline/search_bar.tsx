import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, HelpCircle } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { scheduleService } from '@/services';
import useAppStore from '@/global_state';
import { CalendarEvent } from '@/core/common/types/schedule';
import { useCalendarUI } from '@/core/common/components/calendar/CalendarUIProvider';
import TimeUtil from '@/core/util/time';

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
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const { setCreateTileModalOpen } = useCalendarUI();

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
					{ batchSize: pageSize, index: 0 },
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
		[authenticatedUser, onResults, pageSize],
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
				{ batchSize: pageSize, index: nextPage },
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
			performSearch(value);
		}, debounceMs);
	};

	const handleClear = () => {
		setQuery('');
		setResults([]);
		setHasSearched(false);
		setShowDropdown(false);
		setCurrentPage(0);
		setHasMore(false);
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
		setCreateTileModalOpen(true);
		setShowDropdown(false);
	};

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

	const showResults = showDropdown && hasSearched && results.length > 0;
	const showNotFound = showDropdown && hasSearched && results.length === 0;

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

			{showResults && (
				<ResultsDropdown data-testid="search-results-dropdown">
					{results.map((event) => (
						<ResultItem key={event.id} data-testid="search-result-item">
							<ColorDot
								data-testid="result-color-dot"
								$r={event.colorRed ?? 0}
								$g={event.colorGreen ?? 0}
								$b={event.colorBlue ?? 0}
							/>
							<ResultName>{event.name}</ResultName>
							<ResultTime>{TimeUtil.relativeTime(event.start ?? 0)}</ResultTime>
							<ChevronRight size={14} />
						</ResultItem>
					))}
					{hasMore && (
						<LoadMoreButton
							data-testid="load-more-button"
							onClick={loadMore}
							disabled={isLoadingMore}
						>
							{isLoadingMore ? t('timeline.loading') : t('timeline.loadMore')}
						</LoadMoreButton>
					)}
				</ResultsDropdown>
			)}

			{showNotFound && (
				<NotFoundPrompt data-testid="search-not-found">
					<NotFoundIcon>
						<HelpCircle size={24} />
					</NotFoundIcon>
					<NotFoundText>
						{t('timeline.notFoundMessage', { query })}
					</NotFoundText>
					<NotFoundActions>
						<DismissButton onClick={handleDismissNotFound}>{t('timeline.notFoundDismiss')}</DismissButton>
						<CreateButton onClick={handleCreate}>{t('timeline.notFoundCreate')}</CreateButton>
					</NotFoundActions>
				</NotFoundPrompt>
			)}
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

const ResultsDropdown = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 4px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	max-height: 300px;
	overflow-y: auto;
`;

const ResultItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.primary};
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	}
`;

const ColorDot = styled.span<{ $r: number; $g: number; $b: number }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
	background-color: ${({ $r, $g, $b }) => `rgb(${$r}, ${$g}, ${$b})`};
`;

const ResultName = styled.span`
	flex: 1;
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ResultTime = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.muted};
	white-space: nowrap;
`;

const LoadMoreButton = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	cursor: pointer;
	text-align: center;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;

const NotFoundPrompt = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 4px;
	padding: 16px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	text-align: center;
`;

const NotFoundIcon = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 8px;
	color: ${({ theme }) => theme.colors.text.muted};
`;

const NotFoundText = styled.p`
	font-size: 14px;
	color: ${({ theme }) => theme.colors.text.primary};
	margin: 0 0 12px;
	line-height: 1.4;
`;

const NotFoundActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 8px;
`;

const DismissButton = styled.button`
	padding: 6px 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	cursor: pointer;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}
`;

const CreateButton = styled.button`
	padding: 6px 16px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: ${({ theme }) => theme.colors.text.primary};
	color: ${({ theme }) => theme.colors.background.card};
	font-size: 13px;
	cursor: pointer;

	&:hover {
		opacity: 0.9;
	}
`;

export default SearchBar;
