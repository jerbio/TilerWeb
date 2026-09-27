import { createContext, useContext } from 'react';
import styled from 'styled-components';
import { Check, X, Clock3, CircleHelp, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DesignatedUser, InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';

export const TileShareViewerContext = createContext<{ isOwner: boolean; viewerId: string | null }>({
	isOwner: false,
	viewerId: null,
});
const statuses = [
	InvitationStatus.Accepted,
	InvitationStatus.Declined,
	InvitationStatus.None,
	InvitationStatus.Tentative,
] as const;
type Status = (typeof statuses)[number] | 'unknown';
function statusOf(assignment: DesignatedUser): Status {
	return statuses.find((status) => status === assignment.rsvpStatus) ?? 'unknown';
}
const labels: Record<Status, string> = {
	accepted: 'Accepted',
	declined: 'Declined',
	none: 'Awaiting response',
	tentative: 'Tentative',
	unknown: 'Unknown response',
};
const icons = {
	accepted: Check,
	declined: X,
	none: Clock3,
	tentative: CircleDot,
	unknown: CircleHelp,
};
function Badge({ status, count }: { status: Status; count?: number }) {
	const { t } = useTranslation();
	const Icon = icons[status];
	return (
		<Chip $status={status}>
			<Icon size={14} aria-hidden="true" />
			{count !== undefined && <span>{count}</span>}
			<span>{t(`tileshareRsvp.${status}`, labels[status])}</span>
		</Chip>
	);
}
function displayName(assignment: DesignatedUser) {
	return (
		assignment.userProfile?.fullName ||
		assignment.userProfile?.firstName ||
		assignment.displayedIdentifier
	);
}

export default function TiletteRsvpStatus({
	tilette,
	assigneeId,
	embedded,
}: {
	tilette: TileShareTemplate;
	assigneeId?: string;
	/** Render inline (no border/padding) inside a host row, e.g. beside the invitation actions. */
	embedded?: boolean;
}) {
	const { t } = useTranslation();
	const viewer = useContext(TileShareViewerContext);
	if (!viewer.viewerId) return null;
	const assignments = tilette.designatedUsers ?? [];
	if (!viewer.isOwner || assigneeId) {
		const id = viewer.isOwner ? assigneeId : viewer.viewerId;
		if (!viewer.isOwner && assigneeId && assigneeId !== viewer.viewerId) return null;
		const assignment = assignments.find((d) => (d.userId ?? d.displayedIdentifier) === id);
		if (!assignment) return null;
		return (
			<Wrap $embedded={embedded}>
				<Label>
					{id === viewer.viewerId
						? t('tileshareRsvp.yours', 'Your response')
						: t('tileshareRsvp.response', 'Invitation response')}
				</Label>
				<Badge status={statusOf(assignment)} />
			</Wrap>
		);
	}
	const groups = [...statuses, 'unknown' as const]
		.map((status) => ({
			status,
			count: assignments.filter((d) => statusOf(d) === status).length,
		}))
		.filter((g) => g.count > 0);
	return (
		<Wrap $embedded={embedded}>
			<Label>{t('tileshareRsvp.responses', 'Invitation responses')}</Label>
			{groups.map((group) => (
				<Badge key={group.status} status={group.status} count={group.count} />
			))}
			{!assignments.length && (
				<Label>{t('tileshareRsvp.noParticipants', 'No participants')}</Label>
			)}
			{assignments.length > 0 && (
				<People>
					<summary>{t('tileshareRsvp.viewPeople', 'View responses')}</summary>
					<ul>
						{assignments.map((assignment, index) => (
							<li key={assignment.designatedTileTemplateId ?? index}>
								<span>
									{displayName(assignment) ||
										t('tileshareRsvp.participant', 'Participant')}
								</span>
								<Badge status={statusOf(assignment)} />
							</li>
						))}
					</ul>
				</People>
			)}
		</Wrap>
	);
}
const Wrap = styled.div<{ $embedded?: boolean }>`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	padding: 12px 20px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	${({ $embedded }) =>
		$embedded &&
		`
		padding: 0;
		border-top: 0;
	`};
`;
const Label = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
	margin-right: 4px;
`;
const Chip = styled.span<{ $status: Status }>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 5px 8px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	line-height: 1.4;
	color: ${({ theme, $status }) =>
		$status === InvitationStatus.Accepted
			? theme.colors.text.success
			: $status === InvitationStatus.Declined
				? theme.colors.text.error
				: $status === InvitationStatus.None
					? theme.colors.text.warning
					: theme.colors.text.secondary};
	border: 1px solid currentColor;
`;
const People = styled.details`
	margin-left: auto;
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
	summary {
		cursor: pointer;
		padding: 6px;
		border-radius: 4px;
	}
	summary:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	&[open] {
		flex-basis: 100%;
		margin-left: 0;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 10px 0 0;
		max-height: 240px;
		overflow-y: auto;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
	}
	li > span:first-child {
		min-width: 0;
		overflow-wrap: anywhere;
	}
`;
