import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { TileShareExecutionResult } from '@/core/common/types/chat';

const Card = styled.section`
	margin-block: 12px;
	padding: 14px;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	h4,
	p {
		margin: 8px 0;
	}
	ul {
		padding-inline-start: 20px;
	}
	li {
		margin-block: 8px;
		overflow-wrap: anywhere;
	}
	small {
		display: block;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	button {
		margin: 8px 8px 0 0;
		padding: 8px 12px;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		background: ${({ theme }) => theme.colors.background.card2};
		color: inherit;
	}
	button[data-destructive] {
		color: ${({ theme }) => theme.colors.text.error};
		border-color: ${({ theme }) => theme.colors.text.error};
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
	[role='alert'] {
		color: ${({ theme }) => theme.colors.text.error};
	}
`;
const NoteText = styled.p`
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	max-height: 16rem;
	overflow: auto;
`;
export default function TileShareReviewCard({
	result,
	disabled,
	onConfirm,
	onCheck,
	onChanged,
}: {
	result: TileShareExecutionResult;
	disabled?: boolean;
	onConfirm: (token: string, signal: AbortSignal) => Promise<TileShareExecutionResult>;
	onCheck: () => Promise<TileShareExecutionResult>;
	onChanged: (result: TileShareExecutionResult) => void;
}) {
	const { t } = useTranslation();
	const isPlan = result.Operation === 'UpdatePlan' || result.Review?.Operation === 'UpdatePlan';
	const isRecipients =
		result.Operation === 'UpdateRecipients' || result.Review?.Operation === 'UpdateRecipients';
	const isAccess =
		result.Operation === 'UpdateAccess' || result.Review?.Operation === 'UpdateAccess';
	const isManagement = isRecipients || isAccess;
	const managementLabel = isAccess
		? t('chat.tileShare.manageAccess', 'Manage project access')
		: t('chat.tileShare.manageRecipients', 'Manage recipients');
	const isProjectUpdate =
		result.Operation === 'UpdateProject' || result.Review?.Operation === 'UpdateProject';
	const isUpdate =
		isPlan ||
		isManagement ||
		isProjectUpdate ||
		result.Operation === 'UpdateTilette' ||
		result.Review?.Operation === 'UpdateTilette';
	const isDelete =
		result.Operation === 'DeleteTilette' || result.Review?.Operation === 'DeleteTilette';
	const isNotes =
		result.Operation === 'SetTiletteNotes' || result.Review?.Operation === 'SetTiletteNotes';
	const isTiletteRename =
		result.Operation === 'RenameTilette' || result.Review?.Operation === 'RenameTilette';
	const isRename =
		isTiletteRename ||
		result.Operation === 'RenameProject' ||
		result.Review?.Operation === 'RenameProject';
	const [busy, setBusy] = useState(false);
	const [uncertain, setUncertain] = useState(false);
	const [rejected, setRejected] = useState(false);
	useEffect(() => setRejected(false), [result.ReviewToken]);
	const rejectionMessage = t(
		'chat.tileShare.updateRejected',
		'No changes were applied. Review the response and request a revised update.'
	);
	const [notice, setNotice] = useState('');
	const pending = useRef<AbortController | null>(null);
	useEffect(
		() => () => {
			pending.current?.abort();
		},
		[]
	);
	const run = async (check = false) => {
		if (
			pending.current ||
			(disabled && !(check && result.State === 'Pending')) ||
			rejected ||
			(!check && uncertain)
		)
			return;
		const abort = new AbortController();
		pending.current = abort;
		setBusy(true);
		setNotice('');
		try {
			const next = check
				? await onCheck()
				: await onConfirm(result.ReviewToken!, abort.signal);
			if (abort.signal.aborted) return;
			if (next.ActionId === result.ActionId && ['Pending', 'Failed'].includes(next.State)) {
				setUncertain(false);
				onChanged(next);
				return;
			}
			if (next.ActionId === result.ActionId && next.State === 'Rejected') {
				setRejected(true);
				setUncertain(false);
				setNotice(rejectionMessage);
				onChanged(next);
				return;
			}
			if (
				next.ActionId !== result.ActionId ||
				!(
					next.State === 'Applied' ||
					(next.State === 'NotAttempted' && next.ReviewToken && next.Review)
				)
			)
				throw new Error('Unconfirmed action');
			onChanged(next);
			setUncertain(
				next.State !== 'Applied' &&
					!(next.State === 'NotAttempted' && next.ReviewToken && next.Review)
			);
			if (next.State !== 'Applied')
				setNotice(
					t(
						'chat.tileShare.reviewAgain',
						'Review the current proposal before confirming again.'
					)
				);
		} catch {
			if (!abort.signal.aborted) {
				setUncertain(true);
				setNotice(
					t(
						isUpdate
							? 'chat.tileShare.updateUncertain'
							: isDelete
								? 'chat.tileShare.deleteUncertain'
								: isNotes
									? 'chat.tileShare.notesUncertain'
									: isRename
										? 'chat.tileShare.renameUncertain'
										: 'chat.tileShare.uncertain',
						isUpdate
							? 'Update could not be confirmed. Check status before trying again.'
							: isDelete
								? 'Deletion could not be confirmed. Check status before trying again.'
								: isNotes
									? 'Notes update could not be confirmed. Check status before trying again.'
									: isRename
										? 'Rename could not be confirmed. Check status before trying again.'
										: 'Creation could not be confirmed. Check status before trying again.'
					)
				);
			}
		} finally {
			if (!abort.signal.aborted) {
				pending.current = null;
				setBusy(false);
			}
		}
	};
	if (result.State === 'Pending')
		return (
			<Card role="status">
				<p>
					{t(
						'chat.tileShare.schedulePending',
						'Calculating accepted-work schedules. No changes have been saved yet.'
					)}
				</p>
				{notice && <p role="alert">{notice}</p>}
				<button type="button" disabled={busy} onClick={() => run(true)}>
					{t('chat.tileShare.checkStatus', 'Check status')}
				</button>
			</Card>
		);
	if (result.State === 'Failed')
		return (
			<Card>
				<p role="alert">
					{result.ErrorCode === 'schedule_no_fit'
						? t(
								'chat.tileShare.scheduleNoFit',
								'No changes were applied. The remaining work could not fit around protected sessions. Adjust the duration or deadline and request a revised update.'
							)
						: t(
								'chat.tileShare.scheduleFailed',
								'No changes were applied. The schedule changed or calculation could not complete. Request a revised update.'
							)}
				</p>
			</Card>
		);
	if (result.State === 'Applied' && isPlan)
		return (
			<Card role="status">
				<p>{t('chat.tileShare.planUpdated', 'Reviewed changes saved together.')}</p>
				<ul>
					{result.PlanTargets?.map((item, i) => (
						<li key={i}>
							{item.Url.startsWith('/tileshare/') ? (
								<a href={item.Url}>{item.Name}</a>
							) : (
								item.Name
							)}
						</li>
					))}
				</ul>
			</Card>
		);
	if (result.State === 'Applied')
		return (
			<Card role="status">
				{isManagement
					? t('chat.tileShare.managementUpdated', 'Recipient or access changes saved.')
					: isUpdate
						? isProjectUpdate
							? t('chat.tileShare.projectUpdated', 'Project updated.')
							: t('chat.tileShare.tiletteUpdated', 'Tilette updated.')
						: isDelete
							? t('chat.tileShare.tiletteDeleted', 'Tilette deleted.')
							: isNotes
								? t('chat.tileShare.notesUpdated', 'Tilette notes updated.')
								: isTiletteRename
									? t('chat.tileShare.tiletteRenamed', 'Tilette renamed.')
									: isRename
										? t('chat.tileShare.renamed', 'Project renamed.')
										: t('chat.tileShare.created', 'TileShare created.')}{' '}
				{isAccess && (
					<p>
						{t(
							'chat.tileShare.accessReconciliation',
							'Access is saved. Calendar cleanup or restoration runs in the background.'
						)}
					</p>
				)}
				{result.Url?.startsWith('/tileshare/') && (
					<a href={result.Url}>
						{isDelete
							? t('chat.tileShare.openProject', 'Open project')
							: t('chat.tileShare.open', 'Open TileShare')}
					</a>
				)}
			</Card>
		);
	if (result.State === 'Rejected')
		return (
			<Card>
				<p role="alert">{rejectionMessage}</p>
			</Card>
		);
	const review = result.Review;
	if (!review || !result.ReviewToken) return null;
	const time = (value?: number | null) => (value == null ? '' : new Date(value).toLocaleString());
	if (isPlan)
		return (
			<Card aria-label={t('chat.tileShare.planReview', 'Review shared-work plan')}>
				<h4>{t('chat.tileShare.planReview', 'Review shared-work plan')}</h4>
				<div style={{ maxHeight: '28rem', overflow: 'auto' }}>
					<ul>
						{review.Items?.map((item, i) => (
							<li key={i}>
								<strong>
									{item.ProjectName ? `${item.ProjectName} / ` : ''}
									{item.PreviousName}
									{item.UpdatesName ? ` → ${item.Name}` : ''}
								</strong>
								{item.UpdatesNotes && (
									<>
										<small>
											{t('chat.tileShare.previousNotes', 'Current notes')}
										</small>
										<NoteText>
											{item.PreviousNotes ||
												t('chat.tileShare.emptyNotes', 'No notes')}
										</NoteText>
										<small>
											{t('chat.tileShare.proposedNotes', 'Proposed notes')}
										</small>
										<NoteText>
											{item.Notes ||
												t('chat.tileShare.clearNotes', 'Clear notes')}
										</NoteText>
									</>
								)}
							</li>
						))}
					</ul>
				</div>
				<p>
					{t(
						'chat.tileShare.planNote',
						'All displayed targets are saved together after confirmation. If any target changes or access is lost, review a new proposal.'
					)}
				</p>
				{(notice || result.ErrorCode === 'review_changed') && (
					<p role="alert">
						{notice ||
							t(
								'chat.tileShare.reviewAgain',
								'Review the current proposal before confirming again.'
							)}
					</p>
				)}
				<button
					type="button"
					disabled={busy || uncertain || rejected || disabled}
					onClick={() => run()}
				>
					{t('chat.tileShare.confirmUpdate', 'Confirm update')}
				</button>
				{uncertain && (
					<button type="button" disabled={busy} onClick={() => run(true)}>
						{t('chat.tileShare.checkStatus', 'Check status')}
					</button>
				)}
			</Card>
		);
	return (
		<Card
			aria-label={
				isManagement
					? managementLabel
					: isUpdate
						? isProjectUpdate
							? t('chat.tileShare.projectUpdateReview', 'Review project update')
							: t('chat.tileShare.updateReview', 'Review tilette update')
						: isDelete
							? t('chat.tileShare.deleteReview', 'Review tilette deletion')
							: isNotes
								? t('chat.tileShare.notesReview', 'Review tilette notes')
								: isTiletteRename
									? t(
											'chat.tileShare.tiletteRenameReview',
											'Review tilette rename'
										)
									: isRename
										? t('chat.tileShare.renameReview', 'Review project rename')
										: t('chat.tileShare.review', 'Review TileShare creation')
			}
		>
			<h4>
				{isManagement
					? managementLabel
					: isUpdate
						? isProjectUpdate
							? t('chat.tileShare.updateProject', 'Update project')
							: t('chat.tileShare.updateTilette', 'Update tilette')
						: isDelete
							? t('chat.tileShare.deleteTilette', 'Delete tilette')
							: isNotes
								? t('chat.tileShare.editNotes', 'Update tilette notes')
								: isTiletteRename
									? t('chat.tileShare.renameTilette', 'Rename tilette')
									: isRename
										? t('chat.tileShare.renameProject', 'Rename project')
										: review.CreatesProject
											? t('chat.tileShare.newProject', 'Create project')
											: t('chat.tileShare.newTilette', 'Add tilette')}
				: {review.Name}
			</h4>
			{(isRename || (isUpdate && review.UpdatesName)) && (
				<p>
					{t('chat.tileShare.previousName', 'Current name')}: {review.PreviousName}
				</p>
			)}
			{(!isRename || isTiletteRename) && review.ProjectName && (
				<p>
					{t('chat.tileShare.project', 'Project')}: {review.ProjectName}
				</p>
			)}
			{isDelete && (
				<>
					<p>
						{t('chat.tileShare.assignmentCount', 'Assignments')}:{' '}
						{review.AssignmentCount}
					</p>
					<p>
						{t('chat.tileShare.linkedCalendarCount', 'Linked calendar items')}:{' '}
						{review.LinkedCalendarCount}
					</p>
				</>
			)}
			{(isNotes || (isUpdate && review.UpdatesNotes)) && (
				<>
					<strong>{t('chat.tileShare.previousNotes', 'Current notes')}</strong>
					<NoteText>
						{review.PreviousNotes || t('chat.tileShare.emptyNotes', 'No notes')}
					</NoteText>
					<strong>{t('chat.tileShare.proposedNotes', 'Proposed notes')}</strong>
					<NoteText>
						{review.Notes || t('chat.tileShare.clearNotes', 'Clear notes')}
					</NoteText>
				</>
			)}
			{review.EffectsSummary && <NoteText>{review.EffectsSummary}</NoteText>}
			{review.ScheduleSummary && <NoteText>{review.ScheduleSummary}</NoteText>}
			{review.StartTime != null && (
				<small>
					{t('chat.tileShare.starts', 'Starts')}: {time(review.StartTime)}
				</small>
			)}
			{review.Deadline != null && (
				<small>
					{t('chat.tileShare.deadline', 'Deadline')}: {time(review.Deadline)}
				</small>
			)}
			<ul>
				{review.Tilettes.map((item, index) => (
					<li key={index}>
						<strong>{item.Name}</strong> - {item.DurationMinutes}{' '}
						{t('chat.tileShare.minutes', 'minutes')}
						{item.StartTime != null && (
							<small>
								{t('chat.tileShare.starts', 'Starts')}: {time(item.StartTime)}
							</small>
						)}
						{item.Deadline != null && (
							<small>
								{t('chat.tileShare.deadline', 'Deadline')}: {time(item.Deadline)}
							</small>
						)}
						{item.Recipients.map((recipient, i) => (
							<small key={i}>
								{recipient.name} - {recipient.email || recipient.phone}
							</small>
						))}
					</li>
				))}
			</ul>
			<p>
				{t(
					isManagement
						? 'chat.tileShare.managementNote'
						: isUpdate
							? 'chat.tileShare.updateNote'
							: isDelete
								? 'chat.tileShare.deleteNote'
								: isNotes
									? 'chat.tileShare.notesNote'
									: isTiletteRename
										? 'chat.tileShare.tiletteRenameNote'
										: isRename
											? 'chat.tileShare.renameNote'
											: 'chat.tileShare.reviewNote',
					isManagement
						? 'Review the recipient and access effects above. Calendar access cleanup and restoration run in the background.'
						: isUpdate
							? 'All displayed changes are saved together after confirmation. Supplied notes replace the complete note.'
							: isDelete
								? 'This disables the tilette and linked calendar work. The project and other tilettes stay available. Assignment history is retained; undo is not provided here.'
								: isNotes
									? 'The proposed text replaces the complete tilette notes after confirmation.'
									: isTiletteRename
										? 'Only the shared tilette name changes. Personal calendar titles stay as they are.'
										: isRename
											? 'Only the project name changes after confirmation.'
											: 'Nothing is created until you confirm. Recipients still choose whether to accept; notifications are not sent by this action.'
				)}
			</p>
			{(notice || result.ErrorCode === 'review_changed') && (
				<p role="alert">
					{notice ||
						t(
							'chat.tileShare.reviewAgain',
							'Review the current proposal before confirming again.'
						)}
				</p>
			)}
			<button
				type="button"
				disabled={disabled || busy || uncertain || rejected}
				data-destructive={isDelete || undefined}
				onClick={() => void run()}
			>
				{busy
					? t('chat.tileShare.checking', 'Checking...')
					: isUpdate
						? t('chat.tileShare.confirmUpdate', 'Confirm update')
						: isDelete
							? t('chat.tileShare.confirmDeletion', 'Confirm deletion')
							: isNotes
								? t('chat.tileShare.confirmNotes', 'Confirm notes')
								: isRename
									? t('chat.tileShare.confirmRename', 'Confirm rename')
									: t('chat.tileShare.confirm', 'Confirm creation')}
			</button>
			{uncertain && (
				<button type="button" disabled={disabled || busy} onClick={() => void run(true)}>
					{t('chat.tileShare.check', 'Check status')}
				</button>
			)}
		</Card>
	);
}
