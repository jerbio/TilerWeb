import React, { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import {
	ATTACHMENT_ACCEPT,
	AttachmentView,
	CommentParticipant,
	MAX_ATTACHMENTS_PER_COMMENT,
} from '@/core/common/types/comment';
import { generateIdempotencyKey, validateAttachmentFile } from '@/services/commentsService';
import { activeMentionQuery, filterParticipants, SelectedMention, toTokenText } from './mentions';

type CommentComposerProps = {
	/**
	 * Persists a new comment with the given (already-trimmed) text, ready attachment ids, and the
	 * draft's idempotency key. Must reject on failure so the composer keeps the draft for a retry.
	 */
	onSubmit: (text: string, attachmentIds: string[], idempotencyKey: string) => Promise<void>;
	/** Uploads one file, reporting progress as a 0..1 fraction; the attach control is hidden when absent. */
	onUpload?: (
		file: File,
		retryKey: string,
		onProgress?: (fraction: number) => void
	) => Promise<AttachmentView>;
	/** Cancels an uploaded-but-unposted file on the server. */
	onCancelAttachment?: (attachmentId: string) => Promise<void>;
	/** People who can be mentioned with @. */
	participants?: CommentParticipant[];
	disabled?: boolean;
	/** Placeholder text. Defaults to the general comment placeholder. */
	placeholder?: string;
};

type PendingAttachment = {
	localId: string;
	file: File;
	retryKey: string;
	status: 'uploading' | 'ready' | 'failed';
	/** Bytes sent as a 0..1 fraction; 1 while the server checks the file. */
	progress: number;
	attachment?: AttachmentView;
};

/**
 * The comment input form. Trims before submission, blocks empty submissions, and disables the
 * control while a request or upload is in flight. Failures keep the draft, its attachments, and
 * its idempotency key, so a retry cannot create a second comment.
 */
const CommentComposer: React.FC<CommentComposerProps> = ({
	onSubmit,
	onUpload,
	onCancelAttachment,
	participants = [],
	disabled,
	placeholder,
}) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);
	const [selected, setSelected] = useState<SelectedMention[]>([]);
	const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
	const [dismissedStart, setDismissedStart] = useState<number | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const draftKey = useRef(generateIdempotencyKey());
	const fileInput = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const listId = useId();
	const placeholderText = placeholder ?? t('comments.placeholder');

	const suggestions = mention ? filterParticipants(participants, mention.query) : [];
	const pickerOpen =
		!!mention && mention.start !== dismissedStart && suggestions.length > 0 && !disabled;

	const trimmed = text.trim();
	const uploadsSettled = attachments.every((a) => a.status === 'ready');
	const uploadingCount = attachments.filter((a) => a.status === 'uploading').length;
	const canSubmit = trimmed.length > 0 && !submitting && !disabled && uploadsSettled;
	const canAttach =
		!!onUpload && !disabled && !submitting && attachments.length < MAX_ATTACHMENTS_PER_COMMENT;

	useEffect(() => {
		if (uploadingCount === 0 && !submitting) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			// Older browsers only show the leave prompt when returnValue is set.
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [uploadingCount, submitting]);

	const patch = (localId: string, change: Partial<PendingAttachment>) =>
		setAttachments((prev) =>
			prev.map((a) => (a.localId === localId ? { ...a, ...change } : a))
		);

	const upload = async (pending: PendingAttachment) => {
		if (!onUpload) return;
		patch(pending.localId, { status: 'uploading', progress: 0 });
		try {
			const attachment = await onUpload(pending.file, pending.retryKey, (fraction) =>
				patch(pending.localId, { progress: Math.min(Math.max(fraction, 0), 1) })
			);
			patch(pending.localId, {
				status: attachment.state === 'ready' ? 'ready' : 'failed',
				attachment,
			});
		} catch {
			patch(pending.localId, { status: 'failed' });
		}
	};

	const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		e.target.value = '';
		setFileError(null);
		const room = MAX_ATTACHMENTS_PER_COMMENT - attachments.length;
		if (files.length > room)
			setFileError(t('comments.attachmentLimit', { count: MAX_ATTACHMENTS_PER_COMMENT }));
		for (const file of files.slice(0, Math.max(room, 0))) {
			const invalid = validateAttachmentFile(file);
			if (invalid) {
				setFileError(
					t(
						invalid === 'type'
							? 'comments.attachmentInvalidType'
							: invalid === 'size'
								? 'comments.attachmentTooLarge'
								: 'comments.attachmentEmpty'
					)
				);
				continue;
			}
			const pending: PendingAttachment = {
				localId: generateIdempotencyKey(),
				file,
				retryKey: generateIdempotencyKey(),
				status: 'uploading',
				progress: 0,
			};
			setAttachments((prev) => [...prev, pending]);
			void upload(pending);
		}
	};

	const remove = (pending: PendingAttachment) => {
		setAttachments((prev) => prev.filter((a) => a.localId !== pending.localId));
		if (pending.attachment && pending.status === 'ready' && onCancelAttachment) {
			// The server also expires unclaimed files, so a failed cancel needs no user action.
			onCancelAttachment(pending.attachment.id).catch(() => undefined);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			await onSubmit(
				toTokenText(trimmed, selected),
				attachments.map((a) => a.attachment!.id),
				draftKey.current
			);
			setText('');
			setAttachments([]);
			setSelected([]);
			setMention(null);
			setFileError(null);
			draftKey.current = generateIdempotencyKey();
		} catch {
			// Keep the draft so the user can retry; the caller surfaces the toast.
		} finally {
			setSubmitting(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setText(value);
		const next = activeMentionQuery(value, e.target.selectionStart ?? value.length);
		setMention(next);
		if (next?.start !== mention?.start) setActiveIndex(0);
	};

	const pick = (person: CommentParticipant) => {
		if (!mention) return;
		const caret = inputRef.current?.selectionStart ?? text.length;
		const insert = `@${person.displayName} `;
		const next = text.slice(0, mention.start) + insert + text.slice(caret);
		setText(next);
		setSelected((prev) =>
			prev.some((m) => m.id === person.id)
				? prev
				: [...prev, { id: person.id, displayName: person.displayName }]
		);
		setMention(null);
		const cursor = mention.start + insert.length;
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.setSelectionRange(cursor, cursor);
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (pickerOpen) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				const step = e.key === 'ArrowDown' ? 1 : -1;
				setActiveIndex((i) => (i + step + suggestions.length) % suggestions.length);
				return;
			}
			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
				pick(suggestions[Math.min(activeIndex, suggestions.length - 1)]);
				return;
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				setDismissedStart(mention!.start);
				return;
			}
		}
		// Submit on Enter (Shift+Enter inserts a newline).
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void handleSubmit(e as unknown as React.FormEvent);
		}
	};

	return (
		<form onSubmit={handleSubmit} data-testid="comment-composer">
			<InputWrap>
				<Input
					ref={inputRef}
					data-testid="comment-composer-input"
					value={text}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onBlur={() => setMention(null)}
					placeholder={placeholderText}
					disabled={disabled}
					maxLength={2000}
					rows={2}
					aria-label={placeholderText}
					aria-autocomplete="list"
					aria-controls={pickerOpen ? listId : undefined}
					aria-activedescendant={
						pickerOpen ? `${listId}-${suggestions[activeIndex]?.id}` : undefined
					}
				/>
				{pickerOpen && (
					<Suggestions
						id={listId}
						role="listbox"
						aria-label={t('comments.mentionSuggestions')}
					>
						{suggestions.map((p, i) => (
							<Suggestion
								key={p.id}
								id={`${listId}-${p.id}`}
								role="option"
								aria-selected={i === activeIndex}
								$active={i === activeIndex}
								// Keep focus in the textarea so the caret position survives the pick.
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => pick(p)}
							>
								{p.displayName}
							</Suggestion>
						))}
					</Suggestions>
				)}
			</InputWrap>
			{attachments.length > 0 && (
				<PendingList>
					{attachments.map((a) => (
						<PendingItem key={a.localId} data-testid="comment-pending-attachment">
							<FileName>{a.file.name}</FileName>
							{a.status === 'uploading' && a.progress < 1 && (
								<>
									<ProgressTrack
										role="progressbar"
										aria-label={a.file.name}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-valuenow={Math.round(a.progress * 100)}
									>
										<ProgressFill
											style={{ width: `${Math.round(a.progress * 100)}%` }}
										/>
									</ProgressTrack>
									<PendingStatus>{Math.round(a.progress * 100)}%</PendingStatus>
								</>
							)}
							<PendingStatus>
								{a.status === 'uploading' &&
									a.progress >= 1 &&
									t('comments.attachmentProcessing')}
								{a.status === 'ready' && t('comments.attachmentUploaded')}
								{a.status === 'failed' && t('comments.attachmentUploadFailed')}
							</PendingStatus>
							{a.status === 'failed' && (
								<LinkButton
									type="button"
									data-testid="comment-attachment-retry"
									onClick={() => void upload(a)}
								>
									{t('comments.attachmentRetry')}
								</LinkButton>
							)}
							<LinkButton
								type="button"
								data-testid="comment-attachment-remove"
								aria-label={t('comments.attachmentRemove', { name: a.file.name })}
								onClick={() => remove(a)}
								disabled={a.status === 'uploading' || submitting}
							>
								×
							</LinkButton>
						</PendingItem>
					))}
				</PendingList>
			)}
			{fileError && <FileError role="alert">{fileError}</FileError>}
			<FootRow>
				<FootLeft>
					{onUpload && (
						<>
							<HiddenInput
								ref={fileInput}
								type="file"
								multiple
								accept={ATTACHMENT_ACCEPT}
								data-testid="comment-attach-input"
								onChange={handleFiles}
								disabled={!canAttach}
								tabIndex={-1}
								aria-hidden="true"
							/>
							<LinkButton
								type="button"
								data-testid="comment-attach-button"
								onClick={() => fileInput.current?.click()}
								disabled={!canAttach}
							>
								{t('comments.attach')}
							</LinkButton>
						</>
					)}
					<CharCount>{text.length}/2000</CharCount>
				</FootLeft>
				{uploadingCount > 0 && (
					<UploadSummary role="status" data-testid="comment-upload-summary">
						{t('comments.attachmentUploadingSummary', { count: uploadingCount })}
					</UploadSummary>
				)}
				<Button
					type="submit"
					data-testid="comment-composer-submit"
					size="small"
					variant="brand"
					disabled={!canSubmit}
				>
					{submitting ? t('comments.sending') : t('comments.send')}
				</Button>
			</FootRow>
		</form>
	);
};

