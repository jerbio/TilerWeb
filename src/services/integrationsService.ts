import { IntegrationsApi } from '@/api/integrationsApi';
import { TilerResponseError } from '@/core/common/types/errors';
import { normalizeError } from '@/core/error';
import { mapIntegrationsEnvelope } from '@/core/integrations/mapping';
import type { Integration } from '@/core/integrations/types';

/**
 * Thin wrapper around {@link IntegrationsApi} that unwraps the standard
 * `{ Error, Content }` envelope and normalizes errors, following the
 * convention used by the other services (`notesService`, `userService`, …).
 *
 * Error contract for `getIntegrations`:
 * - Non-zero `Error.Code` → `TilerResponseError` (code + server message).
 * - Structured server error thrown by the API layer (raw
 *   `{ Error: { Code, Message } }` object) → plain `Error` with the
 *   normalized message via `normalizeError`.
 * - `ServerError` (network failure, HTTP error without a JSON body) → the
 *   original `ServerError` instance.
 */
export class IntegrationsService {
	private integrationsApi: IntegrationsApi;

	constructor(integrationsApi: IntegrationsApi) {
		this.integrationsApi = integrationsApi;
	}

	/** Fetch the connected integrations, mapped to the normalized domain model. */
	async getIntegrations(integrationId?: string): Promise<Integration[]> {
		try {
			const response = await this.integrationsApi.getIntegrations(integrationId);
			if (!response || !response.Error || typeof response.Error.Code !== 'string') {
				// Malformed envelope: reject with a generic, non-sensitive error
				// instead of crashing while reading a missing Error block.
				throw new TilerResponseError('integrations.invalid_response');
			}
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}
			return mapIntegrationsEnvelope(response);
		} catch (error) {
			console.error('Error fetching integrations', error);
			throw normalizeError(error);
		}
	}
}
