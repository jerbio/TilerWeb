import React from 'react';
import styled from 'styled-components';
import TileCard from './tile_card';
import { TileCardProps } from '../../util/interface';
import styles from '../../util/styles';
import Button from '../shared/button';
import SectionHeaders from './section_headers';

const TileSectionWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 50px 0;
  padding: 0 ${styles.container.padding.default};
	// border: 1px solid ${styles.colors.borderRed};
`;

const TileCardWrapperLeftOffset = styled.div`
	position: relative;
	margin-top: 0.75rem;
	margin-bottom: 0.75rem;
	margin-left: 100px;
	// border: 1px solid ${styles.colors.borderRed};

	@media (max-width: 768px) {
		margin-left: 10px;
	}
`;

const TileCardWrapperRightOffset = styled.div`
	position: relative;
	margin-top: 0.75rem;
	margin-bottom: 0.75rem;
	margin-right: 100px;
	@media (max-width: 768px) {
		margin-right: 10px;
	}
`;

const TileCardWrapper = styled.div`
	display: flex;
	max-width: 1200px;
	height: 101px;
	// border: 1px solid ${styles.colors.borderRed};

	@media (max-width: 768px) {
		& > *:nth-child(2),
		& > *:nth-child(3),
		& > *:nth-child(4),
		& > *:nth-child(5) {
			display: none;
		}
	}
`;

const TileFadeDivRight = styled.div`
	top: 0;
	right: 0;
	width: 300px;
	height: 103px;
	position: absolute;
	background: linear-gradient(
		90deg,
		rgba(0, 0, 0, 0) 0%,
		rgba(0, 0, 0, 0.7) 60%,
		rgba(0, 0, 0, 0.95) 100%
	);
`;

const TileFadeDivLeft = styled.div`
	top: 0;
	left: 0;
	width: 300px;
	height: 103px;
	position: absolute;
	background: linear-gradient(
		270deg,
		rgba(0, 0, 0, 0) 0%,
		rgba(0, 0, 0, 0.78) 60%,
		rgba(0, 0, 0, 0.95) 100%
	);
`;

const sampleTiles: Array<TileCardProps> = [
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
];

const sampleTiles2: Array<TileCardProps> = [
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
];

const sampleTiles3: Array<TileCardProps> = [
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
];

const TileCardSection: React.FC = () => {
	return (
		<TileSectionWrapper>
			<SectionHeaders
				headerText="Visualize your tasks and appointments"
				subHeaderText="Visualize your schedule with our intuitive tiles. Easily see your appointments, deadlines, and tasks at a glance."
				align="center"
			/>
			<TileCardWrapperLeftOffset>
				<TileCardWrapper>
					{sampleTiles.map((tile, index) => {
						return <TileCard key={index} {...tile} index={index} />;
					})}
				</TileCardWrapper>
				<TileFadeDivRight />
			</TileCardWrapperLeftOffset>

			<TileCardWrapperRightOffset>
				<TileCardWrapper>
					{sampleTiles2.map((tile, index) => {
						return <TileCard key={index} {...tile} index={index} />;
					})}
				</TileCardWrapper>
				<TileFadeDivLeft />
			</TileCardWrapperRightOffset>

			<TileCardWrapperLeftOffset>
				<TileCardWrapper>
					{sampleTiles3.map((tile, index) => {
						return <TileCard key={index} {...tile} index={index} />;
					})}
				</TileCardWrapper>
				<TileFadeDivRight />
			</TileCardWrapperLeftOffset>

			<Button primary={styles.colors.backgroundRed} width="large">
				Create your own tiles
			</Button>
		</TileSectionWrapper>
	);
};
export default TileCardSection;
