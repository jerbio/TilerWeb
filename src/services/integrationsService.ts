import { IntegrationsApi } from '@/api/integrationsApi';
import { TilerResponseError } from '@/core/common/types/errors';
import { normalizeError } from '@/core/error';
import {
	mapCalendarItemsEnvelope,
	mapIntegrationCalendarItem,
	mapIntegrationLocation,
	mapIntegrationsEnvelope,
} from '@/core/integrations/mapping';
import type {
	Integration,
	IntegrationCalendarItem,
	IntegrationLocation,
} from '@/core/integrations/types';

/**
 * Thin wrapper around {@link IntegrationsApi} that unwraps the standard
 * `{ Error, Content }` envelope and normalizes errors, following the
 * convention used by the other services (`notesService`, `userService`, …).
 *
 * Error contract (shared by every method below):
 * - Non-zero `Error.Code` → `TilerResponseError` (code + server message).
 *   This is how the DELETE and calendar-item endpoints report provider-side
 *   failures: they answer HTTP 200 with a non-zero code
 *   (`10000009` = provider refused the disconnect).
 * - Structured server error thrown by the API layer (raw
 *   `{ Error: { Code, Message } }` object) → plain `Error` with the
 *   normalized message via `normalizeError`.
 * - `ServerError` (network failure, HTTP error without a JSON body — e.g.
 *   the 404 the server answers for a missing integration row) → the
 *   original `ServerError` instance.
 */
export class IntegrationsService {
	private integrationsApi: IntegrationsApi;

	constructor(integrationsApi: IntegrationsApi) {
		this.integrationsApi = integrationsApi;
	}

	/**
	 * Reject with a generic, non-sensitive error when the envelope has no
	 * usable `Error` block instead of crashing while reading a missing
	 * `Error.Code`.
	 */
	private assertSuccessEnvelope(
		response: { Error?: { Code?: unknown; Message?: unknown } | null } | null | undefined
	): void {
		if (!response || !response.Error || typeof response.Error.Code !== 'string') {
			throw new TilerResponseError('integrations.invalid_response');
		}
		if (response.Error.Code !== '0') {
			throw TilerResponseError.fromApiCodeResponse({
				Code: response.Error.Code,
				Message:
					typeof response.Error.Message === 'string' ? response.Error.Message : undefined,
			});
		}
	}

	/** Fetch the connected integrations, mapped to the normalized domain model. */
	async getIntegrations(integrationId?: string): Promise<Integration[]> {
		try {
			const response = await this.integrationsApi.getIntegrations(integrationId);
			this.assertSuccessEnvelope(response);
			return mapIntegrationsEnvelope(response);
		} catch (error) {
			console.error('Error fetching integrations', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Fetch the calendar items for one integration — the authoritative
	 * source for the detail page's toggle state.
	 */
	async getCalendarItems(integrationId: string): Promise<IntegrationCalendarItem[]> {
		try {
			const response = await this.integrationsApi.getCalendarItems(integrationId);
			this.assertSuccessEnvelope(response);
			return mapCalendarItemsEnvelope(response);
		} catch (error) {
			console.error('Error fetching calendar items', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Toggle a calendar item's visibility on the server (a full round trip —
	 * the server is the source of truth). Resolves with the updated item
	 * mapped from the response `Content` (or `null` when the server omits
	 * it). The caller owns optimistic UI and failure restoration.
	 */
	async toggleCalendarItem(args: {
		integrationId: string;
		calendarItemId: string;
		isSelected: boolean;
	}): Promise<IntegrationCalendarItem | null> {
		try {
			const response = await this.integrationsApi.toggleCalendarItem({
				IntegrationId: args.integrationId,
				CalendarItemId: args.calendarItemId,
				IsSelected: args.isSelected,
			});
			this.assertSuccessEnvelope(response);
			return response.Content ? mapIntegrationCalendarItem(response.Content) : null;
		} catch (error) {
			console.error('Error toggling calendar item', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Set the integration's default location (a full round trip — the server
	 * is the source of truth). Resolves with the stored location mapped from
	 * the response `Content` (or `null` when the server omits it). The caller
	 * owns optimistic UI and failure restoration. The server overwrites the
	 * sent `description` with an internal marker and stores the row as
	 * non-searchable, so the resolved model is the one to keep.
	 */
	async setCalendarDefaultLocation(args: {
		integrationId: string;
		location: IntegrationLocation;
	}): Promise<IntegrationLocation | null> {
		try {
			const response = await this.integrationsApi.setCalendarDefaultLocation({
				Id: args.location.id ?? '',
				ThirdPartyId: args.location.thirdPartyId ?? undefined,
				Longitude: args.location.longitude,
				Latitude: args.location.latitude,
				Address: args.location.address ?? '',
				Description: args.location.description ?? '',
				IsVerified: args.location.isVerified,
				ThirdPartyCalendarId: args.integrationId,
			});
			this.assertSuccessEnvelope(response);
			return mapIntegrationLocation(response.Content);
		} catch (error) {
			console.error('Error setting calendar default location', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Disconnect (delete) an integration. Resolves `undefined` on success;
	 * rejects when the envelope reports a non-zero `Error.Code` — including
	 * the provider-side failure code `10000009` (surfaced as a
	 * `TilerResponseError` so the caller can distinguish it) — or when the
	 * server answers 404 (the row is already gone).
	 */
	async disconnectIntegration(args: { integrationId: string; provider: string }): Promise<void> {
		try {
			const response = await this.integrationsApi.deleteIntegration({
				IntegrationId: args.integrationId,
				Provider: args.provider,
			});
			this.assertSuccessEnvelope(response);
		} catch (error) {
			console.error('Error disconnecting integration', error);
			throw normalizeError(error);
		}
	}
}
