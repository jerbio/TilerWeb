import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ChevronDown, UsersRound } from 'lucide-react';
import { ContactModel, TileShareTemplate } from '@/core/common/types/tileshare';
import { classParticipantRows } from '@/core/util/classShareParticipants';
import AssigneeTiletteCard from './AssigneeTiletteCard';
import type { ReactNode } from 'react';
import { useShareFilterContext } from '../../TileShareFilters';
import { matchesAssignment, matchesEmptyParticipant } from '@/core/util/tileshareFilters';

export default function ClassParticipantsOverview({
	tilettes,
	participants,
	clusterId,
	remove,
}: {
	tilettes: TileShareTemplate[];
	participants?: ContactModel[];
	clusterId: string;
	remove?: (person: ContactModel) => ReactNode;
}) {
	const { t } = useTranslation();
	const rows = classParticipantRows(tilettes, participants);
	const filters = useShareFilterContext();
	const visible = rows
		.map((row) => ({
			...row,
			matching: filters
				? row.assignments.filter(({ tilette, assignment }) =>
						matchesAssignment(tilette, assignment, filters.filters, filters.env)
					)
				: row.assignments,
		}))
		.filter(
			(row) =>
				row.matching.length ||
				(!row.assignments.length &&
					(!filters || matchesEmptyParticipant(row.person, filters.filters, filters.env)))
		);
	return (
		<Overview aria-label={t('shareExperience.participants', 'Participants')}>
			{filters?.active && (
				<p role="status">
					{t(
						'tileShareFilters.matchingPeople',
						'Matching participants: {{count}} of {{total}}',
						{ count: visible.length, total: rows.length }
					)}
				</p>
			)}
			{!visible.length && (
				<Empty>
					<UsersRound size={24} />
					<p>
						{filters?.active
							? t(
									'tileShareFilters.noResults',
									'No matching results. Change or clear your filters.'
								)
							: t(
									'shareExperience.noParticipants',
									'No participants yet. Add a tilette to start assigning work.'
								)}
					</p>
				</Empty>
			)}
			{visible.map((row) => (
				<Participant key={row.key}>
					<summary>
						<strong>{row.name}</strong>
						<Counts>
							<span>
								{t('shareExperience.assignedCount', '{{count}} assigned tilettes', {
									count: row.assignments.length,
								})}
							</span>
							<span>
								{t(
									'shareExperience.completedCount',
									'{{completed}}/{{total}} completed',
									{ completed: row.completed, total: row.assignments.length }
								)}
							</span>
						</Counts>
						<Responses>
							{[...row.responses].map(([status, count]) => (
								<span key={status}>
									{t('shareExperience.responseCount', '{{response}}: {{count}}', {
										response: t(`tileshareRsvp.${status}`),
										count,
									})}
								</span>
							))}
						</Responses>
						<ChevronDown size={18} aria-hidden="true" />
					</summary>
					<Assignments>
						{filters?.active && (
							<p>
								{t(
									'tileShareFilters.matchingAssignments',
									'Matching assignments: {{count}}',
									{ count: row.matching.length }
								)}
							</p>
						)}
						{!row.assignments.length && (
							<p>{t('shareExperience.noAssignments', 'No assigned tilettes yet.')}</p>
						)}
						{row.assignments.length < tilettes.length && (
							<p>
								{t(
									'shareExperience.missingAssignments',
									'Tilettes without an assignment: {{count}}',
									{ count: tilettes.length - row.assignments.length }
								)}
							</p>
						)}
						{row.matching.map(({ tilette, assignment }) => (
							<AssigneeTiletteCard
								key={tilette.id}
								tilette={tilette}
								clusterId={clusterId}
								assigneeId={
									assignment.userId ?? assignment.displayedIdentifier ?? ''
								}
							/>
						))}
						{remove?.(row.person)}
					</Assignments>
				</Participant>
			))}
		</Overview>
	);
}
const Overview = styled.section`
	display: grid;
	gap: 12px;
`;
const Participant = styled.details`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 16px;
	background: ${({ theme }) => theme.colors.background.card};
	overflow: hidden;
	summary {
		padding: 16px 20px;
		display: grid;
		grid-template-columns: minmax(120px, 1fr) auto 20px;
		gap: 8px 16px;
		align-items: center;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary > strong {
		overflow-wrap: anywhere;
	}
	summary > svg {
		grid-column: 3;
		grid-row: 1 / 3;
		transition: transform 140ms ease;
	}
	&[open] summary > svg {
		transform: rotate(180deg);
	}
	@media (max-width: 600px) {
		summary {
			grid-template-columns: minmax(0, 1fr) 20px;
			padding: 16px;
		}
		summary > svg {
			grid-column: 2;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		summary > svg {
			transition: none;
		}
	}
`;
const Counts = styled.div`
	display: flex;
	gap: 8px 16px;
	flex-wrap: wrap;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	@media (max-width: 600px) {
		grid-column: 1;
	}
`;
const Responses = styled.div`
	grid-column: 1 / 3;
	display: flex;
	flex-wrap: wrap;
	gap: 6px 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 12px;
	@media (max-width: 600px) {
		grid-column: 1;
	}
`;
const Assignments = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;
const Empty = styled.div`
	padding: 24px;
	color: ${({ theme }) => theme.colors.text.secondary};
	text-align: center;
`;
