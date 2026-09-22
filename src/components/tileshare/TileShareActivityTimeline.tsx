import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TileshareApi } from '@/api/tileshareApi';
import { useAuth } from '@/core/auth/useAuth';
import { TileShareActivity, TileShareActivityScope } from '@/core/common/types/tileshareActivity';
import ServerError from '@/core/error/server';

const api = new TileshareApi();
const labels: Record<string, string> = {
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
	assignment_declined: 'Assignment declined',
	invitation_sent: 'Invitation sent',
	invitation_send_failed: 'Invitation could not be sent',
};

export default function TileShareActivityTimeline({
	ClusterId,
	TiletteId,
}: TileShareActivityScope) {
	const { t, i18n } = useTranslation();
	const { user } = useAuth();
	const accountKey = JSON.stringify(user);
	const scopeKey = JSON.stringify([accountKey, ClusterId, TiletteId]);
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
					{ ClusterId, TiletteId, Cursor: cursor },
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
		[ClusterId, TiletteId, scopeKey]
	);
	useEffect(() => {
		void load();
		const foreground = () => {
			if (document.visibilityState === 'visible') void load();
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
	}, [load]);
	const messages: Record<string, string> = {
		access: 'This activity is no longer available to you.',
		offline: 'You are offline. Reconnect to load activity.',
		failed: 'Activity could not be loaded.',
	};
	return (
		<section
			aria-label={t('tileshareActivity.title', 'Activities')}
			aria-busy={current.loading}
		>
			<h2>{t('tileshareActivity.title', 'Activities')}</h2>
			<button type="button" disabled={current.loading} onClick={() => void load()}>
				{t('tileshareActivity.refresh', 'Refresh')}
			</button>
			{current.loading && (
				<p role="status">{t('tileshareActivity.loading', 'Loading activity…')}</p>
			)}
			{current.error && (
				<div role="alert">
					<p>{t(`tileshareActivity.${current.error}`, messages[current.error])}</p>
					<button type="button" onClick={() => void load()}>
						{t('tileshareActivity.retry', 'Retry')}
					</button>
				</div>
			)}
			{!current.loading && !current.error && current.items.length === 0 && (
				<p>{t('tileshareActivity.empty', 'No activity yet.')}</p>
			)}
			<ol>
				{current.items.map((item, index) => {
					const date = new Date(item.occurredAt);
					const day = date.toLocaleDateString(i18n.language);
					const previousDay =
						index > 0
							? new Date(current.items[index - 1].occurredAt).toLocaleDateString(
									i18n.language
								)
							: null;
					const known =
						item.schemaVersion === 1 &&
						Object.prototype.hasOwnProperty.call(labels, item.eventType);
					const title = known ? item.metadata?.title : undefined;
					const path =
						`/tileshare/${encodeURIComponent(item.clusterId)}` +
						(item.tiletteId ? `/tilette/${encodeURIComponent(item.tiletteId)}` : '');
					return (
						<li key={item.eventId}>
							{day !== previousDay && <h3>{day}</h3>}
							<p>
								{known
									? t(
											`tileshareActivity.events.${item.eventType}`,
											labels[item.eventType]
										)
									: t('tileshareActivity.unknown', 'Activity updated')}
							</p>
							{item.actorId && item.actorName && <p>{item.actorName}</p>}
							{!ClusterId && item.clusterTitle && <p>{item.clusterTitle}</p>}
							{known && item.metadata?.changedFields && (
								<p>
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
								</p>
							)}
							{title && <p>{title}</p>}
							<time
								dateTime={date.toISOString()}
								title={date.toLocaleString(i18n.language)}
							>
								{date.toLocaleTimeString(i18n.language)}
							</time>{' '}
							{item.targetAvailable ? (
								<Link to={path}>
									{t('tileshareActivity.open', 'Open TileShare')}
								</Link>
							) : (
								<span>
									{t('tileshareActivity.unavailable', 'Item no longer available')}
								</span>
							)}
						</li>
					);
				})}
			</ol>
			{current.cursor && !current.loading && (
				<button type="button" onClick={() => void load(current.cursor ?? undefined)}>
					{t('tileshareActivity.more', 'Load more')}
				</button>
			)}
		</section>
	);
}
