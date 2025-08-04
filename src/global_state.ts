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
	countryCode: string; // "1"
}

interface AppState {
	chatContext: ChatContextType[]; // Represents an array of chat contexts
	addChatContext: (context: ChatContextType) => void; // Action to add a new chat context
	removeChatContext: (context: ChatContextType) => void; // Action to remove a specific chat context
	clearChatContext: () => void; // Action to clear all chat contexts
	scheduleId: string | null; // Action to set the schedule change state
	setScheduleId: (id: string | null) => void; // Action to set the schedule ID
	scheduleLastUpdatedBy: string | null; // Action to set the last updated by component
	setScheduleLastUpdatedBy: (component: string | null) => void; // Action to set the last updated by component

	// New user info state
	userInfo: UserInfo | null;
	setUserInfo: (info: UserInfo) => void;

	// Anonymous user state for persona chat sessions
	anonymousUser: UserInfo | null;
	setAnonymousUser: (user: UserInfo | null) => void;
}

const useAppStore = create<AppState>((set) => ({
	chatContext: [], // Initial value for chatContext is an empty array
	addChatContext: (context) => set((state) => ({ chatContext: [...state.chatContext, context] })), // Adds a new context
	removeChatContext: (context) =>
		set((state) => ({
			chatContext: state.chatContext.filter((item) => item !== context), // Removes the specified context
		})),
	clearChatContext: () => set(() => ({ chatContext: [] })), // Clears all contexts
	scheduleId: null, // Initial value for scheduleId is null
	setScheduleId: (id) => set(() => ({ scheduleId: id })), //
	scheduleLastUpdatedBy: null, // Initial value for scheduleLastUpdatedBy is null
	setScheduleLastUpdatedBy: (component) => set(() => ({ scheduleLastUpdatedBy: component })), // Sets the last updated by component

	// User info state
	userInfo: null,
	setUserInfo: (info) => set(() => ({ userInfo: info })),

	// Anonymous user state
	anonymousUser: null,
	setAnonymousUser: (user) => set(() => ({ anonymousUser: user })),
}));

// {EntityId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d++01JTVFJDG5B8G5RBJEY4E365GQ_7_01JTVFJDG5QMY0STMNA82AZ18D_01JTVFJDG521S2V82V17J4ZTX7', Name: 'Work Out', Description: ''}
export default useAppStore;
