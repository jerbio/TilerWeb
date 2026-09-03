import type {
	CalendarItemToggleEnvelope,
	CalendarItemsEnvelope,
	IntegrationMutationEnvelope,
	IntegrationsResponseEnvelope,
} from '@/core/integrations/types';
import { AppApi } from './appApi';

/**
 * Calendar-connections (integrations) endpoints.
 *
 * The wire contract mirrors the mobile client
 * (tiler_app/lib/services/api/integrationsApi.dart):
 * - `GET /api/integrations?integrationId=...` — list integrations
 * - `GET /api/integrations/calendarItem?integrationId=...` — calendar items
 *   for one integration (authoritative toggle state; `Content.calendarItems`)
 * - `POST /api/integrations/google/calendarItem` — toggle one calendar item
 * - `DELETE /api/integrations` — disconnect (delete) an integration
 *
 * This class returns the raw envelopes; envelope unwrapping, error
 * normalization, and mapping to domain models live in `IntegrationsService`.
 * Mutation request bodies stay PascalCase, matching the server models
 * (`GoogleCalendarItemModel`, `ThirdPartyIntegrationCredentials`); the
 * server backfills `UserID` from the authenticated session.
 */
export class IntegrationsApi extends AppApi {
	/**
	 * Fetch the connected integrations.
	 * `GET /api/integrations` — the optional `integrationId` query parameter
	 * is only appended when a non-empty value is provided.
	 */
	public getIntegrations(integrationId?: string): Promise<IntegrationsResponseEnvelope> {
		const params = new URLSearchParams();
		if (integrationId) {
			params.set('integrationId', integrationId);
		}
		const query = params.toString();
		return this.apiRequest<IntegrationsResponseEnvelope>(
			`api/integrations${query ? `?${query}` : ''}`
		);
	}

	/**
	 * Fetch the calendar items for one integration.
	 * `GET /api/integrations/calendarItem` — the server answers
	 * `Content.calendarItems` as a list even for a single item (empty array
	 * when the integration has no items).
	 */
	public getCalendarItems(integrationId: string): Promise<CalendarItemsEnvelope> {
		const params = new URLSearchParams();
		params.set('integrationId', integrationId);
		return this.apiRequest<CalendarItemsEnvelope>(
			`api/integrations/calendarItem?${params.toString()}`
		);
	}

	/**
	 * Toggle a calendar item's selection on the server.
	 * `POST /api/integrations/google/calendarItem` — PascalCase body; the
	 * server answers `Content` with the single updated item.
	 */
	public toggleCalendarItem(payload: {
		IntegrationId: string;
		CalendarItemId: string;
		IsSelected: boolean;
	}): Promise<CalendarItemToggleEnvelope> {
		return this.apiRequest<CalendarItemToggleEnvelope>('api/integrations/google/calendarItem', {
			method: 'POST',
			body: JSON.stringify({
				IntegrationId: payload.IntegrationId,
				CalendarItemId: payload.CalendarItemId,
				IsSelected: payload.IsSelected,
			}),
		});
	}

	/**
	 * Disconnect (delete) an integration.
	 * `DELETE /api/integrations` — PascalCase body. The server can answer
	 * HTTP 200 with a non-zero `Error.Code` (`10000009`) when the
	 * provider-side delete fails, so success must be judged on the envelope,
	 * never on the status code.
	 */
	public deleteIntegration(payload: {
		IntegrationId: string;
		Provider: string;
	}): Promise<IntegrationMutationEnvelope> {
		return this.apiRequest<IntegrationMutationEnvelope>('api/integrations', {
			method: 'DELETE',
			body: JSON.stringify({
				IntegrationId: payload.IntegrationId,
				Provider: payload.Provider,
			}),
		});
	}
}
