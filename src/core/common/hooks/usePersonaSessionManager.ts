import { useEffect, useCallback } from 'react';
import useAppStore, { PersonaSession } from '@/global_state';
import { Persona } from '@/core/common/types/persona';
import { CreateSessionParams, SessionChangeCallback } from '@/services/personaSessionManager.types';

/**
 * Hook to access the PersonaSessionManager
 * Provides methods to manage persona sessions in a centralized way
 * 
 * @example
 * const { createSession, setUserId, applyDevOverride } = usePersonaSessionManager();
 * 
 * // Create a new session
 * createSession({
 *   personaId: 'professional',
 *   personaName: 'Professional',
 *   userId: 'TilerUser@@123',
 * });
 * 
 * // Apply dev override
 * applyDevOverride('TilerUser@@999');
 */
export function usePersonaSessionManager() {
  const manager = useAppStore((state) => state.getPersonaSessionManager());

  return {
    // Session CRUD operations
    createSession: useCallback(
      (params: CreateSessionParams) => manager.createSession(params),
      [manager]
    ),
    updateSession: useCallback(
      (personaId: Persona['id'], updates: Partial<PersonaSession>) =>
        manager.updateSession(personaId, updates),
      [manager]
    ),
    getSession: useCallback(
      (personaId?: Persona['id']) => manager.getSession(personaId),
      [manager]
    ),
    deleteSession: useCallback(
      (personaId: Persona['id']) => manager.deleteSession(personaId),
      [manager]
    ),

    // User ID management
    setUserId: useCallback(
      (personaId: Persona['id'], userId: string) =>
        manager.setUserId(personaId, userId),
      [manager]
    ),
    getUserId: useCallback(
      (personaId: Persona['id']) => manager.getUserId(personaId),
      [manager]
    ),

    // Dev override operations
    applyDevOverride: useCallback(
      (userId: string) => manager.applyDevOverride(userId),
      [manager]
    ),
    clearDevOverride: useCallback(
      () => manager.clearDevOverride(),
      [manager]
    ),
    isDevOverrideActive: useCallback(
      () => manager.isDevOverrideActive(),
      [manager]
    ),

    // Event subscription
    onSessionChange: useCallback(
      (personaId: Persona['id'], callback: SessionChangeCallback) =>
        manager.onSessionChange(personaId, callback),
      [manager]
    ),
    onAnySessionChange: useCallback(
      (callback: SessionChangeCallback) =>
        manager.onAnySessionChange(callback),
      [manager]
    ),

    // Utility methods
    clearExpiredUsers: useCallback(
      () => manager.clearExpiredUsers(),
      [manager]
    ),
    getAllStoredUsers: useCallback(
      () => manager.getAllStoredUsers(),
      [manager]
    ),
  };
}

/**
 * Hook to access and subscribe to the current persona session
 * Automatically subscribes to session changes for reactive updates
 * 
 * @param personaId - Optional persona ID to monitor specific persona
 * @param onSessionChange - Optional callback when session changes
 * 
 * @example
 * const session = usePersonaSession('professional', (newSession) => {
 *   console.log('Session updated:', newSession);
 * });
 * 
 * // Access session properties
 * const userId = session?.userId;
 * const scheduleId = session?.scheduleId;
 */
export function usePersonaSession(
  personaId?: Persona['id'],
  onSessionChange?: SessionChangeCallback
) {
  const activeSessionType = useAppStore((state) => state.activeSessionType);
  const activeSession = useAppStore((state) => activeSessionType === 'anonymous' ? state.anonymousPersonaSession : state.authenticatedPersonaSession);
  const manager = useAppStore((state) => state.getPersonaSessionManager());

  // Subscribe to session changes
  useEffect(() => {
    if (!onSessionChange) return;

    const unsubscribe = personaId
      ? manager.onSessionChange(personaId, onSessionChange)
      : manager.onAnySessionChange(onSessionChange);

    return () => {
      unsubscribe();
    };
  }, [manager, personaId, onSessionChange]);

  // Return the relevant session
  if (personaId) {
    return activeSession?.personaId === personaId ? activeSession : null;
  }

  return activeSession;
}

/**
 * Hook to get the effective user ID (with dev override applied)
 * Useful for components that need to know the current user ID
 * 
 * @param personaId - Optional persona ID to get user ID for
 * 
 * @example
 * const userId = useEffectiveUserId('professional');
 * // Returns dev override if active, otherwise returns stored userId
 */
export function useEffectiveUserId(personaId?: Persona['id']) {
  const activeSessionType = useAppStore((state) => state.activeSessionType);
  const activeSession = useAppStore((state) => activeSessionType === 'anonymous' ? state.anonymousPersonaSession : state.authenticatedPersonaSession);
  const devOverride = useAppStore((state) => state.devUserIdOverride);
  const manager = useAppStore((state) => state.getPersonaSessionManager());

  if (devOverride) {
    return devOverride;
  }

  if (personaId) {
    return manager.getUserId(personaId);
  }

  return activeSession?.userId || null;
}
