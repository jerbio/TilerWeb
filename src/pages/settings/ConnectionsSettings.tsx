import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { useLocation } from 'react-router';
import { Routes } from '@/core/constants/routes';
import { integrationsService } from '@/services';
import { CONNECTION_PROVIDERS, type Integration } from '@/core/integrations/types';
import { parseOauthReturn, stripOauthParams } from '@/core/integrations/oauthReturn';
import { buildOauthStartUrl } from '@/core/integrations/oauthUrl';
import { Env } from '@/config/config_getter';
import analytics from '@/core/util/analytics';

/**
 * Connections list page (Phase 3).
 *
 * Renders the provider capability list (Google is the only connectable
 * provider in v1) and the connected integrations loaded through
 * `integrationsService`, and completes the server-owned OAuth round trip:
 *
 * - Start: the Connect action navigates the browser to
 *   `GET api/Integrations?provider=google&redirectTarget=<this page>`;
 *   the server redirects to the provider consent screen.
 * - Return: the transient `calendarConnect`/`integrationId`/`reason` query
 *   parameters on this page are parsed with `parseOauthReturn`, exactly one
 *   notification is shown, the list refreshes on success only, and the
 *   transient parameters are removed with replace navigation.
 *
 * Duplicate handling is prevented by `oauthHandledRef` (a React effect
 * re-run or browser back navigation must not trigger a second
 * notification/refresh); the replace navigation itself removes the
 * transient parameters, so any later load sees a clean URL.
 */

/** Best-effort marker (ms epoch) of when the Connect click started the round trip. */
const OAUTH_STARTED_AT_STORAGE_KEY = 'connections.oauth.startedAt';

/** The one OAuth return notification auto-dismisses after this delay. */
const NOTIFICATION_DISMISS_MS = 6000;

interface ConnectionState {
	loading: boolean;
	error: boolean;
	data: Integration[];
}

const ConnectionsSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();
	const location = useLocation();

	const [state, setState] = useState<ConnectionState>({ loading: true, error: false, data: [] });
	const [notification, setNotification] = useState<'success' | 'declined' | 'error' | null>(null);

	// The transient OAuth return parameters are handled exactly once per mount.
	const oauthHandledRef = useRef(false);

	const loadIntegrations = useCallback(async (trackZeroIntegrations: boolean) => {
		setState((prev) => ({ ...prev, loading: true, error: false }));
		try {
			const integrations = await integrationsService.getIntegrations();
			setState({ loading: false, error: false, data: integrations });
			if (trackZeroIntegrations && integrations.length === 0) {
				// A successful OAuth return should be followed by at least one
				// integration. Zero is a support-worthy diagnostic (count only —
				// never contents or user-identifying data).
				console.warn('[connections] oauth success return followed by zero integrations');
				analytics.trackEvent(
					'Connections',
					'OAuth zero integrations after success',
					'google',
					undefined,
					{
						provider: 'google',
						result: 'success',
						integrationCount: 0,
					}
				);
			}
		} catch {
			// IntegrationsService normalizes all failures; the page only needs
			// to surface the retryable error state.
			setState({ loading: false, error: true, data: [] });
		}
	}, []);

	// Initial load.
	useEffect(() => {
		void loadIntegrations(false);
	}, [loadIntegrations]);

	// One-shot OAuth return handling: clean the URL, parse the result, notify,
	// and refresh (success only). Runs before the parse so transient params are
	// removed even when the result is unrecognisable.
	useEffect(() => {
		if (oauthHandledRef.current) return;
		oauthHandledRef.current = true;

		// Read the router's search (not window.location.search) so the transient
		// parameters are picked up under any history implementation and always
		// reflect the mounted URL (jsdom in tests, the browser in production).
		const search = location.search;
		const cleanSearch = stripOauthParams(search);
		if (cleanSearch !== search) {
			navigate(Routes.SettingsConnections + cleanSearch, { replace: true });
		}

		const parsed = parseOauthReturn(search);
		if (!parsed) return;

		// Best-effort elapsed time since the Connect click (see
		// handleConnectGoogle). Telemetry only; failures are silent.
		let elapsedMs: number | undefined;
		try {
			const startedAtRaw = localStorage.getItem(OAUTH_STARTED_AT_STORAGE_KEY);
			if (startedAtRaw) {
				const startedAt = Number(startedAtRaw);
				if (Number.isFinite(startedAt) && startedAt > 0) {
					elapsedMs = Math.max(0, Date.now() - startedAt);
				}
				localStorage.removeItem(OAUTH_STARTED_AT_STORAGE_KEY);
			}
		} catch {
			// Storage unavailable: telemetry is best-effort, never surface it.
		}

		// v1 is Google-only; the return contract does not carry a provider.
		const provider = 'google';
		analytics.trackEvent('Connections', 'OAuth returned', provider, undefined, {
			provider,
			elapsedMs,
		});
		analytics.trackEvent('Connections', 'OAuth result', provider, undefined, {
			provider,
			result: parsed.result,
			elapsedMs,
		});

		setNotification(parsed.result);
		if (parsed.result === 'success') {
			// Refresh so the newly connected integration appears even if the
			// initial load raced the server-side persist.
			void loadIntegrations(true);
		}
	}, [loadIntegrations, navigate, location.search]);

	// Auto-dismiss the one OAuth return notification.
	useEffect(() => {
		if (!notification) return;
		const timer = window.setTimeout(() => setNotification(null), NOTIFICATION_DISMISS_MS);
		return () => window.clearTimeout(timer);
	}, [notification]);

	const handleConnectGoogle = useCallback(() => {
		const provider = 'google';
		analytics.trackEvent('Connections', 'OAuth started', provider, undefined, { provider });
		try {
			// Best-effort start marker for the elapsed-time telemetry on return.
			localStorage.setItem(OAUTH_STARTED_AT_STORAGE_KEY, String(Date.now()));
		} catch {
			// Storage unavailable: telemetry is best-effort, the flow proceeds.
		}
		const startUrl = buildOauthStartUrl(
			Env.get('BASE_URL'),
			provider,
			`${window.location.origin}${Routes.SettingsConnections}`
		);
		if (startUrl) {
			// Full-page navigation: the server owns the OAuth round trip.
			window.location.assign(startUrl);
		}
	}, []);

	const handleManage = useCallback(
		(integration: Integration) => {
			if (!integration.id) return;
			analytics.trackEvent(
				'Connections',
				'Manage connection',
				integration.provider ?? 'unknown',
				undefined,
				{
					provider: integration.provider ?? 'unknown',
				}
			);
			navigate(Routes.SettingsConnectionDetail(integration.id));
		},
		[navigate]
	);

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate(Routes.Settings)}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>{t('settings.sections.connections.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.connections.title')}</Title>
				<Description>{t('settings.sections.connections.description')}</Description>
			</Header>

			{notification && (
				<Notification
					$tone={notification}
					role={notification === 'success' ? 'status' : 'alert'}
				>
					{t(`settings.sections.connections.notifications.${notification}`)}
				</Notification>
			)}

			<Panel>
				{CONNECTION_PROVIDERS.map((provider) => (
					<ProviderRow key={provider.id}>
						<ProviderName>
							{t(`settings.sections.connections.providers.${provider.id}`)}
						</ProviderName>
						{provider.status === 'available' ? (
							<ConnectButton onClick={handleConnectGoogle}>
								{t('settings.sections.connections.connect')}
							</ConnectButton>
						) : (
							<ComingSoon>{t('settings.sections.connections.comingSoon')}</ComingSoon>
						)}
					</ProviderRow>
				))}
			</Panel>

			<Panel>
				<PanelTitle>{t('settings.sections.connections.connectedAccounts')}</PanelTitle>

				{state.loading && (
					<StatusText>{t('settings.sections.connections.loading')}</StatusText>
				)}

				{!state.loading && state.error && (
					<>
						<StatusText role="alert">
							{t('settings.sections.connections.loadError')}
						</StatusText>
						<ConnectButton onClick={() => void loadIntegrations(false)}>
							{t('settings.sections.connections.retry')}
						</ConnectButton>
					</>
				)}

				{!state.loading && !state.error && state.data.length === 0 && (
					<StatusText>{t('settings.sections.connections.empty')}</StatusText>
				)}

				{!state.loading && !state.error && state.data.length > 0 && (
					<IntegrationList>
						{state.data.map((integration, index) => (
							<IntegrationRow key={integration.id ?? `integration-${index}`}>
								<IntegrationInfo>
									<IntegrationEmail>{integration.email ?? ''}</IntegrationEmail>
									{integration.calendarItems.length > 0 && (
										<IntegrationMeta>
											{t('settings.sections.connections.calendarsConnected', {
												count: integration.calendarItems.length,
											})}
										</IntegrationMeta>
									)}
								</IntegrationInfo>
								{integration.id && (
									<ManageButton onClick={() => handleManage(integration)}>
										{t('settings.sections.connections.manage')}
									</ManageButton>
								)}
							</IntegrationRow>
						))}
					</IntegrationList>
				)}
			</Panel>
		</Container>
	);
};

export default ConnectionsSettings;

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

const Description = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;

const Notification = styled.div<{ $tone: 'success' | 'declined' | 'error' }>`
	padding: 0.75rem 1rem;
	margin-bottom: 1.5rem;
	border-radius: 0.5rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	border: 1px solid
		${({ $tone, theme }) =>
			$tone === 'success' ? theme.colors.success[500] : theme.colors.error[500]};
	background-color: ${({ $tone, theme }) =>
		$tone === 'success' ? theme.colors.success[900] : theme.colors.error[900]};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Panel = styled.section`
	border: 1px solid ${({ theme }) => theme.colors.gray[700]};
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const PanelTitle = styled.h2`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0 0 0.75rem 0;
`;

const ProviderRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.5rem 0;
`;

const ProviderName = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const ConnectButton = styled.button`
	padding: 0.375rem 0.75rem;
	border-radius: 0.5rem;
	border: 1px solid ${({ theme }) => theme.colors.success[500]};
	background-color: transparent;
	color: ${({ theme }) => theme.colors.success[500]};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.success[500]};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const ComingSoon = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-style: italic;
`;

const StatusText = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0.25rem 0;
`;

const IntegrationList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
`;

const IntegrationRow = styled.li`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.5rem 0;
`;

const IntegrationInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
`;

const IntegrationEmail = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const IntegrationMeta = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const ManageButton = styled.button`
	padding: 0.375rem 0.75rem;
	border-radius: 0.5rem;
	border: 1px solid ${({ theme }) => theme.colors.gray[500]};
	background-color: transparent;
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	cursor: pointer;
	transition: border-color 0.2s ease;

	&:hover {
		border-color: ${({ theme }) => theme.colors.gray[300]};
	}
`;
