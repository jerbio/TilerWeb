import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { Routes } from '@/core/constants/routes';
import { integrationsService } from '@/services';
import ServerError from '@/core/error/server';
import { ERROR_CODES, TilerResponseError } from '@/core/common/types/errors';
import type { Integration, IntegrationCalendarItem } from '@/core/integrations/types';
import Toggle from '@/core/common/components/Toggle';
import Modal from '@/core/common/components/modals';
import analytics from '@/core/util/analytics';

/**
 * Integration detail page (P4-3).
 *
 * Mirrors the Flutter integration UX (`connetions.dart` /
 * `integrationWidgetRoute.dart`): it shows the connected account, the
 * calendars it exposes with per-calendar visibility toggles, and the
 * disconnect flow.
 *
 * Data flow:
 * - `GET /api/integrations?integrationId=...` supplies the account header
 *   (email / provider). The server answers a *plain* HTTP 404 (no JSON
 *   body) when the integration no longer exists; that surfaces as a
 *   `ServerError` carrying `status`, which the page maps to the not-found
 *   state (an empty list is treated the same way).
 * - `GET /api/integrations/calendarItem?integrationId=...` is the
 *   authoritative source for the toggle states.
 * - Toggles are optimistic: the UI flips immediately, the server round trip
 *   follows, and the previous state is restored when the call fails.
 * - Disconnect confirms through a modal. The server can answer HTTP 200
 *   with `Error.Code` `10000009` when the provider-side delete fails, so
 *   success is judged on the normalized `TilerResponseError` code.
 *
 * Analytics follow the plan's allow-list: event name, provider, and result
 * category only — never emails, calendar names, or identifiers.
 */

/** The server answers a plain 404 (no JSON body) for a missing integration. */
function isNotFoundError(error: unknown): error is ServerError {
	return error instanceof ServerError && error.status === 404;
}

type DetailStatus = 'loading' | 'error' | 'notFound' | 'ready';

/** The toggle failure notification auto-dismisses after this delay. */
const TOGGLE_ERROR_DISMISS_MS = 5000;

const ConnectionsDetailSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();
	const { integrationId } = useParams();

	const [status, setStatus] = useState<DetailStatus>('loading');
	const [integration, setIntegration] = useState<Integration | null>(null);
	const [calendars, setCalendars] = useState<IntegrationCalendarItem[]>([]);
	const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
	const [toggleErrorVisible, setToggleErrorVisible] = useState(false);
	const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
	const [disconnectPending, setDisconnectPending] = useState(false);
	const [disconnectErrorKind, setDisconnectErrorKind] = useState<'provider' | 'generic' | null>(
		null
	);

	// Monotonic guard: a slow response for a previous integrationId must not
	// render over the current one (client-side navigation between details).
	const requestIdRef = useRef(0);

	// Development-only route diagnostic. Loading the route is not treated as a
	// connection attempt (see the plan's logging rules).
	if (import.meta.env.DEV && (!integrationId || integrationId.length > 128)) {
		console.warn(
			'[connections] detail route loaded without a valid integration id',
			integrationId ? `id length=${integrationId.length}` : 'id missing'
		);
	}

	const load = useCallback(async () => {
		const requestId = ++requestIdRef.current;
		if (!integrationId) {
			setStatus('notFound');
			return;
		}
		setStatus('loading');
		setToggleErrorVisible(false);
		try {
			const [integrations, items] = await Promise.all([
				integrationsService.getIntegrations(integrationId),
				integrationsService.getCalendarItems(integrationId),
			]);
			if (requestId !== requestIdRef.current) return; // stale response
			const record = integrations[0];
			if (!record) {
				// Empty list: the row does not exist for this account.
				setStatus('notFound');
				return;
			}
			setIntegration(record);
			setCalendars(items);
			setStatus('ready');
			const provider = record.provider ?? 'unknown';
			analytics.trackEvent('Connections', 'Connection detail loaded', provider, undefined, {
				provider,
			});
		} catch (error) {
			if (requestId !== requestIdRef.current) return;
			setStatus(isNotFoundError(error) ? 'notFound' : 'error');
		}
	}, [integrationId]);

	useEffect(() => {
		void load();
	}, [load]);

	// Auto-dismiss the one toggle failure notification.
	useEffect(() => {
		if (!toggleErrorVisible) return;
		const timer = window.setTimeout(
			() => setToggleErrorVisible(false),
			TOGGLE_ERROR_DISMISS_MS
		);
		return () => window.clearTimeout(timer);
	}, [toggleErrorVisible]);

	const handleToggle = useCallback(
		async (item: IntegrationCalendarItem, next: boolean) => {
			if (!integrationId || !item.id || pendingToggleId !== null || status !== 'ready')
				return;
			const previous = calendars;
			const provider = integration?.provider ?? 'unknown';
			// Optimistic flip; the server is the source of truth and the
			// previous state is restored when the round trip fails.
			setCalendars((prev) =>
				prev.map((c) => (c.id === item.id ? { ...c, isSelected: next } : c))
			);
			setPendingToggleId(item.id);
			analytics.trackEvent(
				'Connections',
				'Calendar visibility toggled',
				provider,
				undefined,
				{
					provider,
					selected: next,
				}
			);
			try {
				const updated = await integrationsService.toggleCalendarItem({
					integrationId,
					calendarItemId: item.id,
					isSelected: next,
				});
				if (updated && updated.id) {
					// Reconcile with the authoritative server state.
					setCalendars((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
				}
			} catch {
				setCalendars(previous);
				setToggleErrorVisible(true);
				analytics.trackEvent(
					'Connections',
					'Calendar visibility toggle failed',
					provider,
					undefined,
					{ provider }
				);
			} finally {
				setPendingToggleId(null);
			}
		},
		[integrationId, integration, calendars, pendingToggleId, status]
	);

	const openDisconnect = useCallback(() => {
		setDisconnectErrorKind(null);
		setDisconnectModalOpen(true);
	}, []);

	const closeDisconnect = useCallback(() => {
		// Ignore closes while the provider call is in flight.
		if (disconnectPending) return;
		setDisconnectModalOpen(false);
	}, [disconnectPending]);

	const handleDisconnectConfirm = useCallback(async () => {
		if (!integrationId || !integration || disconnectPending) return;
		const provider = integration.provider ?? 'google';
		setDisconnectPending(true);
		setDisconnectErrorKind(null);
		analytics.trackEvent('Connections', 'Disconnect requested', provider, undefined, {
			provider,
		});
		try {
			await integrationsService.disconnectIntegration({ integrationId, provider });
			analytics.trackEvent('Connections', 'Disconnect completed', provider, undefined, {
				provider,
			});
			navigate(Routes.SettingsConnections);
		} catch (error) {
			if (
				error instanceof TilerResponseError &&
				error.code === ERROR_CODES.INTEGRATION_DELETE_FAILED
			) {
				// HTTP 200 + Error.Code 10000009: the provider refused the
				// delete. It needs its own, more forgiving message.
				setDisconnectErrorKind('provider');
				analytics.trackEvent('Connections', 'Disconnect failed', provider, undefined, {
					provider,
					providerError: true,
				});
			} else if (isNotFoundError(error)) {
				// Plain 404: the row is already gone — treat as completed.
				analytics.trackEvent('Connections', 'Disconnect completed', provider, undefined, {
					provider,
				});
				navigate(Routes.SettingsConnections);
			} else {
				setDisconnectErrorKind('generic');
				analytics.trackEvent('Connections', 'Disconnect failed', provider, undefined, {
					provider,
					providerError: false,
				});
			}
		} finally {
			setDisconnectPending(false);
		}
	}, [integrationId, integration, disconnectPending, navigate]);

	if (status === 'loading') {
		return (
			<Container>
				<Breadcrumb>
					<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
						{t('settings.breadcrumb.settings')}
					</BreadcrumbLink>
					<BreadcrumbSeparator>/</BreadcrumbSeparator>
					<BreadcrumbCurrent>
						{t('settings.sections.connections.detail.calendarsTitle', {
							defaultValue: 'Connection',
						})}
					</BreadcrumbCurrent>
				</Breadcrumb>
				<StatusMessage $busy>
					{t('settings.sections.connections.detail.loading', {
						defaultValue: 'Loading connection...',
					})}
				</StatusMessage>
			</Container>
		);
	}

	if (status === 'error') {
		return (
			<Container>
				<Breadcrumb>
					<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
						{t('settings.breadcrumb.settings')}
					</BreadcrumbLink>
					<BreadcrumbSeparator>/</BreadcrumbSeparator>
					<BreadcrumbCurrent>
						{t('settings.sections.connections.detail.calendarsTitle', {
							defaultValue: 'Connection',
						})}
					</BreadcrumbCurrent>
				</Breadcrumb>
				<StatusMessage $busy={false}>
					{t('settings.sections.connections.detail.loadError', {
						defaultValue: 'This connection could not be loaded. Please try again.',
					})}
				</StatusMessage>
				<PrimaryButton onClick={() => void load()}>
					{t('settings.sections.connections.detail.retry', {
						defaultValue: 'Try again',
					})}
				</PrimaryButton>
			</Container>
		);
	}

	if (status === 'notFound') {
		return (
			<Container>
				<Breadcrumb>
					<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
						{t('settings.breadcrumb.settings')}
					</BreadcrumbLink>
					<BreadcrumbSeparator>/</BreadcrumbSeparator>
					<BreadcrumbCurrent>
						{t('settings.sections.connections.detail.calendarsTitle', {
							defaultValue: 'Connection',
						})}
					</BreadcrumbCurrent>
				</Breadcrumb>
				<StatusMessage $busy={false}>
					{t('settings.sections.connections.detail.notFound', {
						defaultValue: 'This connection is no longer available.',
					})}
				</StatusMessage>
				<PrimaryButton onClick={() => navigate(Routes.SettingsConnections)}>
					{t('settings.sections.connections.detail.backToConnections', {
						defaultValue: 'Back to connections',
					})}
				</PrimaryButton>
			</Container>
		);
	}

	const provider = integration?.provider ?? 'unknown';
	const providerName = providerLabel(provider, t);
	const accountEmail = integration?.email ?? '';
	const toggleAriaLabel = (item: IntegrationCalendarItem): string => {
		const calendarName = item.name ?? providerName;
		return `${calendarName} — ${
			item.isSelected
				? t('settings.sections.connections.detail.toggleEnabled', {
						defaultValue: 'Enabled',
					})
				: t('settings.sections.connections.detail.toggleDisabled', {
						defaultValue: 'Disabled',
					})
		}`;
	};

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbLink onClick={() => navigate(Routes.SettingsConnections)}>
					{t('settings.sections.connections.title')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>
					{accountEmail ||
						t('settings.sections.connections.detail.calendarsTitle', {
							defaultValue: 'Connection',
						})}
				</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{providerName}</Title>
				{accountEmail ? <AccountEmail>{accountEmail}</AccountEmail> : null}
			</Header>

			<Section>
				<SectionTitle>
					{t('settings.sections.connections.detail.calendarsTitle', {
						defaultValue: 'Calendars',
					})}
				</SectionTitle>
				<SectionDescription>
					{t('settings.sections.connections.detail.calendarsDescription', {
						defaultValue: 'Choose which calendars Tiler is allowed to read.',
					})}
				</SectionDescription>

				{toggleErrorVisible ? (
					<InlineNotice role="alert">
						{t('settings.sections.connections.detail.toggleError', {
							defaultValue: 'This calendar could not be updated. Please try again.',
						})}
					</InlineNotice>
				) : null}

				{calendars.length === 0 ? (
					<EmptyState>
						{t('settings.sections.connections.detail.calendarsEmpty', {
							defaultValue: 'No calendars are available for this account.',
						})}
					</EmptyState>
				) : (
					<div>
						{calendars.map((item) => (
							<Toggle
								key={item.id ?? item.name}
								isOn={Boolean(item.isSelected)}
								onChange={(next) => void handleToggle(item, next)}
								disabled={pendingToggleId !== null && pendingToggleId === item.id}
								label={item.name ?? providerName}
								ariaLabel={toggleAriaLabel(item)}
							/>
						))}
					</div>
				)}
			</Section>

			<Section $danger>
				<SectionTitle>
					{t('settings.sections.connections.detail.disconnectSection', {
						defaultValue: 'Disconnect',
					})}
				</SectionTitle>
				<SectionDescription>
					{t('settings.sections.connections.detail.disconnectDescription', {
						defaultValue:
							'If you disconnect this account, Tiler will no longer read its calendars.',
					})}
				</SectionDescription>
				<PrimaryButton $danger onClick={openDisconnect}>
					{t('settings.sections.connections.detail.disconnectAction', {
						defaultValue: 'Disconnect',
					})}
				</PrimaryButton>
			</Section>

			{disconnectModalOpen ? (
				<Modal
					show={disconnectModalOpen}
					setShow={(open) => {
						if (!open) closeDisconnect();
					}}
					headerText={t('settings.sections.connections.detail.disconnectConfirmTitle', {
						defaultValue: 'Disconnect this account?',
					})}
					footer={
						<ModalFooterButtons>
							<ModalButton onClick={closeDisconnect} disabled={disconnectPending}>
								{t('settings.sections.connections.detail.disconnectCancel', {
									defaultValue: 'Cancel',
								})}
							</ModalButton>
							<ModalButton
								$danger
								onClick={() => void handleDisconnectConfirm()}
								disabled={disconnectPending}
							>
								{disconnectPending
									? t('settings.sections.connections.detail.disconnecting', {
											defaultValue: 'Disconnecting...',
										})
									: t('settings.sections.connections.detail.disconnectAction', {
											defaultValue: 'Disconnect',
										})}
							</ModalButton>
						</ModalFooterButtons>
					}
				>
					<ModalBodyText>
						{t('settings.sections.connections.detail.disconnectConfirmDescription', {
							email: accountEmail || 'this account',
							defaultValue: 'Tiler will no longer be able to read {{email}}.',
						})}
					</ModalBodyText>
					{disconnectErrorKind ? (
						<ModalErrorText role="alert">
							{disconnectErrorKind === 'provider'
								? t(
										'settings.sections.connections.detail.disconnectProviderError',
										{
											defaultValue:
												"The calendar provider couldn't be disconnected right now. Please try again in a moment.",
										}
									)
								: t('settings.sections.connections.detail.disconnectError', {
										defaultValue:
											"We couldn't disconnect this account. Please try again.",
									})}
						</ModalErrorText>
					) : null}
				</Modal>
			) : null}
		</Container>
	);
};

/**
 * Resolves the provider display name from the i18n namespace. Google is the
 * only provider the server knows today, so unknown values fall back to the
 * raw provider string.
 */
function providerLabel(
	provider: string,
	t: (key: string, options?: Record<string, unknown>) => string
): string {
	if (provider.toLowerCase() === 'google') {
		return t('settings.sections.connections.providers.google', {
			defaultValue: 'Google Calendar',
		});
	}
	return provider;
}

const Container = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

const Breadcrumb = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 2rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BreadcrumbLink = styled.span`
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.gray[400]};
	}
`;

const BreadcrumbSeparator = styled.span`
	color: ${({ theme }) => theme.colors.gray[600]};
`;

const BreadcrumbCurrent = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: ${({ theme }) => theme.typography.fontSize.displaySm};
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 0.5rem 0;
`;

const AccountEmail = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const StatusMessage = styled.p<{ $busy?: boolean }>`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
	opacity: ${({ $busy }) => ($busy ? 0.7 : 1)};
	transition: opacity 0.2s ease;
`;

const PrimaryButton = styled.button<{ $danger?: boolean }>`
	margin-top: 1.5rem;
	padding: 0.375rem 0.75rem;
	border-radius: 0.5rem;
	border: 1px solid
		${({ $danger, theme }) => ($danger ? theme.colors.error[500] : theme.colors.gray[500])};
	background-color: transparent;
	color: ${({ $danger, theme }) =>
		$danger ? theme.colors.error[500] : theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	cursor: pointer;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease;

	&:hover {
		border-color: ${({ $danger, theme }) =>
			$danger ? theme.colors.error[300] : theme.colors.gray[300]};
		background-color: ${({ $danger, theme }) =>
			$danger ? theme.colors.error[50] : theme.colors.gray[100]};
	}
`;

const Section = styled.section<{ $danger?: boolean }>`
	border: 1px solid
		${({ $danger, theme }) => ($danger ? theme.colors.border.error : theme.colors.gray[700])};
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.5rem;

	&:last-of-type {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h2`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 0.75rem 0;
`;

const SectionDescription = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0 0 1rem 0;
`;

const InlineNotice = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.error};
	margin: 0 0 1rem 0;
`;

const EmptyState = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;

const ModalFooterButtons = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const ModalButton = styled.button<{ $danger?: boolean }>`
	padding: 0.375rem 0.75rem;
	border-radius: 0.5rem;
	border: 1px solid
		${({ $danger, theme }) => ($danger ? theme.colors.error[500] : theme.colors.gray[500])};
	background-color: transparent;
	color: ${({ $danger, theme }) =>
		$danger ? theme.colors.error[500] : theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	cursor: pointer;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease;

	&:hover:not(:disabled) {
		border-color: ${({ $danger, theme }) =>
			$danger ? theme.colors.error[300] : theme.colors.gray[300]};
		background-color: ${({ $danger, theme }) =>
			$danger ? theme.colors.error[50] : theme.colors.gray[100]};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ModalBodyText = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;

const ModalErrorText = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.error};
	margin: 0.75rem 0 0 0;
`;

export default ConnectionsDetailSettings;
