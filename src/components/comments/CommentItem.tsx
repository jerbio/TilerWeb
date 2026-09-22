import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CommentView } from '@/core/common/types/comment';

type CommentItemProps = {
	comment: CommentView;
	onEdit: (commentId: string, text: string) => Promise<void>;
	onDelete: (commentId: string) => Promise<void>;
};

/**
 * Renders a single comment. Shows an inline "deleted" placeholder when the
 * comment has been soft-deleted (the row is preserved for thread stability).
 * Editing is toggled inline; both edit and delete are guarded by the
 * server-computed canEdit / canDelete flags.
 */
const CommentItem: React.FC<CommentItemProps> = ({ comment, onEdit, onDelete }) => {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const [busy, setBusy] = useState(false);

	const isDeleted = comment.isDeleted === true;
	const canEdit = !isDeleted && comment.canEdit === true;
	const canDelete = !isDeleted && comment.canDelete === true;
	const displayName = comment.author?.displayName || t('comments.deletedAuthor');

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
			<ItemWrapper data-testid="comment-item" data-comment-id={comment.id}>
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

	return (
		<ItemWrapper data-testid="comment-item" data-comment-id={comment.id}>
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
		</ItemWrapper>
	);
};

const ItemWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.75rem 1rem;
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

export default CommentItem;
