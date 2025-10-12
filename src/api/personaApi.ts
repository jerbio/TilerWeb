import { Persona, PersonaResponse, PersonaAnonymousUserResponse } from '../core/common/types/persona';
import { AppApi } from './appApi';

export class PersonaApi extends AppApi {
	public getPersonas() {
		return this.apiRequest<PersonaResponse>('api/Persona');
	}

	public createAnonymousUser(persona: Persona) {
		return this.apiRequest<PersonaAnonymousUserResponse>('api/Anonymous/Persona', {
			method: 'POST',
			body: JSON.stringify({...persona,
      TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone.toString()}),
		});
	}

	public createPersonaWithAudio(description: string, audioFile: Blob) {
		const formData = new FormData();
		formData.append('AudioFile', audioFile, 'recording.webm');
		formData.append('Description', description);
		formData.append('TimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

		return this.apiRequestFormData<PersonaAnonymousUserResponse>(
			'api/Persona/CreateWithAudio',
			{
				method: 'POST',
				body: formData,
			}
		);
	}
}
