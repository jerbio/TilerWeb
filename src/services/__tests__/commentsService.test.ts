import { describe, it, expect, vi } from 'vitest';
import CommentsService, {
	generateIdempotencyKey,
	validateAttachmentFile,
} from '../commentsService';
import { MAX_ATTACHMENT_BYTES } from '@/core/common/types/comment';
import type { CommentsApi } from '@/api/commentsApi';

const ok = (content: unknown) => ({
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: content,
	ServerStatus: null,
});

const fail = {
	Error: { Code: '500', Message: 'boom' },
	Content: null,
	ServerStatus: null,
};

const mockComment = {
	id: 'c1',
	targetType: 'tileshare_tilette',
	targetId: 't',
	author: { id: 'user-1', displayName: 'Alice', isOwner: true, isDeleted: false },
	text: 'hi',
	createdAt: 1750000000000,
	editedAt: null,
	deletedAt: null,
	isDeleted: false,
	canEdit: true,
	canDelete: true,
	hasReplies: false,
	replyCount: 0,
};

describe('CommentsService', () => {
	describe('getComments', () => {
		it('returns unwrapped content on success', async () => {
			const apiMock = {
				getComments: vi
					.fn()
					.mockResolvedValue(ok({ comments: [mockComment], nextCursor: null, total: 1 })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			const params = { targetType: 'tileshare_tilette', targetId: 't', limit: 50 };

			const res = await svc.getComments(params);

			expect(apiMock.getComments).toHaveBeenCalledWith(params);
			expect(res).toEqual({ comments: [mockComment], nextCursor: null, total: 1 });
		});

		it('throws on a non-zero error code', async () => {
			const apiMock = {
				getComments: vi.fn().mockResolvedValue(fail),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(svc.getComments({ targetType: 'x', targetId: 'y' })).rejects.toThrow();
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getComments: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(svc.getComments({ targetType: 'x', targetId: 'y' })).rejects.toThrow();
		});
	});

	describe('getReplies', () => {
		it('returns unwrapped content on success', async () => {
			const apiMock = {
				getReplies: vi
					.fn()
					.mockResolvedValue(ok({ comments: [mockComment], nextCursor: null, total: 1 })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);

			const res = await svc.getReplies('c1', { limit: 50 });

			expect(apiMock.getReplies).toHaveBeenCalledWith('c1', { limit: 50 });
			expect(res).toEqual({ comments: [mockComment], nextCursor: null, total: 1 });
		});

		it('throws on a non-zero error code', async () => {
			const apiMock = {
				getReplies: vi.fn().mockResolvedValue(fail),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(svc.getReplies('c1')).rejects.toThrow();
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getReplies: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(svc.getReplies('c1')).rejects.toThrow();
		});
	});

	describe('createComment', () => {
		it('returns the created comment and forwards params', async () => {
			const apiMock = {
				createComment: vi.fn().mockResolvedValue(ok({ comment: mockComment })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			const params = {
				targetType: 'tileshare_tilette',
				targetId: 't',
				text: 'hi',
				idempotencyKey: 'keyA',
			};

			const res = await svc.createComment(params);

			expect(apiMock.createComment).toHaveBeenCalledWith(params);
			expect(res).toEqual(mockComment);
		});

		it('single-flights concurrent creates that share an idempotency key', async () => {
			let resolveFn!: (v: { comment: unknown }) => void;
			const gate = new Promise<{ comment: unknown }>((r) => (resolveFn = r));
			const apiMock = {
				createComment: vi.fn().mockImplementation(() => gate.then((v) => ok(v))),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			const params = {
				targetType: 'tileshare_tilette',
				targetId: 't',
				text: 'hi',
				idempotencyKey: 'sameKey',
			};

			const p1 = svc.createComment(params);
			const p2 = svc.createComment(params);
			resolveFn({ comment: mockComment });
			await Promise.all([p1, p2]);

			expect(apiMock.createComment).toHaveBeenCalledTimes(1);
		});

		it('allows a new request after a settled flight with the same key', async () => {
			const apiMock = {
				createComment: vi.fn().mockResolvedValue(ok({ comment: mockComment })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			const params = {
				targetType: 'tileshare_tilette',
				targetId: 't',
				text: 'hi',
				idempotencyKey: 'keyB',
			};

			await svc.createComment(params);
			await svc.createComment(params);

			expect(apiMock.createComment).toHaveBeenCalledTimes(2);
		});

		it('throws on a non-zero error code', async () => {
			const apiMock = {
				createComment: vi.fn().mockResolvedValue(fail),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(
				svc.createComment({
					targetType: 'x',
					targetId: 'y',
					text: 'z',
					idempotencyKey: 'keyC',
				})
			).rejects.toThrow();
		});
	});

	describe('updateComment', () => {
		it('calls the api with the comment id and body', async () => {
			const apiMock = {
				updateComment: vi.fn().mockResolvedValue(ok({ comment: mockComment })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);

			await svc.updateComment('c1', { text: 'edited', idempotencyKey: 'k' });

			expect(apiMock.updateComment).toHaveBeenCalledWith('c1', {
				text: 'edited',
				idempotencyKey: 'k',
			});
		});
	});

	describe('deleteComment', () => {
		it('calls the api with the comment id and body', async () => {
			const apiMock = {
				deleteComment: vi.fn().mockResolvedValue(ok({ comment: mockComment })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);

			await svc.deleteComment('c1', { idempotencyKey: 'k' });

			expect(apiMock.deleteComment).toHaveBeenCalledWith('c1', { idempotencyKey: 'k' });
		});
	});

	describe('attachments', () => {
		const attachment = {
			id: 'a1',
			fileName: 'a.pdf',
			contentType: 'application/pdf',
			byteSize: 3,
			state: 'ready',
		};
		const file = new File(['abc'], 'a.pdf', { type: 'application/pdf' });

		it('uploads and unwraps the attachment, forwarding progress', async () => {
			const apiMock = {
				uploadAttachment: vi.fn().mockResolvedValue(ok({ attachment })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			const params = { targetType: 'tileshare_tilette', targetId: 't', retryKey: 'rk', file };
			const onProgress = vi.fn();

			const res = await svc.uploadAttachment(params, onProgress);

			expect(apiMock.uploadAttachment).toHaveBeenCalledWith(params, onProgress);
			expect(res).toEqual(attachment);
		});

		it('rejects an upload the server answers with an error code', async () => {
			const apiMock = {
				uploadAttachment: vi.fn().mockResolvedValue(fail),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await expect(
				svc.uploadAttachment({ targetType: 'x', targetId: 'y', retryKey: 'rk', file })
			).rejects.toThrow();
		});

		it('forwards cancel to the api', async () => {
			const apiMock = {
				deleteAttachment: vi.fn().mockResolvedValue(ok({ id: 'a1' })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			await svc.deleteAttachment('a1');
			expect(apiMock.deleteAttachment).toHaveBeenCalledWith('a1');
		});
	});

	describe('getParticipants', () => {
		it('returns the unwrapped participant list', async () => {
			const participants = [{ id: 'u1', displayName: 'Ada', isViewer: false }];
			const apiMock = {
				getParticipants: vi.fn().mockResolvedValue(ok({ participants })),
			} as unknown as CommentsApi;
			const svc = new CommentsService(apiMock);
			expect(await svc.getParticipants({ targetType: 'x', targetId: 'y' })).toEqual(
				participants
			);
		});
	});

	describe('validateAttachmentFile', () => {
		it('accepts the allowlisted types within the size limit', () => {
			for (const name of ['a.pdf', 'b.docx', 'c.png', 'd.jpg', 'e.JPEG']) {
				expect(validateAttachmentFile(new File(['x'], name))).toBeNull();
			}
		});

		it('rejects other types, empty files and oversize files', () => {
			expect(validateAttachmentFile(new File(['x'], 'a.exe'))).toBe('type');
			expect(validateAttachmentFile(new File(['x'], 'noext'))).toBe('type');
			expect(validateAttachmentFile(new File([], 'a.pdf'))).toBe('empty');
			const big = new File(['x'], 'big.pdf');
			Object.defineProperty(big, 'size', { value: MAX_ATTACHMENT_BYTES + 1 });
			expect(validateAttachmentFile(big)).toBe('size');
		});
	});

	describe('generateIdempotencyKey', () => {
		it('produces a v4-shaped uuid', () => {
			const key = generateIdempotencyKey();
			expect(key).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
			);
		});

		it('is unique across calls', () => {
			const a = generateIdempotencyKey();
			const b = generateIdempotencyKey();
			expect(a).not.toBe(b);
		});
	});
});
