import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Apple, ChevronDown, ChevronRight, ListChecks, Slack, type LucideIcon } from 'lucide-react';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { useLocation } from 'react-router';
import { Routes } from '@/core/constants/routes';
import { integrationsService } from '@/services';
import {
	CONNECTION_PROVIDERS,
	type ConnectionProvider,
	type Integration,
} from '@/core/integrations/types';
import { parseOauthReturn, stripOauthParams } from '@/core/integrations/oauthReturn';
import { buildOauthStartUrl } from '@/core/integrations/oauthUrl';
import { Env } from '@/config/config_getter';
import analytics from '@/core/util/analytics';
import GoogleLogo from '@/assets/google_logo.png';
import MicrosoftLogo from '@/assets/microsoft_logo.png';
import Loader from '@/core/common/components/loader';

/**
 * Connections list page (Phase 3).
 *
 * Renders a single provider panel: every row from `CONNECTION_PROVIDERS`,
 * with each available provider's connected integrations (loaded through
 * `integrationsService`) nested under its expandable row — including the
 * app-wide loading bar while the integrations are retrieved, an error state
 * with retry, and a per-provider empty state. Completes the server-owned OAuth
 * round trip:
 *
 * - Start: the Connect action navigates the browser to
 *   `GET api/Integrations/connect?provider=google&redirectTarget=<this page>`;
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

/**
 * Best-effort marker of the provider the Connect click started the round trip
 * for. The server only reports the provider on success (inside the composite
 * integrationId), so declined/error returns are labelled with this marker.
 */
const OAUTH_STARTED_PROVIDER_STORAGE_KEY = 'connections.oauth.startedProvider';

/** The one OAuth return notification auto-dismisses after this delay. */
const NOTIFICATION_DISMISS_MS = 6000;

/**
 * Display names for the OAuth return notification. Unknown providers fall
 * back to a capitalized raw value so a future provider still reads as a
 * proper name in the message.
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
	google: 'Google',
	microsoft: 'Microsoft',
};

/**
 * Extracts the provider id embedded in the server's composite integration id
 * (`{tilerUserId}_TCA_{email}_TCA_{providerId}_TCA_{ulid}`, see
 * `oauthReturn.ts`). Anchored to the trailing provider+ULID segments so an
 * underscore inside the email segment cannot shift the split. Only the
 * provider id is ever surfaced — never the email or any other segment.
 */
const INTEGRATION_ID_PROVIDER_PATTERN = /_TCA_([a-z][a-z0-9]*)_TCA_[0-9A-Za-z]{26}$/;

function providerFromIntegrationId(integrationId: string | undefined): string | null {
	if (!integrationId) return null;
	const match = INTEGRATION_ID_PROVIDER_PATTERN.exec(integrationId);
	return match ? match[1] : null;
}

