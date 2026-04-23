import { ApiResponse } from './api';

// ── Shared extracted types ──────────────────────────────────────
export enum LocationSource {
	Google = 'google',
}

export type EventColor = {
	colorSelection: number;
	r: number;
	g: number;
	b: number;
	o: number;
};

export type StyleProperties = {
	id: string;
	color: EventColor;
};

export type EventLocation = {
	id: string;
	description: string;
	address: string;
	longitude: number;
	latitude: number;
	isVerified: boolean;
	isDefault: boolean;
	isNull: boolean;
	thirdPartyId: string | null;
	userId: string | null;
	source: string;
	nickname: string;
};

export type LocationResponse = ApiResponse<EventLocation>;
export type LocationSearchResponse = ApiResponse<EventLocation[]>;

export type NotesBlob = {
	type: number;
	note: string;
	id: string;
};

export type EventTimeline = {
	start: number;
	end: number;
	duration: number;
	occupiedSlots: null;
};

export type RepetitionConfig = {
	id: string;
	isEnabled: boolean;
	frequency: string;
	weekDays: string;
	isForever: boolean;
	tileTimeline: EventTimeline;
	repetitionTimeline: EventTimeline;
};

export type TravelPath = {
	start: number;
	end: number;
	startLocation?: EventLocation | null;
	endLocation?: EventLocation | null;
	isRigid: boolean;
	travelLegs: [];
	travelMedium: string;
	isFailed: boolean;
	isDisabled: boolean;
	isDefault: boolean;
	duration: number;
	calTimeLine: EventTimeline;
	projectionType: ['TravelSubCalendarEvent'];
};

export type TravelDetail = {
	before: TravelPath | null;
	after: TravelPath | null;
};

// ── SubCalendarEvent ─────────────────────────────────────────
export enum ThirdPartyType {
	Tiler = 'tiler',
	Google = 'google',
	Unknown = 'unknown',
}

export type SubCalendarEvent = {
	id: string;
	start: number;
	end: number;
	// Original start/end times preserved before visual splitting
	originalStart?: number;
	originalEnd?: number;
	isSleep?: boolean;
	sleepDay?: number;
	isWake?: boolean;
	wakeDay?: number;
	isPaused?: boolean;
	isRigid?: boolean;
	isComplete?: boolean;
	isEnabled?: boolean;
	isTardy?: boolean;
	isViable?: boolean;
	isScheduleAble?: boolean;
	isProcrastinateEvent?: boolean;
	travelTimeBefore?: number;
	travelTimeAfter?: number;
	travelTimeBeforeDetail?: string;
	travelTimeAfterDetail?: string;
	locationId?: null;
	locationValidationId?: string;
	isCompleteAfterElapsedEnabled?: boolean;
	thirdPartyType?: ThirdPartyType | string;
	thirdPartyUserId?: string | null;
	thirdPartyId?: string;
	priority?: number;
	tileShareDesignatedId?: null;
	projectionType?: ['SimpleObject'];
	name?: string;
	address?: string;
	addressDescription?: string;
	location?: EventLocation;
	description?: string;
	searchdDescription?: string;
	rangeStart?: number;
	rangeEnd?: number;
	colorOpacity?: number;
	colorRed?: number;
	colorGreen?: number;
	colorBlue?: number;
	isRecurring?: boolean;
	emojis?: string | null;
	isReadOnly?: boolean;
	restrictionProfile?: null;
	isWhatIf?: boolean;
	jsonProjectionType?: string;
	blob?: NotesBlob;
	styleProperties?: StyleProperties;
	split?: number;
	calendarEventStart?: number;
	calendarEventEnd?: number;
	SubCalCalEventStart?: number;
	SubCalCalEventEnd?: number;
	travelDetail?: TravelDetail;
};

export type ScheduleLookupTravelDetail = TravelPath | null;

export type ScheduleLookupResponse = ApiResponse<{
	subCalendarEvents: Array<SubCalendarEvent>;
}>;

export type ScheduleLookupOptions = {
	startRange: number;
	endRange: number;
};

export enum ScheduleRepeatType {
	Daily = '0',
	Weekly = '1',
	Monthly = '2',
	Yearly = '3',
}

export enum ScheduleRepeatFrequency {
	Daily = 'Daily',
	Weekly = 'Weekly',
	Monthly = 'Monthly',
	Yearly = 'Yearly',
}

export enum ScheduleRepeatWeekday {
	Sunday = '0',
	Monday = '1',
	Tuesday = '2',
	Wednesday = '3',
	Thursday = '4',
	Friday = '5',
	Saturday = '6',
}

export enum ScheduleRepeatStartType {
	Default = '0',
	On = '1',
}

export enum ScheduleRepeatEndType {
	Never = '0',
	On = '1',
}

export type ScheduleRepeatWeeklyData = string;

export enum ScheduleBooleanString {
	True = 'true',
	False = 'false',
}

/**
 * Time of day string. Backend is permissive, but UI should emit HH:mm
 * (24-hour clock), e.g. "09:30", "18:00".
 */
