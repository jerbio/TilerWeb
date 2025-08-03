import { ChatVibeResponse, ChatPromptResponse, ExecuteActionResponse } from './chat';
import { VibeAction, SendMessageRequest, PromptWithActions } from './chat';
import ADDBLOCK from '../../../../assets/image_assets/add_block.svg';
import ADDTASK from '../../../../assets/image_assets/add_new_tile.svg';

const API_URL = 'https://tiler-stage.conveyor.cloud/api/Vibe/Chat';
const API_ACTIONS_URL = 'https://tiler-stage.conveyor.cloud/api/Vibe/Action';
const API_EXECUTE_ACTIONS_URL = 'https://tiler-stage.conveyor.cloud/api/Vibe/Request/Execute';
const STORAGE_KEY = 'chat_session_id';

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

export const fetchChatActions = async (actionIds: string[] | string): Promise<VibeAction[]> => {
	try {
		const queryParam = Array.isArray(actionIds)
			? actionIds.length > 1
				? actionIds.map((id) => `ActionIds=${encodeURIComponent(id)}`).join('&')
				: `ActionId=${encodeURIComponent(actionIds[0])}`
			: `ActionId=${encodeURIComponent(actionIds)}`;

		const response = await fetch(`${API_ACTIONS_URL}?${queryParam}`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// Normalize everything to Action[]
		if (Array.isArray(data.Content?.vibeActions)) {
			// Case: multiple actions
			return data.Content.vibeActions;
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
	anonymousUserId?: string,
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
			AnonymousUserId: anonymousUserId || '',
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
		const promptEntries = Object.values(data.Content?.vibeResponse?.prompts || {});
		const sessionIdFromResponse =
			promptEntries.length > 0 ? (promptEntries[0] as PromptWithActions).sessionId : undefined;
		if (sessionIdFromResponse) {
			setStoredSessionId(sessionIdFromResponse);
		}

		return data;
	} catch (error) {
		console.error('Error sending chat message:', error);
		throw error;
	}
};

export const sendChatAcceptChanges = async (
	requestId: string | null = null
): Promise<ExecuteActionResponse> => {
	try {
		if (!requestId) {
			throw new Error('Request ID is required to execute actions');
		}
		const requestBody = { requestId };

		const response = await fetch(API_EXECUTE_ACTIONS_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ExecuteActionResponse = await response.json();
		return data;
	} catch (error) {
		console.error('Error sending chat accept changes:', error);
		throw error;
	}
};

export const getActionIcon = (action: VibeAction): string => {
	switch (action.type) {
		// Regular actions
		case 'add_new_appointment':
			return ADDBLOCK;
		case 'add_new_task':
			return ADDTASK;
		case 'add_new_project':
			return '📋';
		case 'decide_if_task_or_project':
			return '🤔';
		case 'update_existing_task':
			return '✏️';
		case 'remove_existing_task':
			return '🗑️';
		case 'mark_task_as_done':
			return '✓';
		case 'procrastinate_all_tasks':
			return '⏱️';
		case 'exit_prompting':
			return '🚪';

		// What-if scenarios
		case 'whatif_addanewappointment':
			return '📅❓';
		case 'whatif_addednewtask':
			return '✅❓';
		case 'whatif_editupdatetask':
			return '✏️❓';
		case 'whatif_procrastinatetask':
			return '⏱️❓';
		case 'whatif_removedtask':
			return '🗑️❓';
		case 'whatif_markedtaskasdone':
			return '✓❓';
		case 'whatif_procrastinateall':
			return '⏱️❓';

		// Other cases
		case 'conversational_and_not_supported':
			return '💬';
		case 'none':
			return '⚪';
		default:
			return '🔹';
	}
};
