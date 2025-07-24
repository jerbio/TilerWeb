import { ChatVibeResponse, ChatPromptResponse } from './chat';

const API_URL = 'https://tiler-stage.conveyor.cloud/api/Vibe/Chat';
const API_ACTIONS_URL = 'https://tiler-stage.conveyor.cloud/api/Vibe/Action';
const STORAGE_KEY = 'chat_session_id';

interface SendMessageRequest {
	EntityId: string;
	SessionId?: string;
	RequestId?: string;
	ChatMessage: string;
	ActionId?: string;
	MobileApp?: boolean;
	TimeZoneOffset?: number;
	Version?: string;
	TimeZone?: string;
	IsTimeZoneAdjusted?: string;
	getTimeSpan?: string;
	UserName?: string;
	UserID?: string;
}

type Action = {
	id: string;
	descriptions: string;
	type: string;
	creationTimeInMs: number;
	status: string;
	beforeScheduleId: string;
	afterScheduleId: string;
	vibeRequest: {
		id: string;
		creationTimeInMs: number;
		activeAction: string | null;
		isClosed: boolean;
		actions: any[];
	};
};

export const getStoredSessionId = (): string | null => {
	return localStorage.getItem(STORAGE_KEY);
};

export const setStoredSessionId = (sessionId: string): void => {
	localStorage.setItem(STORAGE_KEY, sessionId);
};

export const clearStoredSessionId = (): void => {
	localStorage.removeItem(STORAGE_KEY);
};

export const fetchChatMessages = async (sessionId: string): Promise<ChatPromptResponse> => {
	try {
		const response = await fetch(`${API_URL}?SessionId=${encodeURIComponent(sessionId)}`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching chat messages:', error);
		throw error;
	}
};

// export const fetchChatActions = async (actionId: string): Promise<ChatVibeResponse> => {
// 	try {
// 		const response = await fetch(`${API_ACTIONS_URL}?ActionId=${encodeURIComponent(actionId)}`);
// 		if (!response.ok) {
// 			throw new Error(`HTTP error! status: ${response.status}`);
// 		}
// 		const data = await response.json();
// 		return data;
// 	} catch (error) {
// 		console.error('Error fetching chat actions:', error);
// 		throw error;
// 	}
// };

export const fetchChatActions = async (
	actionIds: string[] | string
): Promise<Action[]> => {
	try {
		const queryParam = Array.isArray(actionIds)
			? actionIds.length > 1
				? actionIds.map((id) => `ActionIds=${encodeURIComponent(id)}`).join('&')
				: `ActionId=${encodeURIComponent(actionIds[0])}`
			: `ActionId=${encodeURIComponent(actionIds)}`; // 👈 not actionIds[0], it's already a string

		const response = await fetch(`${API_ACTIONS_URL}?${queryParam}`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// 🔁 Normalize everything to Action[]
		if (Array.isArray(data.Content?.vibeAction)) {
			// Case: multiple actions
			return data.Content.vibeAction;
		} else if (data.Content?.vibeAction) {
			// Case: single action
			return [data.Content.vibeAction];
		}

		// Fallback
		return [];
	} catch (error) {
		console.error('Error fetching chat actions:', error);
		throw error;
	}
};


export const sendChatMessage = async (
	message: string,
	entityId: string,
	sessionId: string = '',
	requestId?: string,
	actionId?: string
): Promise<ChatVibeResponse> => {
	try {
		const requestBody: SendMessageRequest = {
			ChatMessage: message,
			SessionId: sessionId,
			EntityId: entityId,
			RequestId: requestId || '',
			ActionId: actionId || '',
			MobileApp: true,
		};

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// If we get a valid session ID in the response, store it
		const sessionIdFromResponse =
			data.Content?.vibeResponse?.actions?.[0]?.prompts?.[0]?.sessionId;
		if (sessionIdFromResponse) {
			setStoredSessionId(sessionIdFromResponse);
		}

		return data;
	} catch (error) {
		console.error('Error sending chat message:', error);
		throw error;
	}
};
