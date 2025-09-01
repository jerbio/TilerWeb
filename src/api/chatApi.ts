import {
  ChatActionsResponse,
  ChatSendMessageResponse,
  ChatExecuteActionResponse,
  ChatVibeRequestResponse,
  ChatMessageBody,
  ChatMessagesResponse,
} from '@/core/common/types/chat';
import { AppApi } from './appApi';

export class ChatApi extends AppApi {
  // Messages
  public getMessages(sessionId: string) {
    return this.apiRequest<ChatMessagesResponse>(
      `api/Vibe/Chat?SessionId=${encodeURIComponent(sessionId)}`
    );
  }

  public sendMessage(messageBody: ChatMessageBody) {
    return this.apiRequest<ChatSendMessageResponse>('api/Vibe/Chat', {
      method: 'POST',
      body: JSON.stringify(messageBody),
    });
  }

  // Actions
  public getActions(actionIds: string[] | string) {
    const ids = Array.isArray(actionIds) ? actionIds : [actionIds];
    const key = ids.length > 1 ? 'ActionIds' : 'ActionId';
    const queryParam = ids.map((id) => `${key}=${encodeURIComponent(id)}`).join('&');

    return this.apiRequest<ChatActionsResponse>('api/Vibe/Action?' + queryParam);
  }

  public executeActions(
    requestId: string, 
    anonymousUserId?: string,
    userLongitude?: string, 
    userLatitude?: string, 
    userLocationVerified?: string
  ) {
    return this.apiRequest<ChatExecuteActionResponse>('api/Vibe/Request/Execute', {
      method: 'POST',
      body: JSON.stringify({ 
        requestId,
        anonymousUserId,
        userLongitude,
        userLatitude,
        userLocationVerified
      }),
    });
  }

  public getVibeRequest(requestId: string) {
    return this.apiRequest<ChatVibeRequestResponse>(
      `api/Vibe/VibeRequest?RequestId=${encodeURIComponent(requestId)}`
    );
  }
}
