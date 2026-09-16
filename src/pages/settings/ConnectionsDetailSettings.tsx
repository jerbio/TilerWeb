import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { Routes } from '@/core/constants/routes';
import { integrationsService, scheduleService } from '@/services';
import ServerError from '@/core/error/server';
import { ERROR_CODES, TilerResponseError } from '@/core/common/types/errors';
import { mapIntegrationLocation } from '@/core/integrations/mapping';
import type { Integration, IntegrationCalendarItem } from '@/core/integrations/types';
import type { EventLocation } from '@/core/common/types/schedule';
import Toggle from '@/core/common/components/Toggle';
import Modal from '@/core/common/components/modals';
import analytics from '@/core/util/analytics';
import { Loader2, MapPin } from 'lucide-react';

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
 * - `POST /api/integrations/location` sets the default location from the
 *   inline editor that expands in place of the "Change location" action.
 *   The search reuses the debounced, stale-guarded pattern from
 *   `EditCalendarEvent`; the selected row saves immediately (mobile
 *   parity): the page updates optimistically, the server's stored copy (the
 *   response `Content`) wins on success, and the previous location is
 *   restored when the call fails while the editor stays open for a retry.
 *   The server overwrites `description` with an internal
 *   `cal-default-location-*` marker, so the stored copy is the source of
 *   truth.
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
	// Default-location picker (mirrors the mobile app's save-on-select flow).
	// The editor expands inline inside the "Default location" section.
	const [locationEditing, setLocationEditing] = useState(false);
	const [locationQuery, setLocationQuery] = useState('');
	const [locationResults, setLocationResults] = useState<EventLocation[]>([]);
	const [isLocationSearching, setIsLocationSearching] = useState(false);
	const [isLocationSaving, setIsLocationSaving] = useState(false);
	const [locationErrorVisible, setLocationErrorVisible] = useState(false);

	// Monotonic guard: a slow response for a previous integrationId must not
	// render over the current one (client-side navigation between details).
	const requestIdRef = useRef(0);
	// Monotonic guard for the debounced location search: a slow response for
	// an older query (or a collapsed editor) must not overwrite newer results.
	const locationSearchIdRef = useRef(0);
	// Provider string for analytics, kept in a ref so the search effect does
	// not re-run when the optimistic location update lands.
	const locationProviderRef = useRef('unknown');

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

	useEffect(() => {
		locationProviderRef.current = integration?.provider ?? 'unknown';
	}, [integration?.provider]);

	// Debounced location search while the inline editor is open (mirrors the
	// EditCalendarEvent pattern). Queries under 3 characters yield no
	// search; the server additionally rejects queries under 4 characters,
	// and that failure is treated like an empty result set. Stale responses
	// are dropped via the monotonic search id.
	useEffect(() => {
		if (!locationEditing) return;
		const query = locationQuery.trim();
		if (query.length < 3) {
			locationSearchIdRef.current += 1;
			setLocationResults([]);
			setIsLocationSearching(false);
			return;
		}
		const searchId = ++locationSearchIdRef.current;
		const startedAt = performance.now();
		setIsLocationSearching(true);
		const timer = window.setTimeout(async () => {
			try {
				const results = await scheduleService.searchLocations(query);
				if (searchId !== locationSearchIdRef.current) return; // stale
				const list = Array.isArray(results) ? results : [];
				setLocationResults(list);
				analytics.trackEvent(
					'Connections',
					'Connection location search completed',
					locationProviderRef.current,
					undefined,
					{
						provider: locationProviderRef.current,
						resultCount: list.length,
						latencyMs: Math.round(performance.now() - startedAt),
					}
				);
			} catch {
				if (searchId !== locationSearchIdRef.current) return; // stale
				setLocationResults([]);
				analytics.trackEvent(
					'Connections',
					'Connection location search failed',
					locationProviderRef.current,
					undefined,
					{ provider: locationProviderRef.current }
				);
			} finally {
				if (searchId === locationSearchIdRef.current) {
					setIsLocationSearching(false);
				}
			}
		}, 300);
		return () => window.clearTimeout(timer);
	}, [locationEditing, locationQuery]);

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

	const openLocationEditor = useCallback(() => {
		locationSearchIdRef.current += 1; // invalidate any in-flight search
		setLocationErrorVisible(false);
		setLocationQuery('');
		setLocationResults([]);
		setIsLocationSearching(false);
		setIsLocationSaving(false);
		setLocationEditing(true);
	}, []);

	const closeLocationEditor = useCallback(() => {
		// Ignore closes while the location save is in flight.
		if (isLocationSaving) return;
		locationSearchIdRef.current += 1;
		setLocationEditing(false);
		setLocationQuery('');
		setLocationResults([]);
	}, [isLocationSaving]);

	const handleSelectLocation = useCallback(
		async (loc: EventLocation) => {
			if (!integrationId || !integration || isLocationSaving) return;
			const mapped = mapIntegrationLocation(loc);
			if (!mapped) return;
			const provider = integration.provider ?? 'unknown';
			const previousLocation = integration.location;
			// Optimistic update; the server is the source of truth and the
			// previous location is restored when the round trip fails.
			setIntegration((prev) => (prev ? { ...prev, location: mapped } : prev));
			setLocationErrorVisible(false);
			setIsLocationSaving(true);
			analytics.trackEvent(
				'Connections',
				'Connection location save requested',
				provider,
				undefined,
				{ provider }
			);
			try {
				const stored = await integrationsService.setCalendarDefaultLocation({
					integrationId,
					location: mapped,
				});
				// Reconcile with the authoritative server copy (the server
				// overwrites description with its cal-default-location-*
				// marker), then collapse the editor.
				setIntegration((prev) => (prev ? { ...prev, location: stored ?? mapped } : prev));
				locationSearchIdRef.current += 1;
				setLocationEditing(false);
				setLocationQuery('');
				setLocationResults([]);
				analytics.trackEvent(
					'Connections',
					'Connection location saved',
					provider,
					undefined,
					{
						provider,
					}
				);
			} catch {
				// Roll back to the previous location and keep the editor open
				// with the search results intact so the user can retry.
				setIntegration((prev) => (prev ? { ...prev, location: previousLocation } : prev));
				setLocationErrorVisible(true);
				analytics.trackEvent(
					'Connections',
					'Connection location save failed',
					provider,
					undefined,
					{ provider }
				);
			} finally {
				setIsLocationSaving(false);
			}
		},
		[integrationId, integration, isLocationSaving]
	);

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
	// The stored copy's `description` is the server's cal-default-location-*
	// marker, so the section surfaces the address only.
	const locationAddress = integration?.location?.address ?? '';
	// "No results" only after a real search attempt (the 3-character
	// minimum), never on a fresh editor or a too-short query.
	const shouldShowLocationNoResults =
		!isLocationSearching &&
		!isLocationSaving &&
		locationResults.length === 0 &&
		locationQuery.trim().length >= 3;
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

			<Section>
				<SectionTitle>
					{t('settings.sections.connections.detail.locationSection', {
						defaultValue: 'Default location',
					})}
				</SectionTitle>
				<SectionDescription>
					{t('settings.sections.connections.detail.locationDescription', {
						defaultValue: 'Tiler uses this location for new events from this account.',
					})}
				</SectionDescription>
				{locationAddress ? (
					<LocationSummary title={locationAddress}>
						<MapPin size={16} aria-hidden="true" />
						<span>{locationAddress}</span>
					</LocationSummary>
				) : (
					<EmptyState>
						{t('settings.sections.connections.detail.locationUnset', {
							defaultValue: 'No default location set.',
						})}
					</EmptyState>
				)}
				{locationEditing ? (
					<LocationEditor>
						<LocationEditorHeader>
							<LocationEditorHeading>
								{t('settings.sections.connections.detail.locationPickerTitle', {
									defaultValue: 'Choose a default location',
								})}
							</LocationEditorHeading>
							<ModalButton onClick={closeLocationEditor} disabled={isLocationSaving}>
								{t('settings.sections.connections.detail.disconnectCancel', {
									defaultValue: 'Cancel',
								})}
							</ModalButton>
						</LocationEditorHeader>
						<LocationSearchInput
							value={locationQuery}
							aria-label={t(
								'settings.sections.connections.detail.locationSearchPlaceholder',
								{
									defaultValue: 'Search for a location...',
								}
							)}
							placeholder={t(
								'settings.sections.connections.detail.locationSearchPlaceholder',
								{
									defaultValue: 'Search for a location...',
								}
							)}
							onChange={(event) => setLocationQuery(event.target.value)}
							disabled={isLocationSaving}
						/>
						{isLocationSaving ? (
							<LocationStatus>
								<Loader2 size={16} className="spin" aria-hidden="true" />
								{t('settings.sections.connections.detail.locationSaving', {
									defaultValue: 'Saving location...',
								})}
							</LocationStatus>
						) : isLocationSearching ? (
							<LocationStatus>
								{t('settings.sections.connections.detail.locationSearching', {
									defaultValue: 'Searching locations...',
								})}
							</LocationStatus>
						) : shouldShowLocationNoResults ? (
							<EmptyState>
								{t('settings.sections.connections.detail.locationNoResults', {
									defaultValue: 'No matching locations found.',
								})}
							</EmptyState>
						) : null}
						{locationResults.length > 0 ? (
							<LocationResults>
								{locationResults.map((location) => (
									<LocationResultButton
										key={location.id}
										type="button"
										disabled={isLocationSaving}
										onClick={() => void handleSelectLocation(location)}
									>
										<LocationResultName>
											{location.description || location.address}
										</LocationResultName>
										{location.address ? (
											<LocationResultAddress>
												{location.address}
											</LocationResultAddress>
										) : null}
									</LocationResultButton>
								))}
							</LocationResults>
						) : null}
						{locationErrorVisible ? (
							<ErrorText role="alert">
								{t('settings.sections.connections.detail.locationSaveError', {
									defaultValue:
										"We couldn't save this location. Please try again.",
								})}
							</ErrorText>
						) : null}
					</LocationEditor>
				) : (
					<PrimaryButton onClick={openLocationEditor}>
						{t('settings.sections.connections.detail.locationChangeAction', {
							defaultValue: 'Change location',
						})}
					</PrimaryButton>
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
						<ErrorText role="alert">
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
						</ErrorText>
					) : null}
				</Modal>
			) : null}
		</Container>
	);
};

