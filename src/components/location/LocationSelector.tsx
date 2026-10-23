import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { CheckCircle2, ChevronDown, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocationState } from '@/hooks/useLocationState';
import {
	hasUsableCoordinates,
	locationService,
	type SelectedLocation,
} from '@/services/locationService';
import {
	LocationIssue,
	LocationPermission,
	LocationSearchState,
	LocationSource,
	LocationStage,
	LOCATION_MIN_SEARCH_LENGTH,
	LOCATION_REFRESH_INTERVAL,
	LOCATION_SEARCH_DEBOUNCE_MS,
	LOCATION_STORAGE_KEY,
} from '@/core/constants/location';
import type { EventLocation } from '@/core/common/types/schedule';

function useLocationMonitoring() {
	useEffect(() => {
		let disposed = false;
		let permissionStatus: PermissionStatus | undefined;
		const updatePermission = () => {
			if (!permissionStatus || disposed) return;
			locationService.store.setState({ permission: permissionStatus.state });
			if (
				permissionStatus.state !== LocationPermission.Granted &&
				locationService.store.getState().active?.source === LocationSource.Device
			) {
				locationService.cancelDetection();
				locationService.store.setState({
					candidate: null,
					issue:
						permissionStatus.state === LocationPermission.Denied
							? LocationIssue.Blocked
							: LocationIssue.RefreshNeeded,
				});
			}
		};
		if (navigator.permissions?.query) {
			void navigator.permissions
				.query({ name: 'geolocation' })
				.then((status) => {
					if (disposed) return;
					permissionStatus = status;
					updatePermission();
					status.addEventListener('change', updatePermission);
				})
				.catch(() => {
					/* Detection still works through an explicit click. */
				});
		}
		const refresh = () => {
			if (document.visibilityState === 'visible') void locationService.refreshIfStale();
		};
		const storage = (event: StorageEvent) => {
			if (event.key === LOCATION_STORAGE_KEY || event.key === null)
				locationService.restoreFromStorage();
		};
		refresh();
		window.addEventListener('focus', refresh);
		window.addEventListener('pageshow', refresh);
		document.addEventListener('visibilitychange', refresh);
		window.addEventListener('storage', storage);
		const timer = window.setInterval(refresh, LOCATION_REFRESH_INTERVAL);
		return () => {
			disposed = true;
			permissionStatus?.removeEventListener('change', updatePermission);
			window.removeEventListener('focus', refresh);
			window.removeEventListener('pageshow', refresh);
			document.removeEventListener('visibilitychange', refresh);
			window.removeEventListener('storage', storage);
			window.clearInterval(timer);
		};
	}, []);
}

function candidateIsUsable(result: EventLocation) {
	return (
		!!result.address?.trim() &&
		!result.isNull &&
		!result.isDefault &&
		hasUsableCoordinates({
			location: result.address,
			latitude: result.latitude,
			longitude: result.longitude,
			verified: result.isVerified,
		})
	);
}

function LocationDetails({ location }: { location: SelectedLocation }) {
	const { t, i18n } = useTranslation();
	return (
		<>
			<Address>
				{location.source === LocationSource.Device
					? t('schedulingLocation.near', { address: location.location })
					: location.location}
			</Address>
			{location.source === LocationSource.Device && (
				<Detail>
					{location.accuracy === undefined
						? t('schedulingLocation.approximate')
						: t('schedulingLocation.accuracy', {
								meters: Math.max(1, Math.ceil(location.accuracy)).toLocaleString(
									i18n.language
								),
							})}
				</Detail>
			)}
		</>
	);
}

type LocationSelectorProps = {
	/** Single-line presentation for the demo toolbar. */
	compact?: boolean;
};

