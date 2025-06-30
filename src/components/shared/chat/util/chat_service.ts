import { ChatVibeResponse, ChatPromptResponse } from './chat';

const API_URL = 'https://localhost-44388-x-if7.conveyor.cloud/api/Vibe/Chat';
const STORAGE_KEY = 'chat_session_id';

interface SendMessageRequest {
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

export const sendChatMessage = async (
	message: string,
	sessionId: string = '',
	requestId?: string,
	actionId?: string
): Promise<ChatVibeResponse> => {
	try {
		const requestBody: SendMessageRequest = {
			ChatMessage: message,
			SessionId: sessionId,
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
