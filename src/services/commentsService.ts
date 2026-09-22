import { CommentsApi } from '@/api/commentsApi';
import {
	CommentView,
	CreateCommentParams,
	DeleteCommentParams,
	GetCommentsParams,
	UpdateCommentParams,
} from '@/core/common/types/comment';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';

/**
 * Generates a UUID idempotency key for safe comment retries. Uses
 * crypto.randomUUID when available and falls back to a manual v4 generator for
 * environments without it (jsdom, older browsers).
 */
export function generateIdempotencyKey(): string {
	const c = globalThis.crypto;
	if (c && typeof c.randomUUID === 'function') {
		return c.randomUUID();
	}
	const bytes = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(
		20
	)}`;
}

/**
 * Single-flight in-flight request dedupe. Concurrent mutations that share an
 * idempotency key resolve to one network call, so a rapid double-tap does not
 * issue two requests. The server enforces the final uniqueness; this only
 * avoids a redundant round-trip. The key is cleared as soon as the flight
 * settles so a later, genuinely-new operation with the same key is allowed.
 */
const inflight = new Map<string, Promise<unknown>>();

function withSingleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
	const existing = inflight.get(key);
	if (existing) {
		return existing as Promise<T>;
	}
	const p = run().finally(() => {
		inflight.delete(key);
	});
	inflight.set(key, p);
	return p;
}

/**
 * Comment service. Owns the HTTP client and unwraps the ApiResponse envelope:
 * a present, non-zero Error.Code is a logical failure and is thrown as a
 * TilerResponseError; otherwise Content is returned. All rejections are
 * normalized via the shared normalizeError helper.
 */
class CommentsService {
	private api: CommentsApi;

	constructor(api: CommentsApi) {
		this.api = api;
	}

	/**
	 * Fetches a page of comments for a target. Returns the unwrapped content:
	 * `{ comments, nextCursor, total }`.
	 */
	async getComments(params: GetCommentsParams) {
		try {
			const res = await this.api.getComments(params);
			if (res.Error && res.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(res.Error);
			}
			return res.Content;
		} catch (error) {
			console.error('Error fetching comments', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Creates a comment. The same idempotency key is single-flight de-duped so
	 * a double submit issues one request. Returns the persisted CommentView.
	 */
	async createComment(params: CreateCommentParams): Promise<CommentView> {
		return withSingleFlight(`comment:create:${params.idempotencyKey}`, async () => {
			try {
				const res = await this.api.createComment(params);
				if (res.Error && res.Error.Code !== '0') {
					throw TilerResponseError.fromApiCodeResponse(res.Error);
				}
				return res.Content.comment;
			} catch (error) {
				console.error('Error creating comment', error);
				throw normalizeError(error);
			}
		});
	}

	/**
	 * Edits a comment. Single-flight de-duped on (commentId, idempotencyKey).
	 */
	async updateComment(commentId: string, params: UpdateCommentParams): Promise<CommentView> {
		return withSingleFlight(`comment:edit:${commentId}:${params.idempotencyKey}`, async () => {
			try {
				const res = await this.api.updateComment(commentId, params);
				if (res.Error && res.Error.Code !== '0') {
					throw TilerResponseError.fromApiCodeResponse(res.Error);
				}
				return res.Content.comment;
			} catch (error) {
				console.error('Error updating comment', error);
				throw normalizeError(error);
			}
		});
	}

	/**
	 * Soft-deletes a comment. Single-flight de-duped on (commentId, key).
	 */
	async deleteComment(commentId: string, params: DeleteCommentParams): Promise<void> {
		return withSingleFlight(
			`comment:delete:${commentId}:${params.idempotencyKey}`,
			async () => {
				try {
					const res = await this.api.deleteComment(commentId, params);
					if (res.Error && res.Error.Code !== '0') {
						throw TilerResponseError.fromApiCodeResponse(res.Error);
					}
				} catch (error) {
					console.error('Error deleting comment', error);
					throw normalizeError(error);
				}
			}
		);
	}
}

export default CommentsService;
