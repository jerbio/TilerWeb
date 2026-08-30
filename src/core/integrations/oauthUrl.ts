/**
 * Building the server-owned OAuth start URL for calendar connections
 * (see docs/web-connections-integration-plan.md, section 6, and the
 * verified contract in `oauthReturn.ts`).
 *
 * Start step: the client navigates the browser (a top-level GET that carries
 * the Tiler session cookies) to:
 *
 *   GET <base>api/Integrations/connect?provider=google&redirectTarget=<own-origin https URL>
 *
 * and the server (`IntegrationsController.StartCalendarConnect`) 302-redirects
 * to the provider consent screen. The round trip is fully server-owned; the
 * client only ever constructs this one URL.
 *
 * `api/Integrations` without the `/connect` segment is the integrations LIST
 * endpoint (returns JSON) — it is never used to start the round trip.
 *
 * This module is pure and total: invalid input returns `null` (the caller
 * keeps the user on the page) instead of throwing.
 *
 * Security invariants (mirroring `oauthReturn.ts`):
 * - Only the `provider` and `redirectTarget` parameters are ever appended.
 *   No token, authorization code, state, or session material is ever put
 *   into the start URL client-side.
 * - `redirectTarget` must be an http(s) URL (the server requires an
 *   own-origin https URL) and is percent-encoded as a single query
 *   parameter value.
 */

/**
 * The server endpoint that starts the OAuth round trip
 * (`IntegrationsController.StartCalendarConnect`; GET, browser navigation).
 */
export const OAUTH_START_PATH = 'api/Integrations/connect';

/**
 * Build the full OAuth start URL for a provider.
 *
 * @param baseUrl The API base URL (e.g. `Env.get('BASE_URL')`).
 * @param providerId Stable provider key from `CONNECTION_PROVIDERS` (`google`).
 * @param returnDestination Own-origin URL the server redirects back to
 *                          (the Connections page).
 * @returns The URL to navigate the browser to, or `null` when the input is
 *          invalid (empty base URL/provider, or a missing or non-http(s)
 *          destination) — never throws.
 */
export function buildOauthStartUrl(
	baseUrl: string,
	providerId: string,
	returnDestination: string
): string | null {
	if (!baseUrl || !providerId) return null;

	let destination: URL;
	try {
		destination = new URL(returnDestination);
	} catch {
		return null;
	}
	if (destination.protocol !== 'http:' && destination.protocol !== 'https:') return null;

	const domain = baseUrl.replace(/\/+$/, '');
	const params = new URLSearchParams();
	params.set('provider', providerId);
	params.set('redirectTarget', returnDestination);
	return `${domain}/${OAUTH_START_PATH}?${params.toString()}`;
}
