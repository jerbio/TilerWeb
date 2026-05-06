import { describe, it, expect, vi } from 'vitest';
import ChatService from '../chatService';
import type { ChatApi } from '@/api/chatApi';
import type { ChatMessagesResponse, SimulationDto, VibeRequest } from '@/core/common/types/chat';
import {
	primeSimulationFromRequest,
	isRequestTerminal,
	isSimulationTerminal,
} from '@/core/util/simulationSelectors';

/**
 * Phase 7.3 integration scenarios — exercise the rehydration contract
 * at the service + selector boundary. A full chat.tsx render test would
 * require mocking zustand + i18n + SignalR + react-router; we instead
 * drive the same code paths through the public service API and the
 * pure selectors that chat.tsx delegates to.
 */

function makeRequest(overrides: Partial<VibeRequest> = {}): VibeRequest {
	return {
		id: 'req-1',
		creationTimeInMs: 100,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions: [],
		...overrides,
	};
}

function makeSim(state: SimulationDto['state'], id = 'prev-1', requestId = 'req-1'): SimulationDto {
	return {
		id,
		vibeRequestId: requestId,
		tilerUserId: 'u',
		creationTimeInMs: 100,
		state,
		previewActions: [],
	};
}

/**
 * Mirrors the cache-vs-fetch decision in chat.tsx's requestId useEffect:
 *   1. Look in the local cache (populated from getMessages embedding).
 *   2. On miss, call chatService.getVibeRequest (single round-trip).
 *   3. On hit, prime simulation directly with no network call.
 */
async function rehydrateRequest(
	requestId: string,
	cache: Record<string, VibeRequest>,
	service: ChatService
): Promise<{
	request: VibeRequest | null;
	primedSimulation: SimulationDto | null;
	cacheHit: boolean;
}> {
	const cached = cache[requestId];
	if (cached) {
		return {
			request: cached,
			primedSimulation: primeSimulationFromRequest(cached),
			cacheHit: true,
		};
	}
	const resp = await service.getVibeRequest(requestId);
	const fetched = (resp?.Content?.vibeRequest ?? null) as VibeRequest | null;
	if (fetched) cache[requestId] = fetched;
	return {
		request: fetched,
		primedSimulation: primeSimulationFromRequest(fetched),
		cacheHit: false,
	};
}

