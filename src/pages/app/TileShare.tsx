import React from 'react';
import styled from 'styled-components';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';

const TileShare: React.FC = () => {
	return (
		<Container>
			<CalendarUIProvider>
				<div>TileShare</div>
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

export default TileShare;
