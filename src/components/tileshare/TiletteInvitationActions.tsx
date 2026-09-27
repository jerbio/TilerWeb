import { createContext, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Check, X, PencilLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth/useAuth';
import { TileshareApi } from '@/api/tileshareApi';
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';

export const TiletteInvitationRefreshContext = createContext<(() => Promise<void>) | undefined>(
	undefined
);
const api = new TileshareApi();

function isResolved(status: string | null | undefined) {
	return status === InvitationStatus.Accepted || status === InvitationStatus.Declined;
}

type Props = {
	tilette: TileShareTemplate;
	clusterId: string;
	assigneeId?: string;
	/** Render inline (no border/padding) inside a host row, e.g. beside the RSVP badge. */
	embedded?: boolean;
	/** Report whether an RSVP request is in flight so the host can shimmer its surface. */
	reportBusy?: (busy: boolean) => void;
};

export default function TiletteInvitationActions({
	tilette,
	clusterId,
	assigneeId,
	embedded,
	reportBusy,
}: Props) {
	const { user } = useAuth();
	if (
		!user?.id ||
		!tilette.id ||
		tilette.clusterId !== clusterId ||
		(assigneeId && assigneeId !== user.id)
	)
		return null;
	// Match the signed-in participant's assignment in any RSVP state: unresolved
	// assignments offer the invitation flow, resolved ones a "change response" flow.
	const assignment = tilette.designatedUsers?.find(
		(d) => d.userId === user.id && d.designatedTileTemplateId
	);
	if (!assignment?.designatedTileTemplateId) return null;
	const status = assignment.rsvpStatus;
	if (
		status !== InvitationStatus.None &&
		status !== InvitationStatus.Tentative &&
		!isResolved(status)
	)
		return null;
	return (
		<ResponseActions
			key={`${user.id}:${clusterId}:${tilette.id}:${assignment.designatedTileTemplateId}`}
			assignmentId={assignment.designatedTileTemplateId}
			tiletteId={tilette.id}
			clusterId={clusterId}
			name={tilette.name ?? ''}
			currentStatus={status}
			embedded={embedded}
			reportBusy={reportBusy}
		/>
	);
}

function ResponseActions({
	assignmentId,
	tiletteId,
	clusterId,
	name,
	currentStatus,
	embedded,
	reportBusy,
}: {
	assignmentId: string;
	tiletteId: string;
	clusterId: string;
	name: string;
	currentStatus: string | null;
	embedded?: boolean;
	reportBusy?: (busy: boolean) => void;
}) {
	const { t } = useTranslation();
	const refresh = useContext(TiletteInvitationRefreshContext);
	const [state, setState] = useState<
		| 'pending'
		| 'resolved'
		| 'saving'
		| 'uncertain'
		| 'checking'
		| 'accepted'
		| 'declined'
		| 'unavailable'
	>(isResolved(currentStatus) ? 'resolved' : 'pending');
	// Change mode: the "Change response" button revealed Accept/Decline for a resolved response.
	const [changeOpen, setChangeOpen] = useState(false);
	const busy = useRef(false);
	const active = useRef(true);
	// Whether the in-flight/confirmed action changed an already-resolved response.
	const wasChange = useRef(false);
	const lastStatus = useRef<InvitationStatus.Accepted | InvitationStatus.Declined>(
		InvitationStatus.Accepted
	);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);
	// Re-sync the view when the assignment's stored status changes underneath us
	// (a background refresh after our own change, or another actor's change).
	useEffect(() => {
		if (busy.current) return;
		setChangeOpen(false);
		setState((s) =>
			s === 'accepted' || s === 'declined'
				? s
				: isResolved(currentStatus)
					? 'resolved'
					: 'pending'
		);
	}, [currentStatus]);
	// The confirmed-response toast is transient: after five seconds it collapses back
	// to the badge view so the host's RSVP status is not repeated indefinitely.
	const currentStatusRef = useRef(currentStatus);
	currentStatusRef.current = currentStatus;
	useEffect(() => {
		if (state !== 'accepted' && state !== 'declined') return;
		const id = window.setTimeout(() => {
			if (!active.current) return;
			setState(isResolved(currentStatusRef.current) ? 'resolved' : 'pending');
		}, 5000);
		return () => window.clearTimeout(id);
	}, [state]);
	const respond = async (status: InvitationStatus.Accepted | InvitationStatus.Declined) => {
		if (busy.current || (state !== 'pending' && !(state === 'resolved' && changeOpen))) return;
		busy.current = true;
		wasChange.current = isResolved(currentStatus);
		lastStatus.current = status;
		setState('saving');
		setChangeOpen(false);
		reportBusy?.(true);
		try {
			await api.respondToInvitation(assignmentId, status);
			if (!active.current) return;
			setState(status);
			window.dispatchEvent(new Event('tileshare-changed'));
			await refresh?.();
		} catch {
			if (active.current) setState('uncertain');
		} finally {
			busy.current = false;
			reportBusy?.(false);
		}
	};
	const check = async () => {
		if (busy.current) return;
		busy.current = true;
		setState('checking');
		reportBusy?.(true);
		try {
			const page = await api.getInvitations({
				ClusterId: clusterId,
				TiletteId: tiletteId,
				AssignmentId: assignmentId,
			});
			if (!active.current) return;
			const stillPending =
				page.invitations?.some((i) => i.assignmentId === assignmentId) ?? false;
			if (wasChange.current) {
				// A resolved assignment leaves the pending list once its status is applied,
				// so an empty list means the change went through.
				setState(stillPending ? 'uncertain' : lastStatus.current);
			} else {
				setState(stillPending ? 'pending' : 'unavailable');
			}
			window.dispatchEvent(new Event('tileshare-changed'));
			await refresh?.();
		} catch {
			if (active.current) setState('uncertain');
		} finally {
			busy.current = false;
			reportBusy?.(false);
		}
	};
	// The Accept/Decline options are visible while an invitation is pending or the
	// change-response panel is open; selecting one (or cancelling) animates them away.
	const optionsOpen = state === 'pending' || (state === 'resolved' && changeOpen);
	const resolvedStatus: InvitationStatus.Accepted | InvitationStatus.Declined | null =
		currentStatus === InvitationStatus.Accepted
			? InvitationStatus.Accepted
			: currentStatus === InvitationStatus.Declined
				? InvitationStatus.Declined
				: null;
	return (
		<Wrap
			$embedded={embedded}
			role="group"
			aria-label={`${t('tileshareInvitations.title', 'Invitations')}: ${name}`}
			aria-busy={state === 'saving' || state === 'checking'}
		>
			{(state === 'pending' || state === 'resolved' || state === 'saving') && (
				<>
					{/* The host row's RSVP badge already states the current status when embedded. */}
					{!embedded && (state === 'pending' || state === 'resolved') && (
						<Hint>
							{state === 'pending'
								? t(
										'tileshareInvitations.yourInvitation',
										'You are invited to this tilette.'
									)
								: resolvedStatus === InvitationStatus.Accepted
									? t(
											'tileshareInvitations.currentAccepted',
											'Current response: Accepted.'
										)
									: t(
											'tileshareInvitations.currentDeclined',
											'Current response: Declined.'
										)}
						</Hint>
					)}
					{state === 'resolved' && !changeOpen && (
						<IconToggle
							type="button"
							aria-label={t('tileshareInvitations.changeResponse', 'Change response')}
							onClick={() => setChangeOpen(true)}
						>
							<PencilLine size={15} aria-hidden="true" />
						</IconToggle>
					)}
					<Collapse $open={optionsOpen}>
						<CollapseInner $open={optionsOpen}>
							<Buttons>
								{resolvedStatus !== InvitationStatus.Accepted && (
									<Option
										$tone="accept"
										type="button"
										disabled={state === 'saving'}
										onClick={() => void respond(InvitationStatus.Accepted)}
									>
										<Check size={16} aria-hidden="true" />
										{t('tileshareInvitations.accept', 'Accept')}
									</Option>
								)}
								{/* The already-selected option stays with the host's RSVP badge, so the panel
							offers only the alternative to avoid repeating it. */}
								{resolvedStatus !== InvitationStatus.Declined && (
									<Option
										$tone="decline"
										type="button"
										disabled={state === 'saving'}
										onClick={() => void respond(InvitationStatus.Declined)}
									>
										<X size={16} aria-hidden="true" />
										{t('tileshareInvitations.decline', 'Decline')}
									</Option>
								)}
								{state === 'resolved' && changeOpen && (
									<Button type="button" onClick={() => setChangeOpen(false)}>
										{t('tileshareInvitations.cancel', 'Cancel')}
									</Button>
								)}
							</Buttons>
						</CollapseInner>
					</Collapse>
				</>
			)}
			{/* Embedded hosts shimmer the tilette surface instead of showing this hint. */}
			{state === 'saving' && !embedded && (
				<Hint role="status">
					{t('tileshareInvitations.responding', 'Saving response...')}
				</Hint>
			)}
			{(state === 'uncertain' || state === 'checking') && (
				<>
					<Hint role="alert">
						{t(
							'tileshareInvitations.responseFailed',
							'The response could not be confirmed. Refresh to check its status before trying again.'
						)}
					</Hint>
					<Button
						type="button"
						disabled={state === 'checking'}
						onClick={() => void check()}
					>
						{t('tileshareInvitations.refresh', 'Refresh')}
					</Button>
				</>
			)}
			{state === 'accepted' && (
				<Hint role="status">
					{wasChange.current
						? t('tileshareInvitations.updatedAccepted', 'Response updated to Accepted.')
						: t(
								'tileshareInvitations.accepted',
								'Accepted. Your tile has been created.'
							)}
				</Hint>
			)}
			{state === 'declined' && (
				<Hint role="status">
					{wasChange.current
						? t('tileshareInvitations.updatedDeclined', 'Response updated to Declined.')
						: t('tileshareInvitations.declined', 'Invitation declined.')}
				</Hint>
			)}
			{state === 'unavailable' && (
				<Hint role="status">
					{t('tileshareInvitations.unavailable', 'This invitation is no longer pending.')}
				</Hint>
			)}
		</Wrap>
	);
}
const Wrap = styled.div<{ $embedded?: boolean }>`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	${({ $embedded }) =>
		$embedded &&
		`
		padding: 0;
		border-top: 0;
	`};
`;
const Hint = styled.p`
	margin: 0;
	flex: 1 1 140px;
	font-size: 13px;
	line-height: 1.5;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
const Buttons = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;
const Button = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 36px;
	padding: 8px 14px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	font: inherit;
	font-size: 13px;
	cursor: pointer;
	&:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.text.primary};
		outline-offset: 3px;
	}
`;
// Animated open/close for the option row: the grid row animates between 0fr and
// 1fr while the inner content fades/slides, so a selection fluidly collapses the
// panel back to the badge. `visibility` hides the closed panel from the a11y tree
// and tab order only after the close animation has played.
const Collapse = styled.div<{ $open: boolean }>`
	display: grid;
	grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
	transition: grid-template-rows 260ms ease;
`;
const CollapseInner = styled.div<{ $open: boolean }>`
	min-height: 0;
	overflow: hidden;
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
	transform: translateY(${({ $open }) => ($open ? '0' : '-6px')});
	transition:
		opacity 180ms ease,
		transform 260ms ease,
		visibility 0s linear ${({ $open }) => ($open ? '0s' : '260ms')};
`;
/** Compact icon-only toggle that sits beside the host row's RSVP badge. */
const IconToggle = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition:
		color 150ms ease,
		border-color 150ms ease;
	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
		border-color: ${({ theme }) => theme.colors.text.secondary};
	}
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.text.primary};
		outline-offset: 3px;
	}
`;
/** Accept/Decline option, tinted with its status colour; the current response is filled. */
const Option = styled.button<{ $tone: 'accept' | 'decline'; $selected?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 36px;
	padding: 8px 14px;
	border-radius: 8px;
	font: inherit;
	font-size: 13px;
	cursor: pointer;
	color: ${({ $tone, theme }) =>
		$tone === 'accept' ? theme.colors.text.success : theme.colors.text.error};
	border: 1px solid currentColor;
	background: ${({ $selected }) =>
		$selected ? 'color-mix(in srgb, currentColor 14%, transparent)' : 'transparent'};
	font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
	transition: background 160ms ease;
	&:hover:not(:disabled) {
		background: color-mix(in srgb, currentColor 10%, transparent);
	}
	&:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}
`;
