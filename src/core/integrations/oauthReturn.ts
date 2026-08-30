/**
 * Client-side handling of the server-owned OAuth round trip for calendar
 * connections (see docs/web-connections-integration-plan.md, section 6).
 *
 * Contract verified against TilerFront (IntegrationsController +
 * RedirectTargetValidator):
 *
 *   1. Start: the client navigates the browser to
 *      `GET api/Integrations?provider=google&redirectTarget=<own-origin https URL>`;
 *      the server 302-redirects to the provider consent screen with a signed
 *      state that binds the Tiler user.
 *   2. `GET api/Integrations/connect/callback` exchanges the authorization
 *      code and persists the integration. The callback deliberately does not
 *      require the Tiler session; the signed state is authoritative.
 *   3. The server redirects the browser back to `redirectTarget` with
 *      transient result query parameters:
 *
 *      - Success:     ?calendarConnect=success&integrationId={guid}
 *      - Cancelled:   ?calendarConnect=declined
 *      - Failure:     ?calendarConnect=error&reason={failureReason}
 *
 * Security invariants (Phase 0 of the plan):
 * - Only the `calendarConnect`, `integrationId`, and `reason` parameters are
 *   ever read from the return URL. No other query parameter — authorization
 *   codes, state, access/refresh tokens, provider response payloads — is
 *   ever surfaced to callers, UI, analytics, or logs.
 * - `calendarConnect` must be one of the exact lowercase result tokens the
 *   server emits. Anything else means "no recognisable result".
 * - `integrationId` is only kept when it is a well-formed GUID; anything else
 *   (tokens, emails, raw payloads) is dropped while the result is still
 *   reported.
 * - `reason` is only kept when it matches a bounded, safe token pattern
 *   (short lowercase phrases, as emitted by the server); otherwise it is
 *   dropped while the result itself is still reported.
 */

export type OauthResult = 'success' | 'declined' | 'error';

export interface ParsedOauthReturn {
	result: OauthResult;
	/**
	 * Integration id reported by the server on a successful connect.
	 * Only present after validation as a well-formed GUID.
	 */
	integrationId?: string;
	/** Sanitized, non-sensitive reason token. Only present for `error` results. */
	reason?: string;
}

const OAUTH_RESULTS: readonly OauthResult[] = ['success', 'declined', 'error'];

/**
 * The server reports the newly persisted integration id on success. It is a
 * GUID; any other value is treated as a potential token/payload and dropped.
 */
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A reason token is only trusted when it is a short lowercase phrase
 * (alphanumeric with spaces and a few punctuation marks), as emitted by the
 * server's fixed failure reasons. Anything else is treated as a potential
 * raw provider response and dropped.
 */
const SAFE_REASON_PATTERN = /^[a-z0-9_-][a-z0-9_ .,()-]{0,127}$/;

function parseSearch(search: string): URLSearchParams | null {
	const body = search.startsWith('?') ? search.slice(1) : search;
	if (!body) return null;
	try {
		return new URLSearchParams(body);
	} catch {
		return null;
	}
}

/**
 * Parse and validate the transient connect-result query parameters on the
 * Connections return URL. Returns `null` when the URL carries no
 * recognisable result (e.g. a plain page load).
 */
export function parseOauthReturn(search: string): ParsedOauthReturn | null {
	const params = parseSearch(search);
	if (!params) return null;

	const rawResult = params.get('calendarConnect');
	if (!rawResult || !(OAUTH_RESULTS as readonly string[]).includes(rawResult)) {
		return null;
	}
	const result = rawResult as OauthResult;

	const parsed: ParsedOauthReturn = { result };

	if (result === 'success') {
		const rawId = params.get('integrationId');
		if (rawId && GUID_PATTERN.test(rawId)) {
			parsed.integrationId = rawId;
		}
	}

	if (result === 'error') {
		const rawReason = params.get('reason');
		if (rawReason && SAFE_REASON_PATTERN.test(rawReason)) {
			parsed.reason = rawReason;
		}
	}

	return parsed;
}

/**
 * Remove the transient connect-result query parameters
 * (`calendarConnect`, `integrationId`, `reason`) from a search string,
 * preserving any unrelated parameters. Returns `''` when nothing remains so
 * callers can replace the URL with a clean `/settings/connections`.
 * Unparseable input is dropped entirely — values we could not validate must
 * not survive the cleanup.
 */
export function stripOauthParams(search: string): string {
	const params = parseSearch(search);
	if (!params) return '';
	for (const key of ['calendarConnect', 'integrationId', 'reason']) {
		params.delete(key);
	}
	const remaining = params.toString();
	return remaining ? `?${remaining}` : '';
}
