export interface TileShareActivity {
	eventId: string;
	schemaVersion: number;
	eventType: string;
	clusterId: string;
	tiletteId?: string;
	assignmentId?: string;
	actorId?: string;
	actorName?: string;
	tiletteTitle?: string;
	clusterTitle?: string;
	ownerId?: string;
	targetUserId?: string;
	occurredAt: number;
	targetAvailable: boolean;
	metadata?: {
		title?: string;
		changedFields?: string[];
		initialTiletteCount?: number;
		channel?: string;
		calendarEventId?: string;
	};
}

export interface TileShareActivityPage {
	items: TileShareActivity[];
	nextCursor: string | null;
	historyAvailableFrom: number;
}

export interface TileShareActivityScope {
	ClusterId?: string;
	TiletteId?: string;
}

export interface TileShareActivityQuery extends TileShareActivityScope {
	DismissedOnly?: boolean;
	EventType?: string;
	PageSize?: number;
	Cursor?: string;
}
