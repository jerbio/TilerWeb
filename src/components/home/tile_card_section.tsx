import React from 'react';
import styled, { keyframes } from 'styled-components';
import TileCard from './tile_card';
import { TileCardProps } from '../../util/interface';
import styles from '../../util/styles';
import Button from '../shared/button';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import ArrowRight from '../icons/arrow_right';

const TileCardContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 3rem;
`;

const TileCardWrapperScroll = styled.div`
	position: relative;
	width: 100%;
	height: 105px;
	overflow: hidden;
`;

const slideInAnimation = (direction: 'left' | 'right') => keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(${direction === 'left' ? '-50%' : '50%'});
  }
`;

const TileCardWrapper = styled.div<{ direction: 'left' | 'right' }>`
	display: flex;
	position: absolute;
	${(props) => (props.direction === 'left' ? 'left: 0;' : 'right: 0;')}

	animation: ${(props) =>
		slideInAnimation(props.direction)} 64s linear infinite;
	transform: translateX(-50%);
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const TileFadeDivRight = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 4rem;
	height: 100%;
	background: linear-gradient(
		90deg,
		rgba(0, 0, 0, 0) 0%,
		rgba(0, 0, 0, 1) 100%
	);
`;

const TileFadeDivLeft = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 4rem;
	height: 100%;
	background: linear-gradient(270deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
`;

const tileGrid: Array<Array<TileCardProps>> = [
	[
		{
			heading: 'Meeting With Charles',
			location: 'Conference Room A',
			startTime: '09:00 AM',
			endTime: '10:00 AM',
			background_color: styles.colors.tileBackgroundPrimary,
		},
		{
			heading: 'Morning Meeting',
			location: 'Conference Room A',
			startTime: '10:00 AM',
			endTime: '11:00 AM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
		{
			heading: 'Client Call',
			location: 'Conference Room A',
			startTime: '11:00 AM',
			endTime: '12:00 PM',
			background_color: styles.colors.tileBackgroundTertiary,
		},
		{
			heading: 'Lunch Break',
			location: 'Conference Room A',
			startTime: '12:00 PM',
			endTime: '01:00 PM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
	],
	[
		{
			heading: 'Meeting With Charles',
			location: 'Conference Room A',
			startTime: '09:00 AM',
			endTime: '10:00 AM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
		{
			heading: 'Team Sync',
			location: 'Conference Room A',
			startTime: '10:00 AM',
			endTime: '11:00 AM',
			background_color: styles.colors.tileBackgroundTertiary,
		},
		{
			heading: 'Project Review',
			location: 'Conference Room A',
			startTime: '11:00 AM',
			endTime: '12:00 PM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
		{
			heading: 'Happy Hour',
			location: 'Conference Room A',
			startTime: '12:00 PM',
			endTime: '01:00 PM',
			background_color: styles.colors.tileBackgroundPrimary,
		},
	],
	[
		{
			heading: 'Breakfast with Friends',
			location: 'Restaurants',
			startTime: '09:00 AM',
			endTime: '10:00 AM',
			background_color: styles.colors.tileBackgroundPrimary,
		},
		{
			heading: 'Grocery Shopping',
			location: 'Grocery Store',
			startTime: '10:00 AM',
			endTime: '11:00 AM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
		{
			heading: 'Gym Workouts',
			location: 'Gym',
			startTime: '11:00 AM',
			endTime: '12:00 PM',
			background_color: styles.colors.tileBackgroundTertiary,
		},
		{
			heading: 'Meeting With Charles',
			location: 'Zoom',
			startTime: '12:00 PM',
			endTime: '01:00 PM',
			background_color: styles.colors.tileBackgroundSecondary,
		},
	],
];

const TileCardSection: React.FC = () => {
	return (
		<Section>
			<SectionHeaders
				headerText="Visualize your tasks and appointments"
				subHeaderText="Visualize your schedule with our intuitive tiles. Easily see your appointments, deadlines, and tasks at a glance."
				align="center"
			/>
			<TileCardContainer>
				{tileGrid.map((tiles, index) => (
					<TileCardWrapperScroll key={index}>
						<TileCardWrapper
							direction={index % 2 === 0 ? 'left' : 'right'}
						>
							{[...tiles, ...tiles].map((tile, index) => {
								return (
									<TileCard
										key={index}
										{...tile}
										index={index}
									/>
								);
							})}
						</TileCardWrapper>
						<TileFadeDivLeft />
						<TileFadeDivRight />
					</TileCardWrapperScroll>
				))}
			</TileCardContainer>

			<ButtonContainer>
				<Button variant="brand">
					<span>Create your own tiles</span>{' '}
					<ArrowRight />
				</Button>
			</ButtonContainer>
		</Section>
	);
};
export default TileCardSection;