export type ScheduleTimeOfDay = string;

export type ScheduleCreateEventParams = {
	BColor?: string;
	RColor?: string;
	GColor?: string;
	Opacity?: string;
	ColorSelection?: string;
	Count?: string;
	DurationDays?: string;
	DurationHours?: string;
	DurationMinute?: string;
	MinimumDurationInMinutes?: string;
	EndDay?: string;
	EndHour?: string;
	EndMinute?: string;
	EndMonth?: string;
	EndYear?: string;
	LookupString?: string;
	LocationIsVerified?: string;
	LocationAddress?: string;
	LocationId?: string;
	LocationSource?: string;
	LocationTag?: string;
	Name?: string;

	// -- REPETITION --
	// Legacy/loosely used by backend. Keep nullable string.
	RepeatData?: string | null;
	// Required for recurrence end when repeating.
	RepeatEndDay?: string;
	RepeatEndMonth?: string;
	RepeatEndYear?: string;
	// Present on backend model, but currently ignored by NewCalEvent recurrence construction.
	RepeatStartDay?: string;
	RepeatStartMonth?: string;
	RepeatStartYear?: string;
	// Frontend/client convention: 0=daily, 1=weekly, 2=monthly, 3=yearly.
	RepeatType?: ScheduleRepeatType;
	// Weekly-only selection. Backend expects a comma-separated string of DayOfWeek ints.
	// Example: "1,3,5" for Monday/Wednesday/Friday.
	RepeatWeeklyData?: ScheduleRepeatWeeklyData;
	// Actual recurrence unit used by backend.
	RepeatFrequency?: ScheduleRepeatFrequency;

	// -- RESTRICTION --
	isRestricted?: ScheduleBooleanString;
	RestrictionStart?: ScheduleTimeOfDay;
	RestrictionEnd?: ScheduleTimeOfDay;
	isWorkWeek?: ScheduleBooleanString;
	isEveryDay?: ScheduleBooleanString;
	RestrictionProfileId?: string;
	RestrictiveWeek?: CalendarEventRestrictiveWeek;

	Rigid?: string;
	StartDay?: string;
	StartHour?: string;
	StartMinute?: string;
	StartMonth?: string;
	StartYear?: string;
	PredictionDurationInMs?: string;
	PredictionLocationDescription?: string;
	PredictionEnabled?: string;
	nextTileSuggestionId?: string;
	TimeZoneOrigin?: string;
	AutoReviseDeadline?: string;
	IsCompleteOnElapsed?: string;
	Priority?: string;
	UserLongitude?: string;
	UserLatitude?: string;
	UserLocationVerified?: string;
	MobileApp?: boolean;
	SocketId?: boolean;
	TimeZoneOffset?: number;
	Version?: string;
	TimeZone?: string;
	IsTimeZoneAdjusted?: string;
	getTimeSpan?: string;
};

export type ScheduleCreateEventResponse = ApiResponse<
	SubCalendarEvent & {
		calendarEvent: CalendarEvent;
	}
>;
// ── Single-event lookup response types ─────────────────────────

/** Response shape for `GET /api/SubCalendarEvent?EventID=...` */
export type SubCalendarEventLookupResponse = ApiResponse<SubCalendarEvent>;

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
	thirdpartyType: ThirdPartyType | string | null;
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
	repetition: RepetitionConfig | null;
	eachTileDuration: number | null;
	restrictionProfile: null;
	emojis: string | null;
	isWhatIf: boolean | null;
	entityName: string | null;
	blob: NotesBlob | null;
	subEvents: Array<SubCalendarEvent> | null;
	isAutoReviseDeadline?: boolean;
	isAutoDeadline?: boolean;
};

export type CalendarEventResponse = ApiResponse<CalendarEvent>;

export type SubEventsOfCalendarResponse = ApiResponse<SubCalendarEvent[]>;

/** Params for `GET /api/CalendarEvent/Name` — search tiles by name */
export type CalendarEventSearchParams = {
	data: string;
	userName: string;
	userId: string;
	batchSize?: number;
	index?: number;
};

/** Response shape for `GET /api/CalendarEvent/Name` */
export type CalendarEventSearchResponse = ApiResponse<CalendarEvent[]>;

/** Params for `POST /api/CalendarEvent/Update` */

export type CalendarEventWeekDayOption = {
	Start?: string;
	Index?: string;
	End?: string;
};

export type CalendarEventRestrictiveWeek = {
	restrictionProfileId?: string;
	WeekDayOption?: CalendarEventWeekDayOption[];
	isEnabled?: string;
};

export type CalendarEventRepetitionConfig = {
	IsEnabled?: boolean;
	IsForever?: boolean;
	RepetitionStart?: number;
	RepetitionEnd?: number;
	TileStart?: number;
	TileEnd?: number;
	Frequency?: string;
	DayOfWeekRepetitions?: string[];
};

export type CalendarEventColorConfig = {
	IsEnabled?: boolean;
	Red?: string;
	Green?: string;
	Blue?: string;
	Opacity?: string;
};

