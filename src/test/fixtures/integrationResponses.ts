/**
 * Contract fixtures for the integrations endpoints consumed by the
 * Connections settings surface (see docs/web-connections-integration-plan.md).
 *
 * The wire shape mirrors the mobile implementation
 * (tiler_app/lib/data/calendarIntegration.dart, location.dart and
 * lib/services/api/integrationsApi.dart). If the backend renames or drops any
 * of these keys, that is an API_CONTRACT defect — update these fixtures and
 * the mapping code together.
 *
 * All fixtures are plain data on purpose so they can assert the exact
 * casing and nullability the server actually returns.
 */

/**
 * The fixtures are typed directly against the shared wire types in
 * `@/core/integrations/types`, so any drift between what the server returns
 * (as pinned by these fixtures) and what the mapping code consumes is a
 * compile-time error.
 */

import type {
	CalendarDefaultLocationEnvelope,
	CalendarItemToggleEnvelope,
	CalendarItemsEnvelope,
	IntegrationMutationEnvelope,
	IntegrationsResponseEnvelope,
} from '@/core/integrations/types';

/**
 * Success: two fully-populated Google integrations.
 * The second record exercises the "multiple returned integration records"
 * case from the plan and omits optional calendar item fields.
 */
export const integrationSuccessEnvelope: IntegrationsResponseEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: [
		{
			id: 'integration-id',
			provider: 'Google',
			email: 'person@example.com',
			userId: 'provider-user-id',
			location: {
				id: 'location-id',
				description: 'Office',
				address: '123 Main St',
				thirdPartyId: 'google-place-id',
				longitude: -73.9857,
				latitude: 40.7484,
				isVerified: true,
			},
			calendarItems: [
				{
					id: 'calendar-id',
					name: 'Work',
					isEnabled: true,
					isSelected: true,
					description: 'Work calendar',
					authenticationId: 'auth-id',
					userIdentifier: 'user-identifier',
				},
				{
					id: 'calendar-id-2',
					name: 'Personal',
					isEnabled: true,
					isSelected: false,
				},
			],
		},
		{
			id: 'integration-id-2',
			provider: 'Google',
			email: 'other@example.com',
			userId: 'provider-user-id-2',
			location: null,
			calendarItems: [],
		},
	],
};

/** Success with no connected integrations: `Content` is an empty array. */
export const integrationEmptyEnvelope: IntegrationsResponseEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: [],
};

/**
 * Malformed but plausible: the server omits optional fields entirely and
 * sends explicit nulls. The web model must map all of these without
 * throwing (see Phase 2 of the plan).
 */
export const integrationMalformedEnvelope: IntegrationsResponseEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: [
		{
			id: 'integration-id-minimal',
			provider: 'Google',
			location: null,
			calendarItems: null,
		},
		{
			id: 'integration-id-partial-items',
			provider: 'Google',
			calendarItems: [
				{
					id: 'calendar-id-partial',
					isEnabled: false,
					isSelected: false,
				},
			],
		},
	],
};

/** Structured server error: non-zero Code and no usable Content. */
export const integrationErrorEnvelope: IntegrationsResponseEnvelope = {
	Error: { Code: '500', Message: 'An error occurred while retrieving integrations' },
};

/**
 * Success: the calendar items for one integration, as returned by
 * `GET /api/integrations/calendarItem`. The server always answers the list
 * shape `Content.calendarItems` (even for a single item) — see
 * `IntegrationsController.GetCalendarItem`.
 */
export const calendarItemsEnvelope: CalendarItemsEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: {
		calendarItems: [
			{
				id: 'calendar-id',
				name: 'Work',
				isEnabled: true,
				isSelected: true,
				description: 'Work calendar',
				authenticationId: 'auth-id',
				userIdentifier: 'user-identifier',
			},
			{
				id: 'calendar-id-2',
				name: 'Personal',
				isEnabled: true,
				isSelected: false,
			},
		],
	},
};

/** Success with no calendar items: `Content.calendarItems` is an empty list. */
export const calendarItemsEmptyEnvelope: CalendarItemsEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: { calendarItems: [] },
};

/** Structured server error for the calendar-items read. */
export const calendarItemsErrorEnvelope: CalendarItemsEnvelope = {
	Error: { Code: '500', Message: 'An error occurred while retrieving calendar items' },
};

/**
 * Success: the single updated item echoed in `Content` (no list wrapper) by
 * `POST /api/integrations/google/calendarItem`.
 */
export const calendarItemToggleEnvelope: CalendarItemToggleEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: {
		id: 'calendar-id',
		name: 'Work',
		isEnabled: true,
		isSelected: false,
		description: 'Work calendar',
	},
};

/**
 * Success for `POST /api/integrations/location`: `Content` is the stored
 * location as the server now holds it (the server overwrites `description`
 * with an internal `cal-default-location-*` marker — see
 * `IntegrationsController.AddLocationToIntegration`).
 */
export const calendarDefaultLocationSuccessEnvelope: CalendarDefaultLocationEnvelope = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: {
		id: 'stored-location-id',
		description: 'cal-default-location-9c1d2e3f-0000-0000-0000-000000000000',
		address: '456 Oak Ave',
		thirdPartyId: 'google-place-id-2',
		longitude: -73.9845,
		latitude: 40.7495,
		isVerified: true,
	},
};

/** Structured server error for the default-location write. */
export const calendarDefaultLocationErrorEnvelope: CalendarDefaultLocationEnvelope = {
	Error: { Code: '500', Message: 'An error occurred while updating the integration location' },
};

/**
 * Success for `DELETE /api/integrations`: the server echoes its success
 * message as a string in `Content`; success is judged on `Error.Code` alone.
 */
export const integrationDeleteSuccessEnvelope: IntegrationMutationEnvelope = {
	Error: { Code: '0', Message: 'Success' },
	Content: 'Success',
};

/**
 * Provider-side delete failure: the server answers HTTP 200 with this
 * non-zero code (`CustomErrors.Errors.Failed_To_Delete_Integration`), so the
 * client must NOT treat the 200 as success.
 */
export const integrationDeleteProviderFailureEnvelope: IntegrationMutationEnvelope = {
	Error: { Code: '10000009', Message: 'Failed to delete third party integrations' },
	Content: 'Failed to delete third party integrations',
};

/** Generic server error for the delete. */
export const integrationDeleteErrorEnvelope: IntegrationMutationEnvelope = {
	Error: { Code: '500', Message: 'An error occurred while deleting the integration' },
};
