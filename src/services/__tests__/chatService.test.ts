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

	it('includes location fields when sending a message', async () => {
		const sendResponse: ChatSendMessageResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: { vibeResponse: { prompts: {} } },
			ServerStatus: null,
		};
		const chatApiMock = {
			sendMessage: vi.fn().mockResolvedValue(sendResponse),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);

		await service.sendMessage(
			'Schedule lunch',
			'entity-1',
			'session-1',
			'anon-1',
			'',
			'',
			'false'
		);

		expect(chatApiMock.sendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				UserLongitude: '',
				UserLatitude: '',
				UserLocationVerified: 'false',
			})
		);
	});

	it('passes location fields when accepting changes', async () => {
		const chatApiMock = {
			executeActions: vi.fn().mockResolvedValue({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: { vibeRequest: {} },
				ServerStatus: null,
			}),
		} as unknown as ChatApi;

		const service = new ChatService(chatApiMock);

		await service.sendChatAcceptChanges('request-1', 'anon-1', '', '', 'false');

		expect(chatApiMock.executeActions).toHaveBeenCalledWith(
			'request-1',
			'anon-1',
			'',
			'',
			'false'
		);
	});
});
