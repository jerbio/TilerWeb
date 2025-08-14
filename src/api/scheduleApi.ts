import { ScheduleLookupResponse } from '../core/common/types/schedule';
import TimeUtil from '../core/util/time';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	public async getScheduleLookupById(
		scheduleId: string,
		options?: { startRange: number; endRange: number }
	) {
		const fourDays = TimeUtil.inMilliseconds(3, 'd');
		const defaultStart = TimeUtil.now() - fourDays;
		const defaultEnd = TimeUtil.now() + fourDays;

		const start = options?.startRange ?? defaultStart;
		const end = options?.endRange ?? defaultEnd;
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
		const oneWeek = TimeUtil.inMilliseconds(1, 'w');
		const start = TimeUtil.now();
		const end = start + oneWeek;

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
