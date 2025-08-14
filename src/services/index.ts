import { PersonaApi } from "@/api/personaApi";
import PersonaService from "./personaService";
import { ScheduleApi } from "@/api/scheduleApi";
import ScheduleService from "./scheduleService";

// Init APIs
const personaApi = new PersonaApi();
const scheduleApi = new ScheduleApi();

// Init Services
export const personaService = new PersonaService(personaApi);
export const scheduleService = new ScheduleService(scheduleApi);
