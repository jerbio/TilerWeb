import React from 'react';
import styled from 'styled-components';
import TileCard from './tile_card';
import { TileCardProps } from '../util/interface';
import styles from '../util/styles';
import Button from './button';
import SectionHeaders from './section_headers';

const TileSectionWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 50px 0;
	// border: 1px solid ${styles.colors.borderRed};
`;

const TileCardWrapper = styled.div`
	display: flex;
	max-width: 1200px;
	height: 101px;
	margin: 0.75rem auto;
	// border: 1px solid ${styles.colors.borderRed};
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
			<TileCardWrapper style={{marginRight: '50px'}}>
				{sampleTiles.map((tile, index) => {
					return <TileCard key={index} {...tile} index={index} />;
				})}
			</TileCardWrapper>

			<TileCardWrapper style={{marginLeft: '50px'}}>
				{sampleTiles2.map((tile, index) => {
					return <TileCard key={index} {...tile} index={index}/>;
				})}
			</TileCardWrapper>

			<TileCardWrapper style={{ marginBottom: '50px', marginRight: '50px'}}>
				{sampleTiles3.map((tile, index) => {
					return <TileCard  key={index} {...tile} index={index}/>;
				})}
			</TileCardWrapper>

			<Button primary={styles.colors.backgroundRed} width="large">
				Create your own tiles
			</Button>
		</TileSectionWrapper>
	);
};
export default TileCardSection;
