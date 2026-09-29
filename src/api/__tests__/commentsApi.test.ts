import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const requestOf = (call: unknown[]) => {
	const first = call[0];
	return first instanceof Request ? first : new Request(String(first), call[1] as RequestInit);
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

	describe('getReplies', () => {
		it('puts the comment id in the query string, not the path', async () => {
			fetchSpy.mockResolvedValueOnce(
				json(envelope({ comments: [], nextCursor: null, total: 0 }))
			);

			await api.getReplies('Comment+tileshare_tilette+abc+def', { limit: 50 });

			const url = urlOf(fetchSpy.mock.calls[0]);
			expect(url).toContain('api/Comments/replies');
			expect(url).toContain('commentId=Comment%2Btileshare_tilette%2Babc%2Bdef');
			expect(url).toContain('limit=50');
			// The id must never appear as a path segment (IIS Express 404s on '+' paths).
			expect(url).not.toMatch(/replies\/[^?]+/);
			expect(methodOf(fetchSpy.mock.calls[0])).toBe('GET');
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
		it('sends a PUT with the comment id as a query parameter', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ comment: mockComment })));
			await api.updateComment('Comment+abc', { text: 'edited', idempotencyKey: 'k2' });
			const call = fetchSpy.mock.calls[0];
			const url = urlOf(call);
			expect(url).toContain('api/Comments?id=Comment%2Babc');
			expect(url).not.toContain('api/Comments/');
			expect(methodOf(call)).toBe('PUT');
		});
	});

	describe('deleteComment', () => {
		it('sends a DELETE with the comment id as a query parameter', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ comment: mockComment })));
			await api.deleteComment('Comment+abc', { idempotencyKey: 'k3' });
			const call = fetchSpy.mock.calls[0];
			const url = urlOf(call);
			expect(url).toContain('api/Comments?id=Comment%2Babc');
			expect(url).not.toContain('api/Comments/');
			expect(methodOf(call)).toBe('DELETE');
		});
	});

	describe('getParticipants', () => {
		it('requests the participants for a target', async () => {
			fetchSpy.mockResolvedValueOnce(
				json(
					envelope({ participants: [{ id: 'u1', displayName: 'Ada', isViewer: false }] })
				)
			);
			const res = await api.getParticipants({
				targetType: 'tileshare_tilette',
				targetId: 't1',
			});
			const url = urlOf(fetchSpy.mock.calls[0]);
			expect(url).toContain('api/Comments/participants');
			expect(url).toContain('targetType=tileshare_tilette');
			expect(url).toContain('targetId=t1');
			expect(res.Content.participants).toHaveLength(1);
		});
	});

	describe('attachments', () => {
		const attachment = {
			id: '01HATTACH',
			fileName: 'a.pdf',
			contentType: 'application/pdf',
			byteSize: 3,
			state: 'ready',
		};

		class FakeXhr {
			static last: FakeXhr;
			upload: { onprogress: ((e: Partial<ProgressEvent>) => void) | null } = {
				onprogress: null,
			};
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;
			withCredentials = false;
			status = 0;
			responseText = '';
			method = '';
			url = '';
			body: unknown;
			open(method: string, url: string) {
				this.method = method;
				this.url = url;
			}
			send(body: unknown) {
				this.body = body;
				FakeXhr.last = this;
			}
			respond(status: number, text: string) {
				this.status = status;
				this.responseText = text;
				this.onload?.();
			}
		}

		const upload = (onProgress?: (fraction: number) => void) =>
			api.uploadAttachment(
				{
					targetType: 'tileshare_tilette',
					targetId: 't1',
					retryKey: 'rk-1',
					file: new File(['abc'], 'a.pdf', { type: 'application/pdf' }),
				},
				onProgress
			);

		beforeEach(() => {
			vi.stubGlobal('XMLHttpRequest', FakeXhr);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('uploads multipart with credentials, the file part last, and reports progress', async () => {
			const onProgress = vi.fn();
			const pending = upload(onProgress);
			const xhr = FakeXhr.last;

			expect(xhr.method).toBe('POST');
			expect(xhr.url).toContain('api/CommentAttachments');
			expect(xhr.withCredentials).toBe(true);
			const form = xhr.body as FormData;
			expect(Array.from(form.keys())).toEqual(['targetType', 'targetId', 'retryKey', 'file']);
			expect(form.get('retryKey')).toBe('rk-1');

			xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 4 });
			expect(onProgress).toHaveBeenLastCalledWith(0.25);

			xhr.respond(200, envelope({ attachment }));
			const res = await pending;
			expect(res.Content.attachment).toEqual(attachment);
		});

		it('rejects with the server error envelope on a failed upload', async () => {
			const pending = upload();
			FakeXhr.last.respond(
				400,
				JSON.stringify({ Error: { Code: '400', Message: 'bad' }, Content: null })
			);
			await expect(pending).rejects.toMatchObject({ Error: { Code: '400' } });
		});

		it('rejects on a network error', async () => {
			const pending = upload();
			FakeXhr.last.onerror?.();
			await expect(pending).rejects.toThrow();
		});

		it('cancels an attachment with DELETE', async () => {
			fetchSpy.mockResolvedValueOnce(json(envelope({ id: '01HATTACH' })));
			await api.deleteAttachment('01HATTACH');
			const call = fetchSpy.mock.calls[0];
			expect(urlOf(call)).toContain('api/CommentAttachments/01HATTACH');
			expect(methodOf(call)).toBe('DELETE');
		});

		it('downloads the file as a blob with credentials', async () => {
			fetchSpy.mockResolvedValueOnce(new Response('abc', { status: 200 }));
			const blob = await api.downloadAttachment('01HATTACH');
			const call = fetchSpy.mock.calls[0];
			expect(urlOf(call)).toContain('api/CommentAttachments/01HATTACH/download');
			expect(requestOf(call).credentials).toBe('include');
			expect(blob.size).toBe(3);
		});

		it('rejects a failed download', async () => {
			fetchSpy.mockResolvedValueOnce(new Response('', { status: 404 }));
			await expect(api.downloadAttachment('01HATTACH')).rejects.toThrow();
		});
	});
});