/** Human-readable provider name for the notification (unknown values are capitalized). */
function providerDisplayName(provider: string): string {
	const key = provider.toLowerCase();
	return PROVIDER_DISPLAY_NAMES[key] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

interface ConnectionState {
	loading: boolean;
	error: boolean;
	data: Integration[];
}

/**
 * Brand logo assets for the connectable providers (the same assets the home
 * integration section uses). Keyed by the stable `CONNECTION_PROVIDERS` id.
 */
const PROVIDER_LOGOS: Record<string, string> = {
	google: GoogleLogo,
	microsoft: MicrosoftLogo,
};

/** Muted line icons for the not-yet-available provider rows. */
const COMING_SOON_ICONS: Record<string, LucideIcon> = {
	apple: Apple,
	slack: Slack,
	googleTasks: ListChecks,
};

/** Row icon for a provider list row: brand asset or muted line icon. */
const ProviderRowIcon: React.FC<{ provider: ConnectionProvider }> = ({ provider }) => {
	const logo = PROVIDER_LOGOS[provider.id];
	if (logo) {
		return <ProviderBrandLogo src={logo} alt="" />;
	}
	const LineIcon = COMING_SOON_ICONS[provider.id];
	if (!LineIcon) return null;
	return (
		<ProviderLineIcon>
			<LineIcon size={18} />
		</ProviderLineIcon>
	);
};

/** Provider icon for a connected account row (null when the provider is unknown). */
const integrationProviderLogo = (provider: string | null): string | null => {
	if (!provider) return null;
	// Wire records can carry a differently-cased provider value (e.g. "Google").
	return PROVIDER_LOGOS[provider.toLowerCase()] ?? null;
};

/** Icon slot for a connected account row; renders nothing for unknown providers. */
const IntegrationProviderLogoSlot: React.FC<{ provider: string | null }> = ({ provider }) => {
	const logo = integrationProviderLogo(provider);
	if (!logo) return null;
	return (
		<ProviderIconSlot>
			<ProviderBrandLogo src={logo} alt="" />
		</ProviderIconSlot>
	);
};

const ConnectionsSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();
	const location = useLocation();

	const [state, setState] = useState<ConnectionState>({ loading: true, error: false, data: [] });
	const [notification, setNotification] = useState<{
		kind: 'success' | 'declined' | 'error';
		provider: string;
	} | null>(null);
	// Available provider rows the user has opened to reveal their accounts.
	const [expandedProviders, setExpandedProviders] = useState<ReadonlySet<string>>(new Set());

	// The transient OAuth return parameters are handled exactly once per mount.
	const oauthHandledRef = useRef(false);

	const loadIntegrations = useCallback(
		async (trackZeroIntegrations: boolean, provider: string = 'google') => {
			setState((prev) => ({ ...prev, loading: true, error: false }));
			try {
				const integrations = await integrationsService.getIntegrations();
				setState({ loading: false, error: false, data: integrations });
				if (trackZeroIntegrations && integrations.length === 0) {
					// A successful OAuth return should be followed by at least one
					// integration. Zero is a support-worthy diagnostic (count only —
					// never contents or user-identifying data).
					console.warn(
						'[connections] oauth success return followed by zero integrations'
					);
					analytics.trackEvent(
						'Connections',
						'OAuth zero integrations after success',
						provider,
						undefined,
						{
							provider,
							result: 'success',
							integrationCount: 0,
						}
					);
				}
				return integrations;
			} catch {
				// IntegrationsService normalizes all failures; the page only needs
				// to surface the retryable error state.
				setState({ loading: false, error: true, data: [] });
				return [];
			}
		},
		[]
	);

	// Initial load.
	useEffect(() => {
		void loadIntegrations(false);
	}, [loadIntegrations]);

	/** Opens or closes a provider row's nested account list. */
	const toggleProviderExpanded = useCallback((providerId: string) => {
		setExpandedProviders((prev) => {
			const next = new Set(prev);
			if (next.has(providerId)) {
				next.delete(providerId);
			} else {
				next.add(providerId);
			}
			return next;
		});
	}, []);

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

		// Best-effort record of the provider the Connect click started the
		// round trip for (see handleConnectToProvider); the server only
		// reports the provider on success, inside the composite id.
		let startedProvider: string | null = null;
		try {
			const storedProvider = localStorage.getItem(OAUTH_STARTED_PROVIDER_STORAGE_KEY);
			if (storedProvider) {
				startedProvider = storedProvider.trim().toLowerCase();
				localStorage.removeItem(OAUTH_STARTED_PROVIDER_STORAGE_KEY);
			}
		} catch {
			// Storage unavailable: the notification falls back to the default.
		}

		// Provider derivation, most authoritative source first: the server's
		// integrationId (success only), the client's started-provider marker
		// (declined/error carries no provider), then the v1 default.
		const provider =
			providerFromIntegrationId(parsed.integrationId) ??
			(startedProvider && startedProvider.length > 0 ? startedProvider : null) ??
			'google';
		analytics.trackEvent('Connections', 'OAuth returned', provider, undefined, {
			provider,
			elapsedMs,
		});
		analytics.trackEvent('Connections', 'OAuth result', provider, undefined, {
			provider,
			result: parsed.result,
			elapsedMs,
		});

		setNotification({ kind: parsed.result, provider: providerDisplayName(provider) });
		if (parsed.result === 'success') {
			// Refresh so the newly connected integration appears even if the
			// initial load raced the server-side persist, then open the
			// provider rows that gained accounts so the result is visible.
			void (async () => {
				const integrations = await loadIntegrations(true, provider);
				// Normalize casing to match the CONNECTION_PROVIDERS ids.
				const providerIds = Array.from(
					new Set(
						integrations
							.map((integration) => integration.provider?.toLowerCase() ?? '')
							.filter((providerId) => providerId.length > 0)
					)
				);
				if (providerIds.length > 0) {
					setExpandedProviders((prev) => {
						const next = new Set(prev);
						for (const providerId of providerIds) {
							next.add(providerId);
						}
						return next;
					});
				}
			})();
		}
	}, [loadIntegrations, navigate, location.search]);

	// Auto-dismiss the one OAuth return notification.
	useEffect(() => {
		if (!notification) return;
		const timer = window.setTimeout(() => setNotification(null), NOTIFICATION_DISMISS_MS);
		return () => window.clearTimeout(timer);
	}, [notification]);

	const handleConnectToProvider = useCallback((provider: string) => {
		analytics.trackEvent('Connections', 'OAuth started', provider, undefined, { provider });
		try {
			// Best-effort start markers for the return: the elapsed-time
			// telemetry and the provider the round trip was started for (the
			// label source for declined/error notifications).
			localStorage.setItem(OAUTH_STARTED_AT_STORAGE_KEY, String(Date.now()));
			localStorage.setItem(OAUTH_STARTED_PROVIDER_STORAGE_KEY, provider);
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
					$tone={notification.kind}
					role={notification.kind === 'success' ? 'status' : 'alert'}
				>
					{t(`settings.sections.connections.notifications.${notification.kind}`, {
						provider: notification.provider,
					})}
				</Notification>
			)}

			<Panel>
				{CONNECTION_PROVIDERS.map((provider) => {
					const isExpanded = expandedProviders.has(provider.id);
					// Wire records can carry a differently-cased provider value
					// (e.g. "Google"); group case-insensitively.
					const accounts = state.data.filter(
						(integration) => (integration.provider ?? '').toLowerCase() === provider.id
					);
					return (
						<ProviderSection key={provider.id}>
							<ProviderRow
								$interactive={provider.status === 'available'}
								onClick={
									provider.status === 'available'
										? () => toggleProviderExpanded(provider.id)
										: undefined
								}
							>
								<ProviderIconSlot>
									<ProviderRowIcon provider={provider} />
								</ProviderIconSlot>
								<ProviderName>
									{t(`settings.sections.connections.providers.${provider.id}`)}
								</ProviderName>
								<ProviderActions>
									{provider.status === 'available' ? (
										<>
											<ConnectButton
												onClick={(event) => {
													// The whole row toggles the expansion;
													// Connect must not trigger it.
													event.stopPropagation();
													handleConnectToProvider(provider.id);
												}}
											>
												{t('settings.sections.connections.connect')}
											</ConnectButton>
											<ExpandButton
												aria-controls={`connections-accounts-${provider.id}`}
												aria-expanded={isExpanded}
												aria-label={t(
													isExpanded
														? 'settings.sections.connections.collapseAccounts'
														: 'settings.sections.connections.expandAccounts'
												)}
												onClick={(event) => {
													// The whole row toggles the
													// expansion; stop the row handler
													// from firing a second time for
													// the same click.
													event.stopPropagation();
													toggleProviderExpanded(provider.id);
												}}
											>
												{isExpanded ? (
													<ChevronDown size={16} />
												) : (
													<ChevronRight size={16} />
												)}
											</ExpandButton>
										</>
									) : (
										<ComingSoon>
											{t('settings.sections.connections.comingSoon')}
										</ComingSoon>
									)}
								</ProviderActions>
							</ProviderRow>

							{provider.status === 'available' && isExpanded && (
								<ExpandedAccounts id={`connections-accounts-${provider.id}`}>
									{state.loading ? (
										<ExpandedLoader>
											<Loader />
										</ExpandedLoader>
									) : state.error ? (
										<StatusText role="alert">
											{t('settings.sections.connections.loadError')}
										</StatusText>
									) : accounts.length === 0 ? (
										<StatusText>
											{t('settings.sections.connections.empty')}
										</StatusText>
									) : (
										<IntegrationList>
											{accounts.map((integration, index) => (
												<IntegrationRow
													key={integration.id ?? `integration-${index}`}
												>
													<IntegrationProviderLogoSlot
														provider={integration.provider}
													/>
													<IntegrationInfo>
														<IntegrationEmail>
															{integration.email ?? ''}
														</IntegrationEmail>
														{integration.calendarItems.length > 0 && (
															<IntegrationMeta>
																{t(
																	'settings.sections.connections.calendarsConnected',
																	{
																		count: integration
																			.calendarItems.length,
																	}
																)}
															</IntegrationMeta>
														)}
													</IntegrationInfo>
													{integration.id && (
														<ManageButton
															onClick={() =>
																handleManage(integration)
															}
														>
															{t(
																'settings.sections.connections.manage'
															)}
														</ManageButton>
													)}
												</IntegrationRow>
											))}
										</IntegrationList>
									)}
								</ExpandedAccounts>
							)}
						</ProviderSection>
					);
				})}

				{state.loading && (
					<LoadingStatus data-testid="connections-loading">
						<Loader />
					</LoadingStatus>
				)}

				{!state.loading && state.error && (
					<PanelStatus>
						<StatusText role="alert">
							{t('settings.sections.connections.loadError')}
						</StatusText>
						<ConnectButton onClick={() => void loadIntegrations(false)}>
							{t('settings.sections.connections.retry')}
						</ConnectButton>
					</PanelStatus>
				)}

				{!state.loading && !state.error && state.data.length === 0 && (
					<PanelStatus>
						<StatusText>{t('settings.sections.connections.empty')}</StatusText>
					</PanelStatus>
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
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0.75rem;
	background-color: ${({ theme }) => theme.colors.background.card};
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const ProviderSection = styled.div`
	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;

const ProviderRow = styled.div<{ $interactive?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	// The negative horizontal margin plus equal padding lets the hover
	// background extend slightly beyond the row content without shifting
	// the layout.
	margin: 0 -0.5rem;
	padding: 0.625rem 0.5rem;
	border-radius: 0.5rem;

	${({ $interactive, theme }) =>
		$interactive &&
		`
		cursor: pointer;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: ${theme.colors.background.card2};
		}
	`}
`;

const ProviderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ExpandButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border: none;
	border-radius: 0.5rem;
	background-color: transparent;
	color: ${({ theme }) => theme.colors.text.muted};
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.background.card2};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const ExpandedAccounts = styled.div`
	margin: 0.25rem 0 0.75rem 2.5rem;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0.5rem;
	background-color: ${({ theme }) => theme.colors.background.card2};
`;

const PanelStatus = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

/** Centered host for the app-wide loading bar (page level, under the rows). */
const LoadingStatus = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

/** Centered host for the app-wide loading bar inside an expanded provider row. */
const ExpandedLoader = styled.div`
	display: flex;
	justify-content: center;
	padding: 0.75rem 0;
`;

const ProviderIconSlot = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 1.5rem;
	height: 1.5rem;
`;

const ProviderBrandLogo = styled.img`
	height: 1.25rem;
	width: auto;
`;

const ProviderLineIcon = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.text.muted};
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
	padding: 0.625rem 0;

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
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
		background-color: ${({ theme }) => theme.colors.background.card2};
	}
`;
