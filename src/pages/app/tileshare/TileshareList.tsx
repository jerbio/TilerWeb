import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';
import { CalendarCheck2, Search } from 'lucide-react';
import TileShareClusterCard from '@/components/tileshare/TileShareClusterCard';
import TileShareClusterCardSkeleton from '@/components/tileshare/TileShareClusterCardSkeleton';
import Pagination from '@/core/common/components/Pagination';
import Select from '@/core/common/components/select';
import EmptyState from '@/core/common/components/EmptyState';
import Button from '@/core/common/components/button';
import useServerPagination from '@/hooks/useServerPagination';
import useDebounce from '@/hooks/useDebounce';
import { deadlineOptions, deadlineParams, type DeadlineOption } from '@/core/util/tileshareFilters';
import { useAuth } from '@/core/auth/useAuth';
import { tileshareService } from '@/services';
import type { ClusterPageParams } from '@/core/common/types/tileshare';

const ordering = {
	createdDesc: { sortBy: 'CreationTime', sortOrder: 'desc' },
	createdAsc: { sortBy: 'CreationTime', sortOrder: 'asc' },
	deadlineAsc: { sortBy: 'Deadline', sortOrder: 'asc' },
	deadlineDesc: { sortBy: 'Deadline', sortOrder: 'desc' },
} as const;
const sortLabels = {
	createdDesc: 'Newest first',
	createdAsc: 'Oldest first',
	deadlineAsc: 'Soonest deadline',
	deadlineDesc: 'Latest deadline',
};
export default function TileshareList() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const [params, setParams] = useSearchParams();
	const createdByMe = params.get('createdByMe') === '1';
	const search = params.get('search') ?? '';
	const debouncedSearch = useDebounce(search.trim(), 300);
	const deadlineValue = params.get('deadline') ?? 'all';
	const deadline: DeadlineOption = Object.prototype.hasOwnProperty.call(
		deadlineOptions,
		deadlineValue
	)
		? (deadlineValue as DeadlineOption)
		: 'all';
	const from = params.get('from') ?? '';
	const to = params.get('to') ?? '';
	const deadlineQuery = deadlineParams(deadline, from, to);
	const filtered = !!search || createdByMe || deadline !== 'all';
	const value = params.get('sort') ?? 'createdDesc';
	const sort = Object.prototype.hasOwnProperty.call(ordering, value)
		? (value as keyof typeof ordering)
		: 'createdDesc';
	const [revision, setRevision] = useState(0);
	useEffect(() => {
		const refresh = () => setRevision((r) => r + 1);
		window.addEventListener('tileshare-changed', refresh);
		return () => window.removeEventListener('tileshare-changed', refresh);
	}, []);
	const update = (key: string, value: string | null, replace = false) => {
		setParams(
			(previous) => {
				const next = new URLSearchParams(previous);
				if (value === null) next.delete(key);
				else next.set(key, value);
				return next;
			},
			{ replace }
		);
	};
	const clearFilters = () =>
		setParams((previous) => {
			const next = new URLSearchParams(previous);
			for (const key of ['search', 'createdByMe', 'deadline', 'from', 'to']) next.delete(key);
			return next;
		});
	return (
		<Container>
			<Toolbar>
				<Filters role="group" aria-label={t('tileshareList.filters', 'Filter TileShares')}>
					<SearchField>
						<Search size={16} aria-hidden="true" />
						<SearchInput
							type="search"
							aria-label={t('tileshareList.search', 'Search by name')}
							value={search}
							maxLength={256}
							placeholder={t('tileshareList.searchPlaceholder', 'Search TileShares…')}
							onChange={(e) => update('search', e.target.value || null, true)}
						/>
					</SearchField>
					<Field>
						<span>{t('tileshareList.deadline', 'Deadline')}</span>
						<ToolbarSelect
							value={deadline}
							onChange={(value) => update('deadline', value === 'all' ? null : value)}
							aria-label={t('tileshareList.deadline', 'Deadline')}
							options={Object.entries(deadlineOptions).map(([value, label]) => ({
								value,
								label: t(`tileshareList.filterDeadline.${value}`, label),
							}))}
						/>
					</Field>
					<Filter>
						<input
							type="checkbox"
							checked={createdByMe}
							onChange={(e) => update('createdByMe', e.target.checked ? '1' : null)}
						/>
						{t('tileshareList.createdByMe', 'Created by me')}
					</Filter>
					{filtered && (
						<ClearFilters type="button" onClick={clearFilters}>
							{t('tileshareList.clearFilters', 'Clear filters')}
						</ClearFilters>
					)}
				</Filters>
				<SortField>
					<span>{t('tileshareList.sort', 'Sort by')}</span>
					<ToolbarSelect
						value={sort}
						onChange={(value) => update('sort', value)}
						align="right"
						aria-label={t('tileshareList.sort', 'Sort by')}
						options={Object.entries(sortLabels).map(([value, label]) => ({
							value,
							label: t(`tileshareList.${value}`, label),
						}))}
					/>
				</SortField>
			</Toolbar>
			{deadline === 'custom' && (
				<RangeControls>
					<DateLabel>
						{t('tileshareList.from', 'From')}
						<TextInput
							type="date"
							value={from}
							max={to || undefined}
							aria-describedby={!deadlineQuery ? 'deadline-range-error' : undefined}
							onChange={(e) => update('from', e.target.value || null)}
						/>
					</DateLabel>
					<DateLabel>
						{t('tileshareList.to', 'Through')}
						<TextInput
							type="date"
							value={to}
							min={from || undefined}
							aria-describedby={!deadlineQuery ? 'deadline-range-error' : undefined}
							onChange={(e) => update('to', e.target.value || null)}
						/>
					</DateLabel>
				</RangeControls>
			)}
			{deadlineQuery ? (
				<Results
					key={JSON.stringify([
						user?.id,
						createdByMe,
						sort,
						debouncedSearch,
						deadlineQuery,
						revision,
					])}
					params={{
						createdByMe,
						search: debouncedSearch || undefined,
						...ordering[sort],
						...deadlineQuery,
					}}
					onRetry={() => setRevision((r) => r + 1)}
				/>
			) : (
				<p id="deadline-range-error" role="status">
					{t(
						'tileshareList.invalidRange',
						'Choose at least one date. The end date must be on or after the start date.'
					)}
				</p>
			)}
		</Container>
	);
}
function Results({ params, onRetry }: { params: ClusterPageParams; onRetry: () => void }) {
	const { t } = useTranslation();
	const location = useLocation();
	const { items, page, setPage, pageSize, setPageSize, hasNext, loading, error } =
		useServerPagination((p) => tileshareService.getClusters({ ...params, ...p }), 20, {
			shortPageIsLast: true,
		});
	if (error)
		return (
			<div role="alert">
				{t('tileshareList.failed', 'Could not load TileShares.')}{' '}
				<Button onClick={onRetry}>{t('tileshareList.retry', 'Retry')}</Button>
			</div>
		);
	return (
		<>
			{!loading && !items.length ? (
				<EmptyState
					icon={CalendarCheck2}
					text={t('tileshareList.empty', 'No TileShares match this filter.')}
				/>
			) : (
				<>
					<List aria-busy={loading}>
						{loading
							? Array.from({ length: pageSize }, (_, i) => (
									<TileShareClusterCardSkeleton key={i} />
								))
							: items.map((cluster) => (
									<TileShareClusterCard
										key={cluster.id}
										cluster={cluster}
										returnTo={location.pathname + location.search}
									/>
								))}
					</List>
					{(page > 1 || hasNext) && (
						<Pagination
							mode="simple"
							page={page}
							onChange={setPage}
							hasNext={hasNext}
							pageSize={pageSize}
							onPageSizeChange={setPageSize}
							disabled={loading}
						/>
					)}
				</>
			)}
		</>
	);
}
const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	min-width: 0;
	color: ${({ theme }) => theme.colors.text.primary};
