/**
 * Types for the calendar-connections (integrations) surface.
 *
 * Two distinct groups live here on purpose (see
 * docs/web-connections-integration-plan.md, Phase 2):
 *
 * 1. Wire types — the exact casing and nullability the server returns for
 *    `GET /api/integrations`. These mirror the mobile client
 *    (tiler_app/lib/data/calendarIntegration.dart and location.dart).
 *    `src/test/fixtures/integrationResponses.ts` is typed against them so a
 *    server rename is a compile-time error.
 *
 * 2. Domain models — the normalized, always-total shape the UI consumes.
 *    Every nullable wire field maps to an explicit `null` (never `undefined`,
 *    never a throw), and provider credential identifiers are deliberately
 *    NOT retained in the mapped model.
 *
 * Provider capability metadata (`CONNECTION_PROVIDERS`) is a third, separate
 * concern: it describes which provider rows the UI renders, independent of
 * the integration records the server returns.
 */

import type { ApiCodeResponse } from '@/core/common/types/api';

// ---------------------------------------------------------------------------
// Wire types (server shape — do not rename; see the contract fixtures)
// ---------------------------------------------------------------------------

/** Location block as returned inside an integration record. */
export interface IntegrationLocationRecord {
	id?: string | null;
	description?: string | null;
	address?: string | null;
	thirdPartyId?: string | null;
	longitude?: number | null;
	latitude?: number | null;
	isVerified?: boolean | null;
}

/** Calendar item block as returned inside an integration record. */
export interface IntegrationCalendarItemRecord {
	id?: string | null;
	name?: string | null;
	description?: string | null;
	isEnabled?: boolean | null;
	isSelected?: boolean | null;
	/**
	 * Provider-side identifiers retained by the mobile client. The web client
	 * never copies these into its domain model (see mapping.ts) — provider
	 * credential identifiers must not be retained.
	 */
	authenticationId?: string | null;
	userIdentifier?: string | null;
}

/** A single integration record as returned inside `Content`. */
export interface IntegrationRecord {
	id?: string | null;
	provider?: string | null;
	email?: string | null;
	userId?: string | null;
	location?: IntegrationLocationRecord | null;
	calendarItems?: IntegrationCalendarItemRecord[] | null;
}

/** Envelope returned by `GET /api/integrations`. `Content` is absent/null on error. */
export interface IntegrationsResponseEnvelope {
	Error?: ApiCodeResponse | null;
	Content?: IntegrationRecord[] | null;
}

// ---------------------------------------------------------------------------
// Domain models (normalized shape the UI consumes)
// ---------------------------------------------------------------------------

/** A connection location with all fields resolved to concrete values. */
export interface IntegrationLocation {
	id: string | null;
	description: string | null;
	address: string | null;
	thirdPartyId: string | null;
	/** Missing/invalid coordinates map to 0. */
	longitude: number;
	/** Missing/invalid coordinates map to 0. */
	latitude: number;
	/** Missing/invalid verification flags map to false. */
	isVerified: boolean;
}

/**
 * A connected calendar. `authenticationId` and `userIdentifier` from the wire
 * record are intentionally absent — they are provider credential
 * identifiers and must not be retained in the web model.
 */
export interface IntegrationCalendarItem {
	id: string | null;
	name: string | null;
	description: string | null;
	isEnabled: boolean;
	isSelected: boolean;
}

/** A connected integration account. */
export interface Integration {
	/** Null when the server omits it; detail navigation requires a non-null id. */
	id: string | null;
	provider: string | null;
	/** Display account (e.g. the linked Google account email). */
	email: string | null;
	/** Provider-side user id. */
	userId: string | null;
	location: IntegrationLocation | null;
	/** Always an array; missing/null/non-array wire values map to `[]`. */
	calendarItems: IntegrationCalendarItem[];
}

// ---------------------------------------------------------------------------
// Provider capability metadata (separate from returned records)
// ---------------------------------------------------------------------------

export type ConnectionProviderStatus = 'available' | 'unavailable';

/** Capability of a single provider row in the Connections list. */
export interface ConnectionProvider {
	/** Stable provider key used by the OAuth start URL and mutation requests (`google`). */
	id: string;
	/** Whether the provider can be connected in this release. */
	status: ConnectionProviderStatus;
}

/**
 * Which provider rows the Connections list renders. This is static product
 * metadata — it is NOT derived from, and does NOT mutate with, the
 * integrations returned by the server.
 */
export const CONNECTION_PROVIDERS: readonly ConnectionProvider[] = [
	{ id: 'google', status: 'available' },
	{ id: 'microsoft', status: 'unavailable' },
	{ id: 'apple', status: 'unavailable' },
	{ id: 'slack', status: 'unavailable' },
	{ id: 'googleTasks', status: 'unavailable' },
];
