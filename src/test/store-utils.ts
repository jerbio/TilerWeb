import { create } from 'zustand';
import {
	ChatContextType,
	PersonaSession,
	SessionType,
	UserInfo,
} from '@/global_state';

// Minimal AppState interface for testing
interface TestAppState {
	// Session state
	authenticatedPersonaSession: PersonaSession | null;
	anonymousPersonaSession: PersonaSession | null;
	activeSessionType: SessionType;

	// Authentication state
	isAuthenticated: boolean;
	isAuthLoading: boolean;
	authenticatedUser: UserInfo | null;

	// Development tools
	devUserIdOverride: string | null;

	// Actions
	setActivePersonaSession: (session: PersonaSession | null) => void;
	updateActivePersonaSession: (updates: Partial<PersonaSession>) => void;
	getActivePersonaSession: () => PersonaSession | null;
	addChatContext: (context: ChatContextType) => void;
	removeChatContext: (context: ChatContextType) => void;
	clearChatContext: () => void;
	setScheduleId: (id: string | null) => void;
	setScheduleLastUpdatedBy: (component: string | null) => void;
	setUserInfo: (info: UserInfo) => void;
	setChatSessionId: (id: string) => void;
	setDevUserIdOverride: (userId: string | null) => void;
	switchSessionType: (type: SessionType) => void;
	checkAuth: () => Promise<void>;
	logout: () => Promise<void>;
	setAuthenticated: (user: UserInfo | null) => void;
}

// Default test state
const defaultTestState: Omit<TestAppState, 'setActivePersonaSession' | 'updateActivePersonaSession' | 'getActivePersonaSession' | 'addChatContext' | 'removeChatContext' | 'clearChatContext' | 'setScheduleId' | 'setScheduleLastUpdatedBy' | 'setUserInfo' | 'setChatSessionId' | 'setDevUserIdOverride' | 'switchSessionType' | 'checkAuth' | 'logout' | 'setAuthenticated'> = {
	authenticatedPersonaSession: null,
	anonymousPersonaSession: null,
	activeSessionType: SessionType.ANONYMOUS,
	isAuthenticated: false,
	isAuthLoading: false,
	authenticatedUser: null,
	devUserIdOverride: null,
};

// Factory function - creates isolated store per test
export const createTestStore = (initialState: Partial<TestAppState> = {}) => {
	return create<TestAppState>()((set, get) => ({
		// Default state
		...defaultTestState,

		// Override with initial state
		...initialState,

		// Actions
		setActivePersonaSession: (session) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			set({ [propertyName]: session });
		},

		updateActivePersonaSession: (updates) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, ...updates } });
		},

		getActivePersonaSession: () => {
			const state = get();
			return state.activeSessionType === SessionType.AUTHENTICATED
				? state.authenticatedPersonaSession
				: state.anonymousPersonaSession;
		},

		addChatContext: (context) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({
				[propertyName]: {
					...currentSession,
					chatContext: [...currentSession.chatContext, context],
				},
			});
		},

		removeChatContext: (context) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({
				[propertyName]: {
					...currentSession,
					chatContext: currentSession.chatContext.filter((item) => item !== context),
				},
			});
		},

		clearChatContext: () => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, chatContext: [] } });
		},

		setScheduleId: (id) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, scheduleId: id } });
		},

		setScheduleLastUpdatedBy: (component) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, scheduleLastUpdatedBy: component } });
		},

		setUserInfo: (info) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, userInfo: info } });
		},

		setChatSessionId: (id) => {
			const state = get();
			const propertyName =
				state.activeSessionType === SessionType.AUTHENTICATED
					? 'authenticatedPersonaSession'
					: 'anonymousPersonaSession';
			const currentSession = state[propertyName];
			if (!currentSession) return;
			set({ [propertyName]: { ...currentSession, chatSessionId: id } });
		},

		setDevUserIdOverride: (userId) => set({ devUserIdOverride: userId }),

		switchSessionType: (type) => set({ activeSessionType: type }),

		checkAuth: async () => {
			set({ isAuthLoading: false });
		},

		logout: async () => {
			set({ isAuthenticated: false, authenticatedUser: null });
		},

		setAuthenticated: (user) => {
			set({
				isAuthenticated: user !== null,
				authenticatedUser: user,
			});
		},
	}));
};

// Helper to create a mock PersonaSession
export const createMockPersonaSession = (
	overrides: Partial<PersonaSession> = {}
): PersonaSession => ({
	personaId: 'test-persona',
	personaName: 'Test Persona',
	userId: 'test-user-id',
	scheduleId: null,
	chatSessionId: 'test-chat-session',
	chatContext: [],
	userInfo: null,
	scheduleLastUpdatedBy: null,
	...overrides,
});

// Helper to create a mock UserInfo
export const createMockUserInfo = (overrides: Partial<UserInfo> = {}): UserInfo => ({
	id: 'test-user-id',
	username: 'testuser',
	timeZoneDifference: 0,
	timeZone: 'UTC',
	email: 'test@example.com',
	endfOfDay: null,
	phoneNumber: null,
	fullName: 'Test User',
	firstName: 'Test',
	lastName: 'User',
	countryCode: null,
	dateOfBirth: null,
	...overrides,
});
