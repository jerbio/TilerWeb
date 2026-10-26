import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Users, Trash2, UserPlus, UserCheck } from 'lucide-react';
import Modal from '../TileShareModal';
import Button from '@/core/common/components/button';
import { DesignatedUser, TileShareTemplate, TileshareMode } from '@/core/common/types/tileshare';
import { classifyContact, isValidRecipient, normalizePhoneNumber } from '@/core/util/contact';
import { tileshareService } from '@/services';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';
import { useAuth } from '@/core/auth/useAuth';

type Props = {
	mode?: TileshareMode | null;
	tilette: TileShareTemplate;
	isOwner: boolean;
	onChanged: () => Promise<void>;
	onDeleted: () => void | Promise<void>;
};

export default function TiletteManagement({ tilette, isOwner, onChanged, onDeleted, mode }: Props) {
	const participants = validDesignatedUsers(tilette.designatedUsers);
	const { t } = useTranslation();
	const { user } = useAuth();
	const alreadyAssigned =
		!!user &&
		participants.some(
			(u) => u.userId === user.id || u.userProfile?.email === user.email
		);
	const [view, setView] = useState<'people' | 'remove' | 'delete' | null>(null);
	const [recipient, setRecipient] = useState<DesignatedUser | null>(null);
	const [contact, setContact] = useState('');
	const [busy, setBusy] = useState(false);
	const pending = useRef(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const nameOf = (person: DesignatedUser) =>
		person.userProfile?.fullName ||
		person.displayedIdentifier ||
		person.userProfile?.email ||
		t('tileshareManagement.recipient', 'Recipient');
	const open = (next: typeof view) => {
		setError('');
		setNotice('');
		setView(next);
	};
	const run = async (action: () => Promise<unknown>, success: () => void | Promise<void>) => {
		if (pending.current || !isOwner || !tilette.id) return;
		pending.current = true;
		setBusy(true);
		setError('');
		setNotice('');
		try {
			await action();
			window.dispatchEvent(new Event('tileshare-changed'));
			await success();
		} catch {
			setError(
				t(
					'tileshareManagement.failed',
					'The change could not be completed. Please try again.'
				)
			);
		} finally {
			pending.current = false;
			setBusy(false);
		}
	};
	const refresh = async () => {
		try {
			await onChanged();
		} catch {
			setError(
				t(
					'tileshareManagement.refreshFailed',
					'The change was saved, but the list could not refresh. Reload this page.'
				)
			);
		}
	};
	const validContact =
		isValidRecipient(contact) &&
		(classifyContact(contact) !== 'phone' || contact.trim().startsWith('+'));
	if (!isOwner || !tilette.id) return null;
	const title =
		view === 'delete'
			? t('tileshareManagement.delete', 'Delete tilette')
			: view === 'remove'
				? t('tileshareManagement.remove', 'Remove recipient')
				: t('tileshareManagement.peopleTitle', 'People on {{name}}', {
						name: tilette.name,
					});
	return (
		<>
			<Toolbar aria-label={t('tileshareManagement.actions', 'Manage tilette')}>
				{mode !== TileshareMode.Class && (
					<Button variant="ghost" onClick={() => open('people')}>
						<Users size={16} /> {t('tileshareManagement.people', 'Manage people')}
					</Button>
				)}
				{mode === TileshareMode.Project && !alreadyAssigned && user?.email && (
					<Button
						variant="primary"
						disabled={busy}
						onClick={() =>
							void run(
								() =>
									tileshareService.addTiletteRecipient(tilette.id!, {
										Email: user.email!,
									}),
								async () => {
									setNotice(t('tileshareManagement.assignedToMe', 'Assigned to you.'));
									await refresh();
								}
							)
						}
					>
						<UserCheck size={16} />{' '}
						{t('tileshareManagement.assignToMe', 'Assign To Me')}
					</Button>
				)}
				<DangerButton $quiet onClick={() => open('delete')}>
					<Trash2 size={16} /> {t('tileshareManagement.delete', 'Delete tilette')}
				</DangerButton>
			</Toolbar>
			<Modal
				show={view !== null}
				setShow={busy ? undefined : () => setView(null)}
				headerText={title}
			>
				<Body>
					{error && <ErrorText role="alert">{error}</ErrorText>}
					{notice && <p role="status">{notice}</p>}
					{view === 'people' ? (
						<>
							<form
								onSubmit={(event) => {
									event.preventDefault();
									if (!validContact) return;
									const value = contact.trim();
									const target =
										classifyContact(value) === 'phone'
											? { PhoneNumber: normalizePhoneNumber(value, '') }
											: { Email: value };
									void run(
										() =>
											tileshareService.addTiletteRecipient(
												tilette.id!,
												target
											),
										async () => {
											setContact('');
											setNotice(
												t('tileshareManagement.added', 'Recipient added.')
											);
											await refresh();
										}
									);
								}}
							>
								<label htmlFor="tilette-recipient">
									{t(
										'tileshareManagement.contact',
										'Email or international phone number (+country code)'
									)}
								</label>
								<AddRow>
									<Input
										id="tilette-recipient"
										value={contact}
										onChange={(e) => setContact(e.target.value)}
										disabled={busy}
										autoComplete="off"
									/>
									<Button
										type="submit"
										variant="brand"
										disabled={busy || !validContact}
									>
										<UserPlus size={16} />{' '}
										{t('tileshareManagement.add', 'Add recipient')}
									</Button>
								</AddRow>
							</form>
							<List aria-label={t('tileshareManagement.recipients', 'Recipients')}>
								{participants.map((person) => (
									<li
										key={
											person.designatedTileTemplateId ??
											person.displayedIdentifier
										}
									>
										<div>
											<strong>{nameOf(person)}</strong>
											{person.displayedIdentifier &&
												person.displayedIdentifier !== nameOf(person) && (
													<small>{person.displayedIdentifier}</small>
												)}
										</div>
										<DangerButton
											disabled={busy || !person.designatedTileTemplateId}
											aria-label={t(
												'tileshareManagement.removePerson',
												'Remove {{name}}',
												{ name: nameOf(person) }
											)}
											onClick={() => {
												setRecipient(person);
												open('remove');
											}}
										>
											<Trash2 size={16} />{' '}
											{t('tileshareManagement.removeShort', 'Remove')}
										</DangerButton>
									</li>
								))}
							</List>
							{!participants.length && (
								<p>{t('tileshareManagement.empty', 'No recipients yet.')}</p>
							)}
						</>
					) : (
						<>
							<p>
								{view === 'delete'
									? t(
											'tileshareManagement.deletePrompt',
											'Delete "{{name}}" for all recipients? Its linked calendar work will be disabled. The project will remain.',
											{ name: tilette.name }
										)
									: t(
											'tileshareManagement.removePrompt',
											'Remove {{name}} from this tilette? Their linked calendar work will be disabled. Other tilettes will remain unchanged.',
											{ name: recipient ? nameOf(recipient) : '' }
										)}
							</p>
							<Toolbar>
								<Button
									variant="ghost"
									disabled={busy}
									onClick={() => open(view === 'remove' ? 'people' : null)}
								>
									{t('tileshareManagement.cancel', 'Cancel')}
								</Button>
								<DangerButton
									disabled={busy}
									onClick={() => {
										if (view === 'delete')
											void run(
												() => tileshareService.deleteTilette(tilette.id!),
												async () => {
													setView(null);
													await onDeleted();
												}
											);
										else if (recipient?.designatedTileTemplateId)
											void run(
												() =>
													tileshareService.removeTiletteRecipient(
														tilette.id!,
														recipient.designatedTileTemplateId!
													),
												async () => {
													setView('people');
													setNotice(
														t(
															'tileshareManagement.removed',
															'Recipient removed.'
														)
													);
													await refresh();
												}
											);
									}}
								>
									{busy
										? t('tileshareManagement.saving', 'Saving...')
										: view === 'delete'
											? t('tileshareManagement.delete', 'Delete tilette')
											: t('tileshareManagement.remove', 'Remove recipient')}
								</DangerButton>
							</Toolbar>
						</>
					)}
				</Body>
			</Modal>
		</>
	);
}

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	min-width: 0;
`;
const Body = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16px;
	color: ${({ theme }) => theme.colors.text.primary};
	overflow-wrap: anywhere;
`;
const AddRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 8px;
`;
const Input = styled.input`
	flex: 1;
	min-width: 180px;
	padding: 10px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.page};
	color: ${({ theme }) => theme.colors.text.primary};
`;
const List = styled.ul`
	padding: 0;
	margin: 0;
	list-style: none;
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	}
	small {
		display: block;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
const DangerButton = styled.button<{ $quiet?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	color: ${({ theme, $quiet }) =>
		$quiet ? theme.colors.text.secondary : theme.colors.text.error};
	background: transparent;
	cursor: pointer;
	${({ $quiet }) =>
		$quiet && 'margin-left: auto; border-color: transparent; font-size: 13px; padding: 8px;'}
	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.colors.button.ghost.bgHover};
	}
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`;
const ErrorText = styled.p`
	color: ${({ theme }) => theme.colors.text.error};
`;
