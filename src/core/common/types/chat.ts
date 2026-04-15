import { Actions, Status } from '@/core/constants/enums';
import { UserInfo } from '@/global_state';
import { ApiResponse, PaginationParams } from './api';

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
	status: Status;
	prompts?: PromptWithActions[];
	entityId?: string;
	entityType?: string;
	beforeScheduleId: string | null;
	afterScheduleId: string | null;
	vibeRequest: VibeRequest | null;
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
	activeAction: string | null;
	isClosed: boolean;
	beforeScheduleId: string | null;
	afterScheduleId: string | null;
	actions: VibeAction[];
	previews?: unknown[];
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

export interface ChatMessagesParams extends PaginationParams {
  anonymousUserId?: string;
}

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
};

export interface VibeSession {
	id: string;
	creationTimeInMs: number;
	title: string | null;
	requests: (string | null)[];
}

export interface VibeSessionParams extends PaginationParams {
	sessionId?: string;
	anonymousUserId?: string;
}

export type VibeSessionsResponse = ApiResponse<{
	vibeSessions: VibeSession[];
}>;

export type { PromptWithActions as Message };

export interface VariantPreview {
	id: string;
	vibeRequestId: string;
	tilerUserId: string;
	creationTimeInMs: number;
	previewActions?: {
		action?: VibeAction;
	}[];
}

export type VariantPreviewsResponse = ApiResponse<{
	previews: VariantPreview[];
}>;
