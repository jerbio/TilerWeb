import { ApiResponse } from './api';

export type Persona = {
	id: string;
	name: string;
	description: string | null;
	personaType: number | null;
	occupation: string | null;
	isActive: boolean | null;
	createdAt: string | null;
	updatedAt: string | null | null;
	tilePreferences: Array<{
		Id: string;
		TileName: string;
		Description: string | null;
		Category: string | null;
		Priority: number | null;
		EstimatedDurationMinutes: number | null;
		RecurrencePattern: string | null;
		Tags: Array<string> | null;
		Location: string | null;
		IsActive: boolean | null;
	}>;
	preferredSchedulePattern: string | null;
	timeZone: string | null;
	preferredStartHour: number | null;
	preferredEndHour: number | null;
	preferredWorkDurationMinutes: number | null;
	preferredBreakDurationMinutes: number | null;
	preferredLocations: Array<string>;
	preferredTags: Array<string>;
};

export type PersonaResponse = ApiResponse<{
	personas: {
		personas: Array<Persona>;
		totalCount: number | null;
		pageIndex: number | null;
		pageSize: number | null;
	};
}>;

export type PersonaScheduleResponse = ApiResponse<{
	anonymousUserWithPersona: {
		anonymousUser: {
			id: string | null;
			username: string | null;
			timeZoneDifference: number | null;
			timeZone: string | null;
			email: null | null;
			endfOfDay: string | null;
			phoneNumber: null | null;
			fullName: string | null;
			firstName: string | null;
			lastName: string | null;
			countryCode: string | null;
		};
		scheduleId: string;
	};
}>;
