import {Actions} from '../../../../util/enums';
import { UserInfo } from '../../../../global_state';

type ActionType = `${Actions}`;
interface ServerResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: Record<string, unknown>;
	ServerStatus: Record<string, unknown> | null;
}

// PromptWithActions interface
interface PromptWithActions {
	id: string;
	origin: 'user' | 'model' | 'tiler';
	content: string;
	actionId: string;
	requestId: string;
	sessionId: string;
	actions: VibeAction[];
	actionIds?: string[];
}

// VibeAction interface
interface VibeAction {
	id: string;
	descriptions: string;
	type: ActionType; // ActionType is a string literal type based on Actions enum
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

// VibeResponse interface
interface VibeResponse {
	prompts: Record<
		string,
		PromptWithActions & {
			actions: Array<VibeAction>;
		}
	>;
	tilerUser?: UserInfo;
}

// Chat-specific response interface
interface ChatVibeResponse extends ServerResponse {
	Content: {
		vibeResponse: VibeResponse;
	};
	ServerStatus: null;
}

interface vibeRequest {
	id: string;
	creationTimeInMs: number;
	activeAction: string | null; // More specific type
	isClosed: boolean;
	beforeScheduleId: string | null;
	afterScheduleId: string | null;
	actions: VibeAction[]; // Using VibeAction type
}

interface ExecuteActionResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: {
		vibeRequest: vibeRequest;
	};
	ServerStatus: any | null;
}

// ChatPromptResponse interface
interface ChatPromptResponse extends ServerResponse {
	Content: {
		chats: PromptWithActions[];
	};
	ServerStatus: null;
}

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
	AnonymousUserId?: string;
}

export type {
	ServerResponse,
	ChatVibeResponse,
	VibeResponse,
	VibeAction,
	PromptWithActions,
	ChatPromptResponse,
	PromptWithActions as Message,
	ExecuteActionResponse,
	ActionType,
	SendMessageRequest,
};