describe('Phase 7.3 — chat rehydration integration', () => {
	// Plan §7.3 scenario 9 — embedded preview hydrates without a
	// separate getSimulationForRequest call.
	it('scenario 9: embedded vibeRequests in getMessages avoid the per-request fetch', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockResolvedValue({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: {
					chats: [],
					vibeRequests: [
						makeRequest({ id: 'req-A', preview: makeSim('Ready', 'p-A', 'req-A') }),
					],
				},
				ServerStatus: null,
			} as ChatMessagesResponse),
			getVibeRequest: vi.fn(),
			getSimulationForRequest: vi.fn(),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);
		const cache: Record<string, VibeRequest> = {};

		const messagesResp = await service.getMessages('session-1');
		for (const r of messagesResp.Content.vibeRequests ?? []) {
			cache[r.id] = r;
		}

		const result = await rehydrateRequest('req-A', cache, service);
		expect(result.cacheHit).toBe(true);
		expect(result.primedSimulation?.state).toBe('Ready');
		expect(chatApiMock.getVibeRequest).not.toHaveBeenCalled();
		expect(chatApiMock.getSimulationForRequest).not.toHaveBeenCalled();
	});

	// Plan §7.3 scenario 6 — refresh mid-Processing: status strip
	// shows generating, polling resumes (cache primes Processing, then
	// the polling hook would tick).
	it('scenario 6: refresh mid-Processing primes "generating" state from embedded preview', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockResolvedValue({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: {
					chats: [],
					vibeRequests: [
						makeRequest({
							id: 'req-P',
							preview: makeSim('Processing', 'p-P', 'req-P'),
						}),
					],
				},
				ServerStatus: null,
			} as ChatMessagesResponse),
			getVibeRequest: vi.fn(),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);
		const cache: Record<string, VibeRequest> = {};
		const messagesResp = await service.getMessages('session-1');
		for (const r of messagesResp.Content.vibeRequests ?? []) {
			cache[r.id] = r;
		}

		const result = await rehydrateRequest('req-P', cache, service);
		// Polling should keep ticking — neither request nor sim is terminal.
		expect(isRequestTerminal(result.request)).toBe(false);
		expect(isSimulationTerminal(result.primedSimulation)).toBe(false);
		expect(result.primedSimulation?.state).toBe('Processing');
	});

	// Plan §7.3 scenario 8 — refresh after applying a request: history
	// renders cleanly, no simulation UI invited.
	it('scenario 8: refresh after Apply (Executed/closed) renders no simulation UI', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockResolvedValue({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: {
					chats: [],
					vibeRequests: [
						makeRequest({
							id: 'req-X',
							isClosed: true,
							state: 'Executed',
							preview: makeSim('Ready', 'p-X', 'req-X'),
						}),
					],
				},
				ServerStatus: null,
			} as ChatMessagesResponse),
			getVibeRequest: vi.fn(),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);
		const cache: Record<string, VibeRequest> = {};
		const messagesResp = await service.getMessages('session-1');
		for (const r of messagesResp.Content.vibeRequests ?? []) {
			cache[r.id] = r;
		}

		const result = await rehydrateRequest('req-X', cache, service);
		// Terminal request → polling halts and the strip's hide-on-terminal
		// branch suppresses the Review CTA even if the embedded preview
		// is "Ready".
		expect(isRequestTerminal(result.request)).toBe(true);
	});

	// Plan §6.6.3 / §7.3 — refresh into a session whose latest request
	// was superseded: stale Ready preview must NOT auto-open review.
	it('treats supersededByRequestId as terminal so stale Ready preview is hidden', async () => {
		const cache: Record<string, VibeRequest> = {
			'req-S': makeRequest({
				id: 'req-S',
				supersededByRequestId: 'req-T',
				preview: makeSim('Ready', 'p-S', 'req-S'),
			}),
		};
		const chatApiMock = {
			getVibeRequest: vi.fn(),
		} as unknown as ChatApi;
		const service = new ChatService(chatApiMock);

		const result = await rehydrateRequest('req-S', cache, service);
		expect(result.cacheHit).toBe(true);
		expect(isRequestTerminal(result.request)).toBe(true);
		expect(chatApiMock.getVibeRequest).not.toHaveBeenCalled();
	});

	// Cache miss path — when getMessages didn't carry the request (older
	// session, follow-up sendMessage before the next getMessages, or
	// refresh into a request not in the most recent batch), fall back to
	// a single getVibeRequest round-trip and seed the cache for next time.
	it('falls back to getVibeRequest on cache miss and stores result for next lookup', async () => {
		const fetched = makeRequest({ id: 'req-M', preview: makeSim('Ready', 'p-M', 'req-M') });
		const chatApiMock = {
			getVibeRequest: vi.fn().mockResolvedValue({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: { vibeRequest: fetched },
				ServerStatus: null,
			}),
		} as unknown as ChatApi;
		const service = new ChatService(chatApiMock);
		const cache: Record<string, VibeRequest> = {};

		const first = await rehydrateRequest('req-M', cache, service);
		expect(first.cacheHit).toBe(false);
		expect(first.primedSimulation?.state).toBe('Ready');
		expect(chatApiMock.getVibeRequest).toHaveBeenCalledTimes(1);

		const second = await rehydrateRequest('req-M', cache, service);
		expect(second.cacheHit).toBe(true);
		expect(chatApiMock.getVibeRequest).toHaveBeenCalledTimes(1);
	});

	// Plan §6.6.5 — anonymous user threading on the polling fetch.
	it('threads anonymousUserId through getSimulationForRequest at the service layer', async () => {
		const chatApiMock = {
			getSimulationForRequest: vi
				.fn()
				.mockResolvedValue({
					Error: null,
					Content: makeSim('Processing'),
					ServerStatus: null,
				}),
		} as unknown as ChatApi;
		const service = new ChatService(chatApiMock);

		await service.getSimulationForRequest('req-1', 'anon-7');
		expect(chatApiMock.getSimulationForRequest).toHaveBeenCalledWith('req-1', 'anon-7');

		await service.getSimulationForRequest('req-2');
		expect(chatApiMock.getSimulationForRequest).toHaveBeenLastCalledWith('req-2', undefined);
	});
});
