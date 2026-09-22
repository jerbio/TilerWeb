import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CommentsApi } from '@/api/commentsApi';
import CommentsService, { generateIdempotencyKey } from '@/services/commentsService';
import { CommentView, DEFAULT_COMMENT_PAGE_SIZE } from '@/core/common/types/comment';
import Button from '@/core/common/components/button';
import CommentComposer from './CommentComposer';
import CommentItem from './CommentItem';

type CommentThreadProps = {
	/** Registered related-entity target type (e.g. 'tileshare_tilette'). */
	targetType: string;
	/** The target entity id (e.g. the TileShareTemplate id). */
	targetId: string;
	/** Optional injected service (used by tests / to share an instance). */
	service?: CommentsService;
};

/**
 * Owns the comment conversation for a single related-entity target. Handles
 * the initial paged load, load-more, and create/edit/delete with server-side
 * idempotency and client-side single-flight dedupe. Renders loading, error
 * (with retry), and empty states.
 */
const CommentThread: React.FC<CommentThreadProps> = ({ targetType, targetId, service }) => {
	const { t } = useTranslation();

	// Resolve the service once: use the injected instance when provided,
	// otherwise build a default one. Kept in a ref so it is stable across renders.
	const serviceRef = useRef<CommentsService | undefined>(undefined);
	if (serviceRef.current === undefined) {
		serviceRef.current = service ?? new CommentsService(new CommentsApi());
	}
	const svc = serviceRef.current;

	const [comments, setComments] = useState<CommentView[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		svc.getComments({ targetType, targetId, limit: DEFAULT_COMMENT_PAGE_SIZE })
			.then((content) => {
				if (cancelled) return;
				setComments(content.comments ?? []);
				setNextCursor(content.nextCursor ?? null);
				setTotal(content.total ?? 0);
			})
			.catch((err) => {
				if (cancelled) return;
				setError(messageOf(err, t('comments.loadError')));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [targetType, targetId, reloadKey, svc]);

	const loadMore = useCallback(async () => {
		if (!nextCursor || loadingMore) return;
		setLoadingMore(true);
		try {
			const content = await svc.getComments({
				targetType,
				targetId,
				cursor: nextCursor,
				limit: DEFAULT_COMMENT_PAGE_SIZE,
			});
			setComments((prev) => [...prev, ...(content.comments ?? [])]);
			setNextCursor(content.nextCursor ?? null);
		} catch {
			toast.error(t('comments.loadMoreError'));
		} finally {
			setLoadingMore(false);
		}
	}, [nextCursor, loadingMore, targetType, targetId, svc]);

	const handleCreate = useCallback(
		async (text: string) => {
			const created = await svc.createComment({
				targetType,
				targetId,
				text,
				idempotencyKey: generateIdempotencyKey(),
			});
			setComments((prev) => [...prev, created]);
			setTotal((n) => n + 1);
		},
		[svc, targetType, targetId]
	);

	const handleEdit = useCallback(
		async (commentId: string, text: string) => {
			const updated = await svc.updateComment(commentId, {
				text,
				idempotencyKey: generateIdempotencyKey(),
			});
			setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
		},
		[svc]
	);

	const handleDelete = useCallback(
		async (commentId: string) => {
			await svc.deleteComment(commentId, { idempotencyKey: generateIdempotencyKey() });
			// Reflect the soft delete optimistically; a full reload on next
			// navigation is the source of truth.
			setComments((prev) =>
				prev.map((c) =>
					c.id === commentId
						? { ...c, isDeleted: true, text: '', canEdit: false, canDelete: false }
						: c
				)
			);
		},
		[svc]
	);

	const hasMore = nextCursor != null && nextCursor !== '';
	const showEmpty = !loading && !error && comments.length === 0;
	const showList = comments.length > 0;
	return (
		<ThreadRoot data-testid="comment-thread">
			<Header>
				<Count>{t('comments.count', { count: total })}</Count>
			</Header>

			<CommentComposer
				onSubmit={(text) =>
					handleCreate(text).catch(() => {
						toast.error(t('comments.createError'));
					})
				}
			/>

			{loading && <Status data-testid="comment-loading">{t('comments.loading')}</Status>}

			{!loading && error && (
				<ErrorState data-testid="comment-error">
					<p>{error}</p>
					<Button
						size="small"
						variant="secondary"
						onClick={() => setReloadKey((k) => k + 1)}
						data-testid="comment-retry"
					>
						{t('comments.retry')}
					</Button>
				</ErrorState>
			)}

			{showEmpty && <Status data-testid="comment-empty">{t('comments.empty')}</Status>}

			{showList && (
				<List data-testid="comment-list">
					{comments.map((c) => (
						<CommentItem
							key={c.id}
							comment={c}
							onEdit={(id, text) =>
								handleEdit(id, text).catch(() => {
									toast.error(t('comments.editError'));
								})
							}
							onDelete={(id) =>
								handleDelete(id).catch(() => {
									toast.error(t('comments.deleteError'));
								})
							}
						/>
					))}
				</List>
			)}

			{showList && hasMore && (
				<LoadMoreRow>
					<Button
						size="small"
						variant="ghost"
						onClick={() => void loadMore()}
						disabled={loadingMore}
						data-testid="comment-load-more"
					>
						{loadingMore ? t('comments.loading') : t('comments.loadMore')}
					</Button>
				</LoadMoreRow>
			)}
		</ThreadRoot>
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
const ThreadRoot = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
`;

const Count = styled.h2`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Status = styled.p`
	margin: 0;
	padding: 1rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ErrorState = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	align-items: center;
	padding: 1rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.background.card};
`;

const LoadMoreRow = styled.div`
	display: flex;
	justify-content: center;
	padding: 0.5rem 0;
`;

export default CommentThread;
