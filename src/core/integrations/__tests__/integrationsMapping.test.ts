import { describe, it, expect } from 'vitest';
import {
	mapIntegrationCalendarItem,
	mapIntegrationLocation,
	mapIntegrationRecord,
	mapIntegrationsEnvelope,
} from '../mapping';
import { CONNECTION_PROVIDERS } from '../types';
import type { Integration } from '../types';
import {
	integrationSuccessEnvelope,
	integrationEmptyEnvelope,
	integrationMalformedEnvelope,
} from '@/test/fixtures/integrationResponses';

describe('integrations mapping (Phase 2)', () => {
	describe('mapIntegrationsEnvelope — success', () => {
		const mapped = mapIntegrationsEnvelope(integrationSuccessEnvelope);

		it('maps all integration fields from a fully-populated record', () => {
			expect(mapped).toHaveLength(2);
			const first = mapped[0];
			expect(first.id).toBe('integration-id');
			expect(first.provider).toBe('Google');
			expect(first.email).toBe('person@example.com');
			expect(first.userId).toBe('provider-user-id');
		});

		it('maps location fields when present', () => {
			const location = mapped[0].location;
			expect(location).not.toBeNull();
			expect(location?.id).toBe('location-id');
			expect(location?.description).toBe('Office');
			expect(location?.address).toBe('123 Main St');
			expect(location?.thirdPartyId).toBe('google-place-id');
			expect(location?.longitude).toBe(-73.9857);
			expect(location?.latitude).toBe(40.7484);
			expect(location?.isVerified).toBe(true);
		});

		it('maps calendar items including optional description', () => {
			const items = mapped[0].calendarItems;
			expect(items).toHaveLength(2);
			expect(items[0]).toEqual({
				id: 'calendar-id',
				name: 'Work',
				description: 'Work calendar',
				isEnabled: true,
				isSelected: true,
			});
			expect(items[1].name).toBe('Personal');
			expect(items[1].description).toBeNull();
			expect(items[1].isSelected).toBe(false);
		});

		it('maps an explicit null location to null without throwing', () => {
			expect(mapped[1].location).toBeNull();
		});

		it('maps an empty calendarItems array to an empty list', () => {
			expect(mapped[1].calendarItems).toEqual([]);
		});
	});

	describe('mapIntegrationsEnvelope — empty and absent content', () => {
		it('empty Content maps to an empty list', () => {
			expect(mapIntegrationsEnvelope(integrationEmptyEnvelope)).toEqual([]);
		});

		it('missing Content maps to an empty list without throwing', () => {
			expect(mapIntegrationsEnvelope({ Error: { Code: '0', Message: 'SUCCESS' } })).toEqual(
				[]
			);
		});

		it('null Content maps to an empty list without throwing', () => {
			expect(
				mapIntegrationsEnvelope({ Error: { Code: '0', Message: 'SUCCESS' }, Content: null })
			).toEqual([]);
		});

		it('non-array Content maps to an empty list without throwing', () => {
			expect(
				mapIntegrationsEnvelope({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { id: 'nope' },
				})
			).toEqual([]);
		});

		it('non-object envelopes map to an empty list without throwing', () => {
			expect(mapIntegrationsEnvelope(null)).toEqual([]);
			expect(mapIntegrationsEnvelope(undefined)).toEqual([]);
			expect(mapIntegrationsEnvelope('not-an-envelope')).toEqual([]);
		});
	});

	describe('mapIntegrationsEnvelope — malformed records', () => {
		const mapped = mapIntegrationsEnvelope(integrationMalformedEnvelope);

		it('maps a minimal record without throwing', () => {
			expect(mapped).toHaveLength(2);
			expect(mapped[0].id).toBe('integration-id-minimal');
			expect(mapped[0].provider).toBe('Google');
			expect(mapped[0].email).toBeNull();
			expect(mapped[0].userId).toBeNull();
		});

		it('maps a missing location to null and null calendarItems to an empty list', () => {
			expect(mapped[0].location).toBeNull();
			expect(mapped[0].calendarItems).toEqual([]);
		});

		it('maps a calendar item missing its name to a null name without throwing', () => {
			const item = mapped[1].calendarItems[0];
			expect(item).toBeDefined();
			expect(item.id).toBe('calendar-id-partial');
			expect(item.name).toBeNull();
			expect(item.isEnabled).toBe(false);
			expect(item.isSelected).toBe(false);
		});
	});

	describe('provider credential identifiers are not retained', () => {
		it('drops authenticationId and userIdentifier from mapped calendar items', () => {
			const mapped = mapIntegrationsEnvelope(integrationSuccessEnvelope);
			const item = mapped[0].calendarItems[0];
			expect('authenticationId' in item).toBe(false);
			expect('userIdentifier' in item).toBe(false);
		});

		it('exposes no keys matching token/secret-like names anywhere in the mapped model', () => {
			const SENSITIVE_KEY_PATTERN = /token|secret|refresh|password|authcode/i;
			const mapped = JSON.parse(
				JSON.stringify(mapIntegrationsEnvelope(integrationSuccessEnvelope))
			);
			const check = (value: unknown): void => {
				if (Array.isArray(value)) {
					value.forEach(check);
					return;
				}
				if (value && typeof value === 'object') {
					for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
						expect(key, `sensitive key "${key}" retained in mapped model`).not.toMatch(
							SENSITIVE_KEY_PATTERN
						);
						check(nested);
					}
				}
			};
			check(mapped);
		});
	});

	describe('individual mappers', () => {
		it('mapIntegrationLocation returns null for non-object input', () => {
			expect(mapIntegrationLocation(null)).toBeNull();
			expect(mapIntegrationLocation('x')).toBeNull();
			expect(mapIntegrationLocation([1, 2])).toBeNull();
		});

		it('mapIntegrationLocation defaults missing coordinates to 0 and missing verification to false', () => {
			expect(mapIntegrationLocation({ id: 'loc' })).toEqual({
				id: 'loc',
				description: null,
				address: null,
				thirdPartyId: null,
				longitude: 0,
				latitude: 0,
				isVerified: false,
			});
		});

		it('mapIntegrationCalendarItem returns null for non-object input', () => {
			expect(mapIntegrationCalendarItem(null)).toBeNull();
		});

		it('mapIntegrationRecord returns null for non-object input', () => {
			expect(mapIntegrationRecord(null)).toBeNull();
			expect(mapIntegrationRecord('nope')).toBeNull();
		});

		it('non-object records inside Content are dropped while object records are kept', () => {
			const mapped = mapIntegrationsEnvelope({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [null, 'junk', { id: 'kept', provider: 'Google' }],
			});
			expect(mapped).toHaveLength(1);
			expect(mapped[0].id).toBe('kept');
		});
	});

	describe('provider capability metadata is separate from returned records', () => {
		it('exposes exactly one available provider (google) and the rest as unavailable', () => {
			const available = CONNECTION_PROVIDERS.filter((p) => p.status === 'available');
			expect(available.map((p) => p.id)).toEqual(['google']);
			expect(CONNECTION_PROVIDERS.length).toBeGreaterThan(1);
			for (const provider of CONNECTION_PROVIDERS) {
				expect(['available', 'unavailable']).toContain(provider.status);
			}
		});

		it('mapped integration records carry no provider capability/status metadata', () => {
			const mapped = mapIntegrationsEnvelope(integrationSuccessEnvelope) as Integration[];
			for (const integration of mapped) {
				expect('status' in integration).toBe(false);
			}
		});
	});
});
