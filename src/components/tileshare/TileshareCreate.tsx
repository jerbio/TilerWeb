import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ChevronLeft, Layers, MapPin, MessageSquare } from 'lucide-react';
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
import { isValidRecipient } from '@/core/util/contact';
import { DEFAULT_COUNTRY_CODE } from '@/core/constants/countryCodes';
import { Routes } from '@/core/constants/routes';
import { deviceTimeZone } from '@/core/common/utils/timeUtils';
export { TileshareMode };

type TileshareCreateProps = {
	mode: TileshareMode;
	onBack: () => void;
};

const initialTileshareFormState: TileshareFormState = {
	name: '',
	deadline: '',
	location: '',
	note: '',
	recipients: [],
};

const CREATE_NOTIFICATION_ID = notificationId(NotificationAction.CreateTileshare, 'cluster');
/** Seconds the success modal stays up before auto-advancing to the detail page. */
const SUCCESS_MODAL_TIMEOUT_SECONDS = 15;

const TileshareCreate: React.FC<TileshareCreateProps> = ({ mode, onBack }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { user } = useAuth();
	const navigate = useNavigate();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const dismissNotification = useUiStore((s) => s.notification.dismiss);
	const { formData, handleFormInputChange, setFormData } =
		useFormHandler<TileshareFormState>(initialTileshareFormState);
	const [submitting, setSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [createdClusterId, setCreatedClusterId] = useState<string | null>(null);
	const [createdName, setCreatedName] = useState('');

	const isSingle = mode === TileshareMode.Single;
	const ModeIcon = isSingle ? MessageSquare : Layers;

	/** Returns the first validation problem as a message, or null when valid. */
	const getValidationError = (): string | null => {
		if (!formData.name.trim()) {
			return t('tilesharedemo.dashboard.create.validation.nameRequired');
		}
		if (!formData.deadline) {
			return t('tilesharedemo.dashboard.create.validation.deadlineRequired');
		}
		if (isSingle && formData.recipients.length === 0) {
			return t('tilesharedemo.dashboard.create.validation.recipientRequired');
		}
		const invalid = formData.recipients.find((r) => !isValidRecipient(r));
		if (invalid) {
			return t('tilesharedemo.dashboard.create.validation.invalidRecipient', {
				recipient: invalid,
			});
		}
		return null;
	};

	const handleSubmit = async () => {
		if (submitting) return;

		const validationError = getValidationError();
		if (validationError) {
			showNotification(CREATE_NOTIFICATION_ID, validationError, 'error');
			return;
		}

		const params = toCreateClusterParams(formData, mode, {
			userName: user?.email ?? null,
			timeZone: deviceTimeZone() ?? user?.timeZone ?? 'UTC',
			timeZoneOffset: user?.timeZoneDifference ?? 0,
			defaultCallingCode: user?.countryCode?.trim() || String(DEFAULT_COUNTRY_CODE.code),
		});

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
			setSubmitting(false);
		}
	};

	/** On any close of the success modal, advance to the new cluster's detail page. */
	const handleSuccessClose = (next: boolean) => {
		setShowSuccess(next);
		if (!next) {
			navigate(
				createdClusterId ? Routes.Tileshare.detail(createdClusterId) : Routes.Tileshare.sent
			);
		}
	};

	return (
		<Container>
			<HeaderBar>
				<BackButton type="button" onClick={onBack}>
					<ChevronLeft size={18} />
					{t('tilesharedemo.dashboard.create.back')}
				</BackButton>
			</HeaderBar>

			<Content>
				<IconBox>
					<ModeIcon size={20} />
				</IconBox>

				<Title>{t(`tilesharedemo.dashboard.create.${mode}.title`)}</Title>
				<Description>{t(`tilesharedemo.dashboard.create.${mode}.description`)}</Description>

				<Fields>
					<Input
						name="name"
						placeholder={t('tilesharedemo.dashboard.create.fields.name.placeholder')}
						value={formData.name}
						onChange={handleFormInputChange('name')}
					/>

					<DatePicker
						value={formData.deadline}
						onChange={handleFormInputChange('deadline', { mode: 'static' })}
						placeholder={t(
							'tilesharedemo.dashboard.create.fields.deadline.placeholder'
						)}
					/>

					<Input
						name="location"
						placeholder={t(
							'tilesharedemo.dashboard.create.fields.location.placeholder'
						)}
						value={formData.location}
						onChange={handleFormInputChange('location')}
						append={<MapPin size={16} />}
					/>

					<Input.Textarea
						name="note"
						placeholder={t('tilesharedemo.dashboard.create.fields.note.placeholder')}
						value={formData.note}
						onChange={handleFormInputChange('note')}
						rows={6}
					/>

					{isSingle && (
						<ShareTo>
							<ShareToLabel>
								{t('tilesharedemo.dashboard.create.shareTo.label')}
							</ShareToLabel>
							<TagInput
								value={formData.recipients}
								onChange={(recipients) =>
									setFormData((prev) => ({ ...prev, recipients }))
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
								inputProps={{ name: 'shareTo' }}
							/>
						</ShareTo>
					)}
				</Fields>

				<Footer>
					<Separator />
					<Actions>
						<Button
							type="button"
							variant="ghost"
							style={{
								border: `1px solid ${theme.colors.border.default}`,
							}}
							onClick={onBack}
						>
							{t('tilesharedemo.dashboard.create.buttons.cancel')}
						</Button>
						<Button
							type="button"
							variant="brand"
							onClick={handleSubmit}
							disabled={submitting}
						>
							{t(`tilesharedemo.dashboard.create.${mode}.submit`)}
						</Button>
					</Actions>
				</Footer>
			</Content>

			<SuccessModal
				show={showSuccess}
				setShow={handleSuccessClose}
				closeTimeout={SUCCESS_MODAL_TIMEOUT_SECONDS}
				actions={[
					{
						text: t('tilesharedemo.dashboard.create.success.view'),
						onClick: () => handleSuccessClose(false),
					},
				]}
			>
				<p>{t('tilesharedemo.dashboard.create.success.message', { name: createdName })}</p>
			</SuccessModal>
		</Container>
	);
};

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
`;

const Content = styled.div`
	width: 100%;
	max-width: ${({ theme }) => theme.screens.md};
	margin-inline: auto;
	padding: 2.5rem 1.5rem 2rem;
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const HeaderBar = styled.header`
	position: sticky;
	top: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	padding: 1rem 1.5rem;
	background-color: ${({ theme }) => theme.colors.background.page};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const BackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const IconBox = styled.div`
	width: 56px;
	height: 56px;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	border: 1px solid ${({ theme }) => theme.colors.border.strong};
	color: ${({ theme }) => theme.colors.text.primary};
	background-color: ${({ theme }) => theme.colors.background.card};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Title = styled.h2`
	margin-top: 1.5rem;
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-size: ${({ theme }) => theme.typography.fontSize.displayXs};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.p`
	margin-top: 0.5rem;
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Fields = styled.div`
	margin-top: 2rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ShareTo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const ShareToLabel = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Footer = styled.div`
	margin-top: 2rem;
	display: flex;
	flex-direction: column;
`;

const Separator = styled.hr`
	border: none;
	height: 0.5px;
	background-color: ${({ theme }) => theme.colors.border.subtle};
`;

const Actions = styled.div`
	margin-top: 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

export default TileshareCreate;
