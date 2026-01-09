import { create } from 'zustand';
import { personaSessionManager } from '@/services/personaSessionManager';
import { PersonaId } from '@/core/constants/persona';

export interface ChatContextType {
  EntityId: string;
  Name: string; // Name of the tile we want in context
  Description?: string; // Description of the tile
}

export interface UserInfo {
  id: string; // TilerUser@@00000000000000000000000
  username: string; // Armando-ALPHANUMERIC
  timeZoneDifference: number; // 0.0
  timeZone: string; // UTC
  email: string | null; // null
  endfOfDay: string; // 0001-01-01T00:00:00+00:00
  phoneNumber: string | null; // null
  fullName: string; // ""
  firstName: string; // ""
  lastName: string; // ""
  countryCode: string | null; // "1"
}

// Grouped persona session that includes user, schedule, and chat session
export interface PersonaSession {
  personaId: string; // The persona ID (string type to match Persona type)
  personaName: string; // Name of the persona for display
  userId: string; // The anonymous user ID created for this persona
  scheduleId: string | null; // The schedule ID for this persona's calendar
  chatSessionId: string; // The chat session ID for this persona
  chatContext: ChatContextType[]; // Chat context specific to this persona session
  userInfo: UserInfo | null; // User info for this persona
  scheduleLastUpdatedBy: string | null; // Component that last updated the schedule
}

interface AppState {
  // Current active persona session
  authenticatedPersonaSession: PersonaSession | null;
  anonymousPersonaSession: PersonaSession | null;
  activeSessionType: 'authenticated' | 'anonymous';

  // Action to set or update the entire persona session
  setActivePersonaSession: (session: PersonaSession | null) => void;

  // Action to update specific fields in the active session
  updateActivePersonaSession: (updates: Partial<PersonaSession>) => void;

  // Convenience actions for backward compatibility and ease of use
  addChatContext: (context: ChatContextType) => void;
  removeChatContext: (context: ChatContextType) => void;
  clearChatContext: () => void;
  setScheduleId: (id: string | null) => void;
  setScheduleLastUpdatedBy: (component: string | null) => void;
  setUserInfo: (info: UserInfo) => void;
  setChatSessionId: (id: string) => void;

  // Development tools (only active in dev mode)
  devUserIdOverride: string | null;
  setDevUserIdOverride: (userId: string | null) => void;

  // Getters for backward compatibility
  get chatContext(): ChatContextType[];
  get scheduleId(): string | null;
  get scheduleLastUpdatedBy(): string | null;
  get userInfo(): UserInfo | null;
  get selectedPersonaId(): string | null;
  get chatSessionId(): string;

  // Persona session manager (centralized session management)
  getPersonaSessionManager: () => typeof personaSessionManager;
  initializePersonaSessionManager: () => void;

  // Session management
  switchSessionType: (type: 'authenticated' | 'anonymous') => void;

  // Authentication state
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authenticatedUser: UserInfo | null;

  // Authentication actions
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (user: UserInfo | null) => void;
}

