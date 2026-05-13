import React from 'react';
import styled from 'styled-components';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import { NavLink, Outlet } from 'react-router';

const TileshareDashboardPage: React.FC = () => {
	return (
		<Container>
			<CalendarUIProvider>
				<div>Tileshare</div>
				<header>
					<NavLink to="inbox">Inbox Link</NavLink>{' '}
					<NavLink to="outbox">Outbox Link</NavLink>
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