`;
const Toolbar = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 12px 24px;
	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
`;
const Filters = styled.div`
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	min-width: 0;
	@media (max-width: 640px) {
		display: contents;
	}
`;
const SearchField = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	flex: 0 1 20rem;
	min-width: 12rem;
	svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	@media (max-width: 640px) {
		grid-column: 1 / -1;
		grid-row: 1;
		min-width: 0;
	}
`;
const Field = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 44px;
	font-size: 14px;
	white-space: nowrap;
	color: ${({ theme }) => theme.colors.text.secondary};
	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 2;
		min-width: 0;
		& > span {
			display: none;
		}
		& > div {
			flex: 1;
			min-width: 0;
		}
	}
`;
const SortField = styled(Field)`
	margin-left: auto;
	@media (max-width: 640px) {
		grid-column: 2;
		margin-left: 0;
	}
`;
const ToolbarSelect = styled(Select)`
	& > button {
		box-sizing: border-box;
		height: 44px;
	}
`;
const RangeControls = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
`;
const DateLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
`;
const TextInput = styled.input`
	display: block;
	box-sizing: border-box;
	height: 44px;
	padding: 0 10px;
	border-radius: 8px;
	min-width: 0;
	max-width: 100%;
	font: inherit;
	background: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
	border: 1px solid ${({ theme }) => theme.colors.input.border};
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
	}
`;
const SearchInput = styled(TextInput)`
	width: 100%;
	padding-left: 36px;
	font-size: 14px;
`;
const ClearFilters = styled.button`
	border: 0;
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	font: inherit;
	font-size: 13px;
	min-height: 44px;
	padding: 0 4px;
	cursor: pointer;
	white-space: nowrap;
	@media (max-width: 640px) {
		grid-column: 2;
		grid-row: 3;
		justify-self: end;
	}
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
		text-decoration: underline;
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
	}
`;
const Filter = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	min-height: 44px;
	white-space: nowrap;
	cursor: pointer;
	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
	&& input[type='checkbox'] {
		width: 16px;
		height: 16px;
		margin: 0;
		accent-color: ${({ theme }) => theme.colors.brand[400]};
	}
`;
const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
`;
