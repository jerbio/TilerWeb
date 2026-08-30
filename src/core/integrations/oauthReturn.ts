/**
 * Client-side handling of the server-owned OAuth round trip for calendar
 * connections (see docs/web-connections-integration-plan.md, section 6).
 *
 * The server initiates and completes OAuth and redirects the browser back to
 * `/settings/connections` with transient query parameters:
 *
 *   - Success:     ?oauth=success&provider=google
 *   - Cancelled:   ?oauth=cancelled&provider=google
 *   - Failure:     ?oauth=error&provider=google&reason=access_denied
 *
 * Security invariants (Phase 0 of the plan):
 * - Only the `oauth`, `provider`, and optional `reason` parameters are ever
 *   read from the return URL. No other query parameter — authorization
 *   codes, state, access/refresh tokens, provider response payloads — is
 *   ever surfaced to callers, UI, analytics, or logs.
 * - `provider` must be a non-sensitive identifier from a fixed allow-list.
 *   Values that look like emails, tokens, or anything else are rejected.
 * - `reason` is only kept when it matches a short, safe token pattern;
 *   otherwise it is dropped while the result itself is still reported.
 */

export type OauthResult = 'success' | 'cancelled' | 'error';

export type IntegrationProvider = 'google';

export interface ParsedOauthReturn {
	result: OauthResult;
	provider: IntegrationProvider;
	/** Sanitized, non-sensitive reason token. Only present for `error` results. */
	reason?: string;
}

const OAUTH_RESULTS: readonly OauthResult[] = ['success', 'cancelled', 'error'];

const SUPPORTED_PROVIDERS: readonly string[] = ['google'];

/**
 * A reason token is only trusted when it is a short lowercase
 * alphanumeric/underscore string. Anything else is treated as a potential
 * raw provider response and dropped.
 */
const SAFE_REASON_PATTERN = /^[a-z0-9_]{1,64}$/;

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
 * Parse and validate the transient OAuth query parameters on the
 * Connections return URL. Returns `null` when the URL carries no
 * recognisable OAuth result (e.g. a plain page load).
 */
export function parseOauthReturn(search: string): ParsedOauthReturn | null {
	const params = parseSearch(search);
	if (!params) return null;

	const rawResult = params.get('oauth');
	if (!rawResult || !(OAUTH_RESULTS as readonly string[]).includes(rawResult)) {
		return null;
	}
	const result = rawResult as OauthResult;

	const rawProvider = params.get('provider');
	if (!rawProvider) return null;
	const provider = rawProvider.toLowerCase();
	if (!SUPPORTED_PROVIDERS.includes(provider)) return null;

	const parsed: ParsedOauthReturn = { result, provider: provider as IntegrationProvider };

	if (result === 'error') {
		const rawReason = params.get('reason');
		if (rawReason && SAFE_REASON_PATTERN.test(rawReason)) {
			parsed.reason = rawReason;
		}
	}

	return parsed;
}

/**
 * Remove the transient OAuth query parameters (`oauth`, `provider`,
 * `reason`) from a search string, preserving any unrelated parameters.
 * Returns `''` when nothing remains so callers can replace the URL with a
 * clean `/settings/connections`. Unparseable input is dropped entirely —
 * values we could not validate must not survive the cleanup.
 */
export function stripOauthParams(search: string): string {
	const params = parseSearch(search);
	if (!params) return '';
	for (const key of ['oauth', 'provider', 'reason']) {
		params.delete(key);
	}
	const remaining = params.toString();
	return remaining ? `?${remaining}` : '';
}
