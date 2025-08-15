import { PersonaApi } from "@/api/personaApi";
import PersonaService from "./personaService";
import { ScheduleApi } from "@/api/scheduleApi";
import ScheduleService from "./scheduleService";
import { ChatApi } from "@/api/chatApi";
import ChatService from "./chatService";
import { WaitlistApi } from "@/api/waitlistApi";
import { WaitlistService } from "./waitlistService";

// Init APIs
const personaApi = new PersonaApi();
const scheduleApi = new ScheduleApi();
const chatApi = new ChatApi();
const waitlistApi = new WaitlistApi();

// Init Services
export const personaService = new PersonaService(personaApi);
export const scheduleService = new ScheduleService(scheduleApi);
export const chatService = new ChatService(chatApi);
export const waitlistService = new WaitlistService(waitlistApi);
