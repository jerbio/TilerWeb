/**
 * Pure, total mapping from the `GET /api/integrations` wire envelope to the
 * normalized domain models in `./types`.
 *
 * Invariants (Phase 2 of docs/web-connections-integration-plan.md):
 * - The mapping never throws, no matter what JSON (or non-JSON) arrives:
 *   a missing location maps to `null`, missing/null/non-array calendarItems
 *   map to `[]`, and non-object records are dropped.
 * - Provider credential identifiers (`authenticationId`, `userIdentifier`)
 *   are never copied into the mapped model.
 * - The function is pure: no fetch, no logging, no module state. Error-code
 *   handling stays in the service layer, which unwraps `Error.Code`.
 */

import type { Integration, IntegrationCalendarItem, IntegrationLocation } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Strings map to their value; anything else (null, missing, non-string) maps to `null`. */
function asString(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Finite numbers map to their value; anything else maps to 0. */
function asNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Booleans map only on an explicit `true`; anything else maps to false. */
function asBoolean(value: unknown): boolean {
	return value === true;
}

export function mapIntegrationLocation(raw: unknown): IntegrationLocation | null {
	if (!isRecord(raw)) return null;
	return {
		id: asString(raw.id),
		description: asString(raw.description),
		address: asString(raw.address),
		thirdPartyId: asString(raw.thirdPartyId),
		longitude: asNumber(raw.longitude),
		latitude: asNumber(raw.latitude),
		isVerified: asBoolean(raw.isVerified),
	};
}

export function mapIntegrationCalendarItem(raw: unknown): IntegrationCalendarItem | null {
	if (!isRecord(raw)) return null;
	return {
		id: asString(raw.id),
		name: asString(raw.name),
		description: asString(raw.description),
		isEnabled: asBoolean(raw.isEnabled),
		isSelected: asBoolean(raw.isSelected),
		// `authenticationId` / `userIdentifier` are intentionally NOT copied:
		// provider credential identifiers must not survive into the web model.
	};
}

export function mapIntegrationRecord(raw: unknown): Integration | null {
	if (!isRecord(raw)) return null;
	return {
		id: asString(raw.id),
		provider: asString(raw.provider),
		email: asString(raw.email),
		userId: asString(raw.userId),
		location: mapIntegrationLocation(raw.location),
		calendarItems: Array.isArray(raw.calendarItems)
			? raw.calendarItems
					.map(mapIntegrationCalendarItem)
					.filter((item): item is IntegrationCalendarItem => item !== null)
			: [],
	};
}

/**
 * Map the raw envelope to a list of integrations. Any envelope shape other
 * than an object with an array `Content` maps to `[]` without throwing.
 */
export function mapIntegrationsEnvelope(envelope: unknown): Integration[] {
	if (!isRecord(envelope)) return [];
	if (!Array.isArray(envelope.Content)) return [];
	return envelope.Content.map(mapIntegrationRecord).filter(
		(integration): integration is Integration => integration !== null
	);
}
