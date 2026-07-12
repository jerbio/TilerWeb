import {
	ChatMessageBody,
	ChatMessagesParams,
	PromptWithActions,
	VibeSessionsResponse,
	VibeSessionParams,
} from '@/core/common/types/chat';
import { ChatApi } from '@/api/chatApi';
import { normalizeError } from '@/core/error';
import { setStoredSessionId } from '@/core/storage/chatSession';
import { parseServerError, ChatLimitError } from '@/core/common/types/errors';

class ChatService {
	private chatApi: ChatApi;
	constructor(chatApi: ChatApi) {
		this.chatApi = chatApi;
	}

	async getMessages(sessionId: string, pagination?: ChatMessagesParams) {
		try {
			const messages = await this.chatApi.getMessages(sessionId, pagination);
			return messages;
		} catch (error) {
			console.error('Error fetching chat messages', error);
			throw normalizeError(error);
		}
	}

	async getVibeSessions(
		userId?: string,
		anonymousUserId?: string,
		pagination?: VibeSessionParams
	): Promise<VibeSessionsResponse> {
		try {
			const sessions = await this.chatApi.getVibeSessions(
				userId,
				anonymousUserId,
				pagination
			);
			return sessions;
		} catch (error) {
			console.error('Error fetching vibe sessions', error);
			throw normalizeError(error);
		}
	}

	async sendMessage(
		message: string,
		entityId: string,
		sessionId: string = '',
		anonymousUserId: string = '',
		userLongitude: string = '',
		userLatitude: string = '',
		userLocationVerified: string = '',
		requestId: string = '',
		actionId: string = '',
		deepThinking: boolean = false
	) {
		const requestBody: ChatMessageBody = {
			EntityId: entityId,
			ChatMessage: message,
			SessionId: sessionId,
			RequestId: requestId,
			ActionId: actionId,
			AnonymousUserId: anonymousUserId,
			MobileApp: true,
			UserLatitude: userLatitude,
			UserLongitude: userLongitude,
			UserLocationVerified: userLocationVerified,
			TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone.toString(),
			DeepThinking: deepThinking,
		};
		try {
			const response = await this.chatApi.sendMessage(requestBody);
			// If we get a valid session ID in the response, store it
			const promptEntries = Object.values(response.Content?.vibeResponse?.prompts || {});
			const sessionIdFromResponse =
				promptEntries.length > 0
					? (promptEntries[0] as PromptWithActions).sessionId
					: undefined;
			if (sessionIdFromResponse) {
				setStoredSessionId(sessionIdFromResponse);
			}
			return response;
		} catch (error) {
			console.error('Error sending chat message', error);

			// Check if it's a server error we can parse
			const serverErrorInfo = parseServerError(error);
			if (serverErrorInfo) {
				throw new ChatLimitError(serverErrorInfo);
			}

			throw normalizeError(error);
		}
	}

	async getActions(actionIds: string[] | string) {
		try {
			const data = await this.chatApi.getActions(actionIds);
			// Normalize everything to Array<VibeAction>
			if (data.Content.vibeActions && Array.isArray(data.Content.vibeActions)) {
				return data.Content.vibeActions;
			} else if (data.Content.vibeAction) {
				return [data.Content.vibeAction];
			} else {
				return [];
			}
		} catch (error) {
			console.error('Error fetching chat actions', error);
			throw normalizeError(error);
		}
	}

	async sendChatAcceptChanges(
		requestId: string | null = null,
		anonymousUserId?: string,
		userLongitude?: string,
		userLatitude?: string,
		userLocationVerified?: string
	) {
		try {
			if (!requestId) {
				throw new Error('Request ID is required to execute actions');
			}
			const response = await this.chatApi.executeActions(
				requestId,
				anonymousUserId,
				userLongitude,
				userLatitude,
				userLocationVerified
			);
			return response;
		} catch (error) {
			console.error('Error accepting chat changes', error);
			throw normalizeError(error);
		}
	}

	async getVibeRequest(requestId: string) {
		try {
			const response = await this.chatApi.getVibeRequest(requestId);
			return response;
		} catch (error) {
			console.error('Error fetching vibe request', error);
			throw normalizeError(error);
		}
	}

	async transcribeAudio(audioFile: Blob): Promise<string> {
		try {
			const response = await this.chatApi.transcribeAudio(audioFile);
			return response.Content.transcription;
		} catch (error) {
			console.error('Error transcribing audio', error);
			throw normalizeError(error);
		}
	}

	async getVariantPreviews(vibeRequestId: string) {
		try {
			const response = await this.chatApi.getVariantPreviews(vibeRequestId);
			return response.Content.previews;
		} catch (error) {
			console.error('Error fetching variant previews', error);
			throw normalizeError(error);
		}
	}

	async selectVariant(vibeRequestId: string, selectedStepId: string) {
		try {
			const response = await this.chatApi.selectVariant(vibeRequestId, selectedStepId);
			return response;
		} catch (error) {
			console.error('Error selecting variant', error);
			throw normalizeError(error);
		}
	}

	async supplyClarification(
		vibeRequestId: string,
		stepId: string,
		parameters: Record<string, string>
	) {
		try {
			const response = await this.chatApi.supplyClarification(
				vibeRequestId,
				stepId,
				parameters
			);
			return response;
		} catch (error) {
			console.error('Error supplying clarification', error);
			throw normalizeError(error);
		}
	}

	// M10 — resume a SuspendedGate via POST /ResolveGate.
	async resolveGate(vibeRequestId: string, gateId: string, selectionRaw: string) {
		try {
			const response = await this.chatApi.resolveGate(vibeRequestId, gateId, selectionRaw);
			return response;
		} catch (error) {
			console.error('Error resolving gate', error);
			throw normalizeError(error);
		}
	}

	// M10 — resume an IntegrationAuth gate via POST /CompleteIntegrationAuth after
	// the user finishes the OAuth flow.
	async completeIntegrationAuth(
		vibeRequestId: string,
		gateId: string,
		integrationKey: string,
		oauthCallbackPayload: string
	) {
		try {
			const response = await this.chatApi.completeIntegrationAuth(
				vibeRequestId,
				gateId,
				integrationKey,
				oauthCallbackPayload
			);
			return response;
		} catch (error) {
			console.error('Error completing integration auth', error);
			throw normalizeError(error);
		}
	}

	async getPlanHistory(actionId: string) {
		try {
			const response = await this.chatApi.getPlanHistory(actionId);
			return response.Content.planHistory;
		} catch (error) {
			console.error('Error fetching plan history', error);
			throw normalizeError(error);
		}
	}
}

export default ChatService;
