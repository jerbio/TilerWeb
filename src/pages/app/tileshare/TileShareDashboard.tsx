import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs, { TabItem } from '@/core/common/components/Tabs';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { tileshareService } from '@/services';
import { DesignatedTile, TileShareCluster } from '@/core/common/types/tileshare';
import ROUTES from '@/core/constants/routes';

import dummyTiles from './data/designatedtiles.json';
import dummyClusters from './data/clusters.json';

export enum TileshareTab {
	Active = 'active',
	Sent = 'sent',
}

export type TileshareDashboardOutletContext = {
	tiles: DesignatedTile[];
	clusters: TileShareCluster[];
};

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [tiles, setTiles] = useState<DesignatedTile[]>(dummyTiles);
	const [clusters, setClusters] = useState<TileShareCluster[]>(dummyClusters);
	const [activeTab, setActiveTab] = useState<TileshareTab>(TileshareTab.Active);

	useEffect(() => {
		if (pathname.endsWith(ROUTES.tileshare.active)) {
			setActiveTab(TileshareTab.Active);
		} else if (pathname.endsWith(ROUTES.tileshare.sent)) {
			setActiveTab(TileshareTab.Sent);
		}
	}, [pathname]);

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

		if (activeTab === TileshareTab.Active) {
			fetchActive();
		} else if (activeTab === TileshareTab.Sent) {
			fetchSent();
		}
	}, [activeTab]);

	const tabs = useMemo<TabItem[]>(
		() => [
			{
				id: TileshareTab.Active,
				label: t('tilesharedemo.dashboard.nav.active', { count: tiles.length }),
				icon: <CalendarCheck2 size={16} />,
			},
			{
				id: TileshareTab.Sent,
				label: t('tilesharedemo.dashboard.nav.sent', { count: clusters.length }),
				icon: <ArrowUpRight size={16} />,
			},
		],
		[t, tiles.length, clusters.length]
	);

	const tabRoutes: Record<string, string> = {
		active: ROUTES.tileshare.active,
		sent: ROUTES.tileshare.sent,
	};

	const handleTabChange = (id: string) => {
		if (tabRoutes[id]) navigate(tabRoutes[id]);
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
