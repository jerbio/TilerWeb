import { vi } from 'vitest';
import { ChatApi } from '../chatApi';
import type { ChatMessagesResponse } from '@/core/common/types/chat';

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

	it('builds base getMessages URL with SessionId', async () => {
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 }),
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
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 }),
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
			new Response(JSON.stringify(mockMessagesResponse), { status: 200 }),
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
			new Response(JSON.stringify({ error: 'Server error' }), { status: 500 }),
		);

		await expect(api.getMessages('session-1')).rejects.toThrow();
	});
});

