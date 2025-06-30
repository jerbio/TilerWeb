import { create } from 'zustand';

interface AppState {
	chatContext: string[]; // Represents an array of chat contexts
	addChatContext: (context: string) => void; // Action to add a new chat context
	removeChatContext: (context: string) => void; // Action to remove a specific chat context
	clearChatContext: () => void; // Action to clear all chat contexts
}

const useAppStore = create<AppState>((set) => ({
	chatContext: ['Intial Value'], // Initial value for chatContext is an empty array
	addChatContext: (context) => set((state) => ({ chatContext: [...state.chatContext, context] })), // Adds a new context
	removeChatContext: (context) =>
		set((state) => ({
			chatContext: state.chatContext.filter((item) => item !== context), // Removes the specified context
		})),
	clearChatContext: () => set(() => ({ chatContext: [] })), // Clears all contexts
}));

export default useAppStore;
