import { PersonaApi } from "@/api/personaApi";
import PersonaService from "./personaService";
import { ScheduleApi } from "@/api/scheduleApi";
import ScheduleService from "./scheduleService";
import { ChatApi } from "@/api/chatApi";
import ChatService from "./chatService";
import { WaitlistApi } from "@/api/waitlistApi";
import { WaitlistService } from "./waitlistService";
import { BetaUserApi } from "@/api/betaUserApi";
import { BetaUserService } from "./betaUserService";
import { EmailListApi } from "@/api/emailListApi";
import { EmailListService } from "./emailListService";
import { personaUserService } from "./personaUserService";

// Init APIs
const personaApi = new PersonaApi();
const scheduleApi = new ScheduleApi();
const chatApi = new ChatApi();
const waitlistApi = new WaitlistApi();
const betaUserApi = new BetaUserApi();
const emailListApi = new EmailListApi();

// Init Services
export const personaService = new PersonaService(personaApi);
export const scheduleService = new ScheduleService(scheduleApi);
export const chatService = new ChatService(chatApi);
export const waitlistService = new WaitlistService(waitlistApi);
export const betaUserService = new BetaUserService(betaUserApi);
export const emailListService = new EmailListService(emailListApi);
export { personaUserService };
