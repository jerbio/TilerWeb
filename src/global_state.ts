import { create } from 'zustand';

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
	activePersonaSession: PersonaSession | null;

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

	// Getters for backward compatibility
	get chatContext(): ChatContextType[];
	get scheduleId(): string | null;
	get scheduleLastUpdatedBy(): string | null;
	get userInfo(): UserInfo | null;
	get selectedPersonaId(): string | null;
	get chatSessionId(): string;

	// Authentication state
	isAuthenticated: boolean;
	isAuthLoading: boolean;
	authenticatedUser: UserInfo | null;

	// Authentication actions
	checkAuth: () => Promise<void>;
	logout: () => Promise<void>;
	setAuthenticated: (user: UserInfo | null) => void;
}

const useAppStore = create<AppState>((set, get) => ({
	activePersonaSession: null,

	setActivePersonaSession: (session) => set(() => ({ activePersonaSession: session })),

	updateActivePersonaSession: (updates) =>
		set((state) => ({
			activePersonaSession: state.activePersonaSession
				? { ...state.activePersonaSession, ...updates }
				: null,
		})),

	// Convenience actions that update the active session
	addChatContext: (context) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					chatContext: [...state.activePersonaSession.chatContext, context],
				},
			};
		}),

	removeChatContext: (context) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					chatContext: state.activePersonaSession.chatContext.filter((item) => item !== context),
				},
			};
		}),

	clearChatContext: () =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					chatContext: [],
				},
			};
		}),

	setScheduleId: (id) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					scheduleId: id,
				},
			};
		}),

	setScheduleLastUpdatedBy: (component) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					scheduleLastUpdatedBy: component,
				},
			};
		}),

	setUserInfo: (info) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					userInfo: info,
				},
			};
		}),

	setChatSessionId: (id) =>
		set((state) => {
			if (!state.activePersonaSession) return state;
			return {
				activePersonaSession: {
					...state.activePersonaSession,
					chatSessionId: id,
				},
			};
		}),

	// Getters for backward compatibility
	get chatContext() {
		return get().activePersonaSession?.chatContext || [];
	},

	get scheduleId() {
		return get().activePersonaSession?.scheduleId || null;
	},

	get scheduleLastUpdatedBy() {
		return get().activePersonaSession?.scheduleLastUpdatedBy || null;
	},

	get userInfo() {
		return get().activePersonaSession?.userInfo || null;
	},

	get selectedPersonaId() {
		return get().activePersonaSession?.personaId || null;
	},

	get chatSessionId() {
		return get().activePersonaSession?.chatSessionId || '';
	},

	// Authentication state
	isAuthenticated: false,
	isAuthLoading: true,
	authenticatedUser: null,

	// Authentication actions
	checkAuth: async () => {
		set({ isAuthLoading: true });
		try {
			const { authService } = await import('./services');
			const response = await authService.checkAuth();

			if (response.isAuthenticated) {
				// Fetch full user info
				const { userService } = await import('./services');
				const user = await userService.getCurrentUser();
				set({ isAuthenticated: true, authenticatedUser: user, isAuthLoading: false });
			} else {
				set({ isAuthenticated: false, authenticatedUser: null, isAuthLoading: false });
			}
		} catch (error) {
			console.error('Auth check failed:', error);
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
	},
}));

export default useAppStore;
