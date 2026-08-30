import { describe, it, expect } from 'vitest';
import { OAUTH_START_PATH, buildOauthStartUrl } from '../oauthUrl';

/**
 * Phase 3 tests: building the server-owned OAuth start URL.
 *
 * Contract (verified against TilerFront in `oauthReturn.ts`): the client
 * navigates the browser (top-level GET with session cookies) to
 * `GET <base>api/Integrations?provider=google&redirectTarget=<own-origin
 * https URL>` and the server 302-redirects to the provider consent screen.
 */
describe('buildOauthStartUrl', () => {
	const baseUrl = 'https://api.tiler.test/';
	const destination = 'https://app.tiler.test/settings/connections';

	it('targets the server-owned integrations start endpoint', () => {
		expect(OAUTH_START_PATH).toBe('api/Integrations');
	});

	it('builds the start URL with provider and redirectTarget parameters', () => {
		const startUrl = buildOauthStartUrl(baseUrl, 'google', destination);
		if (typeof startUrl !== 'string') throw new Error('expected a start URL for valid input');
		const url = new URL(startUrl);

		expect(url.origin).toBe('https://api.tiler.test');
		expect(url.pathname).toBe('/api/Integrations');
		expect(url.searchParams.get('provider')).toBe('google');
		expect(url.searchParams.get('redirectTarget')).toBe(destination);
		// Only the two contract parameters are ever present.
		expect([...url.searchParams.keys()].sort()).toEqual(['provider', 'redirectTarget']);
	});

	it('does not depend on a trailing slash in the base URL', () => {
		const expected =
			'https://api.tiler.test/api/Integrations?provider=google&redirectTarget=' +
			encodeURIComponent(destination);
		expect(buildOauthStartUrl('https://api.tiler.test', 'google', destination)).toBe(expected);
		expect(buildOauthStartUrl('https://api.tiler.test///', 'google', destination)).toBe(
			expected
		);
	});

	it('percent-encodes the destination so its own query params round-trip', () => {
		const withQuery = 'https://app.tiler.test/settings/connections?foo=bar&x=1';
		const startUrl = buildOauthStartUrl(baseUrl, 'google', withQuery);
		if (typeof startUrl !== 'string') throw new Error('expected a start URL for valid input');
		const url = new URL(startUrl);
		expect(url.searchParams.get('redirectTarget')).toBe(withQuery);
	});

	it('returns null instead of throwing for an empty base URL', () => {
		expect(buildOauthStartUrl('', 'google', destination)).toBeNull();
	});

	it('returns null instead of throwing for an empty provider', () => {
		expect(buildOauthStartUrl(baseUrl, '', destination)).toBeNull();
	});

	it('returns null instead of throwing for a missing or unparseable destination', () => {
		expect(buildOauthStartUrl(baseUrl, 'google', '')).toBeNull();
		expect(buildOauthStartUrl(baseUrl, 'google', 'not-a-url')).toBeNull();
	});

	it('rejects non-http(s) destinations (the server requires an own-origin https URL)', () => {
		expect(
			buildOauthStartUrl(baseUrl, 'google', 'ftp://app.tiler.test/settings/connections')
		).toBeNull();
	});
});
