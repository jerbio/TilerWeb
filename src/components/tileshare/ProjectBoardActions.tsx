import { ProjectBoardActionContext } from './ProjectBoardActionContext';
import { ReactNode, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { TileshareApi } from '@/api/tileshareApi';
import { tileshareService } from '@/services';
import { toContact } from '@/services/tileshareService';
import {
	ContactModel,
	InvitationStatus,
	TileletteStatus as Stage,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import { useAuth } from '@/core/auth/useAuth';
import { classParticipants, contactKeys } from '@/core/util/tileshareMode';
import { matchesParticipant } from '@/core/util/classShareParticipants';
import { isValidRecipient } from '@/core/util/contact';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';
import {
	canAcceptByDrag,
	deriveMyTileletteStatus,
	deriveTileletteStatus,
} from '@/core/util/tileshareProgress';
import Button from '@/core/common/components/button';
import TileShareDialog from './TileShareDialog';
import { contactLabel } from './TileShareFilters';
import { useInvitationStore } from './TileShareMutations';
import { useParticipantRemoval } from './useParticipantRemoval';
import { TileShareViewerContext } from './TiletteRsvpStatus';
import { TiletteInvitationRefreshContext } from './TiletteInvitationActions';

type AssignmentFlow = {
	taskId: string;
	name: string;
	selected: ContactModel[];
	remaining: ContactModel[];
	phase: 'select' | 'review' | 'saving' | 'result';
	saved: number;
	processed: number;
	total: number;
	refreshFailed: boolean;
	changed: boolean;
};
type Acceptance = {
	taskId: string;
	assignmentId: string;
	name: string;
	phase: 'saving' | 'accepted' | 'uncertain' | 'checking';
	refreshFailed: boolean;
};
const api = new TileshareApi();
const assignmentIds = (task: TileShareTemplate) =>
	JSON.stringify(
		validDesignatedUsers(task.designatedUsers)
			.map((a) => a.designatedTileTemplateId)
			.sort()
	);

/** Remains above layout/filter replacement so a pending board action cannot lose its result. */
export function ProjectBoardActionsProvider({
	tilettes,
	scope,
	children,
}: {
	tilettes: TileShareTemplate[];
	scope: 'all' | 'mine';
	children: ReactNode;
}) {
	const { t } = useTranslation();
	const { user } = useAuth();
	const viewer = useContext(TileShareViewerContext);
	const refresh = useContext(TiletteInvitationRefreshContext) ?? (async () => undefined);
	const removal = useParticipantRemoval(refresh);
	const mutations = useInvitationStore();
	const [assignment, setAssignment] = useState<AssignmentFlow | null>(null);
	const [assignmentOpen, setAssignmentOpen] = useState(false);
	const [acceptance, setAcceptance] = useState<Acceptance | null>(null);
	const acceptedState = useSyncExternalStore(mutations.subscribe, () =>
		acceptance ? mutations.get(acceptance.assignmentId) : undefined
	);
	useEffect(() => {
		if (
			acceptance?.phase === 'uncertain' &&
			(acceptedState === 'accepted' || acceptedState === 'declined')
		)
			setAcceptance((previous) => previous && { ...previous, phase: 'accepted' });
	}, [acceptance?.phase, acceptedState]);
	const [busy, setBusy] = useState(false);
	const [query, setQuery] = useState('');
	const [contact, setContact] = useState('');
	const pending = useRef(false);
	const generation = useRef(0);
	const feedback = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLElement | null>(null);
	const current = useRef({ tilettes, scope, owner: viewer.isOwner, viewerId: user?.id });
	current.current = { tilettes, scope, owner: viewer.isOwner, viewerId: user?.id };
	useEffect(() => {
		const lifecycle = generation;
		return () => {
			lifecycle.current++;
		};
	}, []);
	const blocked =
		busy ||
		removal.blocked ||
		!!(assignment?.phase === 'result' && assignment.remaining.length) ||
		acceptance?.phase === 'uncertain';
	const people = classParticipants(tilettes);
	const stageOf = (task: TileShareTemplate) =>
		scope === 'mine' && user?.id
			? deriveMyTileletteStatus(task, user.id)
			: deriveTileletteStatus(task);
	const canDrop = (task: TileShareTemplate, target: Stage) => {
		if (blocked || !user?.id || !task.id || !tilettes.some((item) => item.id === task.id))
			return false;
		const source = stageOf(task);
		if (source === target) return false;
		if (target === Stage.Delegated)
			return viewer.isOwner && scope === 'all' && source === Stage.Unassigned;
		if (target === Stage.Unassigned)
			return viewer.isOwner && scope === 'all' && source !== Stage.Unassigned;
		if (target === Stage.InProgress) {
			const id = validDesignatedUsers(task.designatedUsers).find(
				(a) => a.userId === user.id
			)?.designatedTileTemplateId;
			return (
				source === Stage.Delegated &&
				canAcceptByDrag(task, user.id) &&
				!['accepted', 'declined', 'saving', 'checking', 'uncertain'].includes(
					id ? (mutations.get(id) ?? '') : ''
				)
			);
		}
		return false;
	};
	const focusAfterWrite = () => {
		if (
			trigger.current &&
			!trigger.current.isConnected &&
			document.activeElement === document.body
		)
			feedback.current?.focus({ preventScroll: true });
	};
	const refreshOnly = async (kind: 'assignment' | 'acceptance') => {
		if (pending.current) return;
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		let failed = false;
		try {
			await refresh();
		} catch {
			failed = true;
		}
		pending.current = false;
		if (version !== generation.current) return;
		if (kind === 'assignment')
			setAssignment((previous) => previous && { ...previous, refreshFailed: failed });
		else setAcceptance((previous) => previous && { ...previous, refreshFailed: failed });
		setBusy(false);
	};
	const accept = async (task: TileShareTemplate) => {
		const assignment = validDesignatedUsers(task.designatedUsers).find(
			(a) => a.userId === user?.id
		);
		const id = assignment?.designatedTileTemplateId;
		if (
			pending.current ||
			!id ||
			!canDrop(task, Stage.InProgress) ||
			['accepted', 'declined'].includes(mutations.get(id) ?? '') ||
			!mutations.start(id, 'saving')
		)
			return;
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		setAcceptance({
			taskId: task.id!,
			assignmentId: id,
			name: task.name ?? '',
			phase: 'saving',
			refreshFailed: false,
		});
		try {
			await api.respondToInvitation(id, InvitationStatus.Accepted);
			mutations.set(id, 'accepted');
			window.dispatchEvent(new Event('tileshare-changed'));
			if (version !== generation.current) return;
			let refreshFailed = false;
			try {
				await refresh();
			} catch {
				refreshFailed = true;
			}
			if (version === generation.current)
				setAcceptance(
					(previous) => previous && { ...previous, phase: 'accepted', refreshFailed }
				);
		} catch {
			mutations.set(id, 'uncertain');
			if (version === generation.current)
				setAcceptance((previous) => previous && { ...previous, phase: 'uncertain' });
		} finally {
			pending.current = false;
			if (version === generation.current) {
				setBusy(false);
				focusAfterWrite();
			}
		}
	};
	const checkAcceptance = async () => {
		if (pending.current || !acceptance || !mutations.start(acceptance.assignmentId, 'checking'))
			return;
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		setAcceptance((previous) => previous && { ...previous, phase: 'checking' });
		try {
			const result = await api.getAssignmentResponse(acceptance.assignmentId);
			if (version !== generation.current) return;
			if (
				result.id !== acceptance.assignmentId ||
				result.tiletteId !== acceptance.taskId ||
				!current.current.tilettes.some(
					(task) => task.id === result.tiletteId && task.clusterId === result.clusterId
				)
			)
				throw new Error('Assignment mismatch');
			if (
				result.invitationStatus !== InvitationStatus.Accepted &&
				result.invitationStatus !== InvitationStatus.Declined
			)
				throw new Error('Response remains uncertain');
			mutations.set(acceptance.assignmentId, result.invitationStatus);
			window.dispatchEvent(new Event('tileshare-changed'));
			let refreshFailed = false;
			try {
				await refresh();
			} catch {
				refreshFailed = true;
			}
			if (version === generation.current)
				setAcceptance(
					(previous) => previous && { ...previous, phase: 'accepted', refreshFailed }
				);
		} catch {
			mutations.set(acceptance.assignmentId, 'uncertain');
			if (version === generation.current)
				setAcceptance((previous) => previous && { ...previous, phase: 'uncertain' });
		} finally {
			pending.current = false;
			if (version === generation.current) setBusy(false);
		}
	};
	const runAssignment = async () => {
		if (
			pending.current ||
			!assignment ||
			!current.current.owner ||
			current.current.scope !== 'all'
		)
			return;
		const task = current.current.tilettes.find((task) => task.id === assignment.taskId);
		if (
			!task ||
			(assignment.phase === 'review' && validDesignatedUsers(task.designatedUsers).length)
		) {
			setAssignment((previous) => previous && { ...previous, changed: true });
			return;
		}
		const contacts = assignment.phase === 'review' ? assignment.selected : assignment.remaining;
		if (!contacts.length) return;
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		setAssignment(
			(previous) =>
				previous && { ...previous, phase: 'saving', total: contacts.length, processed: 0 }
		);
		const remaining: ContactModel[] = [];
		let saved = assignment.saved;
		for (const person of contacts) {
			if (version !== generation.current) break;
			const latest = current.current.tilettes.find((task) => task.id === assignment.taskId);
			const lock = `assignment:${assignment.taskId}:${contactKeys(person).join('|')}`;
			const acquired = mutations.acquire(lock);
			try {
				if (!acquired || !latest || !current.current.owner)
					throw new Error('Assignment unavailable');
				if (
					!validDesignatedUsers(latest.designatedUsers).some((a) =>
						matchesParticipant(person, a)
					)
				) {
					await tileshareService.addTiletteRecipient(assignment.taskId, person);
					window.dispatchEvent(new Event('tileshare-changed'));
				}
				saved++;
			} catch {
				remaining.push(person);
			} finally {
				if (acquired) mutations.release(lock);
			}
			const count = saved;
			if (version === generation.current)
				setAssignment(
					(previous) =>
						previous && { ...previous, processed: previous.processed + 1, saved: count }
				);
		}
		if (version !== generation.current) return;
		let refreshFailed = assignment.refreshFailed;
		if (saved > assignment.saved) {
			try {
				await refresh();
				refreshFailed = false;
			} catch {
				refreshFailed = true;
			}
		}
		pending.current = false;
		if (version === generation.current) {
			setAssignment(
				(previous) =>
					previous && { ...previous, phase: 'result', remaining, saved, refreshFailed }
			);
			setBusy(false);
		}
	};
	const choose = (visibleTask: TileShareTemplate, target: Stage) => {
		const task = current.current.tilettes.find((task) => task.id === visibleTask.id);
		if (!task || !canDrop(task, target)) return;
		const reviewedIds = assignmentIds(task);
		trigger.current = document.activeElement as HTMLElement | null;
		if (target === Stage.Unassigned)
			removal.review({
				recipient: t('tileShareBoard.allParticipants', 'All participants on {{name}}', {
					name: task.name ?? '',
				}),
				assignments: validDesignatedUsers(task.designatedUsers).map((a) => ({
					tiletteId: task.id!,
					assignmentId: a.designatedTileTemplateId,
				})),
				returnFocusTo: trigger.current,
				fallbackFocusTo: feedback.current,
				all: true,
				validate: (initial) => {
					if (!current.current.owner || current.current.viewerId !== user?.id)
						return false;
					if (!initial) return true;
					const latest = current.current.tilettes.find((item) => item.id === task.id);
					return (
						current.current.scope === 'all' &&
						!!latest &&
						assignmentIds(latest) === reviewedIds
					);
				},
			});
		else if (target === Stage.Delegated) {
			setQuery('');
			setContact('');
			setAssignment({
				taskId: task.id!,
				name: task.name ?? '',
				selected: [],
				remaining: [],
				phase: 'select',
				saved: 0,
				processed: 0,
				total: 0,
				refreshFailed: false,
				changed: false,
			});
			setAssignmentOpen(true);
		} else if (target === Stage.InProgress) void accept(task);
	};
	const selectPerson = (person: ContactModel) =>
		setAssignment((previous) => {
			if (!previous) return previous;
			const keys = contactKeys(person);
			const selected = previous.selected.some((p) =>
				contactKeys(p).some((key) => keys.includes(key))
			);
			return {
				...previous,
				selected: selected
					? previous.selected.filter(
							(p) => !contactKeys(p).some((key) => keys.includes(key))
						)
					: [...previous.selected, person],
			};
		});
	const assignmentResult = assignment &&
		assignment.phase !== 'select' &&
		assignment.phase !== 'review' && (
			<Notice
				role={
					assignment.remaining.length && assignment.phase === 'result'
						? 'alert'
						: 'status'
				}
				aria-atomic="true"
			>
				<p>
					{assignment.phase === 'saving'
						? t(
								'tileShareBoard.assignProgress',
								'Assigning {{name}}. Participants processed: {{processed}}/{{total}}.',
								{
									name: assignment.name,
									processed: assignment.processed,
									total: assignment.total,
								}
							)
						: t(
								'tileShareBoard.assignResult',
								'{{name}} — assignments saved: {{saved}}; assignments to retry: {{failed}}.',
								{
									name: assignment.name,
									saved: assignment.saved,
									failed: assignment.remaining.length,
								}
							)}
				</p>
				{assignment.phase === 'saving' && (
					<progress
						value={assignment.processed}
						max={assignment.total}
						aria-label={t('tileShareBoard.assignProgressLabel', 'Assignment progress')}
					/>
				)}
				{assignment.refreshFailed && (
					<>
						<p role="alert">
							{t(
								'participantRemoval.savedRefreshFailed',
								'Saved, but couldn’t refresh'
							)}
						</p>
						<Button disabled={busy} onClick={() => void refreshOnly('assignment')}>
							{t('shareExperience.refresh', 'Refresh')}
						</Button>
					</>
				)}
				{assignment.phase === 'result' && assignment.remaining.length > 0 && (
					<Button
						disabled={busy}
						onClick={() => {
							setAssignmentOpen(true);
							void runAssignment();
						}}
					>
						{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
					</Button>
				)}
			</Notice>
		);
	const editSelection =
		assignment?.phase === 'result' &&
		assignment.saved === 0 &&
		assignment.remaining.length > 0 ? (
			<Button
				variant="ghost"
				disabled={busy}
				onClick={() => {
					setAssignment(
						(previous) =>
							previous && {
								...previous,
								phase: 'select',
								remaining: [],
								changed: false,
							}
					);
					setAssignmentOpen(true);
				}}
			>
				{t('tileShareBoard.editSelection', 'Edit selection')}
			</Button>
		) : null;
	return (
		<ProjectBoardActionContext.Provider value={{ canDrop, choose, busy: blocked }}>
			<div
				ref={feedback}
				tabIndex={-1}
				aria-label={t('tileShareBoard.updates', 'TileShare updates')}
			>
				{removal.feedback}
				{!assignmentOpen && (
					<>
						{assignmentResult}
						{editSelection}
					</>
				)}
				{acceptance && (
					<Notice
						role={acceptance.phase === 'uncertain' ? 'alert' : 'status'}
						aria-atomic="true"
					>
						<p>
							{acceptance.phase === 'saving' || acceptance.phase === 'checking'
								? t(
										'tileShareBoard.accepting',
										'Updating your invitation for {{name}}…',
										{ name: acceptance.name }
									)
								: acceptance.phase === 'uncertain'
									? t(
											'tileShareBoard.uncertain',
											'Your response for {{name}} could not be confirmed. Check the response before trying again.',
											{ name: acceptance.name }
										)
									: t(
											'tileShareBoard.accepted',
											'Your response for {{name}} is saved.',
											{ name: acceptance.name }
										)}
						</p>
						{acceptance.phase === 'uncertain' && (
							<Button disabled={busy} onClick={() => void checkAcceptance()}>
								{t('tileShareBoard.checkResponse', 'Check response')}
							</Button>
						)}
						{acceptance.refreshFailed && (
							<>
								<p role="alert">
									{t(
										'participantRemoval.savedRefreshFailed',
										'Saved, but couldn’t refresh'
									)}
								</p>
								<Button
									disabled={busy}
									onClick={() => void refreshOnly('acceptance')}
								>
									{t('shareExperience.refresh', 'Refresh')}
								</Button>
							</>
						)}
					</Notice>
				)}
			</div>
			{children}
			{removal.dialog}
			<TileShareDialog
				open={assignmentOpen && assignment !== null}
				title={t('tileShareBoard.assign', 'Assign participants')}
				subtitle={assignment?.name}
				dismissible={!busy}
				onClose={() => setAssignmentOpen(false)}
				returnFocusTo={trigger.current}
				fallbackFocusTo={feedback.current}
				footer={
					<>
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => setAssignmentOpen(false)}
						>
							{assignment?.phase === 'select' || assignment?.phase === 'review'
								? t('tilesharedemo.detail.edit.cancel', 'Cancel')
								: t('tileShareComposer.close', 'Close')}
						</Button>
						{assignment?.phase === 'select' && (
							<Button
								disabled={busy || !assignment.selected.length}
								onClick={() =>
									setAssignment(
										(previous) => previous && { ...previous, phase: 'review' }
									)
								}
							>
								{t('tileShareBoard.review', 'Review assignments')}
							</Button>
						)}
						{editSelection}
						{assignment?.phase === 'review' && (
							<>
								<Button
									variant="ghost"
									disabled={busy}
									onClick={() =>
										setAssignment(
											(previous) =>
												previous && {
													...previous,
													phase: 'select',
													changed: false,
												}
										)
									}
								>
									{t('tileShareBoard.editSelection', 'Edit selection')}
								</Button>
								<Button
									variant="brand"
									disabled={
										busy ||
										assignment.changed ||
										!viewer.isOwner ||
										scope !== 'all'
									}
									onClick={() => void runAssignment()}
								>
									{t('tileShareBoard.confirmAssign', 'Confirm assignments')}
								</Button>
							</>
						)}
					</>
				}
			>
				{assignment?.phase === 'select' ? (
					<Picker>
						<label>
							{t('tileShareFilters.findPeople', 'Find people')}
							<input
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</label>
						<fieldset>
							<legend>{t('shareExperience.people', 'People')}</legend>
							{classParticipants([], [...people, ...assignment.selected])
								.filter((person) =>
									contactLabel(person)
										.toLocaleLowerCase()
										.includes(query.trim().toLocaleLowerCase())
								)
								.map((person) => {
									const reachable = !!(person.Email || person.PhoneNumber);
									const selected = assignment.selected.some((p) =>
										contactKeys(p).some((key) =>
											contactKeys(person).includes(key)
										)
									);
									return (
										<label key={contactKeys(person)[0]}>
											<input
												type="checkbox"
												disabled={!reachable}
												checked={selected}
												onChange={() => selectPerson(person)}
											/>
											{contactLabel(person)}
											{!reachable && (
												<small>
													{t(
														'tileShareBoard.noContact',
														'Contact details unavailable'
													)}
												</small>
											)}
										</label>
									);
								})}
						</fieldset>
						<label>
							{t('tileShareModes.participantContact', 'Participant email or phone')}
							<input value={contact} onChange={(e) => setContact(e.target.value)} />
						</label>
						<Button
							disabled={!isValidRecipient(contact)}
							onClick={() => {
								const person = toContact(contact, user?.countryCode || '1');
								if (
									!assignment.selected.some((p) =>
										contactKeys(p).some((key) =>
											contactKeys(person).includes(key)
										)
									)
								)
									selectPerson(person);
								setContact('');
							}}
						>
							{t('tileShareBoard.addSelection', 'Add to selection')}
						</Button>
					</Picker>
				) : assignment?.phase === 'review' ? (
					<>
						<p>
							{t(
								'tileShareBoard.assignReview',
								'Assign {{name}} to the selected participants? Total: {{count}}.',
								{ name: assignment.name, count: assignment.selected.length }
							)}
						</p>
						<ul>
							{assignment.selected.map((person) => (
								<li key={contactKeys(person)[0]}>{contactLabel(person)}</li>
							))}
						</ul>
						{assignment.changed && (
							<p role="alert">
								{t(
									'tileShareBoard.changed',
									'This tilette has changed. Close this dialog and review its current assignments.'
								)}
							</p>
						)}
					</>
				) : (
					assignmentResult
				)}
			</TileShareDialog>
		</ProjectBoardActionContext.Provider>
	);
}

const Notice = styled.div`
	padding: 12px 16px;
	margin-bottom: 12px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	p {
		margin: 0 0 8px;
		overflow-wrap: anywhere;
	}
	progress {
		width: 100%;
		accent-color: ${({ theme }) => theme.colors.button.brand.bg};
	}
`;
const Picker = styled.div`
	display: grid;
	gap: 14px;
	min-width: 0;
	label {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	input:not([type='checkbox']) {
		box-sizing: border-box;
		width: 100%;
		padding: 10px;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 8px;
		background: ${({ theme }) => theme.colors.background.page};
		color: ${({ theme }) => theme.colors.text.primary};
	}
	fieldset {
		display: grid;
		gap: 12px;
		max-height: 240px;
		overflow: auto;
		min-width: 0;
		border: 1px solid ${({ theme }) => theme.colors.border.default};
		border-radius: 8px;
	}
	small {
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
