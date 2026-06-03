import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext } from './TileShareDashboard';
import TileShareCard, { type AvatarUser } from '@/components/tileshare/TileShareCard';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { SendHorizonal } from 'lucide-react';
import usePagination from '@/hooks/usePagination';

const TileshareSent: React.FC = () => {
	const { t } = useTranslation();
	const { clusters } = useOutletContext<TileshareDashboardOutletContext>();

	const { page, totalPages, pagedItems: pagedClusters, setPage } = usePagination(clusters, 5, []);

	return (
		<Container>
			{clusters.length === 0 ? (
				<EmptyState icon={SendHorizonal} text={t('tilesharedemo.active.empty')} />
			) : (
				<>
					<List>
						{pagedClusters.map((cluster) => {
							const avatarUsers: AvatarUser[] = cluster.truncatedUser
								? cluster.truncatedUser.split(',').map((user) => ({ name: user }))
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
									due={cluster.end}
									avatarUsers={avatarUsers}
									linkCount={avatarUsers.length}
									commentCount={null}
								/>
							);
						})}
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

export default TileshareSent;
