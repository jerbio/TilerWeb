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

	/** Reads the replies under a single root comment (two-level thread). */
	getReplies(rootCommentId: string, params: GetRepliesParams = {}) {
		const qs =
			'?' +
			new URLSearchParams(
				Object.entries(params)
					.filter(([, v]) => v !== undefined && v !== '')
					.map(([k, v]) => [k, String(v)])
			).toString();
		return this.apiRequest<CommentListResponse>(
			`api/Comments/${encodeURIComponent(rootCommentId)}/replies${qs}`
		);
	}

	createComment(body: CreateCommentParams) {
		return this.apiRequest<CommentSingleResponse>('api/Comments', {
			method: 'POST',
			body: JSON.stringify(body),
		});
	}

	updateComment(commentId: string, body: UpdateCommentParams) {
		return this.apiRequest<CommentSingleResponse>(
			`api/Comments/${encodeURIComponent(commentId)}`,
			{
				method: 'PUT',
				body: JSON.stringify(body),
			}
		);
	}

	deleteComment(commentId: string, body: DeleteCommentParams) {
		return this.apiRequest<CommentSingleResponse>(
			`api/Comments/${encodeURIComponent(commentId)}`,
			{
				method: 'DELETE',
				body: JSON.stringify(body),
			}
		);
	}
}
