import { Persona, PersonaResponse, PersonaScheduleResponse } from '../core/common/types/persona';
import { AppApi } from './appApi';

export class PersonaApi extends AppApi {
	public getPersonas() {
		return this.apiRequest<PersonaResponse>('api/Persona');
	}

	public getPersonaSchedule(persona: Persona) {
		const requestBody = {
			...persona,
			TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};
		return this.apiRequest<PersonaScheduleResponse>('api/Anonymous/Persona', {
			method: 'POST',
			body: JSON.stringify(requestBody),
		});
	}
}
