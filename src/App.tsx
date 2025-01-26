import { useState }  from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { UserApi } from './api/userApi'
import { ScheduleApi } from './api/scheduleApi'


interface Tile {
  id: string;
  name: string;
}

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
  const [count, setCount] = useState(0)
  const [tilesForTheNextWeek, setTiles] = useState([])



  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel='noreferrer'>
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel='noreferrer'>
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

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
      
    </>
  )
}

export default App
