import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { AlertTriangle, CheckCircle2, UserMinus } from 'lucide-react';
import Button from '@/core/common/components/button';
import { tileshareService } from '@/services';
import TileShareDialog from './TileShareDialog';
import { useInvitationStore } from './TileShareMutations';

type Assignment = { tiletteId: string; assignmentId?: string | null };
type RemovalRequest = {
	recipient: string;
	assignments: Assignment[];
	/** Single-tilette removals retain their more specific impact warning. */
	single?: boolean;
	returnFocusTo?: HTMLElement | null;
	fallbackFocusTo?: HTMLElement | null;
	all?: boolean;
	validate?: (initial: boolean) => boolean;
};
type Removal = RemovalRequest & {
	remaining: Assignment[];
	phase: 'review' | 'saving' | 'result';
	saved: number;
	processed: number;
	total: number;
	refreshFailed: boolean;
	changed?: boolean;
};

/** Shared by Class management and individual tilettes; retries retain only unfinished writes. */
export function useParticipantRemoval(onChanged: () => Promise<void>) {
	const { t } = useTranslation();
	const mutations = useInvitationStore();
	const [removal, setRemoval] = useState<Removal | null>(null);
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const pending = useRef(false);
	const generation = useRef(0);
	const removed = useRef(new Set<string>());
	useEffect(() => {
		const lifecycle = generation;
		return () => {
			lifecycle.current++;
		};
	}, []);
	const blocked = busy || !!(removal?.phase === 'result' && removal.remaining.length);
	const review = (request: RemovalRequest) => {
		if (pending.current || blocked) return;
		const assignments = [
			...new Map(
				request.assignments
					.filter((a) => !a.assignmentId || !removed.current.has(a.assignmentId))
					.map((a, index) => [a.assignmentId ?? `missing-${index}`, a])
			).values(),
		];
		setRemoval({
			...request,
			assignments,
			remaining: assignments,
			phase: 'review',
			saved: 0,
			processed: 0,
			total: assignments.length,
			refreshFailed: false,
		});
		setOpen(true);
	};
	const refresh = async () => {
		if (pending.current) return;
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		try {
			await onChanged();
			if (version !== generation.current) return;
			if (removal?.phase === 'review') {
				setOpen(false);
				setRemoval(null);
			} else setRemoval((previous) => previous && { ...previous, refreshFailed: false });
		} catch {
			if (version === generation.current)
				setRemoval((previous) => previous && { ...previous, refreshFailed: true });
		} finally {
			pending.current = false;
			if (version === generation.current) setBusy(false);
		}
	};
	const run = async () => {
		if (
			pending.current ||
			!removal?.remaining.length ||
			removal.remaining.some((a) => !a.assignmentId)
		)
			return;
		if (removal.validate && !removal.validate(removal.phase === 'review')) {
			setRemoval((previous) => previous && { ...previous, changed: true });
			return;
		}
		pending.current = true;
		setBusy(true);
		const version = generation.current;
		const current = () => version === generation.current;
		setRemoval(
			(previous) =>
				previous && {
					...previous,
					phase: 'saving',
					changed: false,
					processed: 0,
					total: previous.remaining.length,
				}
		);
		const failed: Assignment[] = [];
		let saved = removal.saved;
		for (const assignment of removal.remaining) {
			if (!current()) break;
			const id = assignment.assignmentId!;
			const acquired = mutations.acquire(id);
			try {
				if (!acquired || (removal.validate && !removal.validate(false)))
					throw new Error('Assignment is unavailable for removal');
				await tileshareService.removeTiletteRecipient(assignment.tiletteId, id);
				removed.current.add(id);
				saved++;
				// A completed write still notifies dependent views after navigation or unmount.
				window.dispatchEvent(new Event('tileshare-changed'));
			} catch {
				failed.push(assignment);
			} finally {
				if (acquired) mutations.release(id);
			}
			if (current())
				setRemoval(
					(previous) =>
						previous && { ...previous, processed: previous.processed + 1, saved }
				);
		}
		if (!current()) return;
		setRemoval(
			(previous) => previous && { ...previous, phase: 'result', remaining: failed, saved }
		);
		let refreshFailed = removal.refreshFailed;
		// A failed write is retryable independently of a failed background read.
		if (saved > removal.saved) {
			try {
				await onChanged();
				refreshFailed = false;
			} catch {
				refreshFailed = true;
			}
		}
		pending.current = false;
		if (current()) {
			setRemoval((previous) => previous && { ...previous, refreshFailed });
			setBusy(false);
		}
	};
	const retry = (
		<Button
			variant="brand"
			disabled={busy}
			onClick={() => {
				setOpen(true);
				void run();
			}}
		>
			{t('tileShareModes.retryRemaining', 'Retry remaining changes')}
		</Button>
	);
	const feedback =
		removal && removal.phase !== 'review' ? (
			<Feedback
				$state={
					removal.phase === 'saving'
						? 'saving'
						: removal.remaining.length
							? 'error'
							: 'saved'
				}
				role={removal.phase === 'result' && removal.remaining.length ? 'alert' : 'status'}
				aria-atomic="true"
				aria-busy={busy}
			>
				{removal.phase === 'saving' ? (
					<UserMinus size={20} aria-hidden="true" />
				) : removal.remaining.length ? (
					<AlertTriangle size={20} aria-hidden="true" />
				) : (
					<CheckCircle2 size={20} aria-hidden="true" />
				)}
				<p>
					{removal.phase === 'saving'
						? t(
								'participantRemoval.progress',
								'Removing {{recipient}}. Assignments processed: {{processed}}/{{total}}.',
								{
									recipient: removal.recipient,
									processed: removal.processed,
									total: removal.total,
								}
							)
						: removal.remaining.length
							? removal.saved
								? t(
										'participantRemoval.partial',
										'{{recipient}} — assignments removed: {{saved}}; removals to retry: {{failed}}.',
										{
											recipient: removal.recipient,
											saved: removal.saved,
											failed: removal.remaining.length,
										}
									)
								: t(
										'participantRemoval.failed',
										'Couldn’t remove {{recipient}}. Removals to retry: {{count}}.',
										{
											recipient: removal.recipient,
											count: removal.remaining.length,
										}
									)
							: t(
									'participantRemoval.success',
									'{{recipient}} removed. Assignments removed: {{count}}.',
									{ recipient: removal.recipient, count: removal.saved }
								)}
				</p>
				{removal.phase === 'saving' && (
					<progress
						value={removal.processed}
						max={removal.total}
						aria-label={t(
							'participantRemoval.progressLabel',
							'Participant removal progress'
						)}
					/>
				)}
				{removal.changed && (
					<p role="alert">
						{t(
							'tileShareBoard.changed',
							'This tilette has changed. Close this dialog and review its current assignments.'
						)}
					</p>
				)}
				{removal.refreshFailed && (
					<>
						<p role="alert">
							{t(
								'participantRemoval.savedRefreshFailed',
								'Saved, but couldn’t refresh'
							)}
						</p>
						<Button disabled={busy} onClick={() => void refresh()}>
							{t('shareExperience.refresh', 'Refresh')}
						</Button>
					</>
				)}
			</Feedback>
		) : null;
	const unavailable = removal?.assignments.some((a) => !a.assignmentId);
	return {
		review,
		blocked,
		wasRemoved: (id?: string | null) => !!id && removed.current.has(id),
		feedback: !open && (
			<>
				{feedback}
				{removal?.phase === 'result' && removal.remaining.length > 0 && retry}
			</>
		),
		dialog: (
			<TileShareDialog
				open={open && removal !== null}
				title={
					removal?.phase === 'saving'
						? t('participantRemoval.saving', 'Removing participant…')
						: removal?.phase === 'result'
							? removal.remaining.length
								? t('participantRemoval.incomplete', 'Removal needs attention')
								: t('participantRemoval.done', 'Participant removed')
							: t('participantRemoval.title', 'Remove participant?')
				}
				subtitle={removal?.recipient}
				returnFocusTo={removal?.returnFocusTo}
				fallbackFocusTo={removal?.fallbackFocusTo}
				dismissible={!busy}
				onClose={() => setOpen(false)}
				footer={
					<>
						<Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
							{removal?.phase === 'review' && removal.assignments.length
								? t('tilesharedemo.detail.edit.cancel', 'Cancel')
								: t('tileShareComposer.close', 'Close')}
						</Button>
						{removal?.phase === 'review' &&
							!unavailable &&
							removal.assignments.length > 0 && (
								<Button
									variant="brand"
									disabled={busy || removal.changed}
									onClick={() => void run()}
								>
									{t('participantRemoval.confirm', 'Remove participant')}
								</Button>
							)}
						{removal?.phase === 'review' && unavailable && (
							<Button disabled={busy} onClick={() => void refresh()}>
								{t('shareExperience.refresh', 'Refresh')}
							</Button>
						)}
						{removal?.phase === 'result' && removal.remaining.length > 0 && retry}
					</>
				}
			>
				{removal?.phase === 'review' ? (
					<>
						<p>
							{unavailable
								? t(
										'participantRemoval.unavailable',
										'Some assignment details are unavailable. Refresh the participant list, then try removing this participant again.'
									)
								: !removal.assignments.length
									? t(
											'participantRemoval.empty',
											'{{recipient}} has no assignments to remove from the existing tilettes.',
											{ recipient: removal.recipient }
										)
									: removal.all
										? t(
												'tileShareBoard.removeAllReview',
												'Remove all {{count}} assignments on this tilette? Linked calendar work for every participant will be disabled. Other tilettes will remain unchanged.',
												{ count: removal.assignments.length }
											)
										: removal.single
											? t(
													'tileshareManagement.removePrompt',
													'Remove {{name}} from this tilette? Their linked calendar work will be disabled. Other tilettes will remain unchanged.',
													{ name: removal.recipient }
												)
											: t(
													'participantRemoval.review',
													'Remove {{recipient}} from existing tilettes? Assignments: {{count}}. Their linked calendar work for these assignments will be disabled.',
													{
														recipient: removal.recipient,
														count: removal.assignments.length,
													}
												)}
						</p>
						{removal.changed && (
							<p role="alert">
								{t(
									'tileShareBoard.changed',
									'This tilette has changed. Close this dialog and review its current assignments.'
								)}
							</p>
						)}
						{removal.refreshFailed && (
							<p role="alert">
								{t(
									'participantRemoval.refreshFailed',
									'Couldn’t refresh the participant list. Please try again.'
								)}
							</p>
						)}
					</>
				) : (
					feedback
				)}
			</TileShareDialog>
		),
	};
}

const Feedback = styled.div<{ $state: 'saving' | 'error' | 'saved' }>`
	display: grid;
	grid-template-columns: 22px minmax(0, 1fr);
	gap: 8px 12px;
	padding: 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	> svg {
		color: ${({ theme, $state }) =>
			$state === 'saving'
				? theme.colors.text.secondary
				: $state === 'error'
					? theme.colors.text.warning
					: theme.colors.text.success};
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
