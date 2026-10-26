import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth/useAuth';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import { ContactModel, InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { classParticipants, contactKeys } from '@/core/util/tileshareMode';
import { isValidRecipient } from '@/core/util/contact';
import { toContact } from '@/services/tileshareService';
import { tileshareService } from '@/services';
import { TileshareApi } from '@/api/tileshareApi';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';

type Change = { key: string; send: () => Promise<unknown> };

/** A retry only repeats failed assignment changes; successful ones stay applied. */
export default function ClassShareActions({
	tilettes,
	participants,
	isOwner,
	onChanged,
}: {
	tilettes: TileShareTemplate[];
	participants?: ContactModel[];
	isOwner: boolean;
	onChanged: () => Promise<void>;
}) {
	const { t } = useTranslation();
	const { user } = useAuth();
	const [contact, setContact] = useState('');
	const [busy, setBusy] = useState(false);
	const [remaining, setRemaining] = useState<Change[]>([]);
	const [notice, setNotice] = useState('');
	const inFlight = useRef(false);
	const people = classParticipants(tilettes, participants);
	const pending = tilettes.flatMap((task) =>
		validDesignatedUsers(task.designatedUsers).filter(
			(person) =>
				person.userId === user?.id &&
				person.designatedTileTemplateId &&
				[
					InvitationStatus.None,
					InvitationStatus.Tentative,
					InvitationStatus.Pending,
				].includes(person.rsvpStatus as InvitationStatus)
		)
	);
	const run = async (changes: Change[]) => {
		if (inFlight.current || !changes.length) return;
		inFlight.current = true;
		setBusy(true);
		const failed: Change[] = [];
		for (const change of changes) {
			try {
				await change.send();
			} catch {
				failed.push(change);
			}
		}
		setRemaining(failed);
		setNotice(
			failed.length
				? t(
						'tileShareModes.partialChange',
						'{{saved}} changes saved; {{failed}} need retry.',
						{ saved: changes.length - failed.length, failed: failed.length }
					)
				: t('tileShareModes.changesSaved', 'Changes saved.')
		);
		try {
			window.dispatchEvent(new Event('tileshare-changed'));
			await onChanged();
		} catch {
			setNotice(
				t(
					'tileShareModes.refreshFailed',
					'Changes were sent, but the share could not refresh. Reload to check the saved assignments.'
				)
			);
		} finally {
			inFlight.current = false;
			setBusy(false);
		}
	};
	const matches = (person: ContactModel, assigned: TileShareTemplate['designatedUsers']) =>
		validDesignatedUsers(assigned).filter((assignment) =>
			contactKeys(person).some((key) =>
				contactKeys({
					Id: assignment.userId ?? undefined,
					Email:
						assignment.userProfile?.email ??
						(assignment.displayedIdentifier?.includes('@')
							? assignment.displayedIdentifier
							: undefined),
					PhoneNumber:
						assignment.userProfile?.phoneNumber ??
						(!assignment.displayedIdentifier?.includes('@')
							? (assignment.displayedIdentifier ?? undefined)
							: undefined),
				}).includes(key)
			)
		);
	const add = () => {
		if (!isValidRecipient(contact)) return;
		const person = toContact(contact, user?.countryCode || '1');
		void run(
			tilettes
				.filter((task) => task.id && !matches(person, task.designatedUsers).length)
				.map((task) => ({
					key: task.id!,
					send: () => tileshareService.addTiletteRecipient(task.id!, person),
				}))
		);
	};
	const answer = (status: InvitationStatus.Accepted | InvitationStatus.Declined) => {
		const api = new TileshareApi();
		void run(
			pending.map((person) => ({
				key: person.designatedTileTemplateId!,
				send: () => api.respondToInvitation(person.designatedTileTemplateId!, status),
			}))
		);
	};
	const alreadyParticipating =
		!!user?.email &&
		people.some((c) =>
			contactKeys(c).some(
				(k) =>
					k === `id:${user.id}` ||
					k === `email:${user.email?.toLowerCase()}`
			)
		);
	const participate = () => {
		if (!user?.email) return;
		const me = toContact(user.email, user.countryCode || '1');
		void run(
			tilettes
				.filter((task) => task.id && !matches(me, task.designatedUsers).length)
				.map((task) => ({
					key: task.id!,
					send: () => tileshareService.addTiletteRecipient(task.id!, me),
				}))
		);
	};
	const blocked = busy || remaining.length > 0;
	return (
		<section
			aria-label={t('tileShareModes.classActions', 'Class participants')}
			style={{ display: 'grid', gap: 12 }}
		>
			{isOwner ? (
				<>
					{!alreadyParticipating && !!tilettes.length && (
						<Button variant="primary" disabled={blocked} onClick={participate}>
							{t('tileShareModes.participate', 'Participate')}
						</Button>
					)}
					<h3>{t('tileShareModes.participants', 'Participants')}</h3>
					<Input
						label={t('tileShareModes.participantContact', 'Participant email or phone')}
						value={contact}
						disabled={blocked}
						onChange={(event) => setContact(event.target.value)}
					/>
					<Button
						disabled={blocked || !tilettes.length || !isValidRecipient(contact)}
						onClick={add}
					>
						{t('tileShareModes.addToAll', 'Add to all tilettes')}
					</Button>
					{!tilettes.length && (
						<p>
							{t(
								'tileShareModes.emptyClass',
								'Add a tilette to start assigning work to participants.'
							)}
						</p>
					)}
					<ul>
						{people.map((person, index) => (
							<li key={person.Id ?? person.Email ?? person.PhoneNumber ?? index}>
								{person.Email ?? person.PhoneNumber ?? person.Id}{' '}
								<Button
									disabled={blocked}
									onClick={() => {
										if (
											!window.confirm(
												t(
													'tileShareModes.removeFromClassConfirm',
													'Remove this participant from every tilette in the Class?'
												)
											)
										)
											return;
										void run(
											tilettes.flatMap((task) =>
												matches(person, task.designatedUsers)
													.filter(
														(assignment) =>
															assignment.designatedTileTemplateId &&
															task.id
													)
													.map((assignment) => ({
														key: assignment.designatedTileTemplateId!,
														send: () =>
															tileshareService.removeTiletteRecipient(
																task.id!,
																assignment.designatedTileTemplateId!
															),
													}))
											)
										);
									}}
								>
									{t('tileShareModes.removeFromAll', 'Remove from all tilettes')}
								</Button>
							</li>
						))}
					</ul>
				</>
			) : (
				pending.length > 0 && (
					<div style={{ display: 'flex', gap: 12 }}>
						<Button
							disabled={blocked}
							onClick={() => answer(InvitationStatus.Accepted)}
						>
							{t('tileShareModes.acceptAll', 'Accept all pending tilettes')}
						</Button>
						<Button
							disabled={blocked}
							onClick={() => answer(InvitationStatus.Declined)}
						>
							{t('tileShareModes.declineAll', 'Decline all pending tilettes')}
						</Button>
					</div>
				)
			)}
			{notice && <p role="status">{notice}</p>}
			{remaining.length > 0 && (
				<Button disabled={busy} onClick={() => void run(remaining)}>
					{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
				</Button>
			)}
		</section>
	);
}
