import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CalendarDays, ChevronLeft } from 'lucide-react';
import TileShareModeIcon from './TileShareModeIcon';
import TileShareLocationFields from './TileShareLocationFields';
import MarkdownNoteField from './MarkdownNoteField';
import TiletteDraftComposer from './TiletteDraftComposer';
import TileShareDiscardDialog from './TileShareDiscardDialog';
import { tileShareReveal, tileShareInteraction } from './tileshareMotion';
import TileShareTheme from './TileShareTheme';
import { tileShareControls } from './tileshareVisuals';
import useFormHandler from '@/hooks/useFormHandler';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import Button from '@/core/common/components/button';
import TagInput from '@/core/common/components/TagInput';
import SuccessModal from '@/core/common/components/modals/success-modal';
import { useAuth } from '@/core/auth/useAuth';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { tileshareService } from '@/services';
import { toCreateClusterParams } from '@/services/tileshareService';
import { TileshareFormState, TileshareMode } from '@/core/common/types/tileshare';
import { defaultShareDeadline } from '@/core/util/tileshareDraft';
import { isValidRecipient } from '@/core/util/contact';
import { DEFAULT_COUNTRY_CODE } from '@/core/constants/countryCodes';
import { Routes } from '@/core/constants/routes';
import { deviceTimeZone } from '@/core/common/utils/timeUtils';
export { TileshareMode };

