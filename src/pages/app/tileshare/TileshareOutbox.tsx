import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext, TileshareFilter } from './TileShareDashboard';
import TileShareCard, { type AvatarUser } from '@/components/tileshare/TileShareCard';
import Pagination from '@/core/common/components/Pagination';

const PAGE_SIZE = 5;

const TileshareOutbox: React.FC = () => {
	const { t } = useTranslation();
	const { clusters, filter } = useOutletContext<TileshareDashboardOutletContext>();
	const [page, setPage] = useState(1);

	useEffect(() => {
		setPage(1);
	}, [filter]);

	const filteredClusters = useMemo(
		() =>
			filter === TileshareFilter.InProgress
				? clusters.filter((cluster) => !cluster.isCompleted)
				: clusters,
		[clusters, filter]
	);

	const totalPages = Math.ceil(filteredClusters.length / PAGE_SIZE);
	const pagedClusters = filteredClusters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const handlePageChange = (next: number) => {
		setPage(next);
	};

	return (
		<Container>
			<List>
				{pagedClusters.map((cluster) => {
					const avatarUsers: AvatarUser[] = cluster.creator
						? [{ name: cluster.creator.fullName ?? null }]
						: [];

					return (
						<TileShareCard
							key={cluster.id}
							title={cluster.name}
							subtitle={
								cluster.isMultiTilette
									? t('tilesharedemo.card.multiTileshare')
									: t('tilesharedemo.card.tileshare')
							}
							progress={0}
							dueOn={cluster.start}
							dueBy={cluster.end}
							avatarUsers={avatarUsers}
						/>
					);
				})}
			</List>
			<Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-start;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
`;

export default TileshareOutbox;
