import { Actions, Status } from '@/core/constants/enums';
import { UserInfo } from '@/global_state';
import { ApiResponse, PaginationParams } from './api';
import { SubCalendarEvent } from './schedule';

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
	previews?: SimulationDto[];
	preview?: SimulationDto | null;
	state?: string;
	supersededByRequestId?: string | null;
}

// ---------------------------------------------------------------------------
// Simulated Schedule Experience (frontend uses "simulation"; backend stays
// "preview"). See SIMULATED_SCHEDULE_EXPERIENCE_EXECUTION_PLAN.md Phase 1.1.
// ---------------------------------------------------------------------------

export enum SimulationState {
	Queued = 'Queued',
	Processing = 'Processing',
	Ready = 'Ready',
	Invalidated = 'Invalidated',
	Failed = 'Failed',
}

export interface SimulationActionDto {
	actionId: string;
	entityId?: string | null;
	entityType?: string | null;
	vibePreviewId: string;
	action?: VibeAction;
}

export interface SimulationDto {
	id: string;
	vibeRequestId: string;
	tilerUserId: string;
	creationTimeInMs: number;
	state: SimulationState;
	previewJobId?: string;
	failureReason?: string;
	generatedAt?: number;
	invalidatedAt?: number;
	invalidationReason?: string;
	queuedAt?: number;
	processingStartAt?: number;
	processingEndAt?: number;
	scheduleDumpId?: string;
	previewActions?: SimulationActionDto[];
}

/**
 * Loose envelope returned by GET api/Vibe/Preview?previewId=... — the
 * backend embeds the simulated schedule under `preview`. Kept loose for
 * Phase 1; Phase 5 will narrow the calendar-event shape.
 */
export interface SimulationScheduleResult {
	preview: Record<string, unknown> & {
		/** Wire shape mirrors `/api/Schedule` — see VibeController.buildScheduleResponse. */
		subCalendarEvents?: SubCalendarEvent[];
		calendarEvents?: unknown[];
		previewActions?: unknown[];
		previewId?: string;
		vibeRequestId?: string;
	};
}

export interface PreviewReadyPayload {
	type: 'requestPreviewReady';
	vibeRequestId: string;
	previewId: string;
	scheduleDumpId?: string;
	timestamp?: number;
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
	// Plan §6.5.2 — backend embeds VibeRequests (with `preview`/`previews`
	// hydrated) referenced by the prompts in this page so the frontend can
	// prime simulation state without a per-request fan-out fetch.
	vibeRequests?: VibeRequest[];
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
