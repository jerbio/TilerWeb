import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
	AttachmentView,
	CommentParticipant,
	CommentView,
	DEFAULT_COMMENT_PAGE_SIZE,
} from '@/core/common/types/comment';
import CommentsService from '@/services/commentsService';
import CommentComposer from './CommentComposer';
import CommentAttachments from './CommentAttachments';
import CommentAvatar from './CommentAvatar';
import CommentText from './CommentText';
import { mentionedUserIds, SelectedMention, toDisplayText, toTokenText } from './mentions';

type CommentItemProps = {
	comment: CommentView;
	onEdit: (commentId: string, text: string) => Promise<void>;
	onDelete: (commentId: string) => Promise<void>;
	onDownloadAttachment?: (attachment: AttachmentView) => Promise<void>;
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
	/** People who can be mentioned in the reply composer. */
	participants?: CommentParticipant[];
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
	onDownloadAttachment,
	service,
	targetType,
	targetId,
	isNested,
	participants,
}) => {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const [editSelected, setEditSelected] = useState<SelectedMention[]>([]);
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

	const submitReply = async (text: string, attachmentIds: string[], idempotencyKey: string) => {
		if (!service || !targetType || !targetId) return;
		const created = await service.createComment({
			targetType,
			targetId,
			text,
			idempotencyKey,
			rootCommentId: comment.id,
			attachmentIds,
			mentionedUserIds: mentionedUserIds(text),
		});
		setReplies((prev) => [created, ...prev]);
		setRepliesLoaded(true);
		setExpanded(true);
		setShowComposer(false);
	};

	const startEdit = () => {
		if (!canEdit || busy) return;
		const editable = toDisplayText(comment.text ?? '', comment.mentions ?? []);
		setDraft(editable.text);
		setEditSelected(editable.selected);
		setEditing(true);
	};

	const cancelEdit = () => {
		if (busy) return;
		setEditing(false);
		setDraft('');
	};

	const saveEdit = async () => {
		if (!canEdit || busy) return;
		const next = toTokenText(draft.trim(), editSelected);
		if (!next || next === (comment.text ?? '')) {
			cancelEdit();
			return;
		}
		setBusy(true);
		try {
			await onEdit(comment.id, next);
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

	const createdAt = comment.createdAt != null ? dayjs(comment.createdAt) : null;
	const time = createdAt
		? createdAt.format(createdAt.isSame(dayjs(), 'day') ? 'h:mm A' : 'MMM D, h:mm A')
		: null;
	const isViewer = comment.author?.isViewer === true;
	const avatar = (
		<CommentAvatar
			id={comment.author?.id ?? null}
			name={comment.author?.displayName ?? null}
			size={isNested ? 'sm' : 'md'}
		/>
	);
	const header = (
		<Header>
			<Name $viewer={isViewer}>{displayName}</Name>
			{isViewer && <Muted>{t('comments.you')}</Muted>}
			{createdAt && time && (
				<>
					<Muted aria-hidden="true">•</Muted>
					<Time
						dateTime={createdAt.toISOString()}
						title={createdAt.format('dddd, MMM D YYYY, h:mm A')}
					>
						{time}
					</Time>
				</>
			)}
			{comment.editedAt != null && !isDeleted && (
				<Muted title={dayjs(comment.editedAt).format('dddd, MMM D YYYY, h:mm A')}>
					{t('comments.edited')}
				</Muted>
			)}
		</Header>
	);

	if (editing) {
		return (
			<Row data-testid="comment-item" data-comment-id={comment.id} $nested={isNested}>
				<AvatarCol>{avatar}</AvatarCol>
				<Body>
					{header}
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
				</Body>
			</Row>
		);
	}

	const showRepliesToggle =
		canReply && ((comment.replyCount ?? 0) > 0 || replies.length > 0 || repliesLoaded);
	const replyAuthors = comment.replyAuthors ?? [];

	return (
		<Row data-testid="comment-item" data-comment-id={comment.id} $nested={isNested}>
			<AvatarCol>
				{avatar}
				{(showRepliesToggle || showComposer) && <ThreadLine aria-hidden="true" />}
			</AvatarCol>
			<Body>
				{header}
				<Text deleted={isDeleted} data-testid="comment-text">
					{isDeleted ? (
						t('comments.deletedPlaceholder')
					) : (
						<CommentText text={comment.text ?? ''} mentions={comment.mentions} />
					)}
				</Text>
				{!isDeleted && onDownloadAttachment && comment.attachments && (
					<CommentAttachments
						attachments={comment.attachments}
						onDownload={onDownloadAttachment}
					/>
				)}
				{(canReply || canEdit || canDelete) && (
					<Actions className="comment-actions">
						{canReply && (
							<ActionButton
								type="button"
								data-testid="comment-reply-toggle"
								onClick={() => setShowComposer((v) => !v)}
							>
								{t('comments.reply')}
							</ActionButton>
						)}
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

				{showRepliesToggle && (
					<RepliesToggle
						type="button"
						data-testid="comment-replies-toggle"
						aria-expanded={expanded}
						onClick={() => void toggleReplies()}
						disabled={loadingReplies}
					>
						{!expanded && replyAuthors.length > 0 && (
							<AvatarStack>
								{replyAuthors.map((a) => (
									<CommentAvatar
										key={a.id}
										id={a.id}
										name={a.isDeleted ? null : a.displayName}
										size="sm"
										stacked
									/>
								))}
							</AvatarStack>
						)}
						<span>
							{expanded
								? t('comments.hideReplies')
								: t('comments.replies', { count: comment.replyCount ?? 0 })}
						</span>
					</RepliesToggle>
				)}

				{canReply && showComposer && (
					<ReplyComposerWrap data-testid="comment-reply-composer">
						<CommentComposer
							placeholder={t('comments.replyPlaceholder')}
							onSubmit={submitReply}
							participants={participants}
							onUpload={(file, retryKey, onProgress) =>
								service!.uploadAttachment(
									{
										targetType: targetType!,
										targetId: targetId!,
										retryKey,
										file,
									},
									onProgress
								)
							}
							onCancelAttachment={(id) => service!.deleteAttachment(id)}
						/>
					</ReplyComposerWrap>
				)}

				{canReply && expanded && (
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
						{repliesNextCursor && !loadingReplies && (
							<ReplyLoadMore>
								<ActionButton
									type="button"
									data-testid="comment-replies-load-more"
									onClick={() => void loadReplies(repliesNextCursor)}
									disabled={loadingReplies}
								>
									{t('comments.loadEarlierReplies')}
								</ActionButton>
							</ReplyLoadMore>
						)}
						{/* Server pages are newest-first; show oldest to newest like a chat. */}
						{[...replies].reverse().map((r) => (
							<CommentItem
								key={r.id}
								comment={r}
								isNested
								onEdit={onEdit}
								onDelete={onDelete}
								onDownloadAttachment={onDownloadAttachment}
							/>
						))}
					</ReplyList>
				)}
			</Body>
		</Row>
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

const Row = styled.div<{ $nested?: boolean }>`
	display: flex;
	gap: ${({ $nested }) => ($nested ? '0.5rem' : '0.75rem')};
	padding: ${({ $nested }) => ($nested ? '0.5rem 0 0' : '0.875rem 0')};

	.comment-actions {
		opacity: 0;
		transition: opacity 120ms ease;
	}
	&:hover > div > .comment-actions,
	&:focus-within > div > .comment-actions {
		opacity: 1;
	}
	@media (hover: none) {
		.comment-actions {
			opacity: 1;
		}
	}
`;

const AvatarCol = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const ThreadLine = styled.span`
	flex: 1;
	width: 2px;
	min-height: 1rem;
	margin-top: 0.375rem;
	border-radius: 1px;
	background-color: ${({ theme }) => theme.colors.border.default};
`;

const Body = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const Header = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.375rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Name = styled.span<{ $viewer: boolean }>`
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme, $viewer }) =>
		$viewer ? theme.colors.warning[300] : theme.colors.teal[200]};
`;

const Muted = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const Time = styled.time`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const RepliesToggle = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	align-self: flex-start;
	margin-top: 0.25rem;
	padding: 0.125rem 0;
	background: none;
	border: none;
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.secondary};

	&:hover:not(:disabled) {
		color: ${({ theme }) => theme.colors.text.primary};
	}
	&:disabled {
		cursor: progress;
	}
`;

const AvatarStack = styled.span`
	display: inline-flex;

	& > * + * {
		margin-left: -0.375rem;
	}
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
	color: ${({ theme }) => theme.colors.text.muted};
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

	&:hover:not(:disabled),
	&:focus-visible {
		color: ${({ theme }) => theme.colors.text.primary};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ReplyComposerWrap = styled.div`
	margin-top: 0.5rem;
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
