import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Modal from '../TileShareModal';
import TileShareDiscardDialog from '../TileShareDiscardDialog';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import MarkdownNoteField from '../MarkdownNoteField';
import { useUiStore, notificationId, NotificationAction } from '@/core/ui';
import { TileShareTemplate, TileshareMode } from '@/core/common/types/tileshare';
import {
	editedDeadline,
	tileShareNameProblem,
	tilettesDueAfter,
	TileShareEditValues,
} from '@/core/util/tileshareEdit';
import { ShareDeadlineUpdateError } from '@/services/tileShareEditing';
import { AlertTriangle, Clock3 } from 'lucide-react';

export type EditTileshareValues = TileShareEditValues;
type Initial = { name: string | null; description: string | null; dueDate: number | null };
type Context = {
	kind: 'tilette' | 'share';
	start?: number | null;
	shareDeadline?: number | null;
	duration?: number | null;
	mode?: TileshareMode | null;
	tilettes?: TileShareTemplate[];
};
type Props = {
	show: boolean;
	setShow: (show: boolean) => void;
	headerText: string;
	initial: Initial;
	saving?: boolean;
	hideNotes?: boolean;
	context?: Context;
	onSubmit: (values: EditTileshareValues) => void | Promise<void>;
};
const VALIDATION_NOTIFICATION_ID = notificationId(NotificationAction.Update, 'tileshare-edit');

