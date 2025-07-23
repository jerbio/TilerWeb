import { PersonaResponse } from "../types/persona";
import { AppApi } from "./appApi";

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
};
