import { ApiResponse } from './api';

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
  blob: {
    type: number;
    note: string;
    id: string;
  };
  styleProperties: {
    id: string;
    color: {
      colorSelection: number;
      r: number;
      g: number;
      b: number;
      o: number;
    };
  };
  split: number;
  calendarEventStart: number;
  calendarEventEnd: number;
  SubCalCalEventStart: number;
  SubCalCalEventEnd: number;
  travelDetail: {
    before: {
      start: number;
      end: number;
      startLocation?: ScheduleSubCalendarEventLocation;
      endLocation?: ScheduleSubCalendarEventLocation;
      isRigid: boolean;
      travelLegs: [];
      travelMedium: string;
      isFailed: boolean;
      isDisabled: boolean;
      isDefault: boolean;
      duration: number;
      calTimeLine: {
        start: number;
        end: number;
        duration: number;
        occupiedSlots: null;
      };
      projectionType: ['TravelSubCalendarEvent'];
    } | null;
    after: {
      start: number;
      end: number;
      startLocation: null;
      endLocation: null;
      isRigid: boolean;
      travelLegs: [];
      travelMedium: string;
      isFailed: boolean;
      isDisabled: boolean;
      isDefault: boolean;
      duration: number;
      calTimeLine: {
        start: number;
        end: number;
        duration: number;
        occupiedSlots: null;
      };
      projectionType: ['TravelSubCalendarEvent'];
    } | null;
  };
};

export type ScheduleLookupTravelDetail = ScheduleSubCalendarEvent['travelDetail'][
  | 'before'
  | 'after'];

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

export type ScheduleCreateEventResponse = ApiResponse<ScheduleSubCalendarEvent>;
