import { ApiResponse } from './api';

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
	location: {
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
