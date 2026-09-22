import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentsApi } from '../commentsApi';
import { CommentTargetType } from '@/core/common/types/comment';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

const mockComment = {
	id: 'Comment+abc',
	targetType: 'tileshare_tilette',
	targetId: 'TileShareTemplate+abc+def',
	author: { id: 'user-1', displayName: 'Alice', isOwner: true, isDeleted: false },
	text: 'Hello',
	createdAt: 1750000000000,
	editedAt: null,
	deletedAt: null,
	isDeleted: false,
	canEdit: true,
	canDelete: true,
	hasReplies: false,
};

const envelope = (content: unknown) =>
	JSON.stringify({
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: content,
		ServerStatus: null,
	});

const json = (body: string) =>
	new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });

const urlOf = (call: unknown[]) => {
	const first = call[0];
	return first instanceof Request ? first.url : String(first);
};

const methodOf = (call: unknown[]) => {
	const first = call[0];
	const options = call[1] as RequestInit | undefined;
	return (first instanceof Request ? first.method : options?.method) ?? 'GET';
};

describe('CommentsApi', () => {
	let api: CommentsApi;

	beforeEach(() => {
		api = new CommentsApi();
		fetchSpy.mockReset();
	});

	describe('getComments', () => {
		it('builds the query string from params and returns content', async () => {
			fetchSpy.mockResolvedValueOnce(
				json(envelope({ comments: [mockComment], nextCursor: null, total: 1 }))
			);

			const res = await api.getComments({
				targetType: CommentTargetType.TileshareTilette,
				targetId: 'TileShareTemplate+abc+def',
				limit: 50,
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			const url = urlOf(fetchSpy.mock.calls[0]);
			expect(url).toContain('api/Comments');
			expect(url).toContain('targetType=tileshare_tilette');
			expect(url).toContain('targetId=');
			expect(url).toContain('limit=50');
			expect(methodOf(fetchSpy.mock.calls[0])).toBe('GET');
			expect(res.Content.comments).toHaveLength(1);
		});

		it('omits an empty cursor from the query', async () => {
			fetchSpy.mockResolvedValueOnce(
				json(envelope({ comments: [], nextCursor: null, total: 0 }))
			);
			await api.getComments({ targetType: 'tileshare_tilette', targetId: 't', cursor: '' });
			expect(urlOf(fetchSpy.mock.calls[0])).not.toContain('cursor=');
		});

		it('includes the cursor when provided', async () => {
			fetchSpy.mockResolvedValueOnce(
				json(envelope({ comments: [], nextCursor: null, total: 0 }))
			);
			await api.getComments({
				targetType: 'tileshare_tilette',
				targetId: 't',
				cursor: 'c123',
			});
			expect(urlOf(fetchSpy.mock.calls[0])).toContain('cursor=c123');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getComments({ targetType: 'x', targetId: 'y' })).rejects.toThrow();
		});
	});

	describe('createComment', () => {
		it('sends a POST with a JSON body including the idempotency key', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ comment: mockComment })));
			const body = {
				targetType: 'tileshare_tilette',
				targetId: 'TileShareTemplate+abc+def',
				text: 'Hello',
				idempotencyKey: 'key-1',
			};

			await api.createComment(body);

			const call = fetchSpy.mock.calls[0];
			expect(urlOf(call)).toContain('api/Comments');
			expect(methodOf(call)).toBe('POST');
			const first = call[0];
			const bodyStr =
				first instanceof Request ? await first.text() : (call[1] as RequestInit).body;
			const parsed = JSON.parse(bodyStr as string);
			expect(parsed.idempotencyKey).toBe('key-1');
		});
	});

	describe('updateComment', () => {
		it('sends a PUT to the comment id with a JSON body', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ comment: mockComment })));
			await api.updateComment('Comment+abc', { text: 'edited', idempotencyKey: 'k2' });
			const call = fetchSpy.mock.calls[0];
			expect(urlOf(call)).toContain('api/Comments/');
			expect(methodOf(call)).toBe('PUT');
		});
	});

	describe('deleteComment', () => {
		it('sends a DELETE to the comment id with a JSON body', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ comment: mockComment })));
			await api.deleteComment('Comment+abc', { idempotencyKey: 'k3' });
			const call = fetchSpy.mock.calls[0];
			expect(urlOf(call)).toContain('api/Comments/');
			expect(methodOf(call)).toBe('DELETE');
		});
	});
});
