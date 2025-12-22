import { PersonaSession, UserInfo, ChatContextType } from '@/global_state';
import { Persona } from '@/core/common/types/persona';

/**
 * Parameters for creating a new persona session
 */
export interface CreateSessionParams {
  personaId: string;
  personaName: string;
  userId: string;
  scheduleId?: string | null;
  chatSessionId?: string;
  chatContext?: ChatContextType[];
  userInfo?: UserInfo | null;
  scheduleLastUpdatedBy?: string | null;
}

/**
 * Persona user stored in localStorage with expiration
 */
export interface StoredPersonaUser {
  userId: string;
  expiration: number;
  personaInfo?: {
    name?: string;
  };
}

/**
 * Map of persona IDs to stored persona users
 */
export type StoredPersonaUsers = Record<Persona['id'], StoredPersonaUser | undefined>;

/**
 * Event callback for session changes
 */
export type SessionChangeCallback = (session: PersonaSession | null) => void;

/**
 * Event types for session manager
 */
export enum SessionEventType {
  SESSION_CREATED = 'session:created',
  SESSION_UPDATED = 'session:updated',
  SESSION_DELETED = 'session:deleted',
  USER_ID_CHANGED = 'session:userId:changed',
  DEV_OVERRIDE_APPLIED = 'dev:override:applied',
  DEV_OVERRIDE_CLEARED = 'dev:override:cleared',
}

/**
 * Event data for session changes
 */
export interface SessionEvent {
  type: SessionEventType;
  personaId: string;
  session: PersonaSession | null;
  previousUserId?: string;
  newUserId?: string;
}
