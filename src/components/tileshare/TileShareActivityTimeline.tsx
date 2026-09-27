import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TileshareApi } from '@/api/tileshareApi';
import { useAuth } from '@/core/auth/useAuth';
import { TileShareActivity, TileShareActivityScope } from '@/core/common/types/tileshareActivity';
import ServerError from '@/core/error/server';
import {
	Check,
	ChevronRight,
	CircleHelp,
	Mail,
	MoreHorizontal,
	Pencil,
	Plus,
	RefreshCw,
	RotateCcw,
	Trash2,
	UserRound,
	X,
} from 'lucide-react';
import * as S from './TileShareActivityTimeline.styles';

const api = new TileshareApi();
const labels: Record<string, string> = {
	cluster_invitation: 'Invited to TileShare',
	cluster_created: 'TileShare created',
	cluster_deleted: 'TileShare deleted',
	tilette_added: 'Tilette added',
	tilette_edited: 'Tilette updated',
	tilette_deleted: 'Tilette deleted',
	tilette_restored: 'Tilette restored',
	recipient_added: 'Participant added',
	recipient_removed: 'Participant removed',
	recipient_restored: 'Participant restored',
	assignment_accepted: 'Assignment accepted',
	assignment_completed: 'Occurrence completed',
	assignment_reopened: 'Occurrence reopened',
	assignment_declined: 'Assignment declined',
	invitation_sent: 'Invitation sent',
	invitation_send_failed: 'Invitation could not be sent',
	invitation_send_unknown: 'Invitation send outcome unknown',
};

const actions: Record<string, string> = {
	cluster_invitation: 'invited you to',
	cluster_created: 'created',
	cluster_deleted: 'deleted',
	tilette_added: 'added',
	tilette_edited: 'updated',
	tilette_deleted: 'deleted',
	tilette_restored: 'restored',
	recipient_added: 'added a participant to',
	recipient_removed: 'removed a participant from',
	recipient_restored: 'restored a participant to',
	assignment_accepted: 'accepted',
	assignment_completed: 'completed an occurrence of',
	assignment_reopened: 'reopened an occurrence of',
	assignment_declined: 'declined',
	invitation_sent: 'sent an invitation to',
	invitation_send_failed: 'could not send an invitation to',
	invitation_send_unknown: 'sent an invitation with an unknown outcome for',
};
function appearance(type: string) {
	if (['assignment_accepted', 'assignment_completed'].includes(type))
		return { Icon: Check, tone: 'success' as const };
	if (['assignment_declined', 'recipient_removed', 'invitation_send_failed'].includes(type))
		return { Icon: X, tone: 'danger' as const };
	if (['cluster_deleted', 'tilette_deleted'].includes(type))
		return { Icon: Trash2, tone: 'neutral' as const };
	if (type.includes('restored') || type === 'assignment_reopened')
		return { Icon: RotateCcw, tone: 'neutral' as const };
	if (type === 'tilette_edited') return { Icon: Pencil, tone: 'neutral' as const };
	if (type === 'invitation_send_unknown') return { Icon: CircleHelp, tone: 'warning' as const };
	if (['cluster_invitation', 'invitation_sent'].includes(type))
		return { Icon: Mail, tone: 'neutral' as const };
	if (['cluster_created', 'tilette_added', 'recipient_added'].includes(type))
		return { Icon: Plus, tone: 'neutral' as const };
	return { Icon: CircleHelp, tone: 'neutral' as const };
}

