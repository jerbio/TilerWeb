import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs, { TabItem } from '@/core/common/components/Tabs';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Routes } from '@/core/constants/routes';

export enum TileshareTab {
	Active = 'active',
	Sent = 'sent',
}

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [activeTab, setActiveTab] = useState<TileshareTab>(TileshareTab.Active);

	useEffect(() => {
		if (pathname.endsWith(Routes.Tileshare.active)) {
			setActiveTab(TileshareTab.Active);
		} else if (pathname.endsWith(Routes.Tileshare.sent)) {
			setActiveTab(TileshareTab.Sent);
		}
	}, [pathname]);

	const tabs = useMemo<TabItem[]>(
		() => [
			{
				id: TileshareTab.Active,
				label: t('tilesharedemo.dashboard.nav.active'),
				icon: <CalendarCheck2 size={16} />,
			},
			{
				id: TileshareTab.Sent,
				label: t('tilesharedemo.dashboard.nav.sent'),
				icon: <ArrowUpRight size={16} />,
			},
		],
		[t]
	);

	const tabRoutes: Record<string, string> = {
		active: Routes.Tileshare.active,
		sent: Routes.Tileshare.sent,
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
					<Outlet />
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
