import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CommentView, DEFAULT_COMMENT_PAGE_SIZE } from '@/core/common/types/comment';
import CommentsService, { generateIdempotencyKey } from '@/services/commentsService';
import CommentComposer from './CommentComposer';

type CommentItemProps = {
	comment: CommentView;
	onEdit: (commentId: string, text: string) => Promise<void>;
	onDelete: (commentId: string) => Promise<void>;
	/**
	 * When provided (and this row is a live root) the two-level reply UI is
	 * enabled: an inline reply composer and a lazy-loaded reply list. Replies
	 * are rendered with `isNested` and no service, so they never get a reply
	 * affordance (two-level limit).
	 */
	service?: CommentsService;
	targetType?: string;
	targetId?: string;
	/** True when this row is a nested reply under a root. */
	isNested?: boolean;
};

/**
 * Renders a single comment. Shows an inline "deleted" placeholder when the
 * comment has been soft-deleted (the row is preserved for thread stability).
 * Editing is toggled inline; both edit and delete are guarded by the
 * server-computed canEdit / canDelete flags.
 *
 * For roots (with a bound service) it also renders the two-level reply UI: a
 * "Reply" toggle that opens an inline composer (create with `rootCommentId`)
 * and a "Show/Hide replies" toggle that lazy-loads the replies via
 * `getReplies`.
 */
const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	onEdit,
	onDelete,
	service,
	targetType,
	targetId,
	isNested,
}) => {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const [busy, setBusy] = useState(false);

	const isDeleted = comment.isDeleted === true;
	const canEdit = !isDeleted && comment.canEdit === true;
	const canDelete = !isDeleted && comment.canDelete === true;
	const displayName = comment.author?.displayName || t('comments.deletedAuthor');

	// Two-level reply state — active only on a live root with a bound service.
	const canReply =
		!comment.isReply &&
		!comment.rootCommentId &&
		!isDeleted &&
		!!service &&
		!!targetType &&
		!!targetId;
	const [showComposer, setShowComposer] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [replies, setReplies] = useState<CommentView[]>([]);
	const [repliesLoaded, setRepliesLoaded] = useState(false);
	const [repliesNextCursor, setRepliesNextCursor] = useState<string | null>(null);
	const [loadingReplies, setLoadingReplies] = useState(false);
	const [repliesError, setRepliesError] = useState<string | null>(null);

	const loadReplies = async (cursor?: string) => {
		if (!service) return;
		setLoadingReplies(true);
		setRepliesError(null);
		try {
			const res = await service.getReplies(comment.id, {
				cursor,
				limit: DEFAULT_COMMENT_PAGE_SIZE,
			});
			setReplies((prev) =>
				cursor ? [...prev, ...(res.comments ?? [])] : (res.comments ?? [])
			);
			setRepliesNextCursor(res.nextCursor ?? null);
			setRepliesLoaded(true);
		} catch (err) {
			setRepliesError(messageOf(err, t('comments.loadRepliesError')));
		} finally {
			setLoadingReplies(false);
		}
	};

	const toggleReplies = async () => {
		if (!canReply) return;
		const willExpand = !expanded;
		if (willExpand && !repliesLoaded && !loadingReplies) {
			await loadReplies();
		}
		setExpanded(willExpand);
	};

	const submitReply = async (text: string) => {
		if (!service || !targetType || !targetId) return;
		const created = await service.createComment({
			targetType,
			targetId,
			text,
			idempotencyKey: generateIdempotencyKey(),
			rootCommentId: comment.id,
		});
		setReplies((prev) => [created, ...prev]);
		setRepliesLoaded(true);
		setExpanded(true);
		setShowComposer(false);
	};

	const startEdit = () => {
		if (!canEdit || busy) return;
		setDraft(comment.text ?? '');
		setEditing(true);
	};

	const cancelEdit = () => {
		if (busy) return;
		setEditing(false);
		setDraft('');
	};

	const saveEdit = async () => {
		if (!canEdit || busy) return;
		const trimmed = draft.trim();
		if (!trimmed || trimmed === (comment.text ?? '')) {
			cancelEdit();
			return;
		}
		setBusy(true);
		try {
			await onEdit(comment.id, trimmed);
			setEditing(false);
			setDraft('');
		} catch {
			// Keep the draft so the user can retry; the caller surfaces the toast.
		} finally {
			setBusy(false);
		}
	};

	const remove = async () => {
		if (!canDelete || busy) return;
		setBusy(true);
		try {
			await onDelete(comment.id);
		} catch {
			// Caller surfaces the toast; nothing to roll back locally.
		} finally {
			setBusy(false);
		}
	};

	const timestamp =
		comment.createdAt != null ? dayjs(comment.createdAt).format('DD MMM YYYY, HH:mm') : null;

	if (editing) {
		return (
			<ItemWrapper data-testid="comment-item" data-comment-id={comment.id} nested={isNested}>
				<AuthorLine>{displayName}</AuthorLine>
				<EditBox
					data-testid="comment-edit-input"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					disabled={busy}
					autoFocus
				/>
				<Actions>
					<ActionButton type="button" onClick={cancelEdit} disabled={busy}>
						{t('comments.cancel')}
					</ActionButton>
					<ActionButton
						type="button"
						data-testid="comment-edit-save"
						onClick={() => void saveEdit()}
						disabled={busy || !draft.trim()}
					>
						{t('comments.save')}
					</ActionButton>
				</Actions>
			</ItemWrapper>
		);
	}

	const showRepliesToggle =
		canReply && (comment.hasReplies === true || replies.length > 0 || repliesLoaded);

	return (
		<ItemWrapper data-testid="comment-item" data-comment-id={comment.id} nested={isNested}>
			<AuthorLine>
				<span>{displayName}</span>
				{timestamp && <Time>{timestamp}</Time>}
				{comment.editedAt != null && !isDeleted && (
					<Edited>
						{t('comments.edited')}
						{comment.editedAt != null &&
							` ${dayjs(comment.editedAt).format('DD MMM YYYY, HH:mm')}`}
					</Edited>
				)}
			</AuthorLine>
			<Text deleted={isDeleted} data-testid="comment-text">
				{isDeleted ? t('comments.deletedPlaceholder') : comment.text}
			</Text>
			{(canEdit || canDelete) && (
				<Actions>
					{canEdit && (
						<ActionButton type="button" onClick={startEdit} disabled={busy}>
							{t('comments.edit')}
						</ActionButton>
					)}
					{canDelete && (
						<ActionButton
							type="button"
							data-testid="comment-delete"
							onClick={() => void remove()}
							disabled={busy}
						>
							{t('comments.delete')}
						</ActionButton>
					)}
				</Actions>
			)}

			{canReply && (
				<ReplySection>
					<Actions>
						<ActionButton
							type="button"
							data-testid="comment-reply-toggle"
							onClick={() => setShowComposer((v) => !v)}
						>
							{t('comments.reply')}
						</ActionButton>
						{showRepliesToggle && (
							<ActionButton
								type="button"
								data-testid="comment-replies-toggle"
								onClick={() => void toggleReplies()}
								disabled={loadingReplies}
							>
								{expanded ? t('comments.hideReplies') : t('comments.showReplies')}
							</ActionButton>
						)}
					</Actions>

					{showComposer && (
						<ReplyComposerWrap data-testid="comment-reply-composer">
							<CommentComposer
								placeholder={t('comments.replyPlaceholder')}
								onSubmit={submitReply}
							/>
						</ReplyComposerWrap>
					)}

					{expanded && (
						<ReplyList data-testid="comment-reply-list">
							{loadingReplies && !repliesLoaded && !repliesError && (
								<ReplyStatus data-testid="comment-replies-loading">
									{t('comments.loadingReplies')}
								</ReplyStatus>
							)}
							{!loadingReplies && repliesError && (
								<ReplyStatus $error data-testid="comment-replies-error">
									{repliesError}
									<ActionButton
										type="button"
										data-testid="comment-replies-retry"
										onClick={() => void loadReplies()}
									>
										{t('comments.retry')}
									</ActionButton>
								</ReplyStatus>
							)}
							{!loadingReplies &&
								!repliesError &&
								repliesLoaded &&
								replies.length === 0 && (
									<ReplyStatus data-testid="comment-replies-empty">
										{t('comments.noReplies')}
									</ReplyStatus>
								)}
							{replies.map((r) => (
								<CommentItem
									key={r.id}
									comment={r}
									isNested
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))}
							{repliesNextCursor && !loadingReplies && (
								<ReplyLoadMore>
									<ActionButton
										type="button"
										data-testid="comment-replies-load-more"
										onClick={() => void loadReplies(repliesNextCursor)}
										disabled={loadingReplies}
									>
										{loadingReplies
											? t('comments.loading')
											: t('comments.loadMore')}
									</ActionButton>
								</ReplyLoadMore>
							)}
						</ReplyList>
					)}
				</ReplySection>
			)}
		</ItemWrapper>
	);
};

