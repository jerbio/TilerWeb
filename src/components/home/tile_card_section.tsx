import React from 'react';
import styled, { keyframes } from 'styled-components';
import TileCard from './tile_card';
import { TileCardProps } from '../../util/interface';
import styles from '../../util/styles';
import Button from '../shared/button';
import SectionHeaders from './section_headers';
import ArrowRight from '../../assets/image_assets/icons/arrow_right.svg';

const TileCardContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 3rem;
`;

const TileSectionWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 50px 0;
	padding: 0 ${styles.container.padding.default};
	// border: 1px solid ${styles.colors.borderRed};
`;

const TileCardWrapperScroll = styled.div`
	position: relative;
	width: calc(100vw - 36px);
	max-width: ${styles.container.sizes.xLarge};
	height: 101px;
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

  animation: ${(props) => slideInAnimation(props.direction)} 64s linear infinite;
  transform: translateX(-50%);
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
		<TileSectionWrapper>
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

			<Button variant="brand">
				<span>Create your own tiles</span>{' '}
				<img src={ArrowRight} alt="Arrow Right" />
			</Button>
		</TileSectionWrapper>
	);
};
export default TileCardSection;