/** Desktop edit dialog with the same deadline and save guards as mobile's task sheet. */
export default function EditTileshareModal({
	show,
	setShow,
	headerText,
	initial,
	saving = false,
	hideNotes = false,
	context,
	onSubmit,
}: Props) {
	const { t } = useTranslation();
	const showNotification = useUiStore((s) => s.notification.show);
	const wasOpen = useRef(false);
	const lock = useRef(false);
	const fields = useRef<HTMLFieldSetElement>(null);
	const [baseline, setBaseline] = useState<Initial>(initial);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('23:59');
	const [moveShare, setMoveShare] = useState(false);
	const [discard, setDiscard] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [problem, setProblem] = useState<string | null>(null);
	const [failure, setFailure] = useState<'save' | 'share' | null>(null);
	useEffect(() => {
		if (show && !wasOpen.current) {
			const seed = { ...initial, dueDate: initial.dueDate ?? context?.shareDeadline ?? null };
			setBaseline(seed);
			setName(seed.name ?? '');
			setDescription(seed.description ?? '');
			setDate(seed.dueDate !== null ? dayjs(seed.dueDate).format('YYYY-MM-DD') : '');
			setTime(seed.dueDate !== null ? dayjs(seed.dueDate).format('HH:mm') : '23:59');
			setMoveShare(false);
			setDiscard(false);
			setProblem(null);
			setFailure(null);
		}
		wasOpen.current = show;
	}, [show, initial, context?.shareDeadline]);
	const busy = saving || submitting;
	const dueDate = editedDeadline(date, time, baseline.dueDate);
	const late =
		context?.kind === 'tilette' &&
		dueDate !== null &&
		context.shareDeadline != null &&
		dueDate > context.shareDeadline;
	const dirty =
		name.trim() !== (baseline.name ?? '').trim() ||
		(!hideNotes && description !== (baseline.description ?? '')) ||
		dueDate !== baseline.dueDate ||
		(late && moveShare);
	const impact =
		context?.kind === 'share' && dueDate !== null && dueDate !== baseline.dueDate
			? tilettesDueAfter(context.tilettes ?? [], dueDate)
			: { accepted: 0, notAccepted: 0 };
	const close = () => {
		if (busy || lock.current) return;
		if (dirty || failure) setDiscard(true);
		else setShow(false);
	};
	useEffect(() => {
		if (!show || (!dirty && !failure)) return;
		const beforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', beforeUnload);
		return () => window.removeEventListener('beforeunload', beforeUnload);
	}, [show, dirty, failure]);
	const submit = async () => {
		if (busy || lock.current) return;
		const nameProblem = tileShareNameProblem(name);
		const validation =
			nameProblem === 'required'
				? t('tilesharedemo.detail.edit.validation.nameRequired')
				: nameProblem === 'short'
					? t('tileShareEdit.nameShort', 'Use at least 3 characters.')
					: nameProblem === 'long'
						? t('tileShareEdit.nameLong', 'Use no more than 100 characters.')
						: dueDate === null
							? t('tilesharedemo.detail.edit.validation.deadlineRequired')
							: context?.start != null && dueDate < context.start
								? t(
										'tileShareEdit.beforeStart',
										'The deadline must be on or after the start time.'
									)
								: null;
		if (validation) {
			setProblem(validation);
			showNotification(VALIDATION_NOTIFICATION_ID, validation, 'error');
			fields.current
				?.querySelector<HTMLElement>(
					nameProblem ? 'input[name="name"]' : '.react-datepicker__input-container input'
				)
				?.focus();
			return;
		}
		if ((!dirty && !failure) || dueDate === null) return;
		lock.current = true;
		setSubmitting(true);
		setProblem(null);
		setFailure(null);
		try {
			await onSubmit({
				name: name.trim(),
				description: description.trim() ? description : '',
				dueDate,
				...(context?.kind === 'tilette' ? { moveShareDeadline: late && moveShare } : {}),
			});
		} catch (error) {
			setFailure(error instanceof ShareDeadlineUpdateError ? 'share' : 'save');
		} finally {
			lock.current = false;
			setSubmitting(false);
		}
	};
	return (
		<>
			<Modal
				size={hideNotes ? 'compact' : 'standard'}
				subtitle={baseline.name ?? undefined}
				show={show}
				setShow={busy ? undefined : close}
				headerText={headerText}
				footer={
					<Actions>
						<Button disabled={busy} type="button" variant="ghost" onClick={close}>
							{t('tilesharedemo.detail.edit.cancel')}
						</Button>
						<Button
							disabled={busy}
							type="button"
							variant="brand"
							onClick={() => void submit()}
						>
							{busy
								? t('tilesharedemo.detail.edit.saving')
								: failure
									? t('tileShareEdit.retry', 'Retry save')
									: t('tilesharedemo.detail.edit.save')}
						</Button>
					</Actions>
				}
			>
				<Fields ref={fields} disabled={busy}>
					<FieldGroup>
						<Input
							name="name"
							label={t('tilesharedemo.detail.edit.fields.name.label')}
							placeholder={t('tilesharedemo.detail.edit.fields.name.placeholder')}
							value={name}
							maxLength={100}
							onChange={(event) => {
								setName(event.target.value);
								setProblem(null);
							}}
						/>
						<Hint>{t('tileShareEdit.nameHint', 'Use 3–100 characters.')}</Hint>
					</FieldGroup>
					<DeadlineRow>
						<DatePicker
							label={t('tilesharedemo.detail.edit.fields.deadline.label')}
							value={date}
							onChange={(value) => {
								setDate(value);
								setMoveShare(false);
								setProblem(null);
							}}
							placeholder={t('tilesharedemo.detail.edit.fields.deadline.placeholder')}
							disabled={busy}
						/>
						<Input
							name="deadlineTime"
							type="time"
							label={t('tileShareEdit.time', 'Deadline time')}
							value={time}
							onChange={(event) => {
								setTime(event.target.value);
								setMoveShare(false);
								setProblem(null);
							}}
						/>
					</DeadlineRow>
					{context?.kind === 'tilette' &&
						initial.dueDate === null &&
						context.shareDeadline != null && (
							<Hint>
								{t(
									'tileShareEdit.inherited',
									'This tilette uses the share’s deadline until you choose its own.'
								)}
							</Hint>
						)}
					{late && (
						<Callout role="status">
							<CalloutHeading>
								<AlertTriangle size={17} aria-hidden="true" />
								{t('tileShareEdit.lateTitle', 'Due after the share deadline')}
							</CalloutHeading>
							<p>
								{t(
									'tileShareEdit.afterShare',
									'This tilette is due after the share’s deadline ({{deadline}}).',
									{
										deadline: dayjs(context?.shareDeadline).format(
											'MMM D, YYYY h:mm A'
										),
									}
								)}
							</p>
							<label>
								<input
									type="checkbox"
									checked={moveShare}
									onChange={(event) => setMoveShare(event.target.checked)}
								/>{' '}
								{t(
									'tileShareEdit.moveShare',
									'Also move the share’s deadline to {{deadline}}',
									{ deadline: dayjs(dueDate!).format('MMM D, YYYY h:mm A') }
								)}
							</label>
						</Callout>
					)}
					{context?.kind === 'tilette' && (
						<DurationInfo>
							<Clock3 size={16} aria-hidden="true" />
							<div>
								<strong>
									{t('tileShareEdit.durationLabel', 'Duration')}
									{context.duration != null && context.duration > 0 && (
										<>
											{' '}
											{' · '}
											{context.duration % 3600000 === 0
												? t('tileShareVisual.hours', '{{count}} hour(s)', {
														count: context.duration / 3600000,
													})
												: t(
														'tileShareEdit.duration',
														'{{minutes}} minutes',
														{
															minutes: Math.round(
																context.duration / 60000
															),
														}
													)}
										</>
									)}
								</strong>
								<small>
									{t(
										'tileShareEdit.durationFixed',
										'A tilette’s duration cannot change once it is shared.'
									)}
								</small>
							</div>
						</DurationInfo>
					)}
					{context?.kind === 'share' && context.mode && (
						<Hint>
							{t(`tileShareModes.${context.mode}.label`)}.{' '}
							{t('tileShareEdit.modeFixed', 'The mode cannot change after sharing.')}
						</Hint>
					)}
					{(impact.accepted > 0 || impact.notAccepted > 0) && (
						<Callout role="status">
							{impact.accepted > 0 && (
								<p>
									{t(
										'tileShareEdit.acceptedImpact',
										'{{count}} accepted tilette(s) due later may be moved to this deadline.',
										{ count: impact.accepted }
									)}
								</p>
							)}
							{impact.notAccepted > 0 && (
								<p>
									{t(
										'tileShareEdit.unacceptedImpact',
										'{{count}} tilette(s) that nobody has accepted keep their later deadlines.',
										{ count: impact.notAccepted }
									)}
								</p>
							)}
						</Callout>
					)}
					{!hideNotes && (
						<MarkdownNoteField
							name="note"
							label={t('tilesharedemo.detail.edit.fields.note.label')}
							placeholder={t('tilesharedemo.detail.edit.fields.note.placeholder')}
							value={description}
							onChange={setDescription}
							disabled={busy}
							rows={6}
						/>
					)}
					{problem && <ErrorMessage role="alert">{problem}</ErrorMessage>}
					{failure && (
						<ErrorMessage role="alert">
							{failure === 'share'
								? t(
										'tileShareEdit.shareFailed',
										'The tilette was saved, but the share deadline could not be updated. Retry to finish, or close to keep the saved tilette.'
									)
								: t(
										'tileShareEdit.saveFailed',
										'Could not save right now. Your changes are kept. Try again.'
									)}
						</ErrorMessage>
					)}
					{!dirty && !failure && (
						<Hint>{t('tileShareEdit.unchanged', 'No changes to save.')}</Hint>
					)}
				</Fields>
			</Modal>
			<TileShareDiscardDialog
				open={discard}
				task={context?.kind === 'tilette'}
				message={
					failure === 'share'
						? t(
								'tileShareEdit.partialDiscard',
								'The tilette changes are already saved. Closing abandons the pending share deadline change.'
							)
						: t(
								'tileShareEdit.discard',
								'Your unsaved changes to these details will be lost.'
							)
				}
				onKeep={() => setDiscard(false)}
				onDiscard={() => {
					setDiscard(false);
					setShow(false);
				}}
			/>
		</>
	);
}

