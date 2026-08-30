import { vi } from 'vitest';
import ServerError from '@/core/error/server';
import { TilerResponseError } from '@/core/common/types/errors';
import type { IntegrationsApi } from '@/api/integrationsApi';
import type { IntegrationsResponseEnvelope } from '@/core/integrations/types';
import {
	integrationSuccessEnvelope,
	integrationEmptyEnvelope,
	integrationErrorEnvelope,
} from '@/test/fixtures/integrationResponses';
import { IntegrationsService } from '../integrationsService';

const makeApiMock = (
	result: unknown
): { mock: IntegrationsApi; call: ReturnType<typeof vi.fn> } => {
	const call = vi.fn().mockResolvedValue(result);
	return { mock: { getIntegrations: call } as unknown as IntegrationsApi, call };
};

describe('IntegrationsService', () => {
	describe('getIntegrations', () => {
		it('forwards the optional integrationId and returns mapped integrations', async () => {
			const { mock, call } = makeApiMock(integrationSuccessEnvelope);
			const service = new IntegrationsService(mock);

			const result = await service.getIntegrations('some-guid');

			expect(call).toHaveBeenCalledWith('some-guid');
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('integration-id');
			expect(result[0].provider).toBe('Google');
			expect(result[0].email).toBe('person@example.com');
			expect(result[0].location?.thirdPartyId).toBe('google-place-id');
			expect(result[0].calendarItems[0].name).toBe('Work');
		});

		it('does not forward an integrationId when omitted', async () => {
			const { mock, call } = makeApiMock(integrationSuccessEnvelope);
			await new IntegrationsService(mock).getIntegrations();
			expect(call).toHaveBeenCalledWith(undefined);
		});

		it('returns an empty list for an empty Content array', async () => {
			const { mock } = makeApiMock(integrationEmptyEnvelope);
			expect(await new IntegrationsService(mock).getIntegrations()).toEqual([]);
		});

		it('retains no provider credential identifiers in the resolved model', async () => {
			const { mock } = makeApiMock(integrationSuccessEnvelope);
			const result = await new IntegrationsService(mock).getIntegrations();
			const item = result[0].calendarItems[0];
			expect('authenticationId' in item).toBe(false);
			expect('userIdentifier' in item).toBe(false);
		});

		it('rejects with a TilerResponseError when the envelope carries a non-zero Code', async () => {
			const { mock } = makeApiMock(integrationErrorEnvelope);

			const promise = new IntegrationsService(mock).getIntegrations();
			await expect(promise).rejects.toBeInstanceOf(TilerResponseError);
			await expect(promise).rejects.toMatchObject({
				code: '500',
				message: 'An error occurred while retrieving integrations',
			});
		});

		it('rejects when the envelope has no usable Error block instead of crashing', async () => {
			const malformed: IntegrationsResponseEnvelope = {
				Content: integrationSuccessEnvelope.Content ?? [],
			};
			const { mock } = makeApiMock(malformed);

			await expect(new IntegrationsService(mock).getIntegrations()).rejects.toThrow();
		});

		it('rejects consistently when the API throws a structured server error object', async () => {
			const structuredError = { Error: { Code: '500', Message: 'server exploded' } };
			const call = vi.fn().mockRejectedValue(structuredError);
			const service = new IntegrationsService({
				getIntegrations: call,
			} as unknown as IntegrationsApi);

			const promise = service.getIntegrations();
			await expect(promise).rejects.toBeInstanceOf(Error);
			// The rejection must be a proper Error instance, never the raw object.
			const error = await promise.catch((e) => e);
			expect(error).toBeInstanceOf(Error);
		});

		it('rejects consistently when the API throws a ServerError (network/HTTP failure)', async () => {
			const serverError = new ServerError(
				'HTTP error! status: 503',
				'https://x/api/integrations'
			);
			const call = vi.fn().mockRejectedValue(serverError);
			const service = new IntegrationsService({
				getIntegrations: call,
			} as unknown as IntegrationsApi);

			const promise = service.getIntegrations();
			await expect(promise).rejects.toBeInstanceOf(Error);
			const error = await promise.catch((e) => e);
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toBe('HTTP error! status: 503');
		});
	});
});
