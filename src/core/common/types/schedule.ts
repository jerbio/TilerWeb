import { ApiResponse } from './api';

// ── Shared extracted types ──────────────────────────────────────
export type ScheduleSubCalendarEventColor = {
  colorSelection: number;
  r: number;
  g: number;
  b: number;
  o: number;
};

export type ScheduleSubCalendarEventStyleProperties = {
  id: string;
  color: ScheduleSubCalendarEventColor;
};

export type ScheduleSubCalendarEventLocation = {
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

export type ScheduleSubCalendarEventBlob = {
  type: number;
  note: string;
  id: string;
};

export type ScheduleSubCalendarEventTimeline = {
  start: number;
  end: number;
  duration: number;
  occupiedSlots: null;
};

export type ScheduleSubCalendarEventRepetition = {
  id: string;
  isEnabled: boolean;
  frequency: string;
  weekDays: string;
  isForever: boolean;
  tileTimeline: ScheduleSubCalendarEventTimeline;
  repetitionTimeline: ScheduleSubCalendarEventTimeline;
};

export type ScheduleSubCalendarEventTravelPath = {
  start: number;
  end: number;
  startLocation?: ScheduleSubCalendarEventLocation | null;
  endLocation?: ScheduleSubCalendarEventLocation | null;
  isRigid: boolean;
  travelLegs: [];
  travelMedium: string;
  isFailed: boolean;
  isDisabled: boolean;
  isDefault: boolean;
  duration: number;
  calTimeLine: ScheduleSubCalendarEventTimeline;
  projectionType: ['TravelSubCalendarEvent'];
};

export type ScheduleSubCalendarEventTravelDetail = {
  before: ScheduleSubCalendarEventTravelPath | null;
  after: ScheduleSubCalendarEventTravelPath | null;
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
  location: ScheduleSubCalendarEventLocation;
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
  blob: ScheduleSubCalendarEventBlob;
  styleProperties: ScheduleSubCalendarEventStyleProperties;
  split: number;
  calendarEventStart: number;
  calendarEventEnd: number;
  SubCalCalEventStart: number;
  SubCalCalEventEnd: number;
  travelDetail: ScheduleSubCalendarEventTravelDetail;
};

export type ScheduleLookupTravelDetail = ScheduleSubCalendarEventTravelPath | null;

export type ScheduleLookupResponse = ApiResponse<{
  subCalendarEvents: Array<ScheduleSubCalendarEvent>;
}>;

export type ScheduleLookupOptions = {
  startRange: number;
  endRange: number;
};

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
  RepeatData?: string;
  RepeatEndDay?: string;
  RepeatEndMonth?: string;
  RepeatEndYear?: string;
  RepeatStartDay?: string;
  RepeatStartMonth?: string;
  RepeatStartYear?: string;
  RepeatType?: string;
  RepeatWeeklyData?: string;
  Rigid?: string;
  StartDay?: string;
  StartHour?: string;
  StartMinute?: string;
  StartMonth?: string;
  StartYear?: string;
  RepeatFrequency?: string;
  PredictionDurationInMs?: string;
  PredictionLocationDescription?: string;
  PredictionEnabled?: string;
  isRestricted?: string;
  RestrictionStart?: string;
  RestrictionEnd?: string;
  isWorkWeek?: string;
  isEveryDay?: string;
  nextTileSuggestionId?: string;
  RestrictionProfileId?: string;
  RestrictiveWeek?: {
    restrictionProfileId?: string;
    WeekDayOption?: {
      Start?: string;
      Index?: string;
      End?: string;
    }[];
    isEnabled?: string;
  };
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
  ScheduleSubCalendarEvent & {
    calendarEvent: CalendarEvent;
  }
>;
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
  uiConfig: ScheduleSubCalendarEventStyleProperties | null;
  repetition: ScheduleSubCalendarEventRepetition | null;
  eachTileDuration: number | null;
  restrictionProfile: null;
  emojis: string | null;
  isWhatIf: boolean | null;
  entityName: string | null;
  blob: ScheduleSubCalendarEventBlob | null;
  subEvents: Array<ScheduleSubCalendarEvent> | null;
  isAutoReviseDeadline?: boolean;
  isAutoDeadline?: boolean;
};

export type CalendarEventResponse = ApiResponse<CalendarEvent>;

export type SubEventsOfCalendarResponse = ApiResponse<ScheduleSubCalendarEvent[]>;

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