/**
 * Resolves the provider display name from the i18n namespace. Unknown
 * values fall back to the raw provider string so a future provider still
 * renders a readable heading instead of a blank title.
 */
function providerLabel(
	provider: string,
	t: (key: string, options?: Record<string, unknown>) => string
): string {
	const key = provider.toLowerCase();
	if (key === 'google' || key === 'microsoft') {
		return t(`settings.sections.connections.providers.${key}`, {
			defaultValue: key === 'google' ? 'Google Calendar' : 'Microsoft',
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

const ErrorText = styled.p`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.error};
	margin: 0.75rem 0 0 0;
`;

const LocationSummary = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};

	svg {
		flex-shrink: 0;
		color: ${({ theme }) => theme.colors.text.secondary};
	}

	span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;

const LocationEditor = styled.div`
	margin-top: 1.5rem;
	padding: 1rem;
	border: 1px solid ${({ theme }) => theme.colors.gray[700]};
	border-radius: 0.75rem;
`;

const LocationEditorHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
`;

const LocationEditorHeading = styled.h3`
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	margin: 0;
`;

const LocationSearchInput = styled.input`
	width: 100%;
	box-sizing: border-box;
	padding: 0.5rem 0.75rem;
	margin-bottom: 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.gray[700]};
	border-radius: 0.5rem;
	background-color: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.gray[500]};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const LocationStatus = styled.p`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	padding: 0.75rem 0.25rem;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};

	.spin {
		animation: location-picker-spin 1s linear infinite;
	}

	@keyframes location-picker-spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

const LocationResults = styled.div`
	display: flex;
	flex-direction: column;
	max-height: 240px;
	overflow-y: auto;
`;

const LocationResultButton = styled.button`
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: none;
	background: transparent;
	text-align: left;
	cursor: pointer;

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}

	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.gray[500]};
		outline-offset: -2px;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const LocationResultName = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const LocationResultAddress = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	color: ${({ theme }) => theme.colors.text.muted};
`;

export default ConnectionsDetailSettings;
