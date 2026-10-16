export type TileShareLockedTimeLineRequest = {
	StartTimeUnixMsUtc: number;
	DurationInMs: number;
};
export type TileShareAcceptanceMode = 'Flexible' | 'LockSession';
export type TileSharePreviewBlock = {
	id: string;
	name: string | null;
	start: number;
	end: number;
	isProposed: boolean;
	viable: boolean;
	sessionKey?: string;
	isFixed?: boolean;
	duration?: number;
	allowedStart?: number;
	allowedEnd?: number;
	color?: string | null;
	placement?: 'Scheduled' | 'OutsideWindow' | 'Unscheduled' | 'Conflict' | null;
};
export type TileSharePreview = {
	assignmentId: string;
	previewToken?: string;
	expiresAt?: number;
	tiletteId: string;
	clusterId: string;
	name: string | null;
	description: string | null;
	inviterName?: string | null;
	duration: number | null;
	deadline: number | null;
	generatedAt: number;
	rangeStart: number;
	rangeEnd: number;
	timeZone: string;
	unsupportedReason: string | null;
	isViable: boolean;
	capabilities: { alternatives: boolean; fixedSessions: boolean; reviewedAcceptance: boolean };
	current: TileSharePreviewBlock[];
	proposed: TileSharePreviewBlock[];
	sessions: TileSharePreviewBlock[];
	conflicts?: TileSharePreviewBlock[];
};
export type TileShareAssignmentResponse = {
	id: string;
	tiletteId: string;
	clusterId: string;
	invitationStatus: string;
	completionPercent: number | null;
	calendarId?: string | null;
	lockedSessions?: TileShareLockedTimeLineRequest[];
};

export type TileShareScheduleOperation = {
	operationId: string;
	assignmentId: string;
	state: 'queued' | 'applied' | 'completed' | 'rejected' | 'needsreview';
	calendarId: string | null;
	reason: string | null;
};
export type TileSharePreviewOptions = {
	options: { optionId: string; start: number; end: number; preview?: TileSharePreview }[];
	nextOffset: number | null;
};
