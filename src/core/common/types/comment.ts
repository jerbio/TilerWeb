import { ApiResponse } from './api';

/**
 * Generic comment types for cross-entity conversations (TileShare tilette detail
 * pages first). Field casing is camelCase to match the .NET DTO contract, which
 * is pinned server-side with [JsonProperty]. The wire envelope is the standard
 * `ApiResponse<T>` ({ Error, Content, ServerStatus }).
 */

/** Author of a comment. Attribution is always server-computed from the
 * authenticated context — the client never supplies author identity. */
export type CommentAuthor = {
	id: string | null;
	displayName: string | null;
	isOwner: boolean | null;
	isDeleted: boolean | null;
	/** True when the author is the signed-in viewer. */
	isViewer?: boolean | null;
};

/** A person shown next to a comment (mention or reply author); deleted accounts carry no name. */
export type CommentPerson = {
	id: string;
	displayName: string | null;
	isDeleted: boolean;
};

/** Someone who can read the target and can therefore be mentioned. */
export type CommentParticipant = {
	id: string;
	displayName: string;
	isViewer: boolean;
};

export type GetParticipantsParams = {
	targetType: string;
	targetId: string;
};

export type ParticipantsResponse = ApiResponse<{
	participants: CommentParticipant[];
}>;

/** A single comment as it is projected over the wire. */
export type CommentView = {
	id: string;
	targetType: string;
	targetId: string;
	author: CommentAuthor | null;
	text: string;
	/** epoch ms */
	createdAt: number | null;
	/** epoch ms, null when never edited */
	editedAt: number | null;
	/** epoch ms, null when not deleted (soft delete preserves the row) */
	deletedAt: number | null;
	isDeleted: boolean | null;
	/** Whether the current viewer may edit this comment (server-computed). */
	canEdit: boolean | null;
	/** Whether the current viewer may delete this comment (server-computed). */
	canDelete: boolean | null;
	/** Two-level thread: the root this row replies to; null when this row is a root. */
	rootCommentId: string | null;
	/** True when this row is a reply to a root (false for roots). */
	isReply: boolean | null;
	/** True when a root has at least one (non-deleted) reply. */
	hasReplies: boolean | null;
	/** Number of non-deleted replies for a root; always 0 for replies. */
	replyCount: number;
	/** Files claimed into this comment; empty for deleted comments. */
	attachments?: AttachmentView[];
	/** People referenced by `<@userId>` tokens in `text`, with live names. */
	mentions?: CommentPerson[];
	/** Up to three most recent distinct reply authors (roots only). */
	replyAuthors?: CommentPerson[];
};

/** Sanitized attachment metadata. Storage keys and hashes never reach the client. */
export type AttachmentView = {
	id: string;
	fileName: string;
	contentType: string;
	byteSize: number;
	/** pending | ready | attached | rejected | expired */
	state: string;
};

export type AttachmentSingleResponse = ApiResponse<{
	attachment: AttachmentView;
}>;

export type UploadAttachmentParams = {
	targetType: string;
	targetId: string;
	/** Reused on retry so a lost response does not create a second upload. */
	retryKey: string;
	file: File;
};

/** Mirrors the server's AttachmentLimits; the server remains authoritative. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_COMMENT = 5;
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'docx', 'png', 'jpg', 'jpeg'] as const;
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',');

/** Paged comment thread response. */
export type CommentListResponse = ApiResponse<{
	comments: CommentView[];
	/** Opaque keyset cursor for the next page; null when there are no more. */
	nextCursor: string | null;
	total: number;
}>;

/** Response for a single comment (create/edit/delete). */
export type CommentSingleResponse = ApiResponse<{
	comment: CommentView;
}>;

/** Params for a paged comment read. */
export type GetCommentsParams = {
	targetType: string;
	targetId: string;
	/** Opaque cursor from a previous `nextCursor`; omit for the first page. */
	cursor?: string;
	/** Page size (server default 50, max 100). */
	limit?: number;
};

/** Params for a paged reply read under a single root comment. */
export type GetRepliesParams = {
	/** Opaque cursor from a previous `nextCursor`; omit for the first page. */
	cursor?: string;
	/** Page size (server default 50, max 100). */
	limit?: number;
};

/** Params for creating a comment. */
export type CreateCommentParams = {
	targetType: string;
	targetId: string;
	text: string;
	/** Client-generated UUID for safe retries / idempotency. */
	idempotencyKey: string;
	/**
	 * Optional. When set, the comment is a reply to this root (two-level only);
	 * when omitted the comment is a top-level root.
	 */
	rootCommentId?: string | null;
	/** Ready attachment ids (same uploader and target) to claim into this comment. */
	attachmentIds?: string[];
	/** Ids of everyone tagged in `text` (for notifications); must match its `<@id>` tokens. */
	mentionedUserIds?: string[];
};

/** Params for editing a comment. */
export type UpdateCommentParams = {
	text: string;
	/** Client-generated UUID for safe retries / idempotency. */
	idempotencyKey: string;
	/** Ids of everyone tagged in `text`; must match its `<@id>` tokens. */
	mentionedUserIds?: string[];
};

/** Params for deleting (soft) a comment. */
export type DeleteCommentParams = {
	/** Client-generated UUID for safe retries / idempotency. */
	idempotencyKey: string;
};

/**
 * Supported related-entity target types. Only registered types are accepted by
 * the backend; anything else fails closed with HTTP 400.
 */
export const CommentTargetType = {
	TileshareTilette: 'tileshare_tilette',
} as const;

export type CommentTargetType = (typeof CommentTargetType)[keyof typeof CommentTargetType];

/** Server default page size for comment reads. */
export const DEFAULT_COMMENT_PAGE_SIZE = 50;
