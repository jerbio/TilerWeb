import { vi } from 'vitest';
import { ChatSessionExecutionMode } from '@/core/common/types/chat';
import ChatService from '../chatService';
import type { ChatApi } from '@/api/chatApi';
import type { ChatMessagesResponse } from '@/core/common/types/chat';

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
});

it('defaults TileShare to confirm first and forwards explicit auto act', async () => {
	const api = { sendMessage: vi.fn().mockResolvedValue({ Content: {} }) } as unknown as ChatApi;
	const service = new ChatService(api);
	await service.sendMessage('Create Launch', '');
	expect(api.sendMessage).toHaveBeenLastCalledWith(
		expect.objectContaining({ ChatSessionExecutionMode: 'ConfirmFirst' })
	);
	await service.sendMessage(
		'Create Launch',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		ChatSessionExecutionMode.AutoAct
	);
	expect(api.sendMessage).toHaveBeenLastCalledWith(
		expect.objectContaining({ ChatSessionExecutionMode: 'AutoAct' })
	);
});