export default function LocationSelector({ compact = false }: LocationSelectorProps) {
	const { t } = useTranslation();
	const state = useLocationState((value) => value);
	const busy = state.stage !== LocationStage.Idle;
	const directDeviceAction = !state.active && !state.candidate && !state.issue;
	useLocationMonitoring();
	const status = busy
		? t(`schedulingLocation.stage.${state.stage}`)
		: state.candidate
			? t('schedulingLocation.updateReady')
			: state.issue
				? t('schedulingLocation.needsAttention')
				: state.active
					? t(`schedulingLocation.source.${state.active.source}`)
					: t('schedulingLocation.reviewBeforeUse');
	const findCurrentLocation = () => {
		locationService.openPicker();
		void locationService.detectCurrentLocation();
	};
	return (
		<>
			<Field $compact={compact}>
				<Trigger
					$compact={compact}
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						if (directDeviceAction) findCurrentLocation();
						else locationService.openPicker();
					}}
					aria-haspopup="dialog"
					aria-expanded={state.pickerOpen}
					aria-label={
						directDeviceAction
							? t('schedulingLocation.useCurrent')
							: `${t('schedulingLocation.title')}: ${state.active?.location || t('schedulingLocation.setLocation')}. ${status}`
					}
					title={
						directDeviceAction
							? t('schedulingLocation.permissionExplanation')
							: `${state.active?.location || t('schedulingLocation.notSelected')}. ${status}`
					}
				>
					<PulsingPin $busy={busy}>
						<MapPin size={18} aria-hidden="true" />
					</PulsingPin>
					<TriggerText>
						{!compact && <Label>{t('schedulingLocation.title')}</Label>}
						<TriggerAddress>
							{state.active?.location ||
								t(
									directDeviceAction
										? 'schedulingLocation.useCurrent'
										: 'schedulingLocation.setLocation'
								)}
						</TriggerAddress>
						<TriggerStatus
							role="status"
							$compact={compact}
							$attention={!!state.candidate || !!state.issue}
						>
							{status}
						</TriggerStatus>
					</TriggerText>
					{compact && (state.candidate || state.issue) && (
						<AttentionDot aria-hidden="true" title={status} />
					)}
					<ChevronDown size={14} aria-hidden="true" />
				</Trigger>
				<Shortcut
					type="button"
					aria-haspopup="dialog"
					disabled={busy}
					aria-label={t(
						directDeviceAction
							? 'schedulingLocation.chooseAddress'
							: 'schedulingLocation.useCurrent'
					)}
					title={t(
						directDeviceAction
							? 'schedulingLocation.chooseAddress'
							: 'schedulingLocation.useCurrent'
					)}
					onClick={(event) => {
						event.stopPropagation();
						if (directDeviceAction) locationService.openPicker();
						else findCurrentLocation();
					}}
				>
					{directDeviceAction ? (
						<Search size={17} aria-hidden="true" />
					) : (
						<LocateFixed size={17} aria-hidden="true" />
					)}
				</Shortcut>
			</Field>
		</>
	);
}

/** Mounted once at the app root so toast actions work on every route. */
export function LocationPicker() {
	const isOpen = useLocationState((state) => state.pickerOpen);
	return isOpen ? <LocationPanel /> : null;
}

