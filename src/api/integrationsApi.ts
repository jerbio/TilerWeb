import type { IntegrationsResponseEnvelope } from '@/core/integrations/types';
import { AppApi } from './appApi';

/**
 * Calendar-connections (integrations) endpoints.
 *
 * The wire contract mirrors the mobile client
 * (tiler_app/lib/services/api/integrationsApi.dart): a single
 * `GET /api/integrations?integrationId=...` read endpoint. This class returns
 * the raw envelope; envelope unwrapping, error normalization, and mapping to
 * domain models live in `IntegrationsService`.
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
}
