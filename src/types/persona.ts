/*
 * Example
 {
	id: 'custom-persona';
	name: 'Custom';
	description: 'Create your own personalized persona';
	personaType: 0;
	occupation: 'Custom';
	isActive: true;
	createdAt: '2025-06-21T15:15:22.0074879+00:00';
	updatedAt: null;
	tilePreferences: [
		{
			Id: 'a4fdb62a-4537-4164-91bc-515fb4225555';
			TileName: 'Custom Task 1';
			Description: 'Your first custom task';
			Category: 'Custom';
			Priority: 1;
			EstimatedDurationMinutes: 60;
			RecurrencePattern: 'daily';
			Tags: ['custom', 'personal'];
			Location: 'Anywhere';
			IsActive: true;
		},
	];
	preferredSchedulePattern: 'flexible';
	timeZone: 'UTC';
	preferredStartHour: 9;
	preferredEndHour: 17;
	preferredWorkDurationMinutes: 60;
	preferredBreakDurationMinutes: 15;
	preferredLocations: ['Work', 'Coffee Shop', 'Library'];
	preferredTags: ['personal', 'flexible', 'custom'];
};
*/

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