function LocationPanel() {
	const { t } = useTranslation();
	const state = useLocationState((value) => value);
	const [query, setQuery] = useState('');
	const [searchAttempt, setSearchAttempt] = useState(0);
	const [results, setResults] = useState<EventLocation[]>([]);
	const [searchState, setSearchState] = useState<LocationSearchState>(LocationSearchState.Idle);
	const panelRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const confirmRef = useRef<HTMLButtonElement>(null);
	const titleId = useId(),
		inputId = useId(),
		hintId = useId();
	const busy = state.stage !== LocationStage.Idle;
	const showSearch = !busy && !state.candidate;

	useEffect(() => {
		const previousFocus = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		(searchRef.current ?? confirmRef.current ?? closeRef.current)?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				locationService.closePicker();
			}
			if (event.key !== 'Tab') return;
			const elements = Array.from(
				panelRef.current?.querySelectorAll<HTMLElement>('*') ?? []
			).filter((element) => element.tabIndex >= 0 && !element.hasAttribute('disabled'));
			if (!elements.length) return;
			const first = elements[0],
				last = elements[elements.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', onKey, true);
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', onKey, true);
			if (previousFocus?.isConnected) previousFocus.focus();
		};
	}, []);

	useEffect(() => {
		if (state.candidate) confirmRef.current?.focus();
		else if (showSearch) searchRef.current?.focus();
		else closeRef.current?.focus();
	}, [state.candidate, showSearch]);

	useEffect(() => {
		setResults([]);
		if (!showSearch || query.trim().length < LOCATION_MIN_SEARCH_LENGTH) {
			setSearchState(LocationSearchState.Idle);
			return;
		}
		let cancelled = false;
		const controller = new AbortController();
		setSearchState(LocationSearchState.Searching);
		const timer = setTimeout(() => {
			void locationService
				.searchAddresses(query, controller.signal)
				.then((found) => {
					if (cancelled) return;
					setResults(found);
					setSearchState(
						found.length ? LocationSearchState.Ready : LocationSearchState.Empty
					);
				})
				.catch(() => {
					if (!cancelled) setSearchState(LocationSearchState.Failed);
				});
		}, LOCATION_SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, searchAttempt, showSearch]);

	return createPortal(
		<Overlay
			onClick={(event) => {
				event.stopPropagation();
				if (event.target === event.currentTarget) locationService.closePicker();
			}}
		>
			<Panel ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
				<PanelHeader>
					<h2 id={titleId}>{t('schedulingLocation.title')}</h2>
					<CloseButton
						ref={closeRef}
						type="button"
						aria-label={t('schedulingLocation.close')}
						onClick={locationService.closePicker}
					>
						<X size={18} />
					</CloseButton>
				</PanelHeader>
				<PanelBody>
					{state.requestNeedsLocation && (
						<Detail>{t('schedulingLocation.chooseBeforeSend')}</Detail>
					)}
					{state.active && (
						<Current title={state.active.location}>
							{t('schedulingLocation.using', { address: state.active.location })}
						</Current>
					)}
					{state.persistenceFailed && (
						<Notice role="alert">{t('schedulingLocation.persistenceFailed')}</Notice>
					)}
					{state.issue && (
						<Notice role="alert">{t(`schedulingLocation.issue.${state.issue}`)}</Notice>
					)}
					{busy && (
						<Progress role="status" aria-live="polite">
							<PulsingPin $busy>
								<LocateFixed size={28} aria-hidden="true" />
							</PulsingPin>
							<Address>{t(`schedulingLocation.stage.${state.stage}`)}</Address>
							<QuietAction type="button" onClick={locationService.cancelDetection}>
								{t('schedulingLocation.cancel')}
							</QuietAction>
						</Progress>
					)}
					{state.candidate && (
						<Preview aria-label={t('schedulingLocation.review')}>
							<MapPin size={28} aria-hidden="true" />
							<LocationDetails location={state.candidate} />
							<Primary
								ref={confirmRef}
								type="button"
								onClick={() => locationService.confirmCandidate()}
							>
								{t('schedulingLocation.confirm')}
							</Primary>
							<QuietAction
								type="button"
								onClick={() => {
									locationService.discardCandidate();
									setQuery('');
								}}
							>
								{t('schedulingLocation.changeAddress')}
							</QuietAction>
						</Preview>
					)}
					{showSearch && (
						<>
							<DeviceAction
								type="button"
								onClick={() => {
									setQuery('');
									void locationService.detectCurrentLocation();
								}}
							>
								<LocateFixed size={18} aria-hidden="true" />
								{t('schedulingLocation.useCurrent')}
							</DeviceAction>
							<Detail>{t('schedulingLocation.permissionExplanation')}</Detail>
							<SearchField>
								<Search size={17} aria-hidden="true" />
								<SearchInput
									ref={searchRef}
									id={inputId}
									type="search"
									value={query}
									autoComplete="off"
									aria-label={t('schedulingLocation.chooseAddress')}
									placeholder={t('schedulingLocation.searchPlaceholder')}
									aria-describedby={
										query.trim().length > 0 &&
										query.trim().length < LOCATION_MIN_SEARCH_LENGTH
											? hintId
											: undefined
									}
									onChange={(event) => setQuery(event.target.value)}
								/>
							</SearchField>
							{query.trim().length > 0 &&
								query.trim().length < LOCATION_MIN_SEARCH_LENGTH && (
									<Detail id={hintId}>
										{t('schedulingLocation.searchHint', {
											count: LOCATION_MIN_SEARCH_LENGTH,
										})}
									</Detail>
								)}
							<div role="status" aria-live="polite">
								{searchState === LocationSearchState.Searching && (
									<Detail>{t('schedulingLocation.searching')}</Detail>
								)}
								{searchState === LocationSearchState.Empty && (
									<Detail>{t('schedulingLocation.noMatches')}</Detail>
								)}
								{searchState === LocationSearchState.Failed && (
									<Notice>
										{t('schedulingLocation.searchFailed')}
										<QuietAction
											type="button"
											onClick={() => setSearchAttempt((value) => value + 1)}
										>
											{t('schedulingLocation.retry')}
										</QuietAction>
									</Notice>
								)}
							</div>
							{results.length > 0 && (
								<Results aria-label={t('schedulingLocation.matches')}>
									{results.map((result, index) => {
										const usable = candidateIsUsable(result);
										return (
											<li key={`${result.id}-${index}`}>
												<Result
													type="button"
													disabled={!usable}
													aria-label={`${result.address}, ${t(usable ? 'schedulingLocation.matched' : 'schedulingLocation.unresolved')}`}
													onClick={() => {
														if (locationService.previewAddress(result))
															locationService.confirmCandidate();
													}}
												>
													<ResultText>
														<Address as="span">
															{result.address}
														</Address>
														{!usable ? (
															<Detail as="span">
																{t('schedulingLocation.unresolved')}
															</Detail>
														) : (
															result.description &&
															result.description !== result.id &&
															result.description !==
																result.address && (
																<Detail as="span">
																	{result.description}
																</Detail>
															)
														)}
													</ResultText>
													{usable && (
														<CheckCircle2
															size={16}
															aria-hidden="true"
														/>
													)}
												</Result>
											</li>
										);
									})}
								</Results>
							)}
							{results.some((result) => result.source === 'google') && (
								<Detail>{t('calendarEvent.edit.poweredByGoogle')}</Detail>
							)}
						</>
					)}
					{!busy && !state.candidate && (
						<Footer>
							<QuietAction
								type="button"
								onClick={locationService.continueWithoutLocation}
							>
								{t('schedulingLocation.continueWithout')}
							</QuietAction>
							<Detail>{t('schedulingLocation.withoutConsequences')}</Detail>
						</Footer>
					)}
				</PanelBody>
			</Panel>
		</Overlay>,
		document.body
	);
}

