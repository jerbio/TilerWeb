import { InvitationStatus } from '@/core/common/types/tileshare';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { TileshareApi } from '@/api/tileshareApi';
import { useAuth } from '@/core/auth/useAuth';
import { Routes } from '@/core/constants/routes';
import { InvitationPage, InvitationScope } from '@/core/common/types/tileshareInvitations';

const api = new TileshareApi();

export default function TileShareInvitations({
	ClusterId,
	TiletteId,
	AssignmentId,
}: InvitationScope) {
	const { t, i18n } = useTranslation();
	const { user } = useAuth();
	const [search] = useSearchParams();
	const cluster =
		ClusterId ??
		(TiletteId || AssignmentId ? undefined : (search.get('clusterId') ?? undefined));
	const scope = JSON.stringify([JSON.stringify(user), cluster, TiletteId, AssignmentId]);
	const [state, setState] = useState<{
		scope: string;
		page: InvitationPage;
		loading: boolean;
		error: boolean;
	}>({
		scope,
		page: { nextCursor: null },
		loading: true,
		error: false,
	});
	const [busy, setBusy] = useState<string | null>(null);
	const [notice, setNotice] = useState<{ scope: string; text: string } | null>(null);
	const generation = useRef(0);
	const scopeRef = useRef(scope);
	scopeRef.current = scope;
	const pending = useRef<AbortController>();
	const submitting = useRef(false);
	const current =
		state.scope === scope
			? state
			: { page: { nextCursor: null } as InvitationPage, loading: true, error: false };
	const scoped = !!(cluster || TiletteId || AssignmentId);
	const load = useCallback(
		async (afterId?: string) => {
			if (document.visibilityState !== 'visible') return;
			pending.current?.abort();
			const controller = new AbortController();
			pending.current = controller;
			const version = ++generation.current;
			setState({ scope, page: { nextCursor: null }, loading: true, error: false });
			try {
				const page = await api.getInvitations(
					{ ClusterId: cluster, TiletteId, AssignmentId, AfterId: afterId },
					controller.signal
				);
				if (version === generation.current && !controller.signal.aborted)
					setState({ scope, page, loading: false, error: false });
			} catch {
				if (version === generation.current && !controller.signal.aborted)
					setState({ scope, page: { nextCursor: null }, loading: false, error: true });
			}
		},
		[scope, cluster, TiletteId, AssignmentId]
	);
	useEffect(() => {
		void load();
		const changed = () => {
			void load();
		};
		const visibility = () => {
			if (document.visibilityState === 'visible') void load();
			else {
				++generation.current;
				pending.current?.abort();
				setState({ scope, page: { nextCursor: null }, loading: true, error: false });
			}
		};
		window.addEventListener('tileshare-changed', changed);
		document.addEventListener('visibilitychange', visibility);
		return () => {
			++generation.current;
			pending.current?.abort();
			window.removeEventListener('tileshare-changed', changed);
			document.removeEventListener('visibilitychange', visibility);
		};
	}, [load, scope]);
	const respond = async (
		id: string,
		status: InvitationStatus.Accepted | InvitationStatus.Declined
	) => {
		if (submitting.current) return;
		submitting.current = true;
		setBusy(id);
		setNotice(null);
		try {
			await api.respondToInvitation(id, status);
			if (scopeRef.current !== scope) return;
			setNotice({
				scope,
				text:
					status === InvitationStatus.Accepted
						? t(
								'tileshareInvitations.accepted',
								'Accepted. Your tile has been created.'
							)
						: t('tileshareInvitations.declined', 'Invitation declined.'),
			});
			window.dispatchEvent(new Event('tileshare-changed'));
		} catch {
			if (scopeRef.current !== scope) return;
			setNotice({
				scope,
				text: t(
					'tileshareInvitations.responseFailed',
					'The response could not be confirmed. Refresh to check its status before trying again.'
				),
			});
			// Do not leave a response button active against an uncertain result.
			setState({ scope, page: { nextCursor: null }, loading: false, error: true });
		} finally {
			submitting.current = false;
			setBusy(null);
		}
	};
	return (
		<Section
			aria-label={t('tileshareInvitations.title', 'Invitations')}
			aria-busy={current.loading}
		>
			<header>
				<h2>{t('tileshareInvitations.title', 'Invitations')}</h2>
				<button
					type="button"
					disabled={current.loading || !!busy}
					onClick={() => void load()}
				>
					{t('tileshareInvitations.refresh', 'Refresh')}
				</button>
			</header>
			{scoped && !ClusterId && !TiletteId && !AssignmentId && (
				<Link to={Routes.Tileshare.invitations}>
					{t('tileshareInvitations.all', 'All invitations')}
				</Link>
			)}
			{notice?.scope === scope && <p role="status">{notice.text}</p>}
			{current.loading && (
				<p role="status">{t('tileshareInvitations.loading', 'Loading invitations?')}</p>
			)}
			{current.error && (
				<p role="alert">
					{t(
						'tileshareInvitations.failed',
						'Invitations could not be loaded. Refresh to try again.'
					)}
				</p>
			)}
			{!current.loading &&
				!current.error &&
				!(current.page.projects?.length || current.page.invitations?.length) && (
					<p>{t('tileshareInvitations.empty', 'No pending invitations.')}</p>
				)}
			{!scoped &&
				current.page.projects?.map((project) => (
					<article key={project.clusterId}>
						<h3>{project.name}</h3>
						<p>
							{project.pendingCount}{' '}
							{t('tileshareInvitations.pending', 'pending tilettes')}
						</p>
						<Link
							to={`${Routes.Tileshare.invitations}?clusterId=${encodeURIComponent(project.clusterId)}`}
						>
							{t('tileshareInvitations.review', 'Review invitations')}
						</Link>
					</article>
				))}
			{current.page.invitations?.map((invitation) => (
				<article key={invitation.assignmentId} aria-label={invitation.name}>
					<p>{invitation.clusterName}</p>
					<h3>{invitation.name}</h3>
					{invitation.inviterName && (
						<p>
							{t('tileshareInvitations.from', 'Invited by')} {invitation.inviterName}
						</p>
					)}
					{invitation.deadline != null && (
						<p>
							{t('tileshareInvitations.due', 'Due:')}{' '}
							{new Date(invitation.deadline).toLocaleString(i18n.language)}
						</p>
					)}
					<Actions>
						<button
							type="button"
							disabled={!!busy || current.loading}
							onClick={() =>
								void respond(invitation.assignmentId, InvitationStatus.Accepted)
							}
						>
							{t('tileshareInvitations.accept', 'Accept')}
						</button>
						<button
							type="button"
							disabled={!!busy || current.loading}
							onClick={() =>
								void respond(invitation.assignmentId, InvitationStatus.Declined)
							}
						>
							{t('tileshareInvitations.decline', 'Decline')}
						</button>
					</Actions>
					{busy === invitation.assignmentId && (
						<p role="status">
							{t('tileshareInvitations.responding', 'Saving response?')}
						</p>
					)}
				</article>
			))}
			{current.page.nextCursor && (
				<button
					type="button"
					disabled={!!busy}
					onClick={() => void load(current.page.nextCursor ?? undefined)}
				>
					{t('tileshareInvitations.next', 'Next page')}
				</button>
			)}
		</Section>
	);
}

const Section = styled.section`
	padding: 1rem;
	color: ${({ theme }) => theme.colors.text.primary};
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	h2 {
		font-size: 1.2rem;
	}
	h3 {
		font-size: 1rem;
		margin: 0.5rem 0;
	}
	article {
		padding: 1rem;
		margin: 1rem 0;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 0.75rem;
		overflow-wrap: anywhere;
	}
	button {
		padding: 0.6rem 1rem;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 0.5rem;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
`;
const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;
