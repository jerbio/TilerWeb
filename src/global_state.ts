import { create } from 'zustand';

export interface ChatContextType {
	EntityId: string;
	Name: string; // Name of the tile we want in context
	Description?: string; // Description of the tile
}
interface AppState {
	chatContext: ChatContextType[]; // Represents an array of chat contexts
	addChatContext: (context: ChatContextType) => void; // Action to add a new chat context
	removeChatContext: (context: ChatContextType) => void; // Action to remove a specific chat context
	clearChatContext: () => void; // Action to clear all chat contexts
	scheduleChange: boolean; // Indicates if a schedule change has occurred
	setScheduleChange: (value: boolean) => void; // Action to set the schedule change state
}

const useAppStore = create<AppState>((set) => ({
	chatContext: [], // Initial value for chatContext is an empty array
	addChatContext: (context) => set((state) => ({ chatContext: [...state.chatContext, context] })), // Adds a new context
	removeChatContext: (context) =>
		set((state) => ({
			chatContext: state.chatContext.filter((item) => item !== context), // Removes the specified context
		})),
	clearChatContext: () => set(() => ({ chatContext: [] })), // Clears all contexts
	scheduleChange: false, // Initial value for scheduleChange is false
	setScheduleChange: (value: boolean) => set(() => ({ scheduleChange: value }))
}));

// {EntityId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d++01JTVFJDG5B8G5RBJEY4E365GQ_7_01JTVFJDG5QMY0STMNA82AZ18D_01JTVFJDG521S2V82V17J4ZTX7', Name: 'Work Out', Description: ''}
export default useAppStore;
