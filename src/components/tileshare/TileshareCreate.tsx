import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Layers, MapPin, MessageSquare } from 'lucide-react';
import useFormHandler from '@/hooks/useFormHandler';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import Button from '@/core/common/components/button';
import TagInput from '@/core/common/components/TagInput';
import { useAuth } from '@/core/auth/useAuth';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { tileshareService } from '@/services';
import { toCreateClusterParams } from '@/services/tileshareService';
import { TileshareFormState, TileshareMode } from '@/core/common/types/tileshare';
import { isValidRecipient } from '@/core/util/contact';
import { DEFAULT_COUNTRY_CODE } from '@/core/constants/countryCodes';
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

const TileshareCreate: React.FC<TileshareCreateProps> = ({ mode, onBack }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { user } = useAuth();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const { formData, handleFormInputChange, setFormData, resetForm } =
		useFormHandler<TileshareFormState>(initialTileshareFormState);
	const [submitting, setSubmitting] = useState(false);

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
			timeZone: user?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
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
			await tileshareService.createCluster(params);
			updateNotification(
				CREATE_NOTIFICATION_ID,
				t('tilesharedemo.dashboard.create.toast.success'),
				'success'
			);
			resetForm();
			onBack();
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
