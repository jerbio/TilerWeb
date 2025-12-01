import { PersonaSession } from '@/global_state';
import { Persona } from '@/core/common/types/persona';
import TimeUtil from '@/core/util/time';
import {
  CreateSessionParams,
  StoredPersonaUser,
  StoredPersonaUsers,
  SessionChangeCallback,
  SessionEventType,
  SessionEvent,
} from './personaSessionManager.types';

/**
 * Centralized manager for persona sessions
 * Handles synchronization between localStorage, global state, and dev overrides
 * 
 * @example
 * const manager = new PersonaSessionManager();
 * 
 * // Create a session
 * manager.createSession({
 *   personaId: 'professional',
 *   personaName: 'Professional',
 *   userId: 'TilerUser@@123',
 * });
 * 
 * // Update user ID (automatically syncs everywhere)
 * manager.setUserId('professional', 'TilerUser@@456');
 * 
 * // Listen for changes
 * manager.onSessionChange('professional', (session) => {
 *   console.log('Session updated:', session);
 * });
 */
class PersonaSessionManager {
  private readonly STORAGE_KEY = 'tiler-persona-users' as const;
  private eventListeners: Map<string, Set<SessionChangeCallback>> = new Map();
  
  // Reference to global state setters (injected from Zustand)
  private setActivePersonaSession: ((session: PersonaSession | null) => void) | null = null;
  private updateActivePersonaSession: ((updates: Partial<PersonaSession>) => void) | null = null;
  private getActivePersonaSession: (() => PersonaSession | null) | null = null;
  private getDevUserIdOverride: (() => string | null) | null = null;
  private setDevUserIdOverride: ((userId: string | null) => void) | null = null;

  /**
   * Initialize the manager with Zustand store methods
   */
  initialize(store: {
    setActivePersonaSession: (session: PersonaSession | null) => void;
    updateActivePersonaSession: (updates: Partial<PersonaSession>) => void;
    getActivePersonaSession: () => PersonaSession | null;
    getDevUserIdOverride: () => string | null;
    setDevUserIdOverride: (userId: string | null) => void;
  }): void {
    this.setActivePersonaSession = store.setActivePersonaSession;
    this.updateActivePersonaSession = store.updateActivePersonaSession;
    this.getActivePersonaSession = store.getActivePersonaSession;
    this.getDevUserIdOverride = store.getDevUserIdOverride;
    this.setDevUserIdOverride = store.setDevUserIdOverride;
  }

  // ==================== STORAGE OPERATIONS ====================

