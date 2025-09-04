import { PersonaApi } from "@/api/personaApi";
import { Persona } from "@/core/common/types/persona";
import { normalizeError } from "@/core/error";

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
			console.error("Error fetching personas", error);
			throw normalizeError(error);
		}
	}

	async createAnonymousUser(persona: Persona) {
		try {
			const schedule = await this.personaApi.createAnonymousUser(persona);
			return schedule.Content.anonymousUserWithPersona;
		} catch (error) {
			console.error("Error creating anonymous user", error);
			throw normalizeError(error);
		}
	}
}

export default PersonaService;
