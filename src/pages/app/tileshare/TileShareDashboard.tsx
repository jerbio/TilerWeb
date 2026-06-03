import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs from '@/core/common/components/Tabs';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { tileshareService } from '@/services';
import { DesignatedTile, TileShareCluster } from '@/core/common/types/tileshare';

import dummyTiles from './data/designatedtiles.json';
import dummyClusters from './data/clusters.json';

export enum TileshareFilter {
	All = 'all',
	InProgress = 'inProgress',
}

export type TileshareDashboardOutletContext = {
	tiles: DesignatedTile[];
	clusters: TileShareCluster[];
	receivedClusters: TileShareCluster[];
};

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [tiles, setTiles] = useState<DesignatedTile[]>(dummyTiles);
	const [clusters, setClusters] = useState<TileShareCluster[]>(dummyClusters);
	const [receivedClusters, setReceivedClusters] = useState<TileShareCluster[]>([]);

	const activeTab = pathname.endsWith('/sent') ? 'sent' : 'active';

	useEffect(() => {
		const fetchActive = async () => {
			try {
				const data = await tileshareService.getDesignatedTiles();
				if (data && data.length > 0) setTiles(data);
			} catch (error) {
				console.error('Error fetching tileshare active', error);
			}
		};

		const fetchSent = async () => {
			try {
				const data = await tileshareService.getOutboxClusters();
				if (data && data.length > 0) setClusters(data);
			} catch (error) {
				console.error('Error fetching tileshare sent', error);
			}
		};

		const fetchReceived = async () => {
			try {
				const data = await tileshareService.getInboxClusters();
				setReceivedClusters(data ?? []);
			} catch (error) {
				console.error('Error fetching tileshare received', error);
			}
		};

		if (activeTab === 'active') {
			fetchActive();
		} else if (activeTab === 'sent') {
			fetchSent();
		} else if (activeTab === 'received') {
			fetchReceived();
		}
	}, [activeTab]);

	const tabs = useMemo(
		() => [
			{
				id: 'active',
				label: t('tilesharedemo.dashboard.nav.active', { count: tiles.length }),
				icon: <CalendarCheck2 size={16} />,
			},
			{
				id: 'sent',
				label: t('tilesharedemo.dashboard.nav.sent', { count: clusters.length }),
				icon: <ArrowUpRight size={16} />,
			},
		],
		[t, tiles.length, clusters.length, receivedClusters.length]
	);

	const handleTabChange = (id: string) => {
		navigate(id);
	};

	return (
		<Container>
			<CalendarUIProvider>
				<Header>
					<Tabs
						tabs={tabs}
						value={activeTab}
						onChange={handleTabChange}
						aria-label={t('tilesharedemo.dashboard.title')}
						stretch
					/>
				</Header>
				<Main>
					<Outlet
						context={
							{
								tiles,
								clusters,
								receivedClusters,
							} satisfies TileshareDashboardOutletContext
						}
					/>
				</Main>
			</CalendarUIProvider>
		</Container>
	);
};

const Container = styled.div`
	position: relative;
	height: 100%;
	background-color: ${(props) => props.theme.colors.background.page};
	overflow-y: scroll;
	isolation: isolate;
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 1.5rem;
`;

const Main = styled.main`
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