export type CalendarEventUpdateParams = ScheduleUpdateParams & {
	EventID: string;
	EventName?: string;
	Start?: number;
	End?: number;
	Duration?: number;
	Split?: number;
	LocationId?: string;
	IsLocationCleared?: string;
	CalAddress?: string;
	CalAddressDescription?: string;
	IsCalAddressVerified?: string;
	Notes?: string;
	Priority?: string;
	IsLocked?: boolean;
	IsAutoDeadline?: string;
	IsAutoReviseDeadline?: string;
	isRestricted?: string;
	RestrictionStart?: string;
	RestrictionEnd?: string;
	isWorkWeek?: string;
	isEveryDay?: string;
	RestrictionProfileId?: string;
	RestrictiveWeek?: CalendarEventRestrictiveWeek;
	RepetitionConfig?: CalendarEventRepetitionConfig;
	ColorConfig?: CalendarEventColorConfig;
	AllEvents?: number;
	MobileApp?: boolean;
	SocketId?: boolean;
	TimeZoneOffset?: number;
	IsTimeZoneAdjusted?: string;
};

/** Common params shared across schedule update endpoints (Shuffle, Reoptimize, etc.) */
export type ScheduleUpdateParams = {
	UserLongitude?: string;
	UserLatitude?: string;
	UserLocationVerified?: string;
	Version?: string;
	TimeZone?: string;
};

/** Params for `POST /api/Schedule/Shuffle` */
export type ScheduleShuffleParams = ScheduleUpdateParams & {
	MobileApp?: boolean;
	SocketId?: boolean;
	TimeZoneOffset?: number;
	IsTimeZoneAdjusted?: string;
};

/** Params for `POST /api/Schedule/Revise` */
export type ScheduleReviseParams = ScheduleUpdateParams & {
	MobileApp?: boolean;
	SocketId?: boolean;
	TimeZoneOffset?: number;
	IsTimeZoneAdjusted?: string;
};

/** Params for `POST /api/Schedule/Event/Procrastinate` */
export type ScheduleProcrastinateEventParams = ScheduleUpdateParams & {
	EventID: string;
	DurationDays?: number;
	DurationHours?: number;
	DurationMins?: number;
	DurationInMs?: number;
};

/** Params for `DELETE /api/Schedule/Event` */
export type ScheduleDeleteEventParams = ScheduleUpdateParams & {
	EventID: string;
	ThirdPartyType: string;
	ThirdPartyEventID: string;
	ThirdPartyUserID: string;
};

/** Params for `POST /api/Schedule/ProcrastinateAll` */
export type ScheduleProcrastinateAllParams = ScheduleUpdateParams & {
	DurationDays?: number;
	DurationHours?: number;
	DurationMins?: number;
	DurationInMs?: number;
};

// ── Restriction Profile types ──────────────────────────────────

export type DaySchedule = {
	dayIndex: number;
	startTime: string;
	endTime: string;
};

export type RestrictionTimeLine = {
	id: string | null;
	start: number | null;
	duration: number | null;
	end: number | null;
	timeZone: string | null;
};

export type DaySelection = {
	id: string | null;
	weekday: number | null;
	restrictionTimeLine: RestrictionTimeLine | null;
	timeZone: string | null;
};

export type RestrictionProfile = {
	id: string | null;
	isEnabled: boolean | null;
	timeZone: string | null;
	daySelection: (DaySelection | null)[] | null;
};

// ── Schedule Profile types ─────────────────────────────────────

/** Response shape for `GET /api/User/ScheduleProfile?version=v2` */
export type ScheduleProfileResponse = ApiResponse<{
	travelMedium: string | null;
	pinPreference: string | null;
	endTimeOfDay: string | null;
	sleepDuration: number | null;
	endOfDay: string | null;
	timeZone: string | null;
	timeZoneDifference: number | null;
	personalHoursRestrictionProfile: RestrictionProfile | null;
	workHoursRestrictionProfile: RestrictionProfile | null;
}>;

export type WeekDayOption = {
	Start: string;
	Index: string;
	End: string;
};

export type RestrictiveWeekParam = {
	restrictionProfileId?: string;
	WeekDayOption?: WeekDayOption[];
	isEnabled?: string;
};

export type RestrictionProfileParam = {
	Id?: string;
	IsEnabled?: boolean;
	RestrictionProfileType?: string;
	RestrictiveWeek?: RestrictiveWeekParam;
};

/** Params for `POST /api/User/ScheduleProfile` */
export type UpdateScheduleProfileParams = ScheduleUpdateParams & {
	SleepDurationInMs?: number;
	EndOfDay?: string;
	TimeZone?: string;
	TravelMedium?: string;
	PinPreference?: string;
	PersonalRestrictionProfile?: RestrictionProfileParam;
	WorkRestrictionProfile?: RestrictionProfileParam;
	MobileApp?: boolean;
	SocketId?: boolean;
	TimeZoneOffset?: number;
	IsTimeZoneAdjusted?: string;
};
