import { ApiResponse } from './api';

export type Persona = {
	id: string;
	name: string;
	description: string;
	personaType: number;
	occupation: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	tilePreferences: Array<{
		Id: string;
		TileName: string;
		Description: string;
		Category: string;
		Priority: number;
		EstimatedDurationMinutes: number;
		RecurrencePattern: string;
		Tags: Array<string>;
		Location: string;
		IsActive: boolean;
	}>;
	preferredSchedulePattern: string;
	timeZone: string;
	preferredStartHour: number;
	preferredEndHour: number;
	preferredWorkDurationMinutes: number;
	preferredBreakDurationMinutes: number;
	preferredLocations: Array<string>;
	preferredTags: Array<string>;
};

export type PersonaResponse = ApiResponse<{
	personas: {
		personas: Array<Persona>;
		totalCount: number;
		pageIndex: number;
		pageSize: number;
	};
}>;

export type PersonaScheduleResponse = ApiResponse<{
	anonymousUserWithPersona: {
		anonymousUser: {
			id: string;
			username: string;
			timeZoneDifference: number;
			timeZone: string;
			email: null;
			endfOfDay: string;
			phoneNumber: null;
			fullName: string;
			firstName: string;
			lastName: string;
			countryCode: string;
		};
		scheduleId: string;
	};
}>;
