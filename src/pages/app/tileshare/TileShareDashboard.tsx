import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import { NavLink, Outlet } from 'react-router';

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();

	return (
		<Container>
			<CalendarUIProvider>
				<div>{t('tilesharedemo.dashboard.title')}</div>
				<header>
					<NavLink to="inbox">{t('tilesharedemo.dashboard.nav.inbox')}</NavLink>{' '}
					<NavLink to="outbox">{t('tilesharedemo.dashboard.nav.outbox')}</NavLink>
				</header>
				<main>
					<Outlet />
				</main>
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

export default TileshareDashboardPage;
