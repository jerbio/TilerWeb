import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { TiletteIcon } from '@/components/tileshare/icons';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import Button from '@/core/common/components/button';
import MultiInput from '@/core/common/components/multi_input';
import SuccessModal from '@/core/common/components/modals/success-modal';
import { Routes } from '@/core/constants/routes';
import { useAuth } from '@/core/auth/useAuth';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { tileshareService } from '@/services';
import type { ContactModel, TileShareTemplate } from '@/core/common/types/tileshare';
import { classifyContact, isValidRecipient, normalizePhoneNumber } from '@/core/util/contact';
import { DEFAULT_COUNTRY_CODE } from '@/core/constants/countryCodes';
import dayjs from 'dayjs';

type TiletteCreateProps = {
	clusterId: string;
	/** Named in the header copy so it's clear which tileshare this joins. */
	clusterName: string;
	onBack: () => void;
	/** Called after a successful create so the caller can refetch and leave. */
	onCreated: (tilette: TileShareTemplate | null) => void;
};

type Recipient = { label: string; value: string };

const CREATE_NOTIFICATION_ID = notificationId(NotificationAction.Update, 'tilette-create');
/** Seconds the success modal stays up before auto-advancing to the new tilette. */
const SUCCESS_MODAL_TIMEOUT_SECONDS = 15;

/**
 * Turn a raw share-to value into the wire shape. The route binds ContactModel
 * objects, not bare strings, and phone numbers need their calling code.
 */
const toContactModel = (raw: string, defaultCallingCode: string): ContactModel =>
	classifyContact(raw) === 'phone'
		? { PhoneNumber: normalizePhoneNumber(raw, defaultCallingCode) }
		: { Email: raw.trim() };

/**
 * Full-screen form for adding a tilette to an existing cluster. Deliberately
 * mirrors `TileshareCreate` from the create flow — same back bar, icon, title +
 * description, stacked fields and footer actions — so adding a tilette looks
 * like the form the tileshare itself was made in.
 */
const TiletteCreate: React.FC<TiletteCreateProps> = ({
	clusterId,
	clusterName,
	onBack,
	onCreated,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useAuth();
	const showNotification = useUiStore((s) => s.notification.show);
	const updateNotification = useUiStore((s) => s.notification.update);
	const dismissNotification = useUiStore((s) => s.notification.dismiss);

	const [name, setName] = useState('');
	const [deadline, setDeadline] = useState('');
	const [note, setNote] = useState('');
	const [recipients, setRecipients] = useState<Recipient[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [createdName, setCreatedName] = useState('');

	/** First validation problem as a message, or null when valid. */
	const getValidationError = (): string | null => {
		if (!name.trim()) return t('tilesharedemo.detail.add.validation.nameRequired');
		const invalid = recipients.find((r) => !isValidRecipient(r.label));
		if (invalid) {
			return t('tilesharedemo.detail.add.validation.invalidRecipient', {
				recipient: invalid.label,
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

		const defaultCallingCode = user?.countryCode?.trim() || String(DEFAULT_COUNTRY_CODE.code);

		setSubmitting(true);
		showNotification(CREATE_NOTIFICATION_ID, t('tilesharedemo.detail.add.creating'), 'loading');
		try {
			const created = await tileshareService.createTilette({
				ClusterId: clusterId,
				Name: name.trim(),
				NoteMiscData: note.trim() || undefined,
				Contacts: recipients.map((r) => toContactModel(r.label, defaultCallingCode)),
				// Omitted times fall back to the cluster's own timeline.
				EndTime: deadline ? dayjs(deadline).endOf('day').valueOf() : undefined,
			});
			// The loading toast gives way to the success modal, matching the
			// tileshare create flow — success isn't reported as a toast.
			dismissNotification(CREATE_NOTIFICATION_ID);
			setCreatedId(created?.id ?? null);
			setCreatedName(created?.name ?? name.trim());
			setShowSuccess(true);
		} catch (err) {
			console.error('Error creating tilette', err);
			updateNotification(
				CREATE_NOTIFICATION_ID,
				t('tilesharedemo.detail.add.error'),
				'error'
			);
		} finally {
			setSubmitting(false);
		}
	};

	/**
	 * On any close of the success modal — the action, the X, or the timeout —
	 * advance to the new tilette. Without an id there's nothing to open, so fall
	 * back to letting the caller refetch and return to the cluster.
	 */
	const handleSuccessClose = (next: boolean) => {
		setShowSuccess(next);
		if (next) return;
		if (createdId) {
			navigate(Routes.Tileshare.tilette(clusterId, createdId));
			return;
		}
		onCreated(null);
	};

	return (
		<Container>
			<HeaderBar>
				<BackButton type="button" onClick={onBack}>
					<ChevronLeft size={18} />
					{t('tilesharedemo.detail.add.back')}
				</BackButton>
			</HeaderBar>

			<Content>
				<IconBox>
					<TiletteIcon size={20} />
				</IconBox>

				<Title>{t('tilesharedemo.detail.add.title')}</Title>
				<Description>
					{t('tilesharedemo.detail.add.description', { name: clusterName })}
				</Description>

				<Fields>
					<Input
						name="name"
						label={t('tilesharedemo.detail.add.fields.name.label')}
						placeholder={t('tilesharedemo.detail.add.fields.name.placeholder')}
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={submitting}
					/>

					<DatePicker
						label={t('tilesharedemo.detail.add.fields.deadline.label')}
						value={deadline}
						onChange={setDeadline}
						placeholder={t('tilesharedemo.detail.add.fields.deadline.placeholder')}
						minDate={dayjs().format('YYYY-MM-DD')}
					/>

					<Input.Textarea
						name="note"
						label={t('tilesharedemo.detail.add.fields.note.label')}
						placeholder={t('tilesharedemo.detail.add.fields.note.placeholder')}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						disabled={submitting}
						rows={6}
					/>

					<ShareTo>
						<ShareToLabel>{t('tilesharedemo.detail.add.shareTo.label')}</ShareToLabel>
						<MultiInput
							value={recipients}
							onChange={setRecipients}
							placeholder={t('tilesharedemo.detail.add.shareTo.placeholder')}
							inputProps={{ name: 'shareTo', type: 'string' }}
						/>
					</ShareTo>
				</Fields>

				<Footer>
					<Separator />
					<Actions>
						<Button
							type="button"
							variant="ghost"
							style={{ border: `1px solid ${theme.colors.border.default}` }}
							onClick={onBack}
						>
							{t('tilesharedemo.detail.add.cancel')}
						</Button>
						<Button
							type="button"
							variant="brand"
							onClick={handleSubmit}
							disabled={submitting}
						>
							{submitting
								? t('tilesharedemo.detail.add.creating')
								: t('tilesharedemo.detail.add.submit')}
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
						text: t('tilesharedemo.detail.add.success.view'),
						onClick: () => handleSuccessClose(false),
					},
				]}
			>
				<p>{t('tilesharedemo.detail.add.success.message', { name: createdName })}</p>
			</SuccessModal>
		</Container>
	);
};

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	background-color: ${({ theme }) => theme.colors.background.page};
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

export default TiletteCreate;
