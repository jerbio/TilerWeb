import { Persona, PersonaResponse, PersonaAnonymousUserResponse } from '../core/common/types/persona';
import { AppApi } from './appApi';

export class PersonaApi extends AppApi {
	public getPersonas() {
		return this.apiRequest<PersonaResponse>('api/Persona');
	}

	public createAnonymousUser(persona: Persona) {
		return this.apiRequest<PersonaAnonymousUserResponse>('api/Anonymous/Persona', {
			method: 'POST',
			body: JSON.stringify(persona),
		});
	}
}
