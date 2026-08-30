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

/** Standard error block returned in every integrations envelope. */
export interface IntegrationsErrorFixture {
	Code: string;
	Message: string;
}

/** Envelope returned by every integrations endpoint. */
export interface IntegrationsResponseEnvelope {
	Error: IntegrationsErrorFixture;
	Content?: unknown;
}

/** Location block as returned inside an integration record. */
export interface IntegrationLocationFixture {
	id: string;
	description: string;
	address: string;
	thirdPartyId: string;
	longitude: number;
	latitude: number;
	isVerified: boolean;
}

/** Calendar item block as returned inside an integration record. */
export interface IntegrationCalendarItemFixture {
	id: string;
	name: string;
	isEnabled: boolean;
	isSelected: boolean;
	description?: string;
	authenticationId?: string;
	userIdentifier?: string;
}

/** A single integration record as returned inside `Content`. */
export interface IntegrationRecordFixture {
	id: string;
	provider: string;
	email?: string;
	userId?: string;
	location?: IntegrationLocationFixture | null;
	calendarItems?: IntegrationCalendarItemFixture[] | null;
}

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
		} as IntegrationRecordFixture,
		{
			id: 'integration-id-2',
			provider: 'Google',
			email: 'other@example.com',
			userId: 'provider-user-id-2',
			location: null,
			calendarItems: [],
		} as IntegrationRecordFixture,
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
		} as IntegrationRecordFixture,
		{
			id: 'integration-id-partial-items',
			provider: 'Google',
			calendarItems: [
				{
					id: 'calendar-id-partial',
					isEnabled: false,
					isSelected: false,
				} as IntegrationCalendarItemFixture,
			],
		} as IntegrationRecordFixture,
	],
};

/** Structured server error: non-zero Code and no usable Content. */
export const integrationErrorEnvelope: IntegrationsResponseEnvelope = {
	Error: { Code: '500', Message: 'An error occurred while retrieving integrations' },
};