const useAppStore = create<AppState>()((set, get) => ({
  authenticatedPersonaSession: null,
  anonymousPersonaSession: null,
  activeSessionType: 'anonymous',

  setActivePersonaSession: (session: PersonaSession | null) => set((state) => ({
    [state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession']: session
  })),

  updateActivePersonaSession: (updates: Partial<PersonaSession>) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          ...updates
        }
      } as Partial<AppState>;
    }),

  // Convenience actions that update the active session
  addChatContext: (context: ChatContextType) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          chatContext: [...currentSession.chatContext, context],
        },
      } as Partial<AppState>;
    }),

  removeChatContext: (context: ChatContextType) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          chatContext: currentSession.chatContext.filter(
            (item) => item !== context
          ),
        },
      } as Partial<AppState>;
    }),

  clearChatContext: () =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          chatContext: [],
        },
      } as Partial<AppState>;
    }),

  setScheduleId: (id: string | null) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          scheduleId: id,
        },
      } as Partial<AppState>;
    }),

  setScheduleLastUpdatedBy: (component: string | null) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          scheduleLastUpdatedBy: component,
        },
      } as Partial<AppState>;
    }),

  setUserInfo: (info: UserInfo) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          userInfo: info,
        },
      } as Partial<AppState>;
    }),

  setChatSessionId: (id: string) =>
    set((state) => {
      const sessionType = state.activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
      const currentSession = state[sessionType];

      if (!currentSession) return state;

      return {
        [sessionType]: {
          ...currentSession,
          chatSessionId: id,
        },
      } as Partial<AppState>;
    }),

  // Development tools
  devUserIdOverride: null,
  setDevUserIdOverride: (userId: string | null) => set(() => ({ devUserIdOverride: userId })),

  // Getters for backward compatibility
  get chatContext() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.chatContext || [];
  },

  get scheduleId() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.scheduleId || null;
  },

  get scheduleLastUpdatedBy() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.scheduleLastUpdatedBy || null;
  },

  get userInfo() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.userInfo || null;
  },

  get selectedPersonaId() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.personaId || null;
  },

  get chatSessionId() {
    const sessionType = get().activeSessionType === 'authenticated' ? 'authenticatedPersonaSession' : 'anonymousPersonaSession';
    return get()[sessionType]?.chatSessionId || '';
  },

  // Authentication state
  isAuthenticated: false,
  isAuthLoading: true,
  authenticatedUser: null,

  // Method to switch between authenticated and anonymous sessions
  switchSessionType: (type: 'authenticated' | 'anonymous') =>
    set({ activeSessionType: type }),

  // Authentication actions
  checkAuth: async () => {
    set({ isAuthLoading: true });
    try {
      const { authService } = await import('./services');
      const response = await authService.checkAuth();

      if (response && response.isAuthenticated) {
        // Fetch full user info
        const { userService } = await import('./services');
        const user = await userService.getCurrentUser();
        set({ isAuthenticated: true, authenticatedUser: user, isAuthLoading: false });
      } else {
        set({ isAuthenticated: false, authenticatedUser: null, isAuthLoading: false });
      }
    } catch (error) {
      console.error('Check auth failed:', error);
      set({ isAuthenticated: false, authenticatedUser: null, isAuthLoading: false });
    }
  },

  logout: async () => {
    try {
      const { authService } = await import('./services');
      await authService.logout();
      set({ isAuthenticated: false, authenticatedUser: null });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  setAuthenticated: (user) => {
    set({
      isAuthenticated: user !== null,
      authenticatedUser: user,
    });

    // Initialize persona session when user logs in
    if (user) {
      const personaSessionManager = get().getPersonaSessionManager();
      personaSessionManager.createSession({
        personaId: PersonaId.AuthenticatedPersonaId,
        personaName: user.username || 'Default Persona',
        userId: user.id,
        userInfo: user,
        scheduleId: null,
        chatSessionId: '',
        chatContext: [],
        scheduleLastUpdatedBy: null,
      });
    }
  },

  // Persona session manager getter
  getPersonaSessionManager: () => personaSessionManager,

  // Initialize the PersonaSessionManager with Zustand store methods
  initializePersonaSessionManager: () => {
    personaSessionManager.initialize({
      setActivePersonaSession: (session: PersonaSession | null) => {
        if (!session) {
          useAppStore.getState().setActivePersonaSession(null);
          return;
        }

        const { personaId } = session;
        const store = useAppStore.getState();

        // Set active session type based on personaId
        if (personaId === PersonaId.AuthenticatedPersonaId) {
          store.switchSessionType('authenticated');
        } else if (personaId === PersonaId.AnonymousPersonaId) {
          store.switchSessionType('anonymous');
        }

        console.log('initialize session ', store);

        store.setActivePersonaSession(session);
      },
      updateActivePersonaSession: (updates: Partial<PersonaSession>) => {
        const store = useAppStore.getState();
        const currentSession = store.activeSessionType === 'authenticated'
          ? store.authenticatedPersonaSession
          : store.anonymousPersonaSession;

        if (!currentSession) return;

        // If updating personaId, handle session type switching
        if (updates.personaId) {
          if (updates.personaId === PersonaId.AuthenticatedPersonaId) {
            store.switchSessionType('authenticated');
          } else if (updates.personaId === PersonaId.AnonymousPersonaId) {
            store.switchSessionType('anonymous');
          }
        }

        store.updateActivePersonaSession(updates);
      },
      getActivePersonaSession: () => {
        const state = useAppStore.getState();
        return state.activeSessionType === 'anonymous'
          ? state.anonymousPersonaSession
          : state.authenticatedPersonaSession;
      },
      getDevUserIdOverride: () => useAppStore.getState().devUserIdOverride,
      setDevUserIdOverride: (userId: string | null) => useAppStore.getState().setDevUserIdOverride(userId),
    });
  }
}));

// Initialize the persona session manager after the store is created
useAppStore.getState().initializePersonaSessionManager();

export default useAppStore;