/** Extracts a displayable message from a thrown value. */
function messageOf(err: unknown, fallback: string): string {
	if (
		err &&
		typeof err === 'object' &&
		'message' in err &&
		typeof err.message === 'string' &&
		err.message
	) {
		return err.message;
	}
	return fallback;
}

const ItemWrapper = styled.div<{ nested?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.75rem 1rem;
	padding-left: ${({ nested }) => (nested ? '2rem' : '1rem')};
	border-left: ${({ nested, theme }) =>
		nested ? `2px solid ${theme.colors.border.default}` : 'none'};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

	&:last-child {
		border-bottom: none;
	}
`;

const AuthorLine = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Time = styled.span`
	font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const Edited = styled.span`
	font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const Text = styled.p<{ deleted?: boolean }>`
	margin: 0;
	white-space: pre-wrap;
	word-break: break-word;
	color: ${({ theme, deleted }) =>
		deleted ? theme.colors.text.muted : theme.colors.text.primary};
`;

const EditBox = styled.textarea`
	width: 100%;
	min-height: 64px;
	resize: vertical;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font: inherit;
`;

const Actions = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 0.25rem;
`;

const ActionButton = styled.button`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.brand[300]};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ReplySection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 0.25rem;
`;

const ReplyComposerWrap = styled.div`
	padding-left: 0.5rem;
`;

const ReplyList = styled.div`
	display: flex;
	flex-direction: column;
`;

const ReplyStatus = styled.p<{ $error?: boolean }>`
	margin: 0.25rem 0 0.25rem 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ theme, $error }) => ($error ? theme.colors.text.error : theme.colors.text.muted)};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ReplyLoadMore = styled.div`
	padding: 0.25rem 0 0.25rem 0.5rem;
`;

export default CommentItem;