  /**
   * Get all stored persona users from localStorage (with expiration cleanup)
   */
  private getStoredPersonaUsers(): StoredPersonaUsers {
    const storedPersonaUsers: StoredPersonaUsers = JSON.parse(
      localStorage.getItem(this.STORAGE_KEY) || '{}'
    );

    // Clean up expired users
    let hasExpired = false;
    for (const personaId in storedPersonaUsers) {
      const user = storedPersonaUsers[personaId]!;
      if (user.expiration < TimeUtil.now()) {
        delete storedPersonaUsers[personaId];
        hasExpired = true;
      }
    }

    // Save cleaned data back if any were expired
    if (hasExpired) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedPersonaUsers));
    }

    return storedPersonaUsers;
  }

  /**
   * Save persona users to localStorage
   */
  private saveStoredPersonaUsers(users: StoredPersonaUsers): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Get stored persona user by ID
   */
  private getStoredPersonaUser(personaId: Persona['id']): StoredPersonaUser | null {
    const storedUsers = this.getStoredPersonaUsers();
    return storedUsers[personaId] || null;
  }

  /**
   * Set stored persona user
   */
  private setStoredPersonaUser(
    personaId: Persona['id'],
    user: StoredPersonaUser | null
  ): void {
    const storedUsers = this.getStoredPersonaUsers();

    if (user === null) {
      delete storedUsers[personaId];
    } else {
      storedUsers[personaId] = user;
    }

    this.saveStoredPersonaUsers(storedUsers);
  }

  // ==================== SESSION OPERATIONS ====================

  /**
   * Create a new persona session
   * Automatically syncs to both localStorage and global state
   */
  createSession(params: CreateSessionParams): PersonaSession {
    const {
      personaId,
      personaName,
      userId,
      scheduleId = null,
      chatSessionId = '',
      chatContext = [],
      userInfo = null,
      scheduleLastUpdatedBy = null,
    } = params;

    // Check if dev override is active
    const devOverride = this.getDevUserIdOverride?.();
    const effectiveUserId = devOverride || userId;

    const session: PersonaSession = {
      personaId,
      personaName,
      userId: effectiveUserId,
      scheduleId,
      chatSessionId,
      chatContext,
      userInfo: userInfo ? { ...userInfo, id: effectiveUserId } : null,
      scheduleLastUpdatedBy,
    };

    // Save to localStorage (with expiration)
    const expiration = TimeUtil.now() + TimeUtil.inMilliseconds(1, 'd');
    this.setStoredPersonaUser(personaId, {
      userId: effectiveUserId,
      expiration,
      personaInfo: { name: personaName },
    });

    // Save to global state
    this.setActivePersonaSession?.(session);

    // Emit event
    this.emitEvent({
      type: SessionEventType.SESSION_CREATED,
      personaId,
      session,
      newUserId: effectiveUserId,
    });

    return session;
  }

  /**
   * Update an existing persona session
   * Automatically syncs to both localStorage and global state
   */
  updateSession(personaId: Persona['id'], updates: Partial<PersonaSession>): void {
    const activeSession = this.getActivePersonaSession?.();
    
    // Only update if this is the active session
    if (activeSession?.personaId === personaId) {
      this.updateActivePersonaSession?.(updates);

      // If userId changed, update localStorage too
      if (updates.userId) {
        const storedUser = this.getStoredPersonaUser(personaId);
        if (storedUser) {
          this.setStoredPersonaUser(personaId, {
            ...storedUser,
            userId: updates.userId,
          });
        }
      }

      // Emit event
      this.emitEvent({
        type: SessionEventType.SESSION_UPDATED,
        personaId,
        session: { ...activeSession, ...updates },
      });
    }
  }

  /**
   * Get the current session for a persona
   */
  getSession(personaId?: Persona['id']): PersonaSession | null {
    const activeSession = this.getActivePersonaSession?.();
    
    if (!personaId) {
      return activeSession || null;
    }
    
    return activeSession?.personaId === personaId ? activeSession : null;
  }

  /**
   * Delete a persona session
   * Removes from both localStorage and global state
   */
  deleteSession(personaId: Persona['id']): void {
    // Remove from localStorage
    this.setStoredPersonaUser(personaId, null);

    // Clear from global state if it's the active session
    const activeSession = this.getActivePersonaSession?.();
    if (activeSession?.personaId === personaId) {
      this.setActivePersonaSession?.(null);
    }

    // Emit event
    this.emitEvent({
      type: SessionEventType.SESSION_DELETED,
      personaId,
      session: null,
    });
  }

  // ==================== USER ID MANAGEMENT ====================

  /**
   * Set user ID for a persona session
   * Handles dev override transparently and syncs everywhere
   */
  setUserId(personaId: Persona['id'], userId: string): void {
    const previousUserId = this.getUserId(personaId);

    // Update localStorage
    const storedUser = this.getStoredPersonaUser(personaId);
    if (storedUser) {
      this.setStoredPersonaUser(personaId, {
        ...storedUser,
        userId,
      });
    }

    // Update global state if this is the active session
    const activeSession = this.getActivePersonaSession?.();
    if (activeSession?.personaId === personaId) {
      this.updateActivePersonaSession?.({
        userId,
        userInfo: activeSession.userInfo
          ? { ...activeSession.userInfo, id: userId }
          : null,
      });
    }

    // Emit event
    this.emitEvent({
      type: SessionEventType.USER_ID_CHANGED,
      personaId,
      session: activeSession?.personaId === personaId ? activeSession : null,
      previousUserId: previousUserId || undefined,
      newUserId: userId,
    });
  }

  /**
   * Get user ID for a persona
   * Returns dev override if active, otherwise returns stored userId
   */
  getUserId(personaId: Persona['id']): string | null {
    const devOverride = this.getDevUserIdOverride?.();
    if (devOverride) {
      return devOverride;
    }

    const storedUser = this.getStoredPersonaUser(personaId);
    return storedUser?.userId || null;
  }

  // ==================== DEV OVERRIDE OPERATIONS ====================

  /**
   * Apply dev override for testing
   * Automatically updates the active session if one exists
   */
  applyDevOverride(userId: string): void {
    // Set the dev override in global state
    this.setDevUserIdOverride?.(userId);

    // Update active session if one exists
    const activeSession = this.getActivePersonaSession?.();
    if (activeSession) {
      this.updateActivePersonaSession?.({
        userId,
        userInfo: activeSession.userInfo
          ? { ...activeSession.userInfo, id: userId }
          : null,
      });

      // Emit event
      this.emitEvent({
        type: SessionEventType.DEV_OVERRIDE_APPLIED,
        personaId: activeSession.personaId,
        session: activeSession,
        newUserId: userId,
      });
    }
  }

  /**
   * Clear dev override
   * Reverts to the original userId from localStorage
   */
  clearDevOverride(): void {
    // Clear the dev override
    this.setDevUserIdOverride?.(null);

    // Revert active session to stored userId
    const activeSession = this.getActivePersonaSession?.();
    if (activeSession) {
      const storedUser = this.getStoredPersonaUser(activeSession.personaId);
      if (storedUser) {
        this.updateActivePersonaSession?.({
          userId: storedUser.userId,
          userInfo: activeSession.userInfo
            ? { ...activeSession.userInfo, id: storedUser.userId }
            : null,
        });

        // Emit event
        this.emitEvent({
          type: SessionEventType.DEV_OVERRIDE_CLEARED,
          personaId: activeSession.personaId,
          session: activeSession,
          newUserId: storedUser.userId,
        });
      }
    }
  }

  /**
   * Check if dev override is currently active
   */
  isDevOverrideActive(): boolean {
    return !!this.getDevUserIdOverride?.();
  }

  // ==================== EVENT SYSTEM ====================

  /**
   * Subscribe to session changes for a specific persona
   * Returns unsubscribe function
   */
  onSessionChange(
    personaId: Persona['id'],
    callback: SessionChangeCallback
  ): () => void {
    const key = `session:${personaId}`;
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }

    this.eventListeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(key)?.delete(callback);
      if (this.eventListeners.get(key)?.size === 0) {
        this.eventListeners.delete(key);
      }
    };
  }

  /**
   * Subscribe to all session changes
   * Returns unsubscribe function
   */
  onAnySessionChange(callback: SessionChangeCallback): () => void {
    const key = 'session:*';
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }

    this.eventListeners.get(key)!.add(callback);

    return () => {
      this.eventListeners.get(key)?.delete(callback);
      if (this.eventListeners.get(key)?.size === 0) {
        this.eventListeners.delete(key);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: SessionEvent): void {
    // Notify persona-specific listeners
    const specificKey = `session:${event.personaId}`;
    const specificListeners = this.eventListeners.get(specificKey);
    if (specificListeners) {
      specificListeners.forEach((callback) => callback(event.session));
    }

    // Notify global listeners
    const globalListeners = this.eventListeners.get('session:*');
    if (globalListeners) {
      globalListeners.forEach((callback) => callback(event.session));
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all expired persona users from localStorage
   */
  clearExpiredUsers(): void {
    this.getStoredPersonaUsers(); // This method already handles cleanup
  }

  /**
   * Get all stored persona users (for debugging/admin)
   */
  getAllStoredUsers(): StoredPersonaUsers {
    return this.getStoredPersonaUsers();
  }
}

// Export singleton instance
export const personaSessionManager = new PersonaSessionManager();
export default personaSessionManager;
