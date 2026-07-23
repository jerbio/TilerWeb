import React from 'react';
import styled from 'styled-components';
import { Assignee } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import AssigneeTiletteCard from './AssigneeTiletteCard';

type AssigneeColumnProps = {
	assignee: Assignee;
};

/** One assignee lane: a name/avatar header over that person's tilette cards. */
const AssigneeColumn: React.FC<AssigneeColumnProps> = ({ assignee }) => (
	<Column>
		<Header>
			<HeaderName>{assignee.name}</HeaderName>
			<AvatarCluster users={[assignee.avatar]} size={28} />
		</Header>
		<Cards>
			{assignee.tilettes.map((tilette) => (
				<AssigneeTiletteCard key={tilette.id} tilette={tilette} />
			))}
		</Cards>
	</Column>
);

const Column = styled.div`
	display: flex;
	flex-direction: column;
	padding: 0 0.75rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	padding: 0.5rem 0.5rem 0.5rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-bottom: none;
	background-color: ${({ theme }) => theme.colors.background.card};
	border-radius: ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large} 0 0;
`;

const HeaderName = styled.span`
	min-width: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Cards = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.875rem;
	padding: 0.5rem 0.5rem 0.5rem 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 0 0 ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large};
`;

export default AssigneeColumn;
