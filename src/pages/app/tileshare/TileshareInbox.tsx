import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useOutletContext } from 'react-router';
import { TileshareDashboardOutletContext, TileshareFilter } from './TileShareDashboard';
import TileShareCard, { type AvatarUser } from '@/components/tileshare/TileShareCard';
import Pagination from '@/core/common/components/Pagination';
import EmptyState from '@/core/common/components/EmptyState';
import { Inbox } from 'lucide-react';

const PAGE_SIZE = 5;

const TileshareInbox: React.FC = () => {
	const { t } = useTranslation();
	const { tiles, filter } = useOutletContext<TileshareDashboardOutletContext>();
	const [page, setPage] = useState(1);

	useEffect(() => {
		setPage(1);
	}, [filter]);

	const filteredTiles = useMemo(() => {
		const result =
			filter === TileshareFilter.InProgress
				? tiles.filter((tile) => tile.completionPercent !== 100)
				: tiles;
		return result;
	}, [tiles, filter]);

	const totalPages = Math.ceil(filteredTiles.length / PAGE_SIZE);
	const pagedTiles = filteredTiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const handlePageChange = (next: number) => {
		setPage(next);
	};

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
					<Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
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