const pulse = keyframes`0%, 100% { opacity: .45; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.12); }`;
const PulsingPin = styled.span<{ $busy: boolean }>`
	display: inline-flex;
	flex-shrink: 0;
	color: ${({ theme }) => theme.colors.brand[400]};
	animation: ${({ $busy }) => ($busy ? pulse : 'none')} 1.2s ease-in-out infinite;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;
const Field = styled.div<{ $compact: boolean }>`
	display: flex;
	align-items: stretch;
	${({ $compact }) =>
		$compact &&
		css`
			box-sizing: border-box;
			height: 32px;
		`}
	min-width: 0;
	max-width: 300px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	@media (max-width: 600px) {
		max-width: 175px;
	}
`;
const Trigger = styled.button<{ $compact: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	border: 0;
	border-radius: 8px;
	background: transparent;
	color: inherit;
	padding: ${({ $compact }) => ($compact ? '3px 8px' : '5px 8px')};
	text-align: left;
	cursor: pointer;
	font: inherit;
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 2px;
	}
	@media (max-width: 600px) {
		gap: 5px;
		padding: ${({ $compact }) => ($compact ? '3px 6px' : '4px 6px')};
	}
`;
const Shortcut = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	flex-shrink: 0;
	border: 0;
	border-left: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0 8px 8px 0;
	background: transparent;
	color: inherit;
	cursor: pointer;
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
	}
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`;
const TriggerText = styled.span`
	display: flex;
	flex-direction: column;
	min-width: 0;
	gap: 1px;
