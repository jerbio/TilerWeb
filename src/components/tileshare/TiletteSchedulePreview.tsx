import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '@/core/auth/useAuth';
import { useTilettePreviewResponse } from './useTilettePreviewResponse';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	X,
	LockKeyhole,
	Check,
	Clock,
	DiamondPlus,
	ArrowLeft,
	AlertTriangle,
} from 'lucide-react';
import { TileshareApi } from '@/api/tileshareApi';
import {
	TileSharePreview,
	TileSharePreviewBlock,
	TileSharePreviewOptions,
} from '@/core/common/types/tilesharePreview';

const api = new TileshareApi();

export default function TiletteSchedulePreview({
	assignmentId,
	name,
	disabled = false,
	onResponded,
}: {
	assignmentId: string;
	name: string;
	disabled?: boolean;
	onResponded?: () => void;
}) {
	const { t } = useTranslation();
	const { user } = useAuth();
	const [params, setParams] = useSearchParams();
	const open = params.get('preview') === assignmentId;
	const close = () =>
		setParams(
			(previous) => {
				const next = new URLSearchParams(previous);
				next.delete('preview');
				return next;
			},
			{ replace: true, preventScrollReset: true }
		);
	return (
		<>
			<Control
				type="button"
				disabled={disabled}
				onClick={() =>
					setParams(
						(previous) => {
							const next = new URLSearchParams(previous);
							next.set('preview', assignmentId);
							return next;
						},
						{ preventScrollReset: true }
					)
				}
			>
				<CalendarDays size={16} />
				{t('tilesharePreview.open', 'Preview schedule')}
			</Control>
			{open && (
				<PreviewDialog
					key={`${user?.id}:${assignmentId}`}
					assignmentId={assignmentId}
					name={name}
					onClose={close}
					onResponded={onResponded}
				/>
			)}
		</>
	);
}

