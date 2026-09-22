import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';

type CommentComposerProps = {
	/**
	 * Persists a new comment with the given (already-trimmed) text. Must reject
	 * on failure so the composer keeps the draft for a retry.
	 */
	onSubmit: (text: string) => Promise<void>;
	disabled?: boolean;
};

/**
 * The comment input form. Trims before submission, blocks empty submissions,
 * disables the control while a request is in flight, and only clears the field
 * on success (failures keep the draft).
 */
const CommentComposer: React.FC<CommentComposerProps> = ({ onSubmit, disabled }) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const trimmed = text.trim();
	const canSubmit = trimmed.length > 0 && !submitting && !disabled;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			await onSubmit(trimmed);
			setText('');
		} catch {
			// Keep the draft so the user can retry; the caller surfaces the toast.
		} finally {
			setSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Submit on Enter (Shift+Enter inserts a newline).
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void handleSubmit(e as unknown as React.FormEvent);
		}
	};

	return (
		<form onSubmit={handleSubmit} data-testid="comment-composer">
			<Input
				data-testid="comment-composer-input"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={t('comments.placeholder')}
				disabled={disabled}
				maxLength={2000}
				rows={2}
				aria-label={t('comments.placeholder')}
			/>
			<FootRow>
				<CharCount>{text.length}/2000</CharCount>
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
