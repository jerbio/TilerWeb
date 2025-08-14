import { PersonaApi } from "@/api/personaApi";
import { Persona } from "@/core/common/types/persona";

class PersonaService {
	private personaApi: PersonaApi;
	constructor(personaApi: PersonaApi) {
		this.personaApi = personaApi;
	}

	async getPersonas() {
		try {
			const personas = await this.personaApi.getPersonas();
			return personas.Content.personas;
		} catch (error) {
			console.error(error);
		}
	}

	async getPersonaSchedule(persona: Persona) {
		try {
			const schedule = await this.personaApi.getPersonaSchedule(persona);
			return schedule.Content.anonymousUserWithPersona;
		} catch (error) {
			console.error(error);
		}
	}
}

export default PersonaService;