export function PreviewDialog({
	assignmentId,
	name,
	onClose,
	onResponded,
}: {
	assignmentId: string;
	name: string;
	onClose: () => void;
	onResponded?: () => void;
}) {
	const { t, i18n } = useTranslation();
	const response = useTilettePreviewResponse(assignmentId);
	const successful = response.state === 'accepted' || response.state === 'declined';
	const finish = () => {
		onClose();
		if (successful) {
			window.dispatchEvent(new Event('tileshare-changed'));
			onResponded?.();
		}
	};
	const titleId = useId();
	const dialog = useRef<HTMLDialogElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = finish;
	const [data, setData] = useState<TileSharePreview | null>(null);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refresh, setRefresh] = useState(0);
	const [comparison, setComparison] = useState<'current' | 'proposed'>('proposed');
	const [selected, setSelected] = useState<string | null>(null);
	const [day, setDay] = useState('');
	const [options, setOptions] = useState<TileSharePreviewOptions | null>(null);
	const [finding, setFinding] = useState(false);
	const [showIssues, setShowIssues] = useState(false);
	const issueTrigger = useRef<HTMLButtonElement>(null);
	const issueHeading = useRef<HTMLHeadingElement>(null);
	const returnFromIssues = () => {
		setShowIssues(false);
		requestAnimationFrame(() => issueTrigger.current?.focus());
	};
	useEffect(() => {
		if (showIssues) issueHeading.current?.focus();
	}, [showIssues]);
	const [userChosen, setUserChosen] = useState(false);
	const [choosing, setChoosing] = useState(false);
	const [choiceError, setChoiceError] = useState(false);
	const choiceRequest = useRef<AbortController | null>(null);
	const previewRequest = useRef<AbortController | null>(null);
	useEffect(() => () => choiceRequest.current?.abort(), []);
	const responding =
		response.state === 'saving' || response.state === 'uncertain' || !!response.pending;
	const blocked = loading || choosing || responding || successful;
	const applyPreview = (result: TileSharePreview, key?: string) => {
		setData({ ...result, timeZone: safeTimeZone(result.timeZone) });
		const session =
			result.sessions.find((s) => key != null && s.sessionKey === key) ??
			result.sessions.find((s) => isInPreviewWindow(s, result)) ??
			result.sessions[0];
		setSelected(session?.id ?? null);
		setDay(previewDay(result, session));
		setComparison('proposed');
	};
	const loadOptions = async (offset = 0) => {
		const session = data?.sessions.find((s) => s.id === selected);
		if (
			blocked ||
			!data?.isViable ||
			!data.previewToken ||
			session?.sessionKey == null ||
			!hasPlacement(session)
		)
			return;
		const controller = new AbortController();
		choiceRequest.current?.abort();
		choiceRequest.current = controller;
		setChoosing(true);
		setChoiceError(false);
		setFinding(true);
		try {
			const result = await api.getPreviewOptions(
				assignmentId,
				data.previewToken,
				session.sessionKey,
				offset,
				controller.signal
			);
			if (!controller.signal.aborted)
				setOptions((previous) => {
					const seen = new Set<string>();
					const candidates = offset
						? [...(previous?.options ?? []), ...result.options]
						: result.options;
					return {
						...result,
						options: candidates.filter((option) => {
							const signature = option.preview
								? placementSignature(option.preview)
								: `${option.start}:${option.end}`;
							if (seen.has(signature)) return false;
							seen.add(signature);
							return true;
						}),
					};
				});
		} catch {
			if (!controller.signal.aborted) setChoiceError(true);
		} finally {
			if (!controller.signal.aborted) setChoosing(false);
		}
	};
	const revise = async (selection: {
		OptionId?: string;
		SessionKey?: string;
		Fixed?: boolean;
	}) => {
		if (blocked || !data?.previewToken) return;
		const controller = new AbortController();
		choiceRequest.current?.abort();
		choiceRequest.current = controller;
		setChoosing(true);
		setChoiceError(false);
		const key = data.sessions.find((s) => s.id === selected)?.sessionKey;
		try {
			const result = await api.revisePreview(
				assignmentId,
				data.previewToken,
				selection,
				controller.signal
			);
			if (!controller.signal.aborted) {
				applyPreview(result, key);
				setUserChosen(true);
			}
		} catch {
			if (!controller.signal.aborted) setChoiceError(true);
		} finally {
			if (!controller.signal.aborted) setChoosing(false);
		}
	};
	useEffect(() => {
		const element = dialog.current;
		const previousFocus = document.activeElement as HTMLElement | null;
		element?.showModal();
		const close = () => onCloseRef.current();
		element?.addEventListener('cancel', close);
		return () => {
			element?.removeEventListener('cancel', close);
			element?.close();
			previousFocus?.focus({ preventScroll: true });
		};
	}, []);
	const regenerate = () => {
		previewRequest.current?.abort();
		choiceRequest.current?.abort();
		setChoosing(false);
		setLoading(true);
		setData(null);
		// Forecasting is read-only. Keep an uncertain or applied response recoverable.
		if ((response.state === 'idle' && !successful) || response.state === 'rejected')
			response.reset();
		setRefresh((n) => n + 1);
	};
	useEffect(() => {
		const controller = new AbortController();
		previewRequest.current = controller;
		setLoading(true);
		setError(false);
		setData(null);
		setChoiceError(false);
		setUserChosen(false);
		setFinding(false);
		setShowIssues(false);
		setOptions(null);
		api.previewAssignment(assignmentId, controller.signal)
			.then((result) => {
				if (controller.signal.aborted) return;
				const zone = safeTimeZone(result.timeZone);
				setData({ ...result, timeZone: zone });
				const first =
					result.sessions.find((session) => isInPreviewWindow(session, result)) ??
					result.sessions[0];
				setSelected(first?.id ?? null);
				setDay(previewDay(result, first));
				setComparison('proposed');
			})
			.catch(() => {
				if (!controller.signal.aborted) setError(true);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [assignmentId, refresh]);
	const locale = i18n?.language;
	const date = (instant: number, options: Intl.DateTimeFormatOptions) =>
		formatPreviewInstant(instant, data?.timeZone ?? 'UTC', locale, options);
	const choose = (block: TileSharePreviewBlock) => {
		if (choosing) return;
		setSelected(block.id);
		if (isInPreviewWindow(block, data!)) setDay(previewDay(data!, block));
	};
	const blocks = data ? data[comparison] : [];
	const highlighted = data?.sessions.find((session) => session.id === selected);
	const acceptDisabled =
		blocked ||
		choiceError ||
		!data?.isViable ||
		!data.sessions.length ||
		!data.sessions.every(hasPlacement);
	const chooseOption = (option: TileSharePreviewOptions['options'][number]) => {
		if (blocked) return;
		if (option.preview) {
			applyPreview(option.preview, highlighted?.sessionKey);
			setUserChosen(true);
			setChoiceError(false);
		} else void revise({ OptionId: option.optionId });
	};

	return createPortal(
		<Dialog ref={dialog} aria-labelledby={titleId}>
			<Header>
				{!finding && !showIssues && <span />}
				{(finding || showIssues) && (
					<Control
						aria-label={
							showIssues && finding
								? t('tilesharePreview.backOptions', 'Back to time options')
								: t('tilesharePreview.backPreview', 'Back to preview')
						}
						onClick={() => (showIssues ? returnFromIssues() : setFinding(false))}
					>
						<ArrowLeft size={20} />
					</Control>
				)}
				<h2 id={titleId} ref={issueHeading} tabIndex={-1}>
					{showIssues
						? t('tilesharePreview.conflicts', 'Scheduling issues this week')
						: finding
							? t('tilesharePreview.findTime', 'Find another time')
							: t('tilesharePreview.title', 'Tilette preview')}
				</h2>
				<HeaderActions>
					<Control
						type="button"
						onClick={regenerate}
						aria-label={t('tilesharePreview.generate', 'Generate new preview')}
						title={t('tilesharePreview.generate', 'Generate new preview')}
					>
						<RefreshCw size={16} />
					</Control>
					<Control
						type="button"
						onClick={finish}
						aria-label={t('tilesharePreview.close', 'Close preview')}
					>
						<X size={20} />
					</Control>
				</HeaderActions>
			</Header>
			<Body aria-busy={loading || choosing}>
				<CalendarPane $issues={showIssues}>
					{loading ? (
						<Loading role="status">
							{t('tilesharePreview.loading', 'Finding space in your schedule...')}
							<Skeleton />
							<Skeleton />
						</Loading>
					) : error ? (
						<Loading role="alert">
							<p>
								{t(
									'tilesharePreview.error',
									'Your schedule preview could not be loaded.'
								)}
							</p>
							<Control onClick={regenerate}>
								<RefreshCw size={16} />
								{t('tilesharePreview.retry', 'Retry preview')}
							</Control>
						</Loading>
					) : data && !data.unsupportedReason ? (
						<>
							{comparison === 'proposed' &&
								!data.proposed.some((block) => block.isProposed) && (
									<Notice role="status">
										{t(
											'tilesharePreview.notInCalendar',
											'No sessions from this tilette appear in this calendar window. See the session details for its scheduling outcome.'
										)}
									</Notice>
								)}
							<CalendarToolbar
								title={`${date(data.rangeStart, { dateStyle: 'medium' })} - ${date(data.rangeEnd - 1, { dateStyle: 'medium' })}`}
							>
								<Control
									disabled={day <= dayKey(data.rangeStart, data.timeZone)}
									onClick={() => setDay(shiftDay(day, -1))}
									aria-label={t('tilesharePreview.previousDay', 'Previous day')}
								>
									<ChevronLeft size={18} />
								</Control>
								<strong>
									{day &&
										new Intl.DateTimeFormat(locale, {
											dateStyle: 'medium',
											timeZone: 'UTC',
										}).format(Date.parse(day + 'T12:00:00Z'))}
								</strong>
								<Control
									disabled={day >= dayKey(data.rangeEnd - 1, data.timeZone)}
									onClick={() => setDay(shiftDay(day, 1))}
									aria-label={t('tilesharePreview.nextDay', 'Next day')}
								>
									<ChevronRight size={18} />
								</Control>
								<Comparison
									aria-label={t('tilesharePreview.compare', 'Compare schedules')}
								>
									<Control
										aria-pressed={comparison === 'current'}
										onClick={() => setComparison('current')}
									>
										{t('tilesharePreview.current', 'Current')}
									</Control>
									<Control
										aria-pressed={comparison === 'proposed'}
										onClick={() => setComparison('proposed')}
									>
										{t('tilesharePreview.proposed', 'Proposed')}
									</Control>
								</Comparison>
							</CalendarToolbar>
							<CalendarGrid
								day={day}
								rangeStart={data.rangeStart}
								rangeEnd={data.rangeEnd}
								blocks={blocks}
								zone={data.timeZone}
								selected={selected}
								onSelect={choose}
							/>
						</>
					) : (
						<Loading>
							{t(
								`tilesharePreview.unavailable.${data?.unsupportedReason}`,
								unavailableReasons[data?.unsupportedReason ?? ''] ??
									'A schedule preview is not available for this tilette.'
							)}
						</Loading>
					)}
				</CalendarPane>
				<Details>
					{showIssues ? (
						<IssuesView
							aria-label={t(
								'tilesharePreview.conflicts',
								'Scheduling issues this week'
							)}
						>
							<PreviewNote>
								{t(
									'tilesharePreview.weeklyIssuesNote',
									'Review the unscheduled sessions and conflicts in this calendar week. Your selected schedule is unchanged.'
								)}
							</PreviewNote>
							<p>
								{data?.conflicts?.length ?? 0}{' '}
								{t('tilesharePreview.issueSessions', 'sessions')}{' '}
								{data && (
									<>
										- {date(data.rangeStart, { dateStyle: 'medium' })} -{' '}
										{date(data.rangeEnd - 1, { dateStyle: 'medium' })}
									</>
								)}
							</p>
							{data?.conflicts?.map((block) => (
								<IssueCard key={block.id} $error={block.placement === 'Conflict'}>
									<h3>
										{block.name ??
											t('tilesharePreview.untitled', 'Calendar event')}{' '}
										-{' '}
										{block.placement === 'Conflict'
											? t('tilesharePreview.conflict', 'Scheduling conflict')
											: t('tilesharePreview.unscheduled', 'Not scheduled')}
									</h3>
									<p>
										{block.isProposed
											? t(
													'tilesharePreview.candidateIssue',
													'This session belongs to the tilette you are reviewing.'
												)
											: t(
													'tilesharePreview.existingIssue',
													'This issue concerns existing work.'
												)}
									</p>
									{block.duration != null && (
										<p>
											{block.duration / 60000}{' '}
											{t('tilesharePreview.minutes', 'minutes')}
										</p>
									)}
									{block.allowedStart != null && block.allowedEnd != null && (
										<p>
											{t(
												'tilesharePreview.allowedWindow',
												'Scheduling window'
											)}
											: {date(block.allowedStart, { dateStyle: 'medium' })} -{' '}
											{date(block.allowedEnd, { dateStyle: 'medium' })}
										</p>
									)}
									<p>
										{t(
											'tilesharePreview.noConfirmedTime',
											'No confirmed time in this forecast'
										)}
									</p>
								</IssueCard>
							))}
						</IssuesView>
					) : (
						<>
							<div key={finding ? 'options' : 'overview'}>
								<PreviewNote>
									{t(
										'tilesharePreview.explanation',
										finding
											? 'Choose another suggested time, then accept or accept and lock the highlighted session.'
											: 'See how this tilette fits your schedule. Nothing is added until you accept.'
									)}
								</PreviewNote>
								<TaskCard>
									<TaskIdentity>
										<TileIcon>
											<DiamondPlus size={28} />
										</TileIcon>
										<div>
											<h3>{data?.name ?? name}</h3>
											{data?.inviterName && (
												<Attribution>
													<Avatar aria-hidden="true">
														{data.inviterName
															.split(/\s+/)
															.slice(0, 2)
															.map((part) => part[0])
															.join('')}
													</Avatar>
													{data.inviterName}
												</Attribution>
											)}
										</div>
									</TaskIdentity>
									{!finding && (
										<ScheduleChoice>
											{data && (
												<TimelineSummary
													$invalid={!data.isViable}
													aria-label={t(
														'tilesharePreview.selectedSchedule',
														'Selected schedule'
													)}
												>
													<strong>
														{userChosen
															? t(
																	'tilesharePreview.yourChoice',
																	'Selected schedule'
																)
															: t(
																	'tilesharePreview.suggestion',
																	'Suggested schedule'
																)}
													</strong>
													{highlighted && hasPlacement(highlighted) ? (
														<>
															<b>
																{date(highlighted.start, {
																	dateStyle: 'medium',
																})}
															</b>
															<b>
																{date(highlighted.start, {
																	timeStyle: 'short',
																})}{' '}
																-{' '}
																{date(highlighted.end, {
																	timeStyle: 'short',
																})}
															</b>
															<span>
																{data.timeZone} -{' '}
																{(highlighted.duration ??
																	highlighted.end -
																		highlighted.start) /
																	60000}{' '}
																{t(
																	'tilesharePreview.minutes',
																	'minutes'
																)}
															</span>
															{!isInPreviewWindow(
																highlighted,
																data
															) && (
																<span>
																	{t(
																		'tilesharePreview.outsideSummary',
																		'Outside the displayed calendar week'
																	)}
																</span>
															)}
															{data.sessions.length > 1 && (
																<small>
																	{t(
																		'tilesharePreview.lockScope',
																		'Accepts all sessions; locks only this session. Other sessions remain flexible.'
																	)}
																</small>
															)}
														</>
													) : (
														<span>
															{t(
																'tilesharePreview.selectCandidate',
																data.isViable
																	? 'Select a scheduled tilette session to choose a fixed time.'
																	: 'No complete schedule is available. Review the session details or generate a new preview.'
															)}
														</span>
													)}
												</TimelineSummary>
											)}

											{!finding && data?.capabilities.alternatives && (
												<OptionsControl
													disabled={
														blocked ||
														choiceError ||
														!data.isViable ||
														!data.sessions.some(
															(s) =>
																s.id === selected && hasPlacement(s)
														)
													}
													onClick={() => void loadOptions()}
												>
													<CalendarDays size={18} />
													{t(
														'tilesharePreview.otherTimes',
														'View other time options'
													)}
													<ChevronRight size={18} />
												</OptionsControl>
											)}
										</ScheduleChoice>
									)}
									{!finding && data?.description && <p>{data.description}</p>}
									{!finding &&
										(data?.deadline != null || data?.duration != null) && (
											<TaskTiming>
												{data?.deadline != null && (
													<div>
														<dt>
															<CalendarDays size={16} />
															{t(
																'tilesharePreview.deadline',
																'Deadline'
															)}
														</dt>
														<dd>
															{date(data.deadline, {
																dateStyle: 'medium',
																timeStyle: 'short',
															})}
														</dd>
													</div>
												)}
												{data?.duration != null && (
													<div>
														<dt>
															<Clock size={16} />
															{t(
																'tilesharePreview.duration',
																'Total duration'
															)}
														</dt>
														<dd>
															{new Intl.NumberFormat(locale, {
																maximumFractionDigits: 1,
															}).format(data.duration / 60000)}{' '}
															{t(
																'tilesharePreview.minutes',
																'minutes'
															)}
														</dd>
													</div>
												)}
											</TaskTiming>
										)}
								</TaskCard>

								{data &&
									!data.unsupportedReason &&
									data.sessions.length > 0 &&
									!data.isViable && (
										<Notice role="status">
											{t(
												'tilesharePreview.noFit',
												'The full tilette could not be scheduled in this forecast. Review the session details and scheduling issues, generate a new preview, or return to the tilette.'
											)}
										</Notice>
									)}
								{data && !data.unsupportedReason && data.sessions.length === 0 && (
									<Notice role="status">
										{t(
											'tilesharePreview.missingOutcome',
											'No session outcome was returned. Generate a new preview to check this tilette.'
										)}
									</Notice>
								)}
								{finding && (
									<SessionList
										aria-label={t(
											'tilesharePreview.options',
											'Other time options'
										)}
									>
										{options?.options.map((option, index) => (
											<li key={option.optionId}>
												<SessionButton
													aria-pressed={
														data?.previewToken === option.optionId
													}
													disabled={blocked}
													onClick={() => chooseOption(option)}
												>
													<strong>
														{date(option.start, {
															dateStyle: 'medium',
															timeStyle: 'short',
														})}{' '}
														- {date(option.end, { timeStyle: 'short' })}
													</strong>
													<span>
														{t(
															'tilesharePreview.timeOption',
															'Time option'
														)}{' '}
														{index + 1}
													</span>
												</SessionButton>
											</li>
										))}
										{!choosing && options?.options.length === 0 && (
											<li>
												{t(
													'tilesharePreview.noOptions',
													'No different time found. Try another shuffle.'
												)}
											</li>
										)}
									</SessionList>
								)}
								{!!data?.sessions.length &&
									(data.sessions.length > 1 ||
										!data.isViable ||
										data.sessions.some(
											(session) => !isInPreviewWindow(session, data)
										)) && (
										<p>
											{t(
												'tilesharePreview.scheduledCount',
												'Scheduled sessions'
											)}
											: {data.sessions.filter(hasPlacement).length} /{' '}
											{data.sessions.length}
										</p>
									)}
								{!!data?.sessions.length &&
									(data.sessions.length > 1 ||
										!data.isViable ||
										data.sessions.some(
											(session) => !isInPreviewWindow(session, data)
										)) && (
										<SessionList
											aria-label={t(
												'tilesharePreview.sessions',
												'Proposed sessions'
											)}
										>
											{data.sessions.map((session) => (
												<li key={session.id}>
													{!hasPlacement(session) ? (
														<IssueGroup
															$error={
																session.placement === 'Conflict'
															}
															open
														>
															<summary>
																<AlertTriangle size={16} />{' '}
																{session.placement === 'Conflict'
																	? t(
																			'tilesharePreview.sessionConflict',
																			'Scheduling conflict'
																		)
																	: t(
																			'tilesharePreview.unscheduled',
																			'Not scheduled'
																		)}
															</summary>
															<p>
																{t(
																	'tilesharePreview.noPlacement',
																	'No confirmed time in this forecast'
																)}
															</p>
															{session.duration != null && (
																<p>
																	{session.duration / 60000}{' '}
																	{t(
																		'tilesharePreview.minutes',
																		'minutes'
																	)}
																</p>
															)}
															{session.allowedStart != null &&
																session.allowedEnd != null && (
																	<p>
																		{t(
																			'tilesharePreview.allowedWindow',
																			'Scheduling window'
																		)}
																		:{' '}
																		{date(
																			session.allowedStart,
																			{
																				dateStyle: 'medium',
																			}
																		)}{' '}
																		-{' '}
																		{date(session.allowedEnd, {
																			dateStyle: 'medium',
																		})}
																	</p>
																)}
														</IssueGroup>
													) : (
														<>
															<SessionButton
																$issue={!hasPlacement(session)}
																aria-pressed={
																	selected === session.id
																}
																disabled={!hasPlacement(session)}
																onClick={() => choose(session)}
															>
																{hasPlacement(session) ? (
																	<>
																		<strong>
																			{date(session.start, {
																				dateStyle: 'medium',
																			})}
																		</strong>
																		<span>
																			{date(session.start, {
																				timeStyle: 'short',
																			})}{' '}
																			-{' '}
																			{date(session.end, {
																				timeStyle: 'short',
																			})}
																		</span>
																		<span>
																			{session.isFixed
																				? t(
																						'tilesharePreview.fixed',
																						'Fixed time'
																					)
																				: t(
																						'tilesharePreview.flexible',
																						'Flexible'
																					)}
																		</span>
																		{!isInPreviewWindow(
																			session,
																			data
																		) && (
																			<span>
																				{t(
																					'tilesharePreview.outsideWindow',
																					'Scheduled outside the displayed calendar window'
																				)}
																			</span>
																		)}
																	</>
																) : (
																	<>
																		<strong>
																			{session.placement ===
																			'Conflict'
																				? t(
																						'tilesharePreview.sessionConflict',
																						'Scheduling conflict'
																					)
																				: t(
																						'tilesharePreview.unscheduled',
																						'Not scheduled'
																					)}
																		</strong>
																		<span>
																			{t(
																				'tilesharePreview.noPlacement',
																				'No confirmed time in this forecast'
																			)}
																		</span>
																	</>
																)}
																{session.duration != null && (
																	<span>
																		{new Intl.NumberFormat(
																			locale,
																			{
																				maximumFractionDigits: 1,
																			}
																		).format(
																			session.duration / 60000
																		)}{' '}
																		{t(
																			'tilesharePreview.minutes',
																			'minutes'
																		)}
																	</span>
																)}
															</SessionButton>
														</>
													)}
												</li>
											))}
										</SessionList>
									)}
								{!!data?.conflicts?.length && (
									<IssuesButton
										ref={issueTrigger}
										type="button"
										$error={!data.isViable}
										onClick={() => setShowIssues(true)}
										aria-expanded={false}
									>
										<AlertTriangle size={20} />
										<span>
											{t(
												'tilesharePreview.conflicts',
												'Scheduling issues this week'
											)}{' '}
											({data.conflicts.length})
										</span>
										<ChevronRight size={20} />
									</IssuesButton>
								)}
								{choosing && (
									<p role="status">
										{t('tilesharePreview.updating', 'Updating your preview...')}
									</p>
								)}
								{choiceError && (
									<Notice role="alert">
										{t(
											'tilesharePreview.changed',
											'The schedule option could not be loaded. Your last selection is still shown.'
										)}
										{finding && (
											<Control
												disabled={blocked}
												onClick={() =>
													void loadOptions(options?.nextOffset ?? 0)
												}
											>
												{t(
													'tilesharePreview.retryOptions',
													'Retry options'
												)}
											</Control>
										)}
									</Notice>
								)}
							</div>
							<Footer>
								{finding && data && (
									<SelectedTime
										aria-label={t(
											'tilesharePreview.selectedSchedule',
											'Selected schedule'
										)}
									>
										<strong>
											{t('tilesharePreview.selectedTime', 'Selected time')}:
										</strong>{' '}
										{highlighted && hasPlacement(highlighted) ? (
											<>
												{date(highlighted.start, {
													dateStyle: 'medium',
													timeStyle: 'short',
												})}{' '}
												- {date(highlighted.end, { timeStyle: 'short' })}
											</>
										) : (
											t(
												'tilesharePreview.chooseSession',
												'Select a scheduled tilette session.'
											)
										)}
									</SelectedTime>
								)}
								{response.state === 'accepted' ? (
									<>
										<Notice role="status">
											{t(
												'tilesharePreview.accepted',
												'Accepted and added to your calendar.'
											)}
										</Notice>
										<Control
											as={Link}
											to={`/timeline?calendarEventId=${encodeURIComponent(response.calendarId ?? '')}`}
											onClick={finish}
										>
											{t('tilesharePreview.viewCalendar', 'View in calendar')}
										</Control>
									</>
								) : response.state === 'declined' ? (
									<Notice role="status">
										{t('tilesharePreview.declined', 'Invitation declined.')}
									</Notice>
								) : response.state === 'rejected' ? (
									<Notice role="alert">
										{t(
											'tilesharePreview.stale',
											'The response or selected lock could not be applied. Refresh the assignment and review its schedule.'
										)}
									</Notice>
								) : responding ? (
									<>
										<Notice role="status">
											{response.state === 'uncertain'
												? t(
														'tilesharePreview.uncertain',
														'We could not confirm the result yet. Check the response before trying again.'
													)
												: t(
														'tilesharePreview.saving',
														'Accepting and updating your schedule...'
													)}
										</Notice>
										{response.state === 'uncertain' && (
											<Control onClick={response.check}>
												{t('tilesharePreview.check', 'Check response')}
											</Control>
										)}
										{response.pending && response.state === 'uncertain' && (
											<Control onClick={() => void response.accept()}>
												{t(
													'tilesharePreview.retryResponse',
													'Retry same request'
												)}
											</Control>
										)}
									</>
								) : (
									data?.capabilities.reviewedAcceptance && (
										<>
											{!finding && (
												<p>
													{t(
														'tilesharePreview.commitExplanation',
														'Accept keeps sessions flexible. Accept and lock fixes the highlighted session.'
													)}
												</p>
											)}
											<AcceptanceActions>
												<ConfirmControl
													disabled={acceptDisabled}
													onClick={() => void response.accept()}
												>
													<Check size={16} />
													{t('tilesharePreview.accept', 'Accept')}
												</ConfirmControl>
												{data.capabilities.fixedSessions && (
													<ConfirmControl
														disabled={
															acceptDisabled ||
															!highlighted ||
															!hasPlacement(highlighted)
														}
														onClick={() =>
															void response.accept(
																highlighted
																	? {
																			StartTimeUnixMsUtc:
																				highlighted.start,
																			DurationInMs:
																				highlighted.end -
																				highlighted.start,
																		}
																	: undefined
															)
														}
													>
														<LockKeyhole size={16} />
														{t(
															'tilesharePreview.acceptLock',
															'Accept and lock'
														)}
													</ConfirmControl>
												)}
											</AcceptanceActions>

											{!finding && (
												<DeclineControl
													disabled={blocked}
													onClick={() => void response.decline()}
												>
													{t(
														'tilesharePreview.decline',
														'Decline tilette'
													)}
												</DeclineControl>
											)}
										</>
									)
								)}
								{!data?.capabilities.reviewedAcceptance &&
									!responding &&
									!successful && (
										<p>
											{t(
												'tilesharePreview.estimate',
												'This is an estimate. Accepting from the tilette response controls lets Tiler schedule it flexibly; it does not reserve the times shown here.'
											)}
										</p>
									)}
								{!finding && (
									<Control onClick={finish}>
										{t('tilesharePreview.back', 'Back to tilette')}
									</Control>
								)}
								{finding && (
									<OptionNavigation>
										<Control
											disabled={blocked || options?.nextOffset == null}
											onClick={() =>
												void loadOptions(options?.nextOffset ?? 0)
											}
										>
											{t('tilesharePreview.moreTimes', 'Find more times')}
										</Control>
										<Control
											disabled={choosing}
											onClick={() => {
												setFinding(false);
											}}
										>
											{t('tilesharePreview.backPreview', 'Back to preview')}
										</Control>
									</OptionNavigation>
								)}
							</Footer>
						</>
					)}
				</Details>
			</Body>
		</Dialog>,
		document.body
	);
}

function hasPlacement(session: TileSharePreviewBlock) {
	return (
		session.viable && session.placement !== 'Unscheduled' && session.placement !== 'Conflict'
	);
}
function isInPreviewWindow(session: TileSharePreviewBlock, preview: TileSharePreview) {
	return (
		hasPlacement(session) &&
		session.placement !== 'OutsideWindow' &&
		session.start < preview.rangeEnd &&
		session.end > preview.rangeStart
	);
}
function previewDay(preview: TileSharePreview, session?: TileSharePreviewBlock) {
	const instant =
		session && isInPreviewWindow(session, preview)
			? Math.max(session.start, preview.rangeStart)
			: preview.rangeStart;
	return dayKey(instant, safeTimeZone(preview.timeZone));
}

const unavailableReasons: Record<string, string> = {
	alreadyAccepted:
		'This tilette has already been accepted. Return to its details to view your response.',
	missingDuration: 'This tilette needs a duration before its schedule can be previewed.',
	missingFutureDeadline:
		'This tilette needs a future deadline before its schedule can be previewed.',
	unsupportedConstraints:
		"Preview is not yet available for this tilette's scheduling constraints.",
};

export function formatPreviewInstant(
	instant: number,
	zone: string,
	locale: string | undefined,
	options: Intl.DateTimeFormatOptions
) {
	const label = new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(instant);
	if (!options.timeStyle) return label;
	const offset = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'shortOffset' })
		.formatToParts(instant)
		.find((part) => part.type === 'timeZoneName')?.value;
	return offset ? `${label} (${offset})` : label;
}
export function dayKey(instant: number, zone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: zone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(instant);
	return ['year', 'month', 'day']
		.map((key) => parts.find((p) => p.type === key)!.value)
		.join('-');
}
export function safeTimeZone(zone: string) {
	try {
		new Intl.DateTimeFormat('en', { timeZone: zone });
		return zone;
	} catch {
		return 'UTC';
	}
}
function shiftDay(day: string, amount: number) {
	const value = new Date(day + 'T12:00:00Z');
	value.setUTCDate(value.getUTCDate() + amount);
	return value.toISOString().slice(0, 10);
}
function minute(instant: number, zone: string) {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: zone,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(instant);
	return (
		Number(parts.find((p) => p.type === 'hour')!.value) * 60 +
		Number(parts.find((p) => p.type === 'minute')!.value)
	);
}
export function layoutPreviewDay(blocks: TileSharePreviewBlock[], day: string, zone: string) {
	const rows = blocks
		.filter(
			(b) => b.end > b.start && dayKey(b.start, zone) <= day && dayKey(b.end - 1, zone) >= day
		)
		.map((block) => ({
			block,
			top: dayKey(block.start, zone) < day ? 0 : minute(block.start, zone),
			end: dayKey(block.end, zone) > day ? 1440 : minute(block.end, zone),
			lane: 0,
			lanes: 1,
		}))
		.sort((a, b) => a.top - b.top || b.end - a.end || a.block.id.localeCompare(b.block.id));
	let group: typeof rows = [];
	let laneEnds: number[] = [];
	let groupEnd = -1;
	const finish = () => {
		group.forEach((row) => {
			row.lanes = laneEnds.length;
		});
	};
	rows.forEach((row) => {
		row.end = Math.max(row.top + 28, row.end);
		if (row.top >= groupEnd) {
			finish();
			group = [];
			laneEnds = [];
			groupEnd = -1;
		}
		let lane = laneEnds.findIndex((end) => end <= row.top);
		if (lane === -1) lane = laneEnds.length;
		laneEnds[lane] = row.end;
		row.lane = lane;
		group.push(row);
		groupEnd = Math.max(groupEnd, row.end);
	});
	finish();
	return rows;
}
function CalendarGrid({
	day,
	rangeStart,
	rangeEnd,
	blocks,
	zone,
	selected,
	onSelect,
}: {
	day: string;
	rangeStart: number;
	rangeEnd: number;
	blocks: TileSharePreviewBlock[];
	zone: string;
	selected: string | null;
	onSelect: (block: TileSharePreviewBlock) => void;
}) {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const viewport = useRef<HTMLDivElement>(null);
	const [hourHeight, setHourHeight] = useState(110);
	useEffect(() => {
		if (!viewport.current || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) =>
			setHourHeight(Math.max(72, (entry.contentRect.height - 44) / 5))
		);
		observer.observe(viewport.current);
		return () => observer.disconnect();
	}, []);
	const [compact, setCompact] = useState(() => window.innerWidth <= 768);
	useEffect(() => {
		const update = () => setCompact(window.innerWidth <= 768);
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	const first = dayKey(rangeStart, zone),
		last = dayKey(rangeEnd - 1, zone);
	const count = compact ? 1 : 5;
	const earliest = shiftDay(last, -count + 1);
	const from = compact ? day : day > earliest ? (earliest < first ? first : earliest) : day;
	const days = Array.from({ length: count }, (_, i) => shiftDay(from, i)).filter(
		(d) => d >= first && d <= last
	);
	useEffect(() => {
		const target = viewport.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (viewport.current)
			viewport.current.scrollTop = target
				? Math.max(0, target.offsetTop - hourHeight * 2)
				: 7 * hourHeight;
	}, [selected, day, blocks, hourHeight]);
	return (
		<GridScroll
			ref={viewport}
			tabIndex={0}
			aria-label={t('tilesharePreview.calendar', 'Schedule calendar')}
		>
			<WeekHeader
				style={{ gridTemplateColumns: `52px repeat(${days.length},minmax(0,1fr))` }}
			>
				<span />
				{days.map((d) => (
					<strong key={d} aria-current={d === day ? 'date' : undefined}>
						{new Intl.DateTimeFormat(i18n?.language, {
							weekday: 'short',
							day: 'numeric',
							timeZone: 'UTC',
						}).format(Date.parse(d + 'T12:00:00Z'))}
					</strong>
				))}
			</WeekHeader>
			<Grid style={{ height: hourHeight * 24 }}>
				{Array.from({ length: 24 }, (_, hour) => (
					<Hour key={hour} style={{ top: hour * hourHeight }}>
						<span>{String(hour).padStart(2, '0')}:00</span>
					</Hour>
				))}
				{days.map((d, column) => (
					<DayColumn
						key={d}
						style={{
							height: hourHeight * 24,
							left: `calc(52px + (100% - 52px) * ${column / days.length})`,
							width: `calc((100% - 52px) / ${days.length})`,
						}}
					>
						{layoutPreviewDay(blocks, d, zone).map(
							({ block, top, end, lane, lanes }, index) => {
								const colors = eventColors(
									block.color,
									theme.colors.background.card
								);
								return (
									<Block
										key={block.id}
										type="button"
										$proposed={block.isProposed}
										aria-pressed={selected === block.id}
										title={`${block.name ?? 'Calendar event'} - ${new Intl.DateTimeFormat(i18n?.language, { timeZone: zone, timeStyle: 'short' }).format(block.start)}`}
										onClick={() => onSelect(block)}
										style={{
											top: (top * hourHeight) / 60 + 4,
											height: Math.max(
												28,
												((end - top) * hourHeight) / 60 - 8
											),
											left: `calc(${(lane / lanes) * 100}% + 6px)`,
											width: `calc(${100 / lanes}% - 12px)`,
											zIndex: index + 1,
											...(!block.isProposed && colors ? colors : {}),
										}}
									>
										<strong>
											{block.name ??
												t('tilesharePreview.untitled', 'Calendar event')}
										</strong>
										<span>
											<Clock size={12} />{' '}
											{(block.duration ?? block.end - block.start) / 60000}{' '}
											{t('tilesharePreview.minutes', 'minutes')}
										</span>
										{block.isProposed && (
											<span>
												<DiamondPlus size={13} />{' '}
												{t('tilesharePreview.proposed', 'Proposed')}
											</span>
										)}
									</Block>
								);
							}
						)}
					</DayColumn>
				))}
			</Grid>
		</GridScroll>
	);
}
function eventColors(color: string | null | undefined, surface: string) {
	if (/^#[0-9a-f]{3}$/i.test(surface))
		surface =
			'#' +
			surface
				.slice(1)
				.split('')
				.map((c) => c + c)
				.join('');
	if (!color || !/^#[0-9a-f]{6}$/i.test(color) || !/^#[0-9a-f]{6}$/i.test(surface))
		return undefined;
	const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	const base = rgb(surface);
	const mixed = rgb(color).map((c, i) => Math.round(c * 0.28 + base[i] * 0.72));
	const luminance = (v: number[]) =>
		v
			.map((x) => {
				const s = x / 255;
				return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
			})
			.reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
	const lum = luminance(mixed);
	return {
		backgroundColor: `rgb(${mixed.join(',')})`,
		color: lum > 0.179 ? '#000000' : '#ffffff',
	};
}

const Control = styled.button`
	font: inherit;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 38px;
	padding: 6px 12px;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	&:hover:not(:disabled),
	&[aria-pressed='true'] {
		background: ${({ theme }) => theme.colors.button.ghost.bgHover};
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.text.primary};
		outline-offset: 2px;
	}
	&:disabled {
		opacity: 0.6;
		cursor: default;
	}
`;
const ConfirmControl = styled(Control)`
	color: ${({ theme }) => theme.colors.text.success};
	border-color: ${({ theme }) => theme.colors.text.success};
	background: ${({ theme }) => theme.colors.preview.successBg};
	font-weight: 600;
`;
const Dialog = styled.dialog`
	box-sizing: border-box;
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
	padding: 0;
	font-size: clamp(0.875rem, 1vw, 1.125rem);
	width: min(1920px, 96vw);
	max-width: 100vw;
	height: min(900px, max(640px, 44.6vw), 92dvh);
	max-height: 100dvh;
	margin: auto;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 20px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	&::backdrop {
		background: ${({ theme }) => theme.colors.backdrop.default};
	}
	&[open] {
		display: grid;
		grid-template-columns: minmax(0, 68fr) minmax(350px, 32fr);
		grid-template-rows: auto minmax(0, 1fr);
		grid-template-areas: 'calendar header' 'calendar details';
		animation: preview-enter 160ms ease-out;
	}
	@keyframes preview-enter {
		from {
			opacity: 0;
			transform: scale(0.99);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		&[open] {
			animation: none;
		}
	}
	@media (max-width: 768px) {
		width: 100vw;
		&[open] {
			display: flex;
			flex-direction: column;
		}
		height: 100dvh;
		border-radius: 0;
	}
`;
const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;
const Header = styled.header`
	grid-area: header;
	display: grid;
	grid-template-columns: 44px minmax(0, 1fr) auto;
	align-items: center;
	min-height: 64px;
	padding: 8px 16px;
	gap: 8px;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	flex-shrink: 0;
	h2 {
		outline: none;
		margin: 0;
		font-size: 1.1rem;
		text-align: center;
	}
	button {
		border: 0;
		padding: 8px;
		background: transparent;
	}
`;
const Body = styled.div`
	display: contents;
	@media (max-width: 768px) {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		min-height: 0;
		flex: 1;
	}
`;
const CalendarPane = styled.section<{ $issues: boolean }>`
	grid-area: calendar;
	padding: 16px 0 16px 16px;
	min-height: 0;
	display: flex;
	flex-direction: column;
	background: ${({ theme }) => theme.colors.calendar.bg};
	@media (max-width: 768px) {
		display: ${({ $issues }) => ($issues ? 'none' : 'flex')};
		min-height: 350px;
		height: 50dvh;
		flex-shrink: 0;
	}
`;
const CalendarToolbar = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	padding: 0 12px 8px 0;
`;
const Comparison = styled.div`
	display: flex;
	gap: 4px;
	margin-left: auto;
`;
const Details = styled.section`
	grid-area: details;
	min-height: 0;
	> div {
		flex: 1;
		padding-right: 4px;
		min-height: 0;
		overflow-y: auto;
	}
	label {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		margin-block: 8px;
	}
	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		accent-color: ${({ theme }) => theme.colors.text.success};
	}
	padding: 16px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 12px;
	overflow: hidden;
	border-left: 1px solid ${({ theme }) => theme.colors.border.default};
	overflow-wrap: anywhere;
	h3 {
		font-size: 1.35rem;
		margin: 20px 0 12px;
	}
	p {
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	@media (max-width: 768px) {
		overflow: visible;
		flex-shrink: 0;
		> div {
			flex-shrink: 0;
			overflow: visible;
		}
		border-left: 0;
		border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	}
	@media (max-height: 650px) and (min-width: 769px) {
		overflow-y: auto;
		> div {
			flex-shrink: 0;
			overflow: visible;
		}
	}
`;
const PreviewNote = styled.p`
	margin: 0 0 8px;
	padding: 0 2px;
	font-size: 0.75rem;
	line-height: 1.4;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Notice = styled.p`
	margin: 0 0 12px;
	line-height: 1.45;
	padding: 12px;
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card2};
`;
const Footer = styled.footer`
	> button {
		width: 100%;
	}
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	padding-top: 12px;
	padding-bottom: env(safe-area-inset-bottom);
	p {
		font-size: 0.8rem;
		margin: 0;
		line-height: 1.4;
	}
`;
const SessionList = styled.ul`
	margin: 12px 0;
	list-style: none;
	padding: 0;
	display: grid;
	gap: 8px;
`;
const SessionButton = styled(Control)<{ $issue?: boolean }>`
	background: ${({ theme, $issue }) =>
		$issue ? theme.colors.preview.warningBg : theme.colors.background.card};
	&[aria-pressed='true'] {
		border-color: ${({ theme }) => theme.colors.preview.selectedBorder};
		background: ${({ theme }) => theme.colors.preview.selectedBg};
		color: ${({ theme }) => theme.colors.preview.selectedText};
	}
	min-height: 58px;
	padding: 10px 12px;
	text-align: left;
	span {
		color: ${({ theme }) => theme.colors.text.secondary};
		font-size: 0.85rem;
	}
	width: 100%;
	align-items: flex-start;
	flex-direction: column;
`;
const Loading = styled.div`
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
`;
const Skeleton = styled.div`
	height: 100px;
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.skeleton.base};
`;
const GridScroll = styled.div`
	overflow-y: auto;
	flex: 1;
	min-height: 0;
	position: relative;
	border: 1px solid ${({ theme }) => theme.colors.calendar.border};
	border-radius: 12px;
`;
const Grid = styled.div`
	height: 2160px;
	position: relative;
`;
const Hour = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	border-top: 1px solid ${({ theme }) => theme.colors.calendar.grid};
	span {
		font-size: 0.75rem;
		padding: 2px 4px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
const Block = styled.button<{ $proposed: boolean }>`
	font: inherit;
	min-width: 0;
	line-height: 1.4;
	position: absolute;
	display: flex;
	flex-direction: column;
	text-align: left;
	overflow: hidden;
	gap: 4px;
	padding: 8px;
	strong {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex-shrink: 1;
	}
	span {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}
	strong + span {
		margin-top: auto;
	}
	border: 0;
	outline: ${({ $proposed }) => ($proposed ? '2px dashed' : 'none')};
	outline-color: ${({ theme }) => theme.colors.preview.selectedText};
	outline-offset: 2px;
	border-radius: 8px;
	background: ${({ theme, $proposed }) =>
		$proposed ? theme.colors.preview.selectedBg : theme.colors.preview.eventBg};
	color: ${({ theme, $proposed }) =>
		$proposed ? theme.colors.preview.selectedText : theme.colors.preview.eventText};
	&:focus-visible {
		outline: 3px solid ${({ theme }) => theme.colors.text.primary};
	}
	span {
		font-size: 0.75rem;
	}
	cursor: pointer;
`;

const OptionNavigation = styled.div`
	display: flex;
	gap: 8px;
	> button {
		flex: 1;
	}
`;
const AcceptanceActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	> button {
		flex: 1;
	}
`;
const OptionsControl = styled(Control)`
	width: 100%;
	min-height: 44px;
	font-weight: 600;
	background: ${({ theme }) => theme.colors.button.brand.bg};
	color: ${({ theme }) => theme.colors.button.brand.text};
	border-color: ${({ theme }) => theme.colors.button.brand.bg};
	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.colors.button.brand.bgHover};
	}
	svg {
		flex-shrink: 0;
	}
	svg:last-child {
		margin-left: auto;
	}
`;
const ScheduleChoice = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 0 16px 16px;
	&:empty {
		display: none;
	}
`;
const SelectedTime = styled.section`
	font-size: 0.8rem;
	line-height: 1.4;
	color: ${({ theme }) => theme.colors.text.secondary};
	strong {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;
const TimelineSummary = styled.section<{ $invalid?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 3px;
	padding: 10px 12px;
	border-radius: 10px;
	> strong,
	> span {
		font-size: 0.8rem;
	}
	background: ${({ theme, $invalid }) =>
		$invalid ? theme.colors.preview.errorBg : theme.colors.preview.selectedBg};
	color: ${({ theme, $invalid }) =>
		$invalid ? theme.colors.text.error : theme.colors.preview.selectedText};
	b {
		font-size: 0.95rem;
	}
	small {
		line-height: 1.4;
	}
`;
const TaskCard = styled.section`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	margin-block: 12px;
	overflow: hidden;
	> p {
		padding: 12px 16px;
		border-top: 1px solid ${({ theme }) => theme.colors.border.default};
		margin: 0;
		line-height: 1.5;
	}
	h3 {
		margin: 0;
		font-size: 1.1rem;
	}
	svg {
		vertical-align: middle;
	}
`;
const TaskTiming = styled.dl`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: start;
	gap: 12px;
	margin: 0;
	padding: 12px 16px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.8rem;
	line-height: 1.5;
	dt {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	dd {
		margin: 4px 0 0;
		color: ${({ theme }) => theme.colors.text.primary};
	}
	svg {
		flex-shrink: 0;
	}
`;
const TaskIdentity = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px;
`;
const TileIcon = styled.div`
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 48px;
	height: 48px;
	border-radius: 10px;
	background: ${({ theme }) => theme.colors.preview.selectedBg};
	color: ${({ theme }) => theme.colors.preview.selectedText};
`;
const Attribution = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 10px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Avatar = styled.span`
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	font-size: 0.7rem;
	background: ${({ theme }) => theme.colors.avatar.background};
	color: ${({ theme }) => theme.colors.avatar.text};
	border: 1px solid ${({ theme }) => theme.colors.avatar.border};
`;
const DeclineControl = styled(Control)`
	color: ${({ theme }) => theme.colors.text.error};
	border-color: ${({ theme }) => theme.colors.text.error};
`;
const IssuesButton = styled(Control)<{ $error: boolean }>`
	width: 100%;
	min-height: 56px;
	padding: 14px;
	margin-block: 12px;
	text-align: left;
	background: ${({ theme, $error }) =>
		$error ? theme.colors.preview.errorBg : theme.colors.preview.warningBg};
	color: ${({ theme, $error }) => ($error ? theme.colors.text.error : theme.colors.text.warning)};
	border: 0;
	span {
		flex: 1;
		font-weight: 600;
	}
	svg {
		flex-shrink: 0;
	}
`;
const IssuesView = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	> p {
		margin: 0;
	}
`;
const IssueCard = styled.article<{ $error: boolean }>`
	flex-shrink: 0;
	padding: 20px;
	border-radius: 12px;
	background: ${({ theme, $error }) =>
		$error ? theme.colors.preview.errorBg : theme.colors.preview.warningBg};
	h3 {
		margin: 0 0 12px;
		font-size: 1rem;
		line-height: 1.5;
		color: ${({ theme, $error }) =>
			$error ? theme.colors.text.error : theme.colors.text.warning};
	}
	p {
		color: ${({ theme }) => theme.colors.text.primary};
		margin: 8px 0 0;
		line-height: 1.5;
	}
`;
const IssueGroup = styled.details<{ $error: boolean }>`
	border-radius: 10px;
	padding: 12px;
	margin-block: 12px;
	background: ${({ theme, $error }) =>
		$error ? theme.colors.preview.errorBg : theme.colors.preview.warningBg};
	> summary {
		color: ${({ theme, $error }) =>
			$error ? theme.colors.text.error : theme.colors.text.warning};
		font-weight: 600;
	}
	summary {
		cursor: pointer;
		padding-block: 8px;
	}
	svg {
		vertical-align: middle;
	}
`;
function placementSignature(preview: TileSharePreview) {
	return preview.sessions
		.map((s) => `${s.start}:${s.end}`)
		.sort()
		.join(';');
}

const WeekHeader = styled.div`
	display: grid;
	position: sticky;
	top: 0;
	z-index: 50;
	background: ${({ theme }) => theme.colors.calendar.headerBg};
	min-height: 44px;
	strong {
		display: grid;
		place-items: center;
		font-size: 0.85rem;
		border-left: 1px solid ${({ theme }) => theme.colors.calendar.grid};
	}
	[aria-current] {
		background: ${({ theme }) => theme.colors.calendar.headerTodayBg};
		color: ${({ theme }) => theme.colors.calendar.headerDayTodayText};
	}
`;
const DayColumn = styled.div`
	position: absolute;
	top: 0;
	height: 2160px;
	border-left: 1px solid ${({ theme }) => theme.colors.calendar.grid};
`;
