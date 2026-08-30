import { describe, it, expect } from 'vitest';
import { parseOauthReturn, stripOauthParams } from '../oauthReturn';

// ---------------------------------------------------------------------------
// Phase 0 contract tests for the server-owned OAuth round trip
// (docs/web-connections-integration-plan.md, section 6).
//
// Security requirement under test: sensitive OAuth values (authorization
// codes, state, access/refresh tokens, raw provider payloads, emails) are
// NEVER included in what client-side redirect handling surfaces.
// ---------------------------------------------------------------------------

describe('parseOauthReturn', () => {
	describe('valid results', () => {
		it('parses a successful google return', () => {
			expect(parseOauthReturn('?oauth=success&provider=google')).toEqual({
				result: 'success',
				provider: 'google',
			});
		});

		it('parses a cancelled google return without a reason', () => {
			expect(parseOauthReturn('?oauth=cancelled&provider=google')).toEqual({
				result: 'cancelled',
				provider: 'google',
			});
		});

		it('parses an error return with a safe reason token', () => {
			expect(parseOauthReturn('?oauth=error&provider=google&reason=access_denied')).toEqual({
				result: 'error',
				provider: 'google',
				reason: 'access_denied',
			});
		});

		it('normalises provider case to the canonical identifier', () => {
			expect(parseOauthReturn('?oauth=success&provider=GOOGLE')).toEqual({
				result: 'success',
				provider: 'google',
			});
		});

		it('drops an unsafe reason while still reporting the error result', () => {
			// A raw provider response or URL-encoded payload must never surface.
			const parsed = parseOauthReturn(
				'?oauth=error&provider=google&reason=error%3Daccess_denied%20message%3A%20invalid_grant'
			);
			expect(parsed).toEqual({ result: 'error', provider: 'google' });
			expect(parsed?.reason).toBeUndefined();
		});
	});

	describe('unsupported and malformed values', () => {
		it('returns null when the oauth parameter is missing', () => {
			expect(parseOauthReturn('')).toBeNull();
			expect(parseOauthReturn('?provider=google')).toBeNull();
		});

		it('returns null for unknown oauth values', () => {
			expect(parseOauthReturn('?oauth=pending&provider=google')).toBeNull();
			expect(parseOauthReturn('?oauth=&provider=google')).toBeNull();
			// Contract values are exact, lowercase strings.
			expect(parseOauthReturn('?oauth=SUCCESS&provider=google')).toBeNull();
		});

		it('returns null for providers outside the allow-list', () => {
			expect(parseOauthReturn('?oauth=success&provider=microsoft')).toBeNull();
			expect(parseOauthReturn('?oauth=success&provider=')).toBeNull();
			expect(parseOauthReturn('?oauth=success')).toBeNull();
		});

		it('rejects provider values that look like emails', () => {
			expect(parseOauthReturn('?oauth=success&provider=person%40example.com')).toBeNull();
		});

		it('rejects provider values that look like tokens or secrets', () => {
			const longToken = 'a'.repeat(200);
			expect(parseOauthReturn(`?oauth=success&provider=${longToken}`)).toBeNull();
			// Base64-style token characters.
			expect(parseOauthReturn('?oauth=success&provider=abc123%2Bxyz%3D')).toBeNull();
			// Whitespace-delimited payload.
			expect(parseOauthReturn('?oauth=success&provider=Bearer+abc123')).toBeNull();
		});
	});

	describe('sensitive values never leak into the parsed result', () => {
		it('never surfaces extra OAuth parameters (code, state, tokens)', () => {
			const parsed = parseOauthReturn(
				'?oauth=success&provider=google&code=4%2Fsecret-code&state=csrf-123&access_token=at&refresh_token=rt'
			);
			expect(parsed).toEqual({ result: 'success', provider: 'google' });
			const serialised = JSON.stringify(parsed);
			expect(serialised).not.toContain('secret-code');
			expect(serialised).not.toContain('csrf-123');
			expect(serialised).not.toContain('access_token');
			expect(serialised).not.toContain('refresh_token');
		});

		it('never surfaces an email account from a suspicious provider value', () => {
			const parsed = parseOauthReturn(
				'?oauth=success&provider=person%40example.com&code=4%2Fsecret'
			);
			expect(parsed).toBeNull();
		});
	});
});

describe('stripOauthParams', () => {
	it('removes all transient OAuth parameters', () => {
		expect(stripOauthParams('?oauth=success&provider=google&reason=access_denied')).toBe('');
	});

	it('preserves unrelated query parameters', () => {
		expect(stripOauthParams('?oauth=success&provider=google&tab=cards')).toBe('?tab=cards');
	});

	it('drops parameters when there is nothing else to keep', () => {
		expect(stripOauthParams('?oauth=cancelled&provider=google')).toBe('');
	});

	it('tolerates a missing leading ? and empty input', () => {
		expect(stripOauthParams('oauth=success&provider=google')).toBe('');
		expect(stripOauthParams('')).toBe('');
	});
});
