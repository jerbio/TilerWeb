import {
  ChatMessageBody,
  PromptWithActions,
} from '@/core/common/types/chat';
import { ChatApi } from '@/api/chatApi';
import { normalizeError } from '@/core/error';
import { setStoredSessionId } from '@/core/storage/chatSession';

class ChatService {
  private chatApi: ChatApi;
  constructor(chatApi: ChatApi) {
    this.chatApi = chatApi;
  }

  async getMessages(sessionId: string) {
    try {
      const messages = await this.chatApi.getMessages(sessionId);
      return messages;
    } catch (error) {
			console.error('Error fetching chat messages', error);
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
    actionId: string = ''
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
}

export default ChatService;
