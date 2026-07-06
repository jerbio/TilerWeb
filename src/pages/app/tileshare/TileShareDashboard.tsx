import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs, { TabItem } from '@/core/common/components/Tabs';
import TileshareToolbar from '@/components/tileshare/TileshareToolbar';
import TileshareCreate, { TileshareMode } from '@/components/tileshare/TileshareCreate';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Routes } from '@/core/constants/routes';
import { useAuth } from '@/core/auth/useAuth';

export enum TileshareTab {
	Active = 'active',
	Sent = 'sent',
}

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<TileshareTab>(TileshareTab.Active);
	const [createMode, setCreateMode] = useState<TileshareMode | null>(null);

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

	const handleSelectSingle = () => setCreateMode(TileshareMode.Single);
	const handleSelectMulti = () => setCreateMode(TileshareMode.Multi);

	return (
		<Container>
			<CalendarUIProvider>
				{createMode ? (
					<TileshareCreate mode={createMode} onBack={() => setCreateMode(null)} />
				) : (
					<>
						<StyledToolbar
							user={{ name: user?.fullName ?? null, email: user?.email ?? null }}
							onSelectSingle={handleSelectSingle}
							onSelectMulti={handleSelectMulti}
						/>
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
					</>
				)}
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

const StyledToolbar = styled(TileshareToolbar)`
	padding: 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.5rem 1.5rem 1rem;
`;

const Main = styled.main`
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
