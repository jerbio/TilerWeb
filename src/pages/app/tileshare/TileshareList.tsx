import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { CalendarCheck2 } from 'lucide-react';
import TileShareClusterCard from '@/components/tileshare/TileShareClusterCard';
import TileShareClusterCardSkeleton from '@/components/tileshare/TileShareClusterCardSkeleton';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import Button from '@/core/common/components/button';
import useServerPagination from '@/hooks/useServerPagination';
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
	createdDesc: 'Creation time: newest first',
	createdAsc: 'Creation time: oldest first',
	deadlineAsc: 'Deadline: earliest first',
	deadlineDesc: 'Deadline: latest first',
};
export default function TileshareList() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const [params, setParams] = useSearchParams();
	const createdByMe = params.get('createdByMe') === '1';
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
	const update = (key: string, value: string | null) => {
		setParams((previous) => {
			const next = new URLSearchParams(previous);
			if (value === null) next.delete(key);
			else next.set(key, value);
			return next;
		});
	};
	return (
		<Container>
			<Controls>
				<Filter>
					<input
						type="checkbox"
						checked={createdByMe}
						onChange={(e) => update('createdByMe', e.target.checked ? '1' : null)}
					/>
					{t('tileshareList.createdByMe', 'Created by me')}
				</Filter>
				<SortLabel>
					{t('tileshareList.sort', 'Sort by')}
					<Sort value={sort} onChange={(e) => update('sort', e.target.value)}>
						{Object.entries(sortLabels).map(([key, label]) => (
							<option key={key} value={key}>
								{t(`tileshareList.${key}`, label)}
							</option>
						))}
					</Sort>
				</SortLabel>
			</Controls>
			<Results
				key={`${user?.id}:${createdByMe}:${sort}:${revision}`}
				params={{ createdByMe, ...ordering[sort] }}
				onRetry={() => setRevision((r) => r + 1)}
			/>
		</Container>
	);
}
function Results({ params, onRetry }: { params: ClusterPageParams; onRetry: () => void }) {
	const { t } = useTranslation();
	const { items, page, setPage, pageSize, setPageSize, hasNext, loading, error } =
		useServerPagination((p) => tileshareService.getClusters({ ...params, ...p }), 20);
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
									<TileShareClusterCard key={cluster.id} cluster={cluster} />
								))}
					</List>
					<Pagination
						mode="simple"
						page={page}
						onChange={setPage}
						hasNext={hasNext}
						pageSize={pageSize}
						onPageSizeChange={setPageSize}
						disabled={loading}
					/>
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
const Controls = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
`;
const Filter = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	cursor: pointer;
	input {
		width: 16px;
		height: 16px;
		accent-color: ${({ theme }) => theme.colors.text.primary};
	}
`;
const SortLabel = styled.label`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 14px;
`;
const Sort = styled.select`
	padding: 10px;
	border-radius: 8px;
	max-width: 100%;
	background: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
	border: 1px solid ${({ theme }) => theme.colors.input.border};
`;
const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
`;
