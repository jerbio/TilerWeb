import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext } from './TileShareDashboard';
import TileShareCard, { type AvatarUser } from '@/components/tileshare/TileShareCard';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { CalendarCheck2 } from 'lucide-react';
import usePagination from '@/hooks/usePagination';

const TileshareActive: React.FC = () => {
	const { t } = useTranslation();
	const { tiles } = useOutletContext<TileshareDashboardOutletContext>();

	const { page, totalPages, pagedItems: pagedTiles, setPage } = usePagination(tiles, 5, []);

	return (
		<Container>
			{tiles.length === 0 ? (
				<EmptyState icon={CalendarCheck2} text={t('tilesharedemo.active.empty')} />
			) : (
				<>
					<List>
						{pagedTiles.map((tile) => {
							const avatarUsers: AvatarUser[] =
								tile.template?.designatedUsers?.map((u) => ({
									name: u.userProfile?.fullName ?? null,
								})) ?? [];

							return (
								<TileShareCard
									key={tile.id}
									title={tile.name}
									subtitle={t('tilesharedemo.card.tileshare')}
									progress={tile.completionPercent}
									due={tile.template?.end ?? null}
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

export default TileshareActive;
