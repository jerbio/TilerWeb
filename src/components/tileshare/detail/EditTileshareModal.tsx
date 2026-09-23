import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Modal from '@/core/common/components/modals';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';

/** Values handed back on save. `dueDate` is epoch ms — never null, validation requires one. */
export type EditTileshareValues = {
	name: string;
	description: string;
	dueDate: number;
};

type EditTileshareModalProps = {
	show: boolean;
	setShow: (show: boolean) => void;
	headerText: string;
	initial: {
		name: string | null;
		description: string | null;
		dueDate: number | null;
	};
	saving?: boolean;
	onSubmit: (values: EditTileshareValues) => void;
};

const VALIDATION_NOTIFICATION_ID = notificationId(NotificationAction.Update, 'tileshare-edit');

const toDateInput = (epoch: number | null): string =>
	epoch ? dayjs(epoch).format('YYYY-MM-DD') : '';

/**
 * Merge a picked calendar day back into an epoch, keeping the original
 * time-of-day so editing the date doesn't silently move a 5pm deadline to
 * midnight. Falls back to end-of-day for a tileshare that had no date.
 */
const toEpoch = (date: string, original: number | null): number => {
	const base = original ? dayjs(original) : dayjs().endOf('day');
	return dayjs(date).hour(base.hour()).minute(base.minute()).second(0).millisecond(0).valueOf();
};

/**
 * Edit form shared by the cluster and tilette headers — both edit the same
 * three things (name, deadline, note). Deliberately mirrors the create form
 * (`TileshareCreate`): the same field order, placeholders, textarea size,
 * validation messages and button treatment, so editing reads as the same form
 * the tileshare was made in. Location and recipients are create-only; see the
 * note on `onSubmit`'s call sites.
 *
 * The caller owns the service call, so this stays a controlled form: it reports
 * values and renders `saving`.
 */
const EditTileshareModal: React.FC<EditTileshareModalProps> = ({
	show,
	setShow,
	headerText,
	initial,
	saving = false,
	onSubmit,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const showNotification = useUiStore((s) => s.notification.show);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');

	// Seed from the loaded entity each time the modal opens, so reopening after a
	// cancel discards the abandoned edits rather than resurrecting them.
	useEffect(() => {
		if (!show) return;
		setName(initial.name ?? '');
		setDescription(initial.description ?? '');
		setDate(toDateInput(initial.dueDate));
	}, [show, initial.name, initial.description, initial.dueDate]);

	/** First validation problem as a message, or null when valid. Mirrors the create form. */
	const getValidationError = (): string | null => {
		if (!name.trim()) return t('tilesharedemo.detail.edit.validation.nameRequired');
		if (!date) return t('tilesharedemo.detail.edit.validation.deadlineRequired');
		return null;
	};

	const handleSave = () => {
		if (saving) return;

		const validationError = getValidationError();
		if (validationError) {
			showNotification(VALIDATION_NOTIFICATION_ID, validationError, 'error');
			return;
		}

		onSubmit({
			name: name.trim(),
			description: description.trim(),
			dueDate: toEpoch(date, initial.dueDate),
		});
	};

	return (
		<Modal
			show={show}
			setShow={saving ? undefined : setShow}
			headerText={headerText}
			footer={
				<Actions>
					<Button
						type="button"
						variant="ghost"
						style={{ border: `1px solid ${theme.colors.border.default}` }}
						onClick={() => setShow(false)}
					>
						{t('tilesharedemo.detail.edit.cancel')}
					</Button>
					<Button type="button" variant="brand" onClick={handleSave} disabled={saving}>
						{saving
							? t('tilesharedemo.detail.edit.saving')
							: t('tilesharedemo.detail.edit.save')}
					</Button>
				</Actions>
			}
		>
			<Fields>
				<Input
					name="name"
					label={t('tilesharedemo.detail.edit.fields.name.label')}
					placeholder={t('tilesharedemo.detail.edit.fields.name.placeholder')}
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={saving}
				/>

				<DatePicker
					label={t('tilesharedemo.detail.edit.fields.deadline.label')}
					value={date}
					onChange={setDate}
					placeholder={t('tilesharedemo.detail.edit.fields.deadline.placeholder')}
					// A deadline can't be moved into the past. An already-overdue
					// tileshare keeps its seeded date, so name-only edits still save.
					minDate={dayjs().format('YYYY-MM-DD')}
				/>

				<Input.Textarea
					name="note"
					label={t('tilesharedemo.detail.edit.fields.note.label')}
					placeholder={t('tilesharedemo.detail.edit.fields.note.placeholder')}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					disabled={saving}
					rows={6}
				/>
			</Fields>
		</Modal>
	);
};

const Fields = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	/* The modal body is a fixed 400px minus its padding — fill it rather than
	   setting a width of our own, which would overflow to the right. */
	width: 100%;
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
	width: 100%;
`;

export default EditTileshareModal;
