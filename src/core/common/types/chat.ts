import { Actions, Status } from '@/core/constants/enums';
import { UserInfo } from '@/global_state';
import { ApiResponse, PaginationParams } from './api';
import { SubCalendarEvent } from './schedule';

export enum ChatSessionExecutionMode {
	ConfirmFirst = 'ConfirmFirst',
	AutoAct = 'AutoAct',
}

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

export interface DirectorySearchMatch {
	Id: string;
	Name: string;
	Revision: string;
	EmailHint?: string | null;
	PhoneHint?: string | null;
	TeamPath?: { Id: string; Name: string }[] | null;
}

export interface DelegationProjectChoice {
	Id: string;
	Name: string;
	Revision: string;
}
export interface DelegationDraft {
	Revision: string;
	State: 'Draft' | 'Cancelled';
	Project: DelegationProjectChoice;
	RecipientKind: 'Contact' | 'Team';
	Recipient: DirectorySearchMatch;
	Title: string;
	DurationInMs: number;
	DurationWasDefaulted: boolean;
	DeadlineInMs: number;
	TimeZone: string;
}
export interface DirectorySearchPage {
	Kind: 'Contact' | 'Team';
	ResultId: string;
	Matches: DirectorySearchMatch[];
	Selection?: DirectorySearchMatch | null;
	Draft?: DelegationDraft | null;
	NextAfterId?: string | null;
	HasMore: boolean;
}

export type TileShareOperation =
	| 'CreateProject'
	| 'CreateTilette'
	| 'RenameProject'
	| 'RenameTilette'
	| 'UpdateTilette'
	| 'UpdateProject'
	| 'UpdatePlan'
	| 'UpdateRecipients'
	| 'UpdateAccess'
	| 'SetTiletteNotes'
	| 'DeleteTilette';

export interface TileShareReview {
	Items?: {
		ProjectId: string;
		TiletteId?: string | null;
		ProjectName?: string;
		PreviousName: string;
		Name: string;
		UpdatesName?: boolean;
		UpdatesNotes?: boolean;
		PreviousNotes?: string | null;
		Notes?: string | null;
	}[];
	Operation?: TileShareOperation;
	PreviousName?: string | null;
	AssignmentCount?: number;
	LinkedCalendarCount?: number;
	UpdatesName?: boolean;
	UpdatesNotes?: boolean;
	ScheduleSummary?: string;
	EffectsSummary?: string;
	PreviousNotes?: string | null;
	Notes?: string | null;
	Name: string;
	CreatesProject?: boolean;
	ProjectName?: string | null;
	StartTime?: number | null;
	Deadline?: number | null;
	Tilettes: {
		Name: string;
		DurationMinutes: number;
		StartTime?: number | null;
		Deadline?: number | null;
		Recipients: { name: string; email?: string; phone?: string }[];
	}[];
}
export interface TileShareExecutionResult {
	PlanTargets?: {
		ProjectId: string;
		TiletteId?: string | null;
		Name: string;
		Url: string;
		State: string;
	}[];
	Operation?: TileShareOperation | null;
	State: 'Applied' | 'NotAttempted' | 'Rejected' | 'Unknown' | 'Pending' | 'Failed';
	JobId?: string | null;
	ActionId: string;
	ReviewToken?: string | null;
	Review?: TileShareReview | null;
	ErrorCode?: string | null;
	Url?: string | null;
}
export interface VibeAction {
	tileShareResult?: TileShareExecutionResult;
	directorySearch?: DirectorySearchPage;
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
	isStale?: boolean;
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
	ChatSessionExecutionMode?: ChatSessionExecutionMode;
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

/** Keyed so a suggestion keeps its identity across regenerations: { "sug_abc": "Plan my day" }. */
export type AutoSuggestions = Record<string, string>;

export type AutoSuggestionsResponse = ApiResponse<{
	autoSuggestions: {
		suggestions: AutoSuggestions;
		isStale: boolean;
	};
}>;

export type { PromptWithActions as Message };
