import { useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth/useAuth';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import { ContactModel, InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { classParticipants } from '@/core/util/tileshareMode';
import { matchesParticipant } from '@/core/util/classShareParticipants';
import { isValidRecipient } from '@/core/util/contact';
import { toContact } from '@/services/tileshareService';
import { tileshareService } from '@/services';
import { TileshareApi } from '@/api/tileshareApi';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';
import TileShareDialog from './TileShareDialog';
import { useInvitationStore } from './TileShareMutations';
import { CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';
import { useParticipantRemoval } from './useParticipantRemoval';

type Change = {
	key: string;
	send: () => Promise<unknown>;
	response?: InvitationStatus.Accepted | InvitationStatus.Declined;
};
type Addition = {
	label: string;
	changes: Change[];
	skipped: number;
	saved: number;
	failed: number;
	processed: number;
	attemptTotal: number;
	phase: 'review' | 'saving' | 'result';
	refreshFailed: boolean;
};
type Props = {
	tilettes: TileShareTemplate[];
	participants?: ContactModel[];
	isOwner: boolean;
	onChanged: () => Promise<void>;
	children?: (remove: (person: ContactModel) => ReactNode) => ReactNode;
};

/** Kept mounted by the Class experience, including while its participant section is hidden. */
export default function ClassShareActions({
	tilettes,
	participants,
	isOwner,
	onChanged,
	children,
}: Props) {
	const { t } = useTranslation();
	const { user } = useAuth();
	const mutations = useInvitationStore();
	const [contact, setContact] = useState('');
	const [busy, setBusy] = useState(false);
	const [remaining, setRemaining] = useState<Change[]>([]);
	const [notice, setNotice] = useState<{ saved: number; failed: number } | null>(null);
	const removal = useParticipantRemoval(onChanged);
	const [addition, setAddition] = useState<Addition | null>(null);
	const [answerReview, setAnswerReview] = useState<
		InvitationStatus.Accepted | InvitationStatus.Declined | null
	>(null);
	const [additionOpen, setAdditionOpen] = useState(false);
	const [refreshingAddition, setRefreshingAddition] = useState(false);
	const inFlight = useRef(false);
	const people = classParticipants(tilettes, participants);
	const pending = tilettes.flatMap((task) =>
		validDesignatedUsers(task.designatedUsers).filter(
			(person) =>
				!!user?.id &&
				person.userId === user.id &&
				person.designatedTileTemplateId &&
				[
					InvitationStatus.None,
					InvitationStatus.Tentative,
					InvitationStatus.Pending,
				].includes(person.rsvpStatus as InvitationStatus)
		)
	);
	const run = async (changes: Change[], adding = false) => {
		if (inFlight.current || !changes.length) return;
		inFlight.current = true;
		setBusy(true);
		if (!adding) {
			setAddition(null);
			setAdditionOpen(false);
		}
		if (adding)
			setAddition(
				(previous) =>
					previous && {
						...previous,
						phase: 'saving',
						processed: 0,
						attemptTotal: changes.length,
						refreshFailed: false,
					}
			);
		const failed: Change[] = [];
		let saved = 0;
		for (const change of changes) {
			try {
				if (change.response) {
					const previous = mutations.get(change.key);
					if (previous === 'accepted' || previous === 'declined') continue;
					if (previous === 'uncertain') {
						const current = await new TileshareApi().getAssignmentResponse(change.key);
						if (current.id !== change.key) throw new Error('Assignment mismatch');
						if (
							current.invitationStatus === InvitationStatus.Accepted ||
							current.invitationStatus === InvitationStatus.Declined
						) {
							mutations.set(change.key, current.invitationStatus);
							saved++;
							continue;
						}
						throw new Error('Response is still uncertain');
					}
					if (!mutations.start(change.key, 'saving')) continue;
				}
				await change.send();
				if (change.response) mutations.set(change.key, change.response);
				saved++;
			} catch {
				if (change.response) mutations.set(change.key, 'uncertain');
				failed.push(change);
			}
			if (adding)
				setAddition(
					(previous) =>
						previous && {
							...previous,
							processed: previous.processed + 1,
							saved: previous.saved + (failed.includes(change) ? 0 : 1),
						}
				);
		}
		setRemaining(failed);
		if (!adding) setNotice({ saved, failed: failed.length });
		// Refresh failure is separate from write failure; retrying never repeats saved steps.
		window.dispatchEvent(new Event('tileshare-changed'));
		let refreshFailed = false;
		await onChanged().catch(() => {
			refreshFailed = true;
		});
		if (adding) {
			setAddition(
				(previous) =>
					previous && {
						...previous,
						phase: 'result',
						failed: failed.length,
						refreshFailed,
					}
			);
			if (!failed.length) setContact('');
		}
		inFlight.current = false;
		setBusy(false);
	};
	const add = () => {
		if (
			!isOwner ||
			additionOpen ||
			inFlight.current ||
			removal.blocked ||
			remaining.length ||
			!tilettes.some((task) => task.id) ||
			!isValidRecipient(contact)
		)
			return;
		const person = toContact(contact, user?.countryCode || '1');
		const changes = tilettes
			.filter(
				(task) =>
					task.id &&
					!validDesignatedUsers(task.designatedUsers).some((assignment) =>
						matchesParticipant(person, assignment)
					)
			)
			.map((task) => ({
				key: task.id!,
				send: () => tileshareService.addTiletteRecipient(task.id!, person),
			}));
		setNotice(null);
		setAddition({
			label: person.Email ?? person.PhoneNumber ?? contact.trim(),
			changes,
			skipped: tilettes.filter((task) => task.id).length - changes.length,
			saved: 0,
			failed: 0,
			processed: 0,
			attemptTotal: changes.length,
			phase: 'review',
			refreshFailed: false,
		});
		setAdditionOpen(true);
	};
	const answer = (status: InvitationStatus.Accepted | InvitationStatus.Declined) => {
		const api = new TileshareApi();
		void run(
			pending.map((person) => ({
				key: person.designatedTileTemplateId!,
				response: status,
				send: () => api.respondToInvitation(person.designatedTileTemplateId!, status),
			}))
		);
	};
	const blocked = busy || remaining.length > 0 || removal.blocked;
	const editContact = () => {
		setRemaining([]);
		setAdditionOpen(false);
		setAddition(null);
	};
	const editContactAction =
		addition?.phase === 'result' && addition.failed > 0 && addition.saved === 0 ? (
			<Button variant="ghost" disabled={busy} onClick={editContact}>
				{t('classParticipantAddition.editContact', 'Edit contact')}
			</Button>
		) : null;
	const remove = (person: ContactModel) => (
		<Button
			variant="ghost"
			disabled={blocked}
			onClick={() =>
				removal.review({
					recipient:
						[person.FirstName, person.LastName].filter(Boolean).join(' ') ||
						person.Email ||
						person.PhoneNumber ||
						person.Id ||
						t('tileshareManagement.recipient', 'Recipient'),
					assignments: tilettes.flatMap((task) =>
						validDesignatedUsers(task.designatedUsers)
							.filter(
								(assignment) => task.id && matchesParticipant(person, assignment)
							)
							.map((assignment) => ({
								tiletteId: task.id!,
								assignmentId: assignment.designatedTileTemplateId,
							}))
					),
				})
			}
		>
			{t('shareExperience.removeExisting', 'Remove from existing tilettes')}
		</Button>
	);
	const additionFeedback = addition && (
		<AdditionFeedback
			$failed={addition.failed > 0}
			role={addition.failed ? 'alert' : 'status'}
			aria-atomic="true"
		>
			{addition.phase === 'saving' ? (
				<>
					<UserPlus size={20} aria-hidden="true" />
					<p>
						{t(
							'classParticipantAddition.progress',
							'Adding {{recipient}}. Tilettes processed: {{processed}}/{{total}}.',
							{
								recipient: addition.label,
								processed: addition.processed,
								total: addition.attemptTotal,
							}
						)}
					</p>
					<progress
						value={addition.processed}
						max={addition.attemptTotal}
						aria-label={t(
							'classParticipantAddition.progressLabel',
							'Participant addition progress'
						)}
					/>
				</>
			) : (
				<>
					{addition.failed ? (
						<AlertTriangle size={20} aria-hidden="true" />
					) : (
						<CheckCircle2 size={20} aria-hidden="true" />
					)}
					<p>
						{addition.failed
							? addition.saved === 0
								? t(
										'classParticipantAddition.failed',
										'Couldn’t add {{recipient}}. Additions to retry: {{count}}.',
										{ recipient: addition.label, count: addition.failed }
									)
								: t(
										'classParticipantAddition.partial',
										'{{recipient}} — tilettes added: {{saved}}; additions to retry: {{failed}}.',
										{
											recipient: addition.label,
											saved: addition.saved,
											failed: addition.failed,
										}
									)
							: t(
									'classParticipantAddition.success',
									'{{recipient}} added. Tilettes updated: {{count}}.',
									{ recipient: addition.label, count: addition.saved }
								)}
					</p>
					{addition.skipped > 0 && (
						<p>
							{t(
								'classParticipantAddition.skipped',
								'Already assigned; tilettes skipped: {{count}}.',
								{ count: addition.skipped }
							)}
						</p>
					)}
					{addition.refreshFailed && (
						<>
							<p>
								{t(
									'classParticipantAddition.refreshFailed',
									'The participant list couldn’t refresh. Refresh it to check the latest assignments.'
								)}
							</p>
							<Button
								variant="ghost"
								disabled={refreshingAddition}
								onClick={async () => {
									setRefreshingAddition(true);
									try {
										await onChanged();
										setAddition(
											(previous) =>
												previous && { ...previous, refreshFailed: false }
										);
									} catch {
										/* Keep the saved result and offer a read-only retry. */
									} finally {
										setRefreshingAddition(false);
									}
								}}
							>
								{t('shareExperience.refresh', 'Refresh')}
							</Button>
						</>
					)}
				</>
			)}
		</AdditionFeedback>
	);
	return (
		<Actions
			aria-label={t('tileShareModes.classActions', 'Class participants')}
			aria-busy={busy}
		>
			{removal.feedback}
			{removal.dialog}
			{isOwner && (
				<>
					<Input
						label={t('tileShareModes.participantContact', 'Participant email or phone')}
						value={contact}
						disabled={blocked}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								add();
							}
						}}
						onChange={(event) => {
							setContact(event.target.value);
							if (!remaining.length) setAddition(null);
						}}
					/>
					<Button
						disabled={
							blocked ||
							!tilettes.some((task) => task.id) ||
							!isValidRecipient(contact)
						}
						onClick={add}
					>
						{busy && addition?.phase === 'saving'
							? t('classParticipantAddition.adding', 'Adding participant…')
							: t('shareExperience.addExisting', 'Add to all existing tilettes')}
					</Button>
					{addition && addition.phase !== 'review' && !additionOpen && (
						<>
							{additionFeedback}
							{editContactAction}
							{addition.failed > 0 && (
								<Button
									disabled={busy}
									onClick={() => {
										setAdditionOpen(true);
										void run(remaining, true);
									}}
								>
									{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
								</Button>
							)}
						</>
					)}
					{!tilettes.length && (
						<p>
							{t(
								'tileShareModes.emptyClass',
								'Add a tilette to start assigning work to participants.'
							)}
						</p>
					)}
					{children ? (
						children(remove)
					) : (
						<ul>
							{people.map((person, index) => (
								<li key={person.Id ?? person.Email ?? person.PhoneNumber ?? index}>
									{person.Email ?? person.PhoneNumber ?? person.Id}{' '}
									{remove(person)}
								</li>
							))}
						</ul>
					)}
				</>
			)}
			{pending.length > 0 && (
				<Bulk>
					<Button
						disabled={blocked}
						onClick={() => setAnswerReview(InvitationStatus.Accepted)}
					>
						{t('tileShareModes.acceptAll', 'Accept all pending tilettes')}
					</Button>
					<Button
						disabled={blocked}
						onClick={() => setAnswerReview(InvitationStatus.Declined)}
					>
						{t('tileShareModes.declineAll', 'Decline all pending tilettes')}
					</Button>
				</Bulk>
			)}
			<TileShareDialog
				open={answerReview !== null}
				title={t('tileShareBoard.bulkTitle', 'Respond to all pending assignments?')}
				dismissible={!busy}
				onClose={() => setAnswerReview(null)}
				footer={
					<>
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => setAnswerReview(null)}
						>
							{t('tilesharedemo.detail.edit.cancel', 'Cancel')}
						</Button>
						<Button
							variant="brand"
							disabled={blocked || !pending.length}
							onClick={() => {
								if (!answerReview) return;
								answer(answerReview);
								setAnswerReview(null);
							}}
						>
							{t('tileShareBoard.bulkConfirm', 'Confirm response')}
						</Button>
					</>
				}
			>
				<p>
					{t(
						'tileShareBoard.bulkReview',
						'Apply {{response}} to all {{count}} of your pending assignments in this Class, including assignments hidden by filters?',
						{
							response: t(`tileshareRsvp.${answerReview ?? 'none'}`),
							count: pending.length,
						}
					)}
				</p>
			</TileShareDialog>
			{notice && (
				<p role="status">
					{notice.failed
						? t(
								'tileShareModes.partialChange',
								'{{saved}} changes saved; {{failed}} need retry.',
								notice
							)
						: t('tileShareModes.changesSaved', 'Changes saved.')}
				</p>
			)}
			{remaining.length > 0 && !addition && (
				<Button disabled={busy} onClick={() => void run(remaining)}>
					{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
				</Button>
			)}
			<TileShareDialog
				open={additionOpen && addition !== null}
				title={t(
					addition?.phase === 'review'
						? 'classParticipantAddition.title'
						: addition?.phase === 'saving'
							? 'classParticipantAddition.adding'
							: addition?.failed
								? 'classParticipantAddition.partialTitle'
								: 'classParticipantAddition.successTitle',
					addition?.phase === 'review'
						? 'Add participant'
						: addition?.phase === 'saving'
							? 'Adding participant…'
							: addition?.failed
								? 'Some additions need retry'
								: 'Participant added'
				)}
				subtitle={addition?.label}
				dismissible={!busy}
				onClose={() => setAdditionOpen(false)}
				footer={
					<>
						{editContactAction}
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => setAdditionOpen(false)}
						>
							{t(
								addition?.phase === 'review' && addition.changes.length
									? 'tilesharedemo.detail.edit.cancel'
									: 'tileShareComposer.close',
								addition?.phase === 'review' && addition.changes.length
									? 'Cancel'
									: 'Close'
							)}
						</Button>
						{addition?.phase === 'review' && addition.changes.length > 0 && (
							<Button
								variant="brand"
								disabled={busy}
								onClick={() => void run(addition.changes, true)}
							>
								{t('classParticipantAddition.confirm', 'Add participant')}
							</Button>
						)}
						{addition?.phase === 'result' && addition.failed > 0 && (
							<Button
								variant="brand"
								disabled={busy}
								onClick={() => void run(remaining, true)}
							>
								{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
							</Button>
						)}
					</>
				}
			>
				{addition?.phase === 'review' ? (
					<>
						<p role="status">
							{addition.changes.length
								? t(
										'classParticipantAddition.review',
										'Add {{recipient}} to existing tilettes? Total: {{count}}.',
										{
											recipient: addition.label,
											count: addition.changes.length,
										}
									)
								: t(
										'classParticipantAddition.alreadyAssigned',
										'{{recipient}} is already assigned to all existing tilettes. No changes are needed.',
										{ recipient: addition.label }
									)}
						</p>
						{addition.skipped > 0 && addition.changes.length > 0 && (
							<p>
								{t(
									'classParticipantAddition.skipped',
									'Already assigned; tilettes skipped: {{count}}.',
									{ count: addition.skipped }
								)}
							</p>
						)}
					</>
				) : (
					additionFeedback
				)}
			</TileShareDialog>
		</Actions>
	);
}
const Actions = styled.section`
	display: grid;
	gap: 12px;
	> ul {
		padding-left: 20px;
	}
`;
const Bulk = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
`;
const AdditionFeedback = styled.div<{ $failed: boolean }>`
	display: grid;
	grid-template-columns: 22px minmax(0, 1fr);
	gap: 8px 12px;
	padding: 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	> svg {
		color: ${({ theme, $failed }) =>
			$failed ? theme.colors.text.warning : theme.colors.text.success};
	}
	p {
		margin: 0;
		overflow-wrap: anywhere;
	}
	> p,
	> progress,
	> button {
		grid-column: 2;
	}
	progress {
		width: 100%;
		accent-color: ${({ theme }) => theme.colors.button.brand.bg};
	}
`;
