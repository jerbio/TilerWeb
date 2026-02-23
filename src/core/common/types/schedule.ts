import { ApiResponse } from './api';

// ── Shared extracted types ──────────────────────────────────────

export type Color = {
	colorSelection: number;
	r: number;
	g: number;
	b: number;
	o: number;
};

export type StyleProperties = {
	id: string;
	color: Color;
};

export type Location = {
	id: string;
	description: string;
	address: string;
	longitude: number;
	latitude: number;
	isVerified: boolean;
	isDefault: boolean;
	isNull: boolean;
	thirdPartyId: string;
	userId: string;
	source: string;
	nickname: string;
};

export type EventBlob = {
	type: number;
	note: string;
	id: string;
};

export type Timeline = {
	start: number;
	end: number;
	duration: number;
	occupiedSlots: null;
};

export type Repetition = {
	id: string;
	isEnabled: boolean;
	frequency: string;
	weekDays: string;
	isForever: boolean;
	tileTimeline: Timeline;
	repetitionTimeline: Timeline;
};

export type TravelPath = {
	start: number;
	end: number;
	startLocation?: Location | null;
	endLocation?: Location | null;
	isRigid: boolean;
	travelLegs: [];
	travelMedium: string;
	isFailed: boolean;
	isDisabled: boolean;
	isDefault: boolean;
	duration: number;
	calTimeLine: Timeline;
	projectionType: ['TravelSubCalendarEvent'];
};

export type TravelDetail = {
	before: TravelPath | null;
	after: TravelPath | null;
};

// ── ScheduleSubCalendarEvent ───────────────────────────────────

export type ScheduleSubCalendarEvent = {
	id: string;
	start: number;
	end: number;
	isSleep: boolean;
	sleepDay: number;
	isWake: boolean;
	wakeDay: number;
	isPaused: boolean;
	isRigid: boolean;
	isComplete: boolean;
	isEnabled: boolean;
	isTardy: boolean;
	isViable: boolean;
	isScheduleAble: boolean;
	isProcrastinateEvent: boolean;
	travelTimeBefore: number;
	travelTimeAfter: number;
	travelTimeBeforeDetail: string;
	travelTimeAfterDetail: string;
	locationId: null;
	locationValidationId: string;
	isCompleteAfterElapsedEnabled: boolean;
	thirdPartyType: string;
	thirdPartyUserId: null;
	thirdPartyId: string;
	priority: number;
	tileShareDesignatedId: null;
	projectionType: ['SimpleObject'];
	name: string;
	address: string;
	addressDescription: string;
	location: Location;
	description: string;
	searchdDescription: string;
	rangeStart: number;
	rangeEnd: number;
	colorOpacity: number;
	colorRed: number;
	colorGreen: number;
	colorBlue: number;
	isRecurring: boolean;
	emojis: null;
	isReadOnly: boolean;
	restrictionProfile: null;
	isWhatIf: boolean;
	jsonProjectionType: string;
	blob: EventBlob;
	styleProperties: StyleProperties;
	split: number;
	calendarEventStart: number;
	calendarEventEnd: number;
	SubCalCalEventStart: number;
	SubCalCalEventEnd: number;
	travelDetail: TravelDetail;
};

export type ScheduleLookupTravelDetail = TravelPath | null;

export type ScheduleLookupResponse = ApiResponse<{
	subCalendarEvents: Array<ScheduleSubCalendarEvent>;
}>;

export type ScheduleLookupOptions = {
	startRange: number;
	endRange: number;
};

// ── Single-event lookup response types ─────────────────────────

/** Response shape for `GET /api/SubCalendarEvent?EventID=...` */
export type SubCalendarEventLookupResponse = ApiResponse<ScheduleSubCalendarEvent>;

// ── CalendarEvent (parent event with child subEvents) ──────────

/** Response shape for `GET /api/CalendarEvent?EventID=...` */
export type CalendarEvent = {
	id: string | null;
	start: number | null;
	end: number | null;
	name: string | null;
	address: string | null;
	addressDescription: string | null;
	searchdDescription: string | null;
	splitCount: number | null;
	completeCount: number | null;
	deletionCount: number | null;
	thirdpartyType: string | null;
	thirdPartyId: string | null;
	thirdPartyUserId: string | null;
	colorOpacity: number | null;
	colorRed: number | null;
	colorGreen: number | null;
	colorBlue: number | null;
	isComplete: boolean | null;
	isEnabled: boolean | null;
	isRecurring: boolean | null;
	locationId: string | null;
	isReadOnly: boolean | null;
	isProcrastinateEvent: boolean | null;
	isRigid: boolean | null;
	uiConfig: StyleProperties | null;
	repetition: Repetition | null;
	eachTileDuration: number | null;
	restrictionProfile: null;
	emojis: string | null;
	isWhatIf: boolean | null;
	entityName: string | null;
	blob: EventBlob | null;
	subEvents: Array<ScheduleSubCalendarEvent> | null;
};

export type CalendarEventResponse = ApiResponse<CalendarEvent>;
