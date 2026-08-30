import { describe, it, expect } from 'vitest';
import { parseOauthReturn, stripOauthParams } from '../oauthReturn';

// ---------------------------------------------------------------------------
// Phase 0 contract tests for the server-owned OAuth round trip.
//
// Contract verified against the backend (TilerFront):
//   - `IntegrationsController.GetIntegration` start:
//       GET api/Integrations?provider=google&redirectTarget=<allow-listed https URL>
//     The server 302s the browser to provider consent with a signed state.
//   - `IntegrationsController.ConnectCallback` (GET api/Integrations/connect/callback):
//     exchanges the code, persists the integration, then redirects the browser
//     back to `redirectTarget` with `RedirectTargetValidator.AppendCallbackResult`:
//       - Success:     ?calendarConnect=success&integrationId={guid}
//       - Cancelled:   ?calendarConnect=declined
//       - Failure:     ?calendarConnect=error&reason={failureReason}
//
// Security requirement under test: sensitive OAuth values (authorization
// codes, state, access/refresh tokens, raw provider payloads, emails) are
// NEVER included in what client-side redirect handling surfaces.
// ---------------------------------------------------------------------------

const GUID = '3f2b7c1d-9a4e-4f6b-8c2a-1d5e9f3b7a2c';

describe('parseOauthReturn', () => {
	describe('valid results (server-appended contract)', () => {
		it('parses a successful connect return with a GUID integration id', () => {
			expect(parseOauthReturn(`?calendarConnect=success&integrationId=${GUID}`)).toEqual({
				result: 'success',
				integrationId: GUID,
			});
		});

		it('parses a declined connect return', () => {
			expect(parseOauthReturn('?calendarConnect=declined')).toEqual({
				result: 'declined',
			});
		});

		it('parses an error return with each known server failure reason', () => {
			const knownReasons = [
				'missing authorization code',
				'google client credentials not configured',
				'microsoft client credentials not configured',
				'token exchange returned no access token',
				'unable to resolve connected account identity',
				'persistence failed',
				'connect failed',
				'unsupported provider',
			];
			for (const reason of knownReasons) {
				expect(
					parseOauthReturn(`?calendarConnect=error&reason=${encodeURIComponent(reason)}`)
				).toEqual({
					result: 'error',
					reason,
				});
			}
		});

		it('parses a provider-supplied token error reason (e.g. invalid_grant)', () => {
			expect(parseOauthReturn('?calendarConnect=error&reason=invalid_grant')).toEqual({
				result: 'error',
				reason: 'invalid_grant',
			});
		});
	});

	describe('non-conforming values are dropped, never surfaced', () => {
		it('drops a non-GUID integrationId while still reporting success', () => {
			const parsed = parseOauthReturn('?calendarConnect=success&integrationId=not-a-guid');
			expect(parsed).toEqual({ result: 'success' });
			expect(parsed?.integrationId).toBeUndefined();
		});

		it('drops an integrationId that looks like a token or payload', () => {
			const longToken = 'a'.repeat(200);
			expect(parseOauthReturn(`?calendarConnect=success&integrationId=${longToken}`)).toEqual(
				{
					result: 'success',
				}
			);
			expect(
				parseOauthReturn('?calendarConnect=success&integrationId=abc123%2Bxyz%3D')
			).toEqual({
				result: 'success',
			});
		});

		it('drops an unsafe reason while still reporting the error result', () => {
			// A raw provider response or URL-encoded payload must never surface.
			const parsed = parseOauthReturn(
				'?calendarConnect=error&reason=error%3Daccess_denied%20message%3A%20invalid_grant'
			);
			expect(parsed).toEqual({ result: 'error' });
			expect(parsed?.reason).toBeUndefined();
		});

		it('drops reasons that look like emails or URLs', () => {
			expect(
				parseOauthReturn(
					`?calendarConnect=error&reason=${encodeURIComponent('person@example.com')}`
				)
			).toEqual({ result: 'error' });
			expect(
				parseOauthReturn(
					`?calendarConnect=error&reason=${encodeURIComponent('https://attacker.example/err')}`
				)
			).toEqual({ result: 'error' });
		});

		it('drops reasons longer than the bounded length', () => {
			const longReason = 'a'.repeat(200);
			expect(parseOauthReturn(`?calendarConnect=error&reason=${longReason}`)).toEqual({
				result: 'error',
			});
		});
	});

	describe('unsupported and malformed values', () => {
		it('returns null when the calendarConnect parameter is missing', () => {
			expect(parseOauthReturn('')).toBeNull();
			expect(parseOauthReturn('?integrationId=x')).toBeNull();
		});

		it('returns null for unknown calendarConnect values', () => {
			expect(parseOauthReturn('?calendarConnect=pending')).toBeNull();
			expect(parseOauthReturn('?calendarConnect=')).toBeNull();
			// Contract values are exact, lowercase strings.
			expect(parseOauthReturn('?calendarConnect=SUCCESS')).toBeNull();
		});

		it('returns null for the legacy client-side OAuth shape (oauth=...)', () => {
			// The server never emits `oauth`; only `calendarConnect` is trusted.
			expect(parseOauthReturn('?oauth=success&provider=google')).toBeNull();
		});
	});

	describe('sensitive values never leak into the parsed result', () => {
		it('never surfaces extra OAuth parameters (code, state, tokens)', () => {
			const parsed = parseOauthReturn(
				`?calendarConnect=success&integrationId=${GUID}&code=4%2Fsecret-code&state=csrf-123&access_token=at&refresh_token=rt`
			);
			expect(parsed).toEqual({ result: 'success', integrationId: GUID });
			const serialised = JSON.stringify(parsed);
			expect(serialised).not.toContain('secret-code');
			expect(serialised).not.toContain('csrf-123');
			expect(serialised).not.toContain('access_token');
			expect(serialised).not.toContain('refresh_token');
		});

		it('never surfaces an email account from a suspicious parameter value', () => {
			const email = 'person@example.com';
			const parsed = parseOauthReturn(
				`?calendarConnect=success&integrationId=${encodeURIComponent(email)}&code=4%2Fsecret`
			);
			expect(parsed).toEqual({ result: 'success' });
			const serialised = JSON.stringify(parsed);
			expect(serialised).not.toContain(email);
		});
	});
});

describe('stripOauthParams', () => {
	it('removes all transient connect-result parameters', () => {
		expect(stripOauthParams(`?calendarConnect=success&integrationId=${GUID}`)).toBe('');
	});

	it('removes the error result parameters', () => {
		expect(stripOauthParams('?calendarConnect=error&reason=connect+failed')).toBe('');
	});

	it('removes the declined result parameter', () => {
		expect(stripOauthParams('?calendarConnect=declined')).toBe('');
	});

	it('preserves unrelated query parameters', () => {
		expect(stripOauthParams(`?calendarConnect=success&integrationId=${GUID}&tab=cards`)).toBe(
			'?tab=cards'
		);
	});

	it('tolerates a missing leading ? and empty input', () => {
		expect(stripOauthParams('calendarConnect=success&integrationId=x')).toBe('');
		expect(stripOauthParams('')).toBe('');
	});
});