const CREATE_NOTIFICATION_ID = notificationId(NotificationAction.CreateTileshare, 'cluster');
const TileshareCreate: React.FC<{ mode: TileshareMode; onBack: () => void }> = ({
	mode,
	onBack,
}) => {
	const { t } = useTranslation();
	const { user } = useAuth();
	const navigate = useNavigate();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const dismissNotification = useUiStore((s) => s.notification.dismiss);
	const [initial] = useState<TileshareFormState>(() => ({
		durationMinutes: '60',
		name: '',
		deadline: defaultShareDeadline(),
		location: '',
		locationDescription: '',
		locationIsVerified: false,
		tilettes: [],
		note: '',
		recipients: [],
	}));
	const { formData, handleFormInputChange, setFormData } =
		useFormHandler<TileshareFormState>(initial);
	const [workspace, setWorkspace] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		const heading = root.current?.querySelector<HTMLElement>('h2');
		heading?.setAttribute('tabindex', '-1');
		heading?.focus({ preventScroll: true });
	}, [workspace]);
	const [submitting, setSubmitting] = useState(false);
	const submitLock = useRef(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [createdClusterId, setCreatedClusterId] = useState<string | null>(null);
	const [createdName, setCreatedName] = useState('');
	const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
	const dirty = JSON.stringify(formData) !== JSON.stringify(initial);
	const isSingle = mode === TileshareMode.Broadcast;
	const leave = () => {
		if (submitting) return;
		if (dirty && !showSuccess) setLeaveAction(() => onBack);
		else onBack();
	};
	useEffect(() => {
		if (!dirty || showSuccess) return;
		const beforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		const anchorClick = (event: MouseEvent) => {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.altKey
			)
				return;
			const anchor = (event.target as Element).closest?.(
				'a[href]'
			) as HTMLAnchorElement | null;
			if (
				!anchor ||
				anchor.target ||
				anchor.hasAttribute('download') ||
				anchor.origin !== window.location.origin
			)
				return;
			const next = anchor.pathname + anchor.search + anchor.hash;
			if (next === window.location.pathname + window.location.search + window.location.hash)
				return;
			event.preventDefault();
			event.stopPropagation();
			if (!submitting) setLeaveAction(() => () => navigate(next));
		};
		window.addEventListener('beforeunload', beforeUnload);
		document.addEventListener('click', anchorClick, true);
		return () => {
			window.removeEventListener('beforeunload', beforeUnload);
			document.removeEventListener('click', anchorClick, true);
		};
	}, [dirty, showSuccess, submitting, navigate]);
	const getValidationError = (): string | null => {
		if (!formData.name.trim())
			return t('tilesharedemo.dashboard.create.validation.nameRequired');
		if (!formData.deadline)
			return t('tilesharedemo.dashboard.create.validation.deadlineRequired');
		if (isSingle && !formData.recipients.length)
			return t('tilesharedemo.dashboard.create.validation.recipientRequired');
		const invalid = formData.recipients.find((recipient) => !isValidRecipient(recipient));
		if (invalid)
			return t('tilesharedemo.dashboard.create.validation.invalidRecipient', {
				recipient: invalid,
			});
		return null;
	};
	const openWorkspace = () => {
		const error = getValidationError();
		if (error) {
			showNotification(CREATE_NOTIFICATION_ID, error, 'error');
			return;
		}
		setWorkspace(true);
	};
	const handleSubmit = async () => {
		if (submitLock.current) return;
		const error = getValidationError();
		if (error) {
			showNotification(CREATE_NOTIFICATION_ID, error, 'error');
			return;
		}
		const params = toCreateClusterParams(formData, mode, {
			userName: user?.email ?? null,
			timeZone: deviceTimeZone() ?? user?.timeZone ?? 'UTC',
			timeZoneOffset: user?.timeZoneDifference ?? 0,
			defaultCallingCode: user?.countryCode?.trim() || String(DEFAULT_COUNTRY_CODE.code),
		});
		submitLock.current = true;
		setSubmitting(true);
		showNotification(
			CREATE_NOTIFICATION_ID,
			t('tilesharedemo.dashboard.create.toast.creating'),
			'loading'
		);
		try {
			const created = await tileshareService.createCluster(params);
			dismissNotification(CREATE_NOTIFICATION_ID);
			setCreatedClusterId(created?.id ?? null);
			setCreatedName(created?.name ?? params.Name);
			setShowSuccess(true);
		} catch {
			updateNotification(
				CREATE_NOTIFICATION_ID,
				t('tilesharedemo.dashboard.create.toast.error'),
				'error'
			);
		} finally {
			submitLock.current = false;
			setSubmitting(false);
		}
	};
	const handleSuccessClose = (next: boolean) => {
		setShowSuccess(next);
		if (!next)
			navigate(
				createdClusterId ? Routes.Tileshare.detail(createdClusterId) : Routes.Tileshare.sent
			);
	};
	const submitButton = (
		<Button
			type="button"
			variant="brand"
			onClick={handleSubmit}
			disabled={submitting || showSuccess}
		>
			{t(`tileShareModes.${mode}.submit`)}
		</Button>
	);
	return (
		<TileShareTheme>
			<Container ref={root}>
				<HeaderBar>
					<BackButton type="button" onClick={leave} disabled={submitting}>
						<ChevronLeft size={18} />
						{t('tilesharedemo.dashboard.create.back')}
					</BackButton>
				</HeaderBar>
				{workspace ? (
					<>
						<TiletteDraftComposer
							value={formData.tilettes ?? []}
							mode={mode}
							participants={formData.recipients}
							shareDeadline={formData.deadline}
							disabled={submitting || showSuccess}
							onChange={(tilettes) =>
								setFormData((previous) => ({ ...previous, tilettes }))
							}
							onMoveShareDeadline={(deadline) =>
								setFormData((previous) => ({ ...previous, deadline }))
							}
						/>
						<SummaryBar>
							<Summary>
								<TileShareModeIcon mode={mode} />
								<strong>{formData.name}</strong>
								<span>
									<CalendarDays size={18} />
									{formData.deadline}
								</span>
							</Summary>
							<Actions>
								<Button variant="ghost" disabled={submitting} onClick={leave}>
									{t('tileShareComposer.cancelExit')}
								</Button>
								<Button
									variant="primary"
									disabled={submitting}
									onClick={() => setWorkspace(false)}
								>
									{t('tileShareComposer.editDetails')}
								</Button>
								{submitButton}
							</Actions>
						</SummaryBar>
					</>
				) : (
					<Content>
						<IconBox>
							<TileShareModeIcon mode={mode} size={28} />
						</IconBox>
						<Title>{t(`tileShareModes.${mode}.title`)}</Title>
						<Description>{t(`tileShareModes.${mode}.description`)}</Description>
						<Fields disabled={submitting || showSuccess}>
							<Input
								name="name"
								aria-label={t(
									'tilesharedemo.dashboard.create.fields.name.placeholder'
								)}
								placeholder={t(
									'tilesharedemo.dashboard.create.fields.name.placeholder'
								)}
								value={formData.name}
								onChange={handleFormInputChange('name')}
							/>
							<DatePicker
								label={t('tileShareComposer.shareDeadline')}
								value={formData.deadline}
								onChange={handleFormInputChange('deadline', { mode: 'static' })}
								placeholder={t(
									'tilesharedemo.dashboard.create.fields.deadline.placeholder'
								)}
							/>
							<TileShareLocationFields
								value={{
									address: formData.location,
									description: formData.locationDescription ?? '',
									isVerified: formData.locationIsVerified ?? false,
								}}
								disabled={submitting}
								placeholder={t(
									'tilesharedemo.dashboard.create.fields.location.placeholder'
								)}
								onChange={(location) =>
									setFormData((previous) => ({
										...previous,
										location: location.address,
										locationDescription: location.description,
										locationIsVerified: location.isVerified,
									}))
								}
							/>
							<MarkdownNoteField
								name="note"
								placeholder={t(
									'tilesharedemo.dashboard.create.fields.note.placeholder'
								)}
								value={formData.note}
								onChange={(note) =>
									setFormData((previous) => ({ ...previous, note }))
								}
								disabled={submitting || showSuccess}
								rows={4}
							/>
							{mode !== TileshareMode.Project && (
								<ShareTo>
									<ShareToLabel>
										{mode === TileshareMode.Class
											? t('tileShareModes.participants')
											: t('tilesharedemo.dashboard.create.shareTo.label')}
									</ShareToLabel>
									<TagInput
										disabled={submitting}
										value={formData.recipients}
										onChange={(recipients) =>
											setFormData((previous) => ({ ...previous, recipients }))
										}
										placeholder={t(
											'tilesharedemo.dashboard.create.shareTo.placeholder'
										)}
										addLabel={t('tilesharedemo.dashboard.create.shareTo.add')}
										removeLabel={(recipient) =>
											t('tilesharedemo.dashboard.create.shareTo.remove', {
												recipient,
											})
										}
										inputProps={{
											name: 'shareTo',
											'aria-label':
												mode === TileshareMode.Class
													? t('tileShareModes.participants')
													: t(
															'tilesharedemo.dashboard.create.shareTo.label'
														),
										}}
									/>
								</ShareTo>
							)}
						</Fields>
						{!isSingle && (
							<OptionalStep>
								<p>{t('tileShareComposer.optionalDescription')}</p>
								<Button
									variant="primary"
									disabled={submitting}
									onClick={openWorkspace}
								>
									{t(
										formData.tilettes?.length
											? 'tileShareComposer.reviewTilettes'
											: 'tileShareModes.addTilettesNow',
										{ count: formData.tilettes?.length ?? 0 }
									)}
								</Button>
							</OptionalStep>
						)}
						<Footer>
							<Actions>
								<Button
									type="button"
									variant="ghost"
									disabled={submitting}
									onClick={leave}
								>
									{t('tilesharedemo.dashboard.create.buttons.cancel')}
								</Button>
								{submitButton}
							</Actions>
						</Footer>
					</Content>
				)}
				<TileShareDiscardDialog
					open={!!leaveAction}
					onKeep={() => setLeaveAction(null)}
					onDiscard={() => {
						const action = leaveAction;
						setLeaveAction(null);
						action?.();
					}}
				/>
				<SuccessModal
					motion
					show={showSuccess}
					setShow={handleSuccessClose}
					closeTimeout={15}
					actions={[
						{
							text: t('tilesharedemo.dashboard.create.success.view'),
							onClick: () => handleSuccessClose(false),
						},
					]}
				>
					<p>
						{t('tilesharedemo.dashboard.create.success.message', { name: createdName })}
					</p>
				</SuccessModal>
			</Container>
		</TileShareTheme>
	);
};
const Container = styled.div`
	${tileShareControls}
	background: ${({ theme }) => theme.colors.background.page};
	width: 100%;
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
`;
const Content = styled.div`
	${tileShareReveal}
	width: 100%;
	max-width: 680px;
	margin-inline: auto;
	padding: 32px;
	margin-block: 32px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 18px;
	@media (max-width: 720px) {
		width: calc(100% - 32px);
		padding: 24px;
		margin-block: 20px;
	}
`;
const HeaderBar = styled.header`
	position: sticky;
	top: 0;
	z-index: 1;
	padding: 16px 24px;
	background: ${({ theme }) => theme.colors.background.page};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;
const BackButton = styled.button`
	${tileShareInteraction}
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${({ theme }) => theme.colors.text.secondary};
	&:disabled {
		opacity: 0.5;
	}
`;
const IconBox = styled.div`
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
`;
const Title = styled.h2`
	margin-top: 24px;
	font-size: 28px;
	font-weight: 650;
	letter-spacing: -0.7px;
	color: ${({ theme }) => theme.colors.text.primary};
`;
const Description = styled.p`
	margin-top: 8px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Fields = styled.fieldset`
	border: 0;
	padding: 0;
	margin: 32px 0 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;
const ShareTo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;
const ShareToLabel = styled.span`
	font-size: 14px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const OptionalStep = styled.div`
	margin-top: 24px;
	padding-top: 20px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	p {
		margin-bottom: 12px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
const Footer = styled.footer`
	margin-top: 24px;
	padding-top: 24px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;
const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 12px;
`;
const SummaryBar = styled.footer`
	position: sticky;
	bottom: 0;
	z-index: 1;
	flex-shrink: 0;
	margin-top: auto;
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16px;
	padding: 16px 24px;
	background: ${({ theme }) => theme.colors.background.card};
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;
const Summary = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	min-width: 0;
	strong {
		overflow-wrap: anywhere;
	}
	span {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
export default TileshareCreate;
