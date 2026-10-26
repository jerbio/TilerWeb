import { AppApi } from './appApi';
import ServerError from '@/core/error/server';
import {
	AttachmentSingleResponse,
	CommentListResponse,
	CommentSingleResponse,
	CreateCommentParams,
	DeleteCommentParams,
	GetCommentsParams,
	GetParticipantsParams,
	ParticipantsResponse,
	UploadAttachmentParams,
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

	/** People who can read the target and may be mentioned. */
	getParticipants({ targetType, targetId }: GetParticipantsParams) {
		const qs = new URLSearchParams({ targetType, targetId }).toString();
		return this.apiRequest<ParticipantsResponse>(`api/Comments/participants?${qs}`);
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

	/** Uses XMLHttpRequest because fetch cannot report upload progress. */
	uploadAttachment(
		{ targetType, targetId, retryKey, file }: UploadAttachmentParams,
		onProgress?: (fraction: number) => void
	): Promise<AttachmentSingleResponse> {
		// The server streams the body and requires the text fields before the single, last file part.
		const form = new FormData();
		form.append('targetType', targetType);
		form.append('targetId', targetId);
		form.append('retryKey', retryKey);
		form.append('file', file, file.name);
		const endpoint = this.getUri('api/CommentAttachments');

		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', endpoint);
			xhr.withCredentials = true;
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable && e.total > 0) onProgress?.(e.loaded / e.total);
			};
			xhr.onload = () => {
				let body: unknown;
				try {
					body = JSON.parse(xhr.responseText);
				} catch {
					body = undefined;
				}
				if (xhr.status >= 200 && xhr.status < 300 && body) {
					resolve(body as AttachmentSingleResponse);
				} else if (body && typeof body === 'object' && 'Error' in body) {
					reject(body);
				} else {
					reject(
						new ServerError(
							`HTTP error! status: ${xhr.status}`,
							endpoint,
							body,
							xhr.status
						)
					);
				}
			};
			xhr.onerror = () => reject(new ServerError('Network error', endpoint, undefined, 0));
			xhr.onabort = () => reject(new ServerError('Upload aborted', endpoint, undefined, 0));
			xhr.send(form);
		});
	}

	deleteAttachment(attachmentId: string) {
		return this.apiRequest<{ Error: { Code: string; Message: string } }>(
			`api/CommentAttachments/${encodeURIComponent(attachmentId)}`,
			{ method: 'DELETE' }
		);
	}

	/** Fetches file bytes with the session cookie; a plain link would not carry credentials cross-origin. */
	async downloadAttachment(attachmentId: string): Promise<Blob> {
		const endpoint = this.getUri(
			`api/CommentAttachments/${encodeURIComponent(attachmentId)}/download`
		);
		const res = await fetch(endpoint, { method: 'GET', credentials: 'include' });
		if (!res.ok) {
			throw new ServerError(
				`HTTP error! status: ${res.status}`,
				endpoint,
				undefined,
				res.status
			);
		}
		return res.blob();
	}
}