export default function TileShareActivityTimeline({
	ClusterId,
	TiletteId,
}: TileShareActivityScope) {
	const { t, i18n } = useTranslation();
	const { user } = useAuth();
	const accountKey = JSON.stringify(user);
	const [dismissedOnly, setDismissedOnly] = useState(false);
	const [savingPreference, setSavingPreference] = useState<string | null>(null);
	const [preferenceError, setPreferenceError] = useState(false);
	const preferencePending = useRef(false);
	const heading = useRef<HTMLHeadingElement>(null);
	const scopeKey = JSON.stringify([accountKey, ClusterId, TiletteId, dismissedOnly]);
	const [state, setState] = useState<{
		scope: string;
		items: TileShareActivity[];
		cursor: string | null;
		error: string | null;
		loading: boolean;
	}>({ scope: scopeKey, items: [], cursor: null, error: null, loading: true });
	const generation = useRef(0);
	const pending = useRef<AbortController>();
	const current =
		state.scope === scopeKey ? state : { items: [], cursor: null, error: null, loading: true };
	const load = useCallback(
		async (cursor?: string) => {
			if (document.visibilityState !== 'visible') return;
			pending.current?.abort();
			const controller = new AbortController();
			pending.current = controller;
			const version = ++generation.current;
			// Refresh replaces all cached pages so revoked scopes and deleted attribution disappear.
			setState((previous) => ({
				scope: scopeKey,
				items: cursor && previous.scope === scopeKey ? previous.items : [],
				cursor: cursor ?? null,
				error: null,
				loading: true,
			}));
			try {
				const page = await api.getActivity(
					{
						ClusterId,
						TiletteId,
						Cursor: cursor,
						...(dismissedOnly ? { DismissedOnly: true } : {}),
					},
					controller.signal
				);
				if (version !== generation.current || controller.signal.aborted) return;
				setState((previous) => ({
					scope: scopeKey,
					items: [
						...new Map(
							[...(cursor ? previous.items : []), ...page.items].map((item) => [
								item.eventId,
								item,
							])
						).values(),
					],
					cursor: page.nextCursor,
					error: null,
					loading: false,
				}));
			} catch (error) {
				if (version !== generation.current || controller.signal.aborted) return;
				const denied =
					error instanceof ServerError && [401, 403, 404].includes(error.status ?? 0);
				setState({
					scope: scopeKey,
					items: [],
					cursor: null,
					loading: false,
					error: denied ? 'access' : navigator.onLine === false ? 'offline' : 'failed',
				});
			}
		},
		[ClusterId, TiletteId, scopeKey, dismissedOnly]
	);
	useEffect(() => {
		void load();
		const foreground = () => {
			if (document.visibilityState === 'visible') {
				void load();
			} else {
				++generation.current;
				pending.current?.abort();
				setState({ scope: scopeKey, items: [], cursor: null, error: null, loading: true });
			}
		};
		const changed = () => {
			void load();
		};
		document.addEventListener('visibilitychange', foreground);
		window.addEventListener('tileshare-changed', changed);
		return () => {
			++generation.current;
			pending.current?.abort();
			document.removeEventListener('visibilitychange', foreground);
			window.removeEventListener('tileshare-changed', changed);
		};
	}, [load, scopeKey]);
	const changeDismissal = async (eventId: string) => {
		if (preferencePending.current) return;
		preferencePending.current = true;
		setSavingPreference(eventId);
		setPreferenceError(false);
		const version = generation.current;
		try {
			await api.setActivityDismissed(eventId, !dismissedOnly);
			if (version === generation.current) {
				window.dispatchEvent(new Event('tileshare-changed'));
				heading.current?.focus();
			}
		} catch {
			if (version === generation.current) setPreferenceError(true);
		} finally {
			preferencePending.current = false;
			setSavingPreference(null);
		}
	};
	const messages: Record<string, string> = {
		access: 'This activity is no longer available to you.',
		offline: 'You are offline. Reconnect to load activity.',
		failed: 'Activity could not be loaded.',
	};
	return (
		<S.Timeline
			aria-label={t('tileshareActivity.title', 'Activities')}
			aria-busy={current.loading}
		>
			<S.Header>
				<h2 ref={heading} tabIndex={-1}>
					{t('tileshareActivity.title', 'Activities')}
				</h2>
				<S.HeaderActions>
					<S.TextButton
						type="button"
						disabled={current.loading}
						onClick={() => void load()}
					>
						{t('tileshareActivity.refresh', 'Refresh')}
						<RefreshCw size={15} aria-hidden="true" />
					</S.TextButton>
					<S.Options>
						<summary
							aria-label={t('tileshareActivity.options', 'Activity options')}
							title={t('tileshareActivity.options', 'Activity options')}
						>
							<MoreHorizontal size={19} aria-hidden="true" />
						</summary>
						<S.Filter>
							<input
								type="checkbox"
								checked={dismissedOnly}
								disabled={!!savingPreference}
								onChange={(event) => {
									setDismissedOnly(event.target.checked);
									setPreferenceError(false);
								}}
							/>
							{t('tileshareActivity.showDismissed', 'Show dismissed')}
						</S.Filter>
					</S.Options>
				</S.HeaderActions>
			</S.Header>
			{dismissedOnly && (
				<S.Notice>{t('tileshareActivity.showDismissed', 'Show dismissed')}</S.Notice>
			)}
			{preferenceError && (
				<S.Notice role="alert">
					{t(
						'tileshareActivity.dismissFailed',
						'The activity preference could not be saved. Try again.'
					)}
				</S.Notice>
			)}
			{current.loading && (
				<S.Notice role="status">
					{t('tileshareActivity.loading', 'Loading activity...')}
				</S.Notice>
			)}
			{current.error && (
				<S.Notice role="alert">
					<p>{t(`tileshareActivity.${current.error}`, messages[current.error])}</p>
					<S.TextButton type="button" onClick={() => void load()}>
						{t('tileshareActivity.retry', 'Retry')}
					</S.TextButton>
				</S.Notice>
			)}
			{!current.loading && !current.error && current.items.length === 0 && (
				<S.Notice>{t('tileshareActivity.empty', 'No activity yet.')}</S.Notice>
			)}
			<S.List>
				{current.items.map((item) => {
					const date = new Date(item.occurredAt);
					const known =
						item.schemaVersion === 1 &&
						Object.prototype.hasOwnProperty.call(labels, item.eventType);
					const actor = item.actorId ? item.actorName : undefined;
					const title = known
						? item.metadata?.title ||
							item.tiletteTitle ||
							(!item.tiletteId ? item.clusterTitle : undefined)
						: undefined;
					const { Icon, tone } = appearance(known ? item.eventType : '');
					const channel =
						known &&
						[
							'invitation_sent',
							'invitation_send_failed',
							'invitation_send_unknown',
						].includes(item.eventType) &&
						['email', 'sms', 'push'].includes(item.metadata?.channel ?? '')
							? item.metadata?.channel
							: undefined;
					const path =
						known && item.eventType === 'cluster_invitation'
							? `/tileshare/invitations?clusterId=${encodeURIComponent(item.clusterId)}`
							: `/tileshare/${encodeURIComponent(item.clusterId)}` +
								(item.tiletteId
									? `/tilette/${encodeURIComponent(item.tiletteId)}`
									: '');
					const initials = actor
						?.trim()
						.split(/\s+/)
						.filter(Boolean)
						.map((part) => Array.from(part)[0])
						.filter((_, index, parts) => index === 0 || index === parts.length - 1)
						.join('')
						.toLocaleUpperCase(i18n.language);
					const body = (
						<>
							<S.Avatar aria-hidden="true">
								{initials || <UserRound size={22} />}
								<S.Badge $tone={tone}>
									<Icon size={15} strokeWidth={2.3} />
								</S.Badge>
							</S.Avatar>
							<S.Copy>
								<S.Sentence>
									{actor && (
										<>
											<S.Actor>{actor}</S.Actor>{' '}
										</>
									)}
									{known && actor && title ? (
										<>
											{t(
												`tileshareActivity.actions.${item.eventType}`,
												actions[item.eventType]
											)}{' '}
											<strong>&lsquo;{title}&rsquo;</strong>
										</>
									) : (
										<>
											<span>
												{known
													? t(
															`tileshareActivity.events.${item.eventType}`,
															labels[item.eventType]
														)
													: t(
															'tileshareActivity.unknown',
															'Activity updated'
														)}
											</span>
											{title && (
												<>
													{' '}
													&middot; <strong>{title}</strong>
												</>
											)}
										</>
									)}
								</S.Sentence>
								{!ClusterId && item.clusterTitle && (
									<S.Detail>{item.clusterTitle}</S.Detail>
								)}
								{channel && (
									<S.Detail>
										{t(
											`tileshareActivity.channels.${channel}`,
											{
												email: 'Email',
												sms: 'SMS',
												push: 'Push notification',
											}[channel] ?? ''
										)}
									</S.Detail>
								)}
								{known && item.metadata?.changedFields && (
									<S.Detail>
										{item.metadata.changedFields
											.filter((field) =>
												['name', 'note', 'deadline'].includes(field)
											)
											.map((field) =>
												t(
													`tileshareActivity.fields.${field}`,
													{
														name: 'Name',
														note: 'Note',
														deadline: 'Deadline',
													}[field] ?? ''
												)
											)
											.join(', ')}
									</S.Detail>
								)}
								{known && item.eventType === 'invitation_send_unknown' && (
									<S.Detail>
										{t(
											'tileshareActivity.explicitResend',
											'The invitation may have been sent. Resend explicitly if needed.'
										)}
									</S.Detail>
								)}
								{!item.targetAvailable && (
									<S.Detail>
										{t(
											'tileshareActivity.unavailable',
											'Item no longer available'
										)}
									</S.Detail>
								)}
							</S.Copy>
							<S.Trailing>
								<time
									dateTime={date.toISOString()}
									title={date.toLocaleString(i18n.language)}
								>
									{date.toLocaleDateString() === new Date().toLocaleDateString()
										? date.toLocaleTimeString(i18n.language, {
												hour: 'numeric',
												minute: '2-digit',
											})
										: date.toLocaleDateString(i18n.language, {
												month: 'short',
												day: 'numeric',
												...(date.getFullYear() !== new Date().getFullYear()
													? { year: 'numeric' as const }
													: {}),
											})}
								</time>
								{item.targetAvailable && (
									<ChevronRight size={20} aria-hidden="true" />
								)}
							</S.Trailing>
						</>
					);
					return (
						<S.Row key={item.eventId}>
							{item.targetAvailable ? (
								<S.RowLink
									as={Link}
									to={path}
									aria-label={`${t('tileshareActivity.open', 'Open TileShare')}: ${actor ? actor + ' \u00b7 ' : ''}${known ? t(`tileshareActivity.events.${item.eventType}`, labels[item.eventType]) : t('tileshareActivity.unknown', 'Activity updated')}${title ? ' \u00b7 ' + title : ''}`}
								>
									{body}
								</S.RowLink>
							) : (
								<S.RowLink as="div">{body}</S.RowLink>
							)}
							<S.Dismiss
								type="button"
								disabled={!!savingPreference || current.loading}
								onClick={() => void changeDismissal(item.eventId)}
								aria-label={
									dismissedOnly
										? t('tileshareActivity.restore', 'Show in activities')
										: t('tileshareActivity.dismiss', 'Dismiss')
								}
								title={
									dismissedOnly
										? t('tileshareActivity.restore', 'Show in activities')
										: t('tileshareActivity.dismiss', 'Dismiss')
								}
							>
								{dismissedOnly ? (
									<RotateCcw size={14} aria-hidden="true" />
								) : (
									<X size={14} aria-hidden="true" />
								)}
							</S.Dismiss>
						</S.Row>
					);
				})}
			</S.List>
			{current.cursor && !current.loading && (
				<S.More type="button" onClick={() => void load(current.cursor ?? undefined)}>
					{t('tileshareActivity.more', 'Load more')}
				</S.More>
			)}
		</S.Timeline>
	);
}
