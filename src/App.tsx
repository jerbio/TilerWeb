import { useState }  from 'react';
import './App.css'
import { UserApi } from './api/userApi'
import { ScheduleApi } from './api/scheduleApi'
import Navigation from './components/navigation'
import {Tile} from './util/interface'
import TileCardSection from './components/tile_card_section';


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
      <TileCardSection />      
    </>
  )
}

export default App
