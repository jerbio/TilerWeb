import { AppApi } from './appApi';

export class WaitlistApi extends AppApi {
	public async joinWaitlist(email: string): Promise<any> {
		const myHeaders = new Headers();
		myHeaders.append('Content-Type', 'application/json');

		const body = JSON.stringify({
			email: email,
		});

		const requestOptions = {
			method: 'POST',
			headers: myHeaders,
			body: body,
		};

		return fetch('https://tiler.app/api/BetaUser', requestOptions)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((result) => {
				console.log('Successfully joined waitlist:', result);
				return result;
			})
			.catch((error) => {
				console.error('Error joining waitlist:', error);
				throw error;
			});
	}
}