`;
const Label = styled.span`
	font-size: 10px;
	color: ${({ theme }) => theme.colors.text.secondary};
	line-height: 1.2;
`;
const TriggerAddress = styled.span`
	font-size: 12px;
	line-height: 1.3;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;
const TriggerStatus = styled.span<{ $attention: boolean; $compact: boolean }>`
	font-size: 10px;
	line-height: 1.2;
	color: ${({ theme, $attention }) =>
		$attention ? theme.colors.text.warning : theme.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	${({ $compact }) =>
		$compact &&
		css`
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			clip: rect(0, 0, 0, 0);
			border: 0;
		`}
`;
const AttentionDot = styled.span`
	width: 6px;
	height: 6px;
	flex-shrink: 0;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.text.warning};
`;
const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10000;
	background: ${({ theme }) => theme.colors.backdrop.default};
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	@media (max-width: 600px) {
		padding: 16px;
	}
`;
const Panel = styled.div`
	width: 100%;
	max-width: 420px;
	max-height: calc(100dvh - 40px);
	display: flex;
	flex-direction: column;
	border: 1px solid ${({ theme }) => theme.colors.border.strong};
	border-radius: 16px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	box-shadow: 0 16px 60px rgba(0, 0, 0, 0.35);
	overflow: hidden;
	@media (max-width: 600px) {
		max-height: calc(100dvh - 32px);
	}
`;
const PanelHeader = styled.div`
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	h2 {
		margin: 0;
		font-size: 18px;
	}
`;
const PanelBody = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 0;
	gap: 10px;
	padding: 0 16px max(16px, env(safe-area-inset-bottom));
	overflow-y: auto;
	overscroll-behavior: contain;
`;
const Address = styled.p`
	display: block;
	font-size: 14px;
	line-height: 1.5;
	margin: 0;
	overflow-wrap: anywhere;
`;
const Detail = styled.p`
	display: block;
	font-size: 12px;
	line-height: 1.5;
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
`;
const Current = styled(Detail)`
	padding: 8px 10px;
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card2};
	overflow-wrap: anywhere;
`;
const Notice = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	padding: 10px;
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card2};
	font-size: 13px;
	line-height: 1.5;
`;
const Action = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 44px;
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.colors.border.strong};
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.primary};
	font: inherit;
	font-size: 14px;
	cursor: pointer;
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 2px;
	}
`;
const CloseButton = styled(Action)`
	background: transparent;
	border: 0;
	width: 44px;
	padding: 0;
`;
const Primary = styled(Action)`
	width: 100%;
	background: ${({ theme }) => theme.colors.button.primary.bg};
	color: ${({ theme }) => theme.colors.button.primary.text};
`;
const DeviceAction = styled(Primary)`
	justify-content: flex-start;
`;
const QuietAction = styled(Action)`
	min-height: 36px;
	padding: 6px 8px;
	border: 0;
	background: transparent;
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const SearchField = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 0 12px;
	border: 1px solid ${({ theme }) => theme.colors.border.strong};
	border-radius: 8px;
	&:focus-within {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
	}
`;
const SearchInput = styled.input`
	min-width: 0;
	width: 100%;
	padding: 12px 0;
	border: 0;
	outline: 0;
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 16px;
`;
const Results = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	max-height: 220px;
	overflow-y: auto;
	li + li {
		border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;
const Result = styled.button`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 12px 4px;
	text-align: left;
	background: transparent;
	border: 0;
	color: inherit;
	cursor: pointer;
	svg {
		flex-shrink: 0;
		color: ${({ theme }) => theme.colors.text.success};
	}
	&:hover,
	&:focus-visible {
		background: ${({ theme }) => theme.colors.background.card2};
	}
	&:disabled {
		opacity: 0.6;
		cursor: default;
	}
`;
const ResultText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
`;
const Preview = styled.section`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 12px 0;
	text-align: center;
	> svg {
		color: ${({ theme }) => theme.colors.brand[400]};
	}
`;
const Progress = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 28px 0 16px;
	text-align: center;
`;
const Footer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0;
	padding-top: 4px;
`;
