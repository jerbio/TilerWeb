import { useState }  from 'react';
import './App.css'
import { UserApi } from './api/userApi'
import { ScheduleApi } from './api/scheduleApi'
import Navigation from './components/navigation'
import TileCard from './components/tile_card';
import {Tile, TileCardProps} from './util/interface'
import styled from 'styled-components';
import styles from './util/styles';

const TileCardWrapper = styled.div`
  display: flex;
  max-width: 1200px;
  height: 101px;
  // border: 1px solid rgb(202, 20, 20);
  padding-left: 40px;
  margin: 1.5rem auto;
`

function renderTileNames(tiles: Array<Tile>) {
  if (tiles != null && tiles.length > 0) {
    return tiles.map((eachTile: Tile) => {
      return <div className="indent" key={eachTile.id}>
        {eachTile.name}
      </div>
    });
  }
  return [];
}

const sampleTiles: Array<TileCardProps> = [
  {heading: "Meeting With Charles", location: "Conference Room A", startTime: "09:00 AM", endTime: "10:00 AM", backgroundColor: styles.colors.tileBackgroundPrimary },
  {heading: "Morning Meeting", location: "Conference Room A", startTime: "10:00 AM", endTime: "11:00 AM", backgroundColor: styles.colors.tileBackgroundSecondary },
  {heading: "Client Call", location: "Conference Room A", startTime: "11:00 AM", endTime: "12:00 PM", backgroundColor: styles.colors.tileBackgroundTertiary },
  {heading: "Lunch Break", location: "Conference Room A", startTime: "12:00 PM", endTime: "01:00 PM", backgroundColor: styles.colors.tileBackgroundSecondary }
];

const sampleTiles2: Array<TileCardProps> = [
  {heading: "Meeting With Charles", location: "Conference Room A", startTime: "09:00 AM", endTime: "10:00 AM", backgroundColor: styles.colors.tileBackgroundSecondary },
  {heading: "Team Sync", location: "Conference Room A", startTime: "10:00 AM", endTime: "11:00 AM", backgroundColor: styles.colors.tileBackgroundTertiary },
  {heading: "Project Review", location: "Conference Room A", startTime: "11:00 AM", endTime: "12:00 PM", backgroundColor: styles.colors.tileBackgroundSecondary },
  {heading: "Happy Hour", location: "Conference Room A", startTime: "12:00 PM", endTime: "01:00 PM", backgroundColor: styles.colors.tileBackgroundPrimary }
];

const sampleTiles3: Array<TileCardProps> = [
  {heading: "Breakfast with Friends", location: "Restaurants", startTime: "09:00 AM", endTime: "10:00 AM", backgroundColor: styles.colors.tileBackgroundPrimary },
  {heading: "Grocery Shopping", location: "Grocery Store", startTime: "10:00 AM", endTime: "11:00 AM", backgroundColor: styles.colors.tileBackgroundSecondary },
  {heading: "Gym Workouts", location: "Gym", startTime: "11:00 AM", endTime: "12:00 PM", backgroundColor: styles.colors.tileBackgroundTertiary },
  {heading: "Meeting With Charles", location: "Zoom", startTime: "12:00 PM", endTime: "01:00 PM", backgroundColor: styles.colors.tileBackgroundSecondary }
];

function App() {
  const [tilesForTheNextWeek, setTiles] = useState([])

  return (
    <>
      <Navigation />
      <div className="card">
        <button onClick={() => {
          const userApi = new UserApi();
          userApi.signIn("testuser", "TestUser1234#").then(() => {
          });
        }}>
          sign into test user Account
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button onClick={() => {
          const scheduleApi = new ScheduleApi();
          scheduleApi.getSchedule().then((tiles) => {
            setTiles((tiles?.subCalendarEvents??[]).slice(0, 5));
          });
        }}>
          get schedule
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <div>
          {(renderTileNames(tilesForTheNextWeek))}
        </div>
        
        <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      </div>
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
    </>
  )
}

export default App
