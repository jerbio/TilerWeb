import React from 'react';
import { useState } from 'react';
import { UserApi } from '@/api/userApi';
import { Tile } from '@/core/common/types/tile';
import { scheduleService } from '@/services';
import { ScheduleSubCalendarEvent } from '@/core/common/types/schedule';

function renderTileNames(tiles: Array<Tile>) {
	if (tiles != null && tiles.length > 0) {
		return tiles.map((eachTile: Tile) => {
			return (
				<div className="indent" key={eachTile.id}>
					{eachTile.name}
				</div>
			);
		});
	}
	return [];
}

const TileFromApi: React.FC = () => {
	const [tilesForTheNextWeek, setTiles] = useState<Array<ScheduleSubCalendarEvent>>([]);

	return (
		<>
			<div className="card">
				<button
					onClick={() => {
						const userApi = new UserApi();
						userApi.signIn('testuser', 'TestUser1234#').then(() => {});
					}}
				>
					sign into test user Account
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<div className="card">
				<button
					onClick={() => {
						scheduleService.getSchedule().then((tiles) => {
							setTiles((tiles?.subCalendarEvents ?? []).slice(0, 5));
						});
					}}
				>
					get schedule
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
				<div>{renderTileNames(tilesForTheNextWeek)}</div>

				<p className="read-the-docs">Click on the Vite and React logos to learn more</p>
			</div>
		</>
	);
};

export default TileFromApi;