const PendingList = styled.ul`
	list-style: none;
	margin: 0.5rem 0 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const InputWrap = styled.div`
	position: relative;
`;

const Suggestions = styled.ul`
	position: absolute;
	z-index: 5;
	left: 0;
	bottom: calc(100% + 0.25rem);
	min-width: 14rem;
	max-height: 14rem;
	overflow-y: auto;
	margin: 0;
	padding: 0.25rem;
	list-style: none;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.background.card};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;

const Suggestion = styled.li<{ $active: boolean }>`
	padding: 0.375rem 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.small};
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
	background-color: ${({ theme, $active }) =>
		$active ? theme.colors.background.card2 : 'transparent'};
`;

const PendingItem = styled.li`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const FileName = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 60%;
`;

const PendingStatus = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const ProgressTrack = styled.div`
	flex: 1;
	min-width: 4rem;
	max-width: 10rem;
	height: 4px;
	border-radius: 2px;
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.border.default};
`;

const ProgressFill = styled.div`
	height: 100%;
	background-color: ${({ theme }) => theme.colors.brand[300]};
	transition: width 120ms linear;
`;

const UploadSummary = styled.span`
	margin-left: auto;
	margin-right: 0.75rem;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const FileError = styled.p`
	margin: 0.25rem 0 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const FootLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HiddenInput = styled.input`
	display: none;
`;

const LinkButton = styled.button`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.secondary};

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const Input = styled.textarea`
	width: 100%;
	min-height: 56px;
	resize: vertical;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font: inherit;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.brand[300]};
	}
`;

const FootRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 0.25rem;
`;

const CharCount = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

export default CommentComposer;
