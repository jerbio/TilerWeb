import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AttachmentView } from '@/core/common/types/comment';

type CommentAttachmentsProps = {
	attachments: AttachmentView[];
	onDownload: (attachment: AttachmentView) => Promise<void>;
};

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File cards under a posted comment. Downloads go through the authorized API, never a direct link. */
const CommentAttachments: React.FC<CommentAttachmentsProps> = ({ attachments, onDownload }) => {
	const { t } = useTranslation();
	const [busyId, setBusyId] = useState<string | null>(null);

	if (attachments.length === 0) return null;

	const download = async (a: AttachmentView) => {
		setBusyId(a.id);
		try {
			await onDownload(a);
		} catch {
			toast.error(t('comments.attachmentDownloadError'));
		} finally {
			setBusyId(null);
		}
	};

	return (
		<Cards data-testid="comment-attachments">
			{attachments.map((a) => (
				<Card key={a.id}>
					<Name>{a.fileName}</Name>
					<Meta>{formatBytes(a.byteSize)}</Meta>
					<DownloadButton
						type="button"
						data-testid="comment-attachment-download"
						aria-label={t('comments.attachmentDownloadAria', { name: a.fileName })}
						onClick={() => void download(a)}
						disabled={busyId === a.id}
					>
						{t('comments.attachmentDownload')}
					</DownloadButton>
				</Card>
			))}
		</Cards>
	);
};

const Cards = styled.ul`
	list-style: none;
	margin: 0.25rem 0 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Card = styled.li`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	max-width: 100%;
	padding: 0.375rem 0.625rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.background.card};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Name = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Meta = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const DownloadButton = styled.button`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.brand[300]};

	&:disabled {
		cursor: progress;
		opacity: 0.6;
	}
`;

export default CommentAttachments;
