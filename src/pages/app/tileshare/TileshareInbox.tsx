import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext, TileshareFilter } from './TileShareDashboard';
import TileShareCard, { type AvatarUser } from '@/components/tileshare/TileShareCard';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { Inbox } from 'lucide-react';
import usePagination from '@/hooks/usePagination';

const TileshareInbox: React.FC = () => {
	const { t } = useTranslation();
	const { tiles, filter } = useOutletContext<TileshareDashboardOutletContext>();

	const filteredTiles = useMemo(() => {
		const result =
			filter === TileshareFilter.InProgress
				? tiles.filter((tile) => tile.completionPercent !== 100)
				: tiles;
		return result;
	}, [tiles, filter]);

	const {
		page,
		totalPages,
		pagedItems: pagedTiles,
		setPage,
	} = usePagination(filteredTiles, 5, [filter]);

	const emptyText =
		filter === TileshareFilter.InProgress
			? t('tilesharedemo.inbox.emptyFiltered')
			: t('tilesharedemo.inbox.empty');

	return (
		<Container>
			{filteredTiles.length === 0 ? (
				<EmptyState icon={Inbox} text={emptyText} />
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

export default TileshareInbox;
