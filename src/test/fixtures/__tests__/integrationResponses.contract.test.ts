import { describe, it, expect } from 'vitest';
import {
	integrationSuccessEnvelope,
	integrationEmptyEnvelope,
	integrationMalformedEnvelope,
	integrationErrorEnvelope,
} from '../integrationResponses';

// ---------------------------------------------------------------------------
// Contract test — pins the wire-shape keys returned by GET api/integrations.
// These keys are produced by the same backend that serves the mobile app
// (see tiler_app/lib/data/calendarIntegration.dart). If the server renames
// any of them the Connections mapping breaks silently, so we lock them down
// here (mirrors vibePreviewResponse.contract.test.ts).
// ---------------------------------------------------------------------------

const SENSITIVE_KEY_PATTERN = /token|secret|authcode|refresh|password/i;

function assertNoSensitiveKeys(value: unknown, path = 'root'): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => assertNoSensitiveKeys(item, `${path}[${index}]`));
		return;
	}
	if (value && typeof value === 'object') {
		for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
			expect(key, `sensitive key at ${path}`).not.toMatch(SENSITIVE_KEY_PATTERN);
			assertNoSensitiveKeys(nested, `${path}.${key}`);
		}
	}
}

describe('integration response fixtures (contract)', () => {
	it('success envelope carries the standard Error block', () => {
		// The shared wire envelope types `Error` as optional (the server may
		// omit it), so the fixtures are asserted through optional chaining:
		// a fixture missing `Error` fails these assertions.
		expect(integrationSuccessEnvelope.Error?.Code).toBe('0');
		expect(typeof integrationSuccessEnvelope.Error?.Message).toBe('string');
	});

	it('success envelope contains multiple integration records', () => {
		const content = integrationSuccessEnvelope.Content as unknown[];
		expect(Array.isArray(content)).toBe(true);
		expect(content.length).toBe(2);
	});

	it('a fully-populated record exposes the mobile-compatible keys', () => {
		const [record] = integrationSuccessEnvelope.Content as Record<string, unknown>[];
		expect(typeof record.id).toBe('string');
		expect(record.provider).toBe('Google');
		expect(typeof record.email).toBe('string');
		expect(typeof record.userId).toBe('string');
	});

	it('a populated location exposes the mobile-compatible key set', () => {
		const [record] = integrationSuccessEnvelope.Content as Record<string, unknown>[];
		const location = record.location as Record<string, unknown>;
		expect(typeof location.id).toBe('string');
		expect(typeof location.description).toBe('string');
		expect(typeof location.address).toBe('string');
		expect(typeof location.thirdPartyId).toBe('string');
		expect(typeof location.longitude).toBe('number');
		expect(typeof location.latitude).toBe('number');
		expect(typeof location.isVerified).toBe('boolean');
	});

	it('calendar items expose id/name/isEnabled/isSelected with mobile casing', () => {
		const [record] = integrationSuccessEnvelope.Content as Record<string, unknown>[];
		const [item] = record.calendarItems as Record<string, unknown>[];
		expect(typeof item.id).toBe('string');
		expect(typeof item.name).toBe('string');
		expect(typeof item.isEnabled).toBe('boolean');
		expect(typeof item.isSelected).toBe('boolean');
	});

	it('empty envelope has an empty Content array', () => {
		expect(integrationEmptyEnvelope.Error?.Code).toBe('0');
		expect(integrationEmptyEnvelope.Content).toEqual([]);
	});

	it('malformed envelope omits optional fields and sends explicit nulls', () => {
		const content = integrationMalformedEnvelope.Content as Record<string, unknown>[];
		const [minimal, partial] = content;
		expect('email' in minimal).toBe(false);
		expect('userId' in minimal).toBe(false);
		expect(minimal.location).toBeNull();
		expect(minimal.calendarItems).toBeNull();
		const [partialItem] = partial.calendarItems as Record<string, unknown>[];
		expect('name' in partialItem).toBe(false);
		expect(partialItem.isEnabled).toBe(false);
	});

	it('error envelope has a non-zero Code and no Content', () => {
		// `Error` is optional on the wire envelope, so an error envelope is
		// asserted to actually carry one before checking its Code.
		expect(integrationErrorEnvelope.Error).toBeDefined();
		expect(integrationErrorEnvelope.Error?.Code).not.toBe('0');
		expect(typeof integrationErrorEnvelope.Error?.Message).toBe('string');
		expect('Content' in integrationErrorEnvelope).toBe(false);
	});

	it('no fixture carries token or secret-like keys', () => {
		for (const envelope of [
			integrationSuccessEnvelope,
			integrationEmptyEnvelope,
			integrationMalformedEnvelope,
			integrationErrorEnvelope,
		]) {
			assertNoSensitiveKeys(envelope);
		}
	});
});
