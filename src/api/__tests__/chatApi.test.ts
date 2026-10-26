import { vi } from 'vitest';
import { ChatApi } from '../chatApi';
import type { ChatMessagesResponse } from '@/core/common/types/chat';
import { SimulationState } from '@/core/common/types/chat';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const mockMessagesResponse: ChatMessagesResponse = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: { chats: [] },
	ServerStatus: null,
};

describe('ChatApi', () => {
	let api: ChatApi;
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		api = new ChatApi();
		fetchSpy = vi.spyOn(globalThis, 'fetch');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each(['Pending', 'Failed'] as const)(
		'consumes %s schedule outcomes without retrying mutations',
		async (State) => {
			const result = { State, ActionId: 'a', Operation: 'UpdateTilette', JobId: 'job' };
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify(
						State === 'Pending'
							? {
									Error: { Code: '0' },
									Content: { vibeRequest: { tileShareResult: result } },
								}
							: { Error: { Code: '409' }, Content: result }
					),
					{ status: State === 'Pending' ? 200 : 409 }
				)
			);
			expect(await api.confirmTileShare('a', 'review')).toEqual(result);
			expect(fetchSpy).toHaveBeenCalledTimes(1);
		}
	);
	it('returns a matched definitive rejection from the standard 409 envelope', async () => {
		const rejected = { State: 'Rejected', ActionId: 'a', ErrorCode: 'locked_work_conflict' };
		fetchSpy.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					Error: { Code: '409', Message: 'Locked work conflict' },
					Content: rejected,
				}),
				{ status: 409 }
			)
		);
		expect(await api.confirmTileShare('a', 'exact')).toEqual(rejected);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
	it('approves only the exact TileShare review and consumes standard conflicts without retry', async () => {
		const updated = {
			State: 'NotAttempted',
			ActionId: 'a',
			ReviewToken: 'new',
			Review: { Name: 'Changed', Tilettes: [] },
			ErrorCode: 'review_changed',
		};
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ Error: { Code: '409' }, Content: updated }), {
				status: 409,
			})
		);
		expect(await api.confirmTileShare('a', 'old')).toEqual(updated);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toEqual(
			expect.objectContaining({ ActionId: 'a', TileShareReviewToken: 'old' })
		);
	});
	it('rejects a successful envelope for a different TileShare action', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					Error: { Code: '0' },
					Content: {
						vibeRequest: { tileShareResult: { State: 'Applied', ActionId: 'other' } },
					},
				})
			)
		);
		await expect(api.confirmTileShare('a', 'token')).rejects.toThrow();
	});

	it('confirms an exact directory selection using the standard envelope and cancellation signal', async () => {
		const page = {
			Kind: 'Contact',
			ResultId: 'result',
			Matches: [],
			Selection: { Id: 'match' },
			HasMore: false,
		};
		fetchSpy.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					Error: { Code: '0' },
					Content: { ActionId: 'action', DirectorySearch: page },
				})
			)
		);
		const abort = new AbortController();
		expect(await api.selectDirectoryMatch('action', 'result', 'match', abort.signal)).toEqual(
			page
		);
		const [url, options] = fetchSpy.mock.calls[0];
		expect(url).toContain('api/Vibe/Directory/Selection');
		expect(options?.signal).toBe(abort.signal);
		expect(JSON.parse(options?.body as string)).toEqual({
			ActionId: 'action',
			ResultId: 'result',
			MatchId: 'match',
		});
	});

	it.each(['error', 'mismatched'])(
		'rejects a directory selection with an %s response',
		async (failure) => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: failure === 'error' ? '409' : '0' },
						Content: {
							ActionId: 'action',
							DirectorySearch: { ResultId: 'result', Selection: { Id: 'wrong' } },
						},
					})
				)
			);
			await expect(api.selectDirectoryMatch('action', 'result', 'match')).rejects.toThrow();
		}
	);

	it('keeps project discovery and delegation orchestration out of the browser API', () => {
		expect(api).not.toHaveProperty('getDelegationProjects');
		expect(api).not.toHaveProperty('saveDelegationDraft');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('builds base getMessages URL with SessionId', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 })
		);

		await api.getMessages('session id with spaces');

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [urlArg] = fetchSpy.mock.calls[0];
		const url = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

		expect(url).toContain('api/Vibe/Chat?');
		expect(url).toContain('SessionId=session%20id%20with%20spaces');
		expect(url).not.toContain('Index=');
		expect(url).not.toContain('BatchSize=');
		expect(url).not.toContain('Order=');
	});

	it('appends pagination params for getMessages', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 })
		);

		await api.getMessages('session-1', {
			index: 10,
			batchSize: 10,
			order: 'desc',
			anonymousUserId: 'anon-user-1',
		});

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [urlArg] = fetchSpy.mock.calls[0];
		const url = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

		expect(url).toContain('SessionId=session-1');
		expect(url).toContain('AnonymousUserId=anon-user-1');
		expect(url).toContain('Index=10');
		expect(url).toContain('BatchSize=10');
		expect(url).toContain('Order=desc');
	});

	it('includes index=0 and batchSize=0 when explicitly set', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 })
		);

		await api.getMessages('session-1', {
			index: 0,
			batchSize: 0,
		});

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [urlArg] = fetchSpy.mock.calls[0];
		const url = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

		expect(url).toContain('Index=0');
		expect(url).toContain('BatchSize=0');
	});

	it('throws on non-200 response', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
		);

		await expect(api.getMessages('session-1')).rejects.toThrow();
	});

	// Plan §6.5.2 / §7.3 scenario 9 — backend embeds `vibeRequests`
	// alongside `chats` so a single `getMessages` round-trip carries
	// the per-request simulation rows. The frontend cache reads this
	// field directly; if the wire shape changes (e.g. nested under
	// `chats[*].vibeRequest`) the rehydration path silently breaks.
	it('exposes embedded `vibeRequests` from getMessages response', async () => {
		const responseWithEmbedded: ChatMessagesResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: {
				chats: [],
				vibeRequests: [
					{
						id: 'req-1',
						creationTimeInMs: 100,
						activeAction: null,
						isClosed: false,
						beforeScheduleId: null,
						afterScheduleId: null,
						actions: [],
						preview: {
							id: 'prev-1',
							vibeRequestId: 'req-1',
							tilerUserId: 'u',
							creationTimeInMs: 100,
							state: SimulationState.Ready,
							previewActions: [],
						},
					},
				],
			},
			ServerStatus: null,
		};
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(responseWithEmbedded), { status: 200 })
		);

		const result = await api.getMessages('session-1');

		expect(result.Content.vibeRequests).toBeDefined();
		expect(result.Content.vibeRequests).toHaveLength(1);
		expect(result.Content.vibeRequests?.[0].id).toBe('req-1');
		expect(result.Content.vibeRequests?.[0].preview?.state).toBe(SimulationState.Ready);
	});

	// Plan §6.6.5 / §7.3 — anonymous-user threading on the per-request
	// simulation poll. Without the AnonymousUserId param, the backend's
	// anonymous filter rejects the read on refresh-rehydrated sessions.
	it('appends AnonymousUserId to getSimulationForRequest URL', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ Error: null, Content: null, ServerStatus: null }), {
				status: 200,
			})
		);

		await api.getSimulationForRequest('req-42', 'anon-user-99');

		const [urlArg] = fetchSpy.mock.calls[0];
		const url = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;
		expect(url).toContain('api/Vibe/Request/req-42/Preview');
		expect(url).toContain('AnonymousUserId=anon-user-99');
	});

	it('omits the query string for getSimulationForRequest when no anonymousUserId', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ Error: null, Content: null, ServerStatus: null }), {
				status: 200,
			})
		);

		await api.getSimulationForRequest('req-42');

		const [urlArg] = fetchSpy.mock.calls[0];
		const url = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;
		expect(url).toContain('api/Vibe/Request/req-42/Preview');
		expect(url).not.toContain('AnonymousUserId');
		expect(url).not.toContain('?');
	});
});