const Fields = styled.fieldset`
	border: 0;
	padding: 0;
	margin: 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 22px;
`;
const Actions = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
	width: 100%;
`;
const Hint = styled.p`
	margin: 0;
	font-size: 13px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 12px;
`;
const Callout = styled.div`
	padding: 16px;
	border: 1px solid
		color-mix(in srgb, ${({ theme }) => theme.colors.text.warning} 35%, transparent);
	border-radius: 12px;
	background: color-mix(
		in srgb,
		${({ theme }) => theme.colors.text.warning} 7%,
		${({ theme }) => theme.colors.background.card}
	);
	font-size: 13px;
	line-height: 1.6;
	p {
		margin: 0 0 8px;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	label {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding-top: 12px;
		margin-top: 12px;
		border-top: 1px solid
			color-mix(in srgb, ${({ theme }) => theme.colors.text.warning} 20%, transparent);
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;
const ErrorMessage = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors.text.error};
`;

const FieldGroup = styled.div`
	display: grid;
	gap: 6px;
	min-width: 0;
`;
const DeadlineRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
	gap: 16px;
	@media (max-width: 400px) {
		grid-template-columns: 1fr;
		gap: 16px;
	}
`;
const CalloutHeading = styled.strong`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 6px;
	font-size: 13px;
	font-weight: 650;
	color: ${({ theme }) => theme.colors.text.warning};
	svg {
		flex-shrink: 0;
	}
`;
const DurationInfo = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px 14px;
	background: ${({ theme }) => theme.colors.input.bg};
	border-radius: 10px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	svg {
		margin-top: 3px;
		flex-shrink: 0;
	}
	strong {
		font-weight: 500;
		color: ${({ theme }) => theme.colors.text.primary};
	}
	small {
		display: block;
		font-size: 12px;
		margin-top: 2px;
	}
`;
