import React from 'react';
import styled from 'styled-components';
import TileCard from './tile_card';
import {TileCardProps} from '../util/interface'
import styles from '../util/styles';
import Button from './button';

const Section = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TileCardWrapper = styled.div`
  display: flex;
  max-width: 1200px;
  height: 101px;
  // border: 1px solid rgb(202, 20, 20);
  padding-left: 40px;
  margin: 1.5rem auto;
`;

const sampleTiles: Array<TileCardProps> = [
    {heading: "Meeting With Charles", location: "Conference Room A", startTime: "09:00 AM", endTime: "10:00 AM", background_color: styles.colors.tileBackgroundPrimary },
    {heading: "Morning Meeting", location: "Conference Room A", startTime: "10:00 AM", endTime: "11:00 AM", background_color: styles.colors.tileBackgroundSecondary },
    {heading: "Client Call", location: "Conference Room A", startTime: "11:00 AM", endTime: "12:00 PM", background_color: styles.colors.tileBackgroundTertiary },
    {heading: "Lunch Break", location: "Conference Room A", startTime: "12:00 PM", endTime: "01:00 PM", background_color: styles.colors.tileBackgroundSecondary }
  ];
  
  const sampleTiles2: Array<TileCardProps> = [
    {heading: "Meeting With Charles", location: "Conference Room A", startTime: "09:00 AM", endTime: "10:00 AM", background_color: styles.colors.tileBackgroundSecondary },
    {heading: "Team Sync", location: "Conference Room A", startTime: "10:00 AM", endTime: "11:00 AM", background_color: styles.colors.tileBackgroundTertiary },
    {heading: "Project Review", location: "Conference Room A", startTime: "11:00 AM", endTime: "12:00 PM", background_color: styles.colors.tileBackgroundSecondary },
    {heading: "Happy Hour", location: "Conference Room A", startTime: "12:00 PM", endTime: "01:00 PM", background_color: styles.colors.tileBackgroundPrimary }
  ];
  
  const sampleTiles3: Array<TileCardProps> = [
    {heading: "Breakfast with Friends", location: "Restaurants", startTime: "09:00 AM", endTime: "10:00 AM", background_color: styles.colors.tileBackgroundPrimary },
    {heading: "Grocery Shopping", location: "Grocery Store", startTime: "10:00 AM", endTime: "11:00 AM", background_color: styles.colors.tileBackgroundSecondary },
    {heading: "Gym Workouts", location: "Gym", startTime: "11:00 AM", endTime: "12:00 PM", background_color: styles.colors.tileBackgroundTertiary },
    {heading: "Meeting With Charles", location: "Zoom", startTime: "12:00 PM", endTime: "01:00 PM", background_color: styles.colors.tileBackgroundSecondary }
  ];

const TileCardSection: React.FC = () => {
    return (
        <Section>
            <TileCardWrapper>
                {sampleTiles.map((tile) => {
                return <TileCard key={tile.heading} {...tile} />
                })}
            </TileCardWrapper>

            <TileCardWrapper>
                {sampleTiles2.map((tile) => {
                return <TileCard key={tile.heading} {...tile} />
                })}
            </TileCardWrapper>

            <TileCardWrapper>
                {sampleTiles3.map((tile) => {
                return <TileCard key={tile.heading} {...tile} />
                })}
            </TileCardWrapper>

            <Button primary={styles.colors.backgroundRed} width='large'>Create your own tiles</Button>
        </Section>
    );
};
export default TileCardSection;