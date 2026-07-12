import { vi } from 'vitest';
import ChatService from '../chatService';
import type { ChatApi } from '@/api/chatApi';
import type { ChatMessagesResponse, ChatSendMessageResponse } from '@/core/common/types/chat';

describe('ChatService', () => {
	const mockResponse: ChatMessagesResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: { chats: [] },
		ServerStatus: null,
	};

	it('forwards pagination params to chatApi.getMessages', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockResolvedValue(mockResponse),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);
		const result = await service.getMessages('session-123', {
			index: 20,
			batchSize: 10,
			order: 'desc',
			anonymousUserId: 'anon-123',
		});

		expect(chatApiMock.getMessages).toHaveBeenCalledWith('session-123', {
			index: 20,
			batchSize: 10,
			order: 'desc',
			anonymousUserId: 'anon-123',
		});
		expect(result).toEqual(mockResponse);
	});

	it('calls chatApi.getMessages without pagination when not provided', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockResolvedValue(mockResponse),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);
		const result = await service.getMessages('session-456');

		expect(chatApiMock.getMessages).toHaveBeenCalledWith('session-456', undefined);
		expect(result).toEqual(mockResponse);
	});

	it('propagates errors from chatApi.getMessages', async () => {
		const chatApiMock = {
			getMessages: vi.fn().mockRejectedValue(new Error('Network error')),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);

		await expect(service.getMessages('session-789')).rejects.toThrow('Network error');
	});

	// M6.1: Unified Research Path DeepThinking toggle wiring.
	// chatService.sendMessage must forward the toggle as `DeepThinking`
	// in the POST body so the backend can stamp VibeRequest.ThinkingMode = Deep.
	describe('sendMessage DeepThinking wiring (M6.1)', () => {
		const sendResponse: ChatSendMessageResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: { vibeResponse: { prompts: {} } },
			ServerStatus: null,
		} as unknown as ChatSendMessageResponse;

		function buildMock() {
			return {
				sendMessage: vi.fn().mockResolvedValue(sendResponse),
			} as unknown as ChatApi;
		}

		it('omits DeepThinking truthy flag by default (toggle off)', async () => {
			const mock = buildMock();
			const service = new ChatService(mock);

			await service.sendMessage('hello', 'entity-1');

			expect(mock.sendMessage).toHaveBeenCalledTimes(1);
			const body = (mock.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0][0];
			// Default must be false (or absent) so the backend treats it as
			// "user did not toggle DeepThinking" and lets the classifier decide.
			expect(body.DeepThinking).toBeFalsy();
		});

		it('forwards DeepThinking=true when toggle is on', async () => {
			const mock = buildMock();
			const service = new ChatService(mock);

			await service.sendMessage(
				'plan my deep dive',
				'entity-1',
				'',
				'',
				'',
				'',
				'',
				'',
				'',
				true
			);

			expect(mock.sendMessage).toHaveBeenCalledTimes(1);
			const body = (mock.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(body.DeepThinking).toBe(true);
			// Sanity: other required fields still populated.
			expect(body.ChatMessage).toBe('plan my deep dive');
			expect(body.EntityId).toBe('entity-1');
		});

		it('forwards DeepThinking=false when toggle is explicitly off', async () => {
			const mock = buildMock();
			const service = new ChatService(mock);

			await service.sendMessage('just chat', 'entity-1', '', '', '', '', '', '', '', false);

			const body = (mock.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(body.DeepThinking).toBe(false);
		});
	});
});
