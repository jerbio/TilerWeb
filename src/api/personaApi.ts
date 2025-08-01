import { Persona, PersonaResponse, PersonaScheduleResponse } from '../types/persona';
import { AppApi } from './appApi';

export class PersonaApi extends AppApi {
	public async getPersonas() {
		const myHeaders = new Headers();
		const requestOptions = {
			method: 'GET',
			headers: myHeaders,
		};

		return fetch(this.getUri('api/Persona'), requestOptions)
			.then((response) => response.json())
			.then((result: PersonaResponse) => {
				return result.Content.personas;
			})
			.catch((error) => {
				console.error(error);
			});
	}

	public async getPersonaSchedule(persona: Persona) {
		const myHeaders = new Headers({
			'Content-Type': 'application/json',
			Accept: 'application/json',
		});
		const requestOptions = {
			method: 'POST',
			headers: myHeaders,
		};
		const requestBody = persona;
		return fetch(this.getUri('api/Anonymous/Persona'), {
			...requestOptions,
			body: JSON.stringify(requestBody),
		})
			.then((response) => response.json())
			.then((result: PersonaScheduleResponse) => {
				return result.Content.anonymousUserWithPersona;
			})
			.catch((error) => {
				console.error(error);
			});
	}
}
