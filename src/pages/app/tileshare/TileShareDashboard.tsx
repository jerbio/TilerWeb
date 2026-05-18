import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs from '@/core/common/components/Tabs';
import { Outlet, useLocation, useNavigate } from 'react-router';

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const activeTab = pathname.endsWith('/outbox') ? 'outbox' : 'inbox';

	const tabs = useMemo(
		() => [
			{ id: 'inbox', label: t('tilesharedemo.dashboard.nav.inbox') },
			{ id: 'outbox', label: t('tilesharedemo.dashboard.nav.outbox') },
		],
		[t]
	);

	const handleTabChange = (id: string) => {
		navigate(id);
	};

	return (
		<Container>
			<CalendarUIProvider>
				<Title>{t('tilesharedemo.dashboard.title')}</Title>
				<Header>
					<Tabs
						tabs={tabs}
						value={activeTab}
						onChange={handleTabChange}
						aria-label={t('tilesharedemo.dashboard.title')}
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
	overflow: hidden;
	isolation: isolate;
`;

const Title = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.lg};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	padding: 1rem 1.5rem;
`;

const Main = styled.main`
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
