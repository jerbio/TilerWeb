import { AppApi } from './appApi';
import {
	CommentListResponse,
	CommentSingleResponse,
	CreateCommentParams,
	DeleteCommentParams,
	GetCommentsParams,
	GetRepliesParams,
	UpdateCommentParams,
} from '@/core/common/types/comment';

/**
 * Thin HTTP client for the generic comment API. Mirrors the TileshareApi
 * conventions: query strings via URLSearchParams (omitting undefined/empty
 * values), JSON bodies for mutations, and the shared AppApi error handling.
 */
export class CommentsApi extends AppApi {
	getComments(params: GetCommentsParams) {
		const qs =
			'?' +
			new URLSearchParams(
				Object.entries(params)
					.filter(([, v]) => v !== undefined && v !== '')
					.map(([k, v]) => [k, String(v)])
			).toString();
		return this.apiRequest<CommentListResponse>(`api/Comments${qs}`);
	}

	/**
	 * Reads the replies under a single root comment (two-level thread). The comment
	 * id travels in the query string, not the path: ids are '+'-separated composites
	 * and IIS Express rejects any request URL whose path contains a '+'.
	 */
	getReplies(rootCommentId: string, params: GetRepliesParams = {}) {
		const entries: Record<string, string> = {
			commentId: rootCommentId,
		};
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== '') entries[k] = String(v);
		}
		const qs = '?' + new URLSearchParams(entries).toString();
		return this.apiRequest<CommentListResponse>(`api/Comments/replies${qs}`);
	}

	createComment(body: CreateCommentParams) {
		return this.apiRequest<CommentSingleResponse>('api/Comments', {
			method: 'POST',
			body: JSON.stringify(body),
		});
	}

	/** Edits a comment. The id is a query parameter (IIS Express 404s on '+' in paths). */
	updateComment(commentId: string, body: UpdateCommentParams) {
		return this.apiRequest<CommentSingleResponse>(
			`api/Comments?id=${encodeURIComponent(commentId)}`,
			{
				method: 'PUT',
				body: JSON.stringify(body),
			}
		);
	}

	deleteComment(commentId: string, body: DeleteCommentParams) {
		return this.apiRequest<CommentSingleResponse>(
			`api/Comments?id=${encodeURIComponent(commentId)}`,
			{
				method: 'DELETE',
				body: JSON.stringify(body),
			}
		);
	}
}
