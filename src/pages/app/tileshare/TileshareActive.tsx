import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext } from './TileShareDashboard';
import TileShareClusterCard from '@/components/tileshare/TileShareClusterCard';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { CalendarCheck2 } from 'lucide-react';
import usePagination from '@/hooks/usePagination';

const TileshareActive: React.FC = () => {
	const { t } = useTranslation();
	const { inboxClusters } = useOutletContext<TileshareDashboardOutletContext>();

	const {
		page,
		totalPages,
		pagedItems: pagedClusters,
		setPage,
	} = usePagination(inboxClusters, 5, []);

	return (
		<Container>
			{inboxClusters.length === 0 ? (
				<EmptyState icon={CalendarCheck2} text={t('tilesharedemo.active.empty')} />
			) : (
				<>
					<List>
						{pagedClusters.map((cluster) => (
							<TileShareClusterCard key={cluster.id} cluster={cluster} />
						))}
					</List>
					<Pagination page={page} totalPages={totalPages} onChange={setPage} />
				</>
			)}
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

export default TileshareActive;
