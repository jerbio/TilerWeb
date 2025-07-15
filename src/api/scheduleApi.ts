import { ScheduleLookupResponse } from '../types/schedule';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	public async getScheduleLookupById(scheduleId: string) {
		const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
		const fourDaysInMs = oneDay * 4;
		// Three days before and after the current time
		const start = Date.now() - fourDaysInMs;
		const end = Date.now() + fourDaysInMs;
		const myHeaders = new Headers();
		const requestOptions = {
			method: 'GET',
			headers: myHeaders,
		};

		const urlParams = new URLSearchParams({
			scheduleId: scheduleId,
			mobileApp: true.toString(),
			startRange: start.toString(),
			endRange: end.toString(),
		}).toString();

		return fetch(this.getUri(`api/Schedule/Lookup?${urlParams}`), requestOptions)
			.then((response) => response.json())
			.then((result: ScheduleLookupResponse) => {
				return result.Content;
			})
			.catch((error) => {
				console.error(error);
			});
	}

	public async getSchedule() {
		// : Promise<Schedule>
		const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
		const oneWeekInMs = oneDay * 7;
		const start = Date.now();
		const end = start + oneWeekInMs;

		const myHeaders = new Headers();
		const tilerBearerToken = localStorage.getItem('tiler_bearer'); // write
		if (tilerBearerToken) {
			myHeaders.append('Authorization', tilerBearerToken);
		} else {
			throw new Error('No bearer token found');
		}
		// myHeaders.append("mode", "cors");

		// const queryParameters = {
		// 	StartRange: start,
		// 	EndRange: end,
		// 	Version: 'v2',
		// 	MobileApp: true.toString(),
		// };

		const urlParams = new URLSearchParams({
			StartRange: start.toString(),
			EndRange: end.toString(),
			Version: 'v2',
			MobileApp: true.toString(),
		}).toString();

		const requestOptions = {
			method: 'GET',
			headers: myHeaders,
		};

		return fetch(this.getUri('api/Schedule?' + urlParams), requestOptions)
			.then((response) => response.json())
			.then((result) => {
				return result.Content;
			})
			.catch((error) => {
				console.error(error);
			});
	}
}
