import { Actions } from '@/core/constants/enums';
import { UserInfo } from '@/global_state';
import { ApiResponse } from './api';

export type ActionType = `${Actions}`;

export interface PromptWithActions {
  id: string;
  origin: 'user' | 'model' | 'tiler';
  content: string;
  actionId: string;
  requestId: string;
  sessionId: string;
  actions: VibeAction[];
  actionIds?: string[];
}

export interface VibeAction {
  id: string;
  descriptions: string;
  type: ActionType;
  creationTimeInMs: number;
  status: 'parsed' | 'clarification' | 'none' | 'pending' | 'executed' | 'failed' | 'exited';
  prompts: PromptWithActions[];
  beforeScheduleId: string;
  afterScheduleId: string;
  vibeRequest: {
    id: string;
    creationTimeInMs: number;
    activeAction: string | null;
    isClosed: boolean;
    beforeScheduleId: string | null;
    afterScheduleId: string | null;
    actions: VibeAction[];
  };
}

export interface VibeResponse {
  prompts: Record<
    string,
    PromptWithActions & {
      actions: Array<VibeAction>;
    }
  >;
  tilerUser?: UserInfo;
}

export interface VibeRequest {
  id: string;
  creationTimeInMs: number;
  activeAction: string | null; // More specific type
  isClosed: boolean;
  beforeScheduleId: string | null;
  afterScheduleId: string | null;
  actions: VibeAction[]; // Using VibeAction type
}

export type ChatSendMessageResponse = ApiResponse<{
  vibeResponse: VibeResponse;
}>;

export type ChatActionsResponse = ApiResponse<{
	vibeAction?: VibeAction;
	vibeActions?: VibeAction[];
}>;

export type ChatExecuteActionResponse = ApiResponse<{
  vibeRequest: VibeRequest;
}>;

export type ChatVibeRequestResponse = ApiResponse<{
  vibeRequest: VibeRequest;
}>;

export type ChatMessagesResponse = ApiResponse<{
  chats: PromptWithActions[];
}>;

export type ChatMessageBody = {
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
  AnonymousUserId?: string;
  UserLongitude?: string;
  UserLatitude?: string;
  UserLocationVerified?: string;
}

export type {
  PromptWithActions as Message,
};
