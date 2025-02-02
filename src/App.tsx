import { useState }  from 'react';
import './App.css'
import { UserApi } from './api/userApi'
import { ScheduleApi } from './api/scheduleApi'
import Navigation from './components/navigation'
import TileCard from './components/tile_card';
import {Tile, TileCardProps} from './util/interface'

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
  {heading: "Tile 1", location: "Location 1", startTime: "09:00 AM", endTime: "10:00 AM" },
  {heading: "Tile 2", location: "Location 2", startTime: "10:00 AM", endTime: "11:00 AM" },
  {heading: "Tile 3", location: "Location 3", startTime: "11:00 AM", endTime: "12:00 PM" },
  {heading: "Tile 4", location: "Location 4", startTime: "12:00 PM", endTime: "01:00 PM" }
];
function App() {
  // const [count, setCount] = useState(0)
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
      {sampleTiles.map((tile) => {
        return <TileCard key={tile.heading} {...tile} />
      })}
    </>
  )
}

export default App
