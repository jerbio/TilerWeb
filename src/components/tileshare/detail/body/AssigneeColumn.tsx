import React from 'react';
import styled from 'styled-components';
import { Assignee } from '@/core/util/tileshareAssignees';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import AssigneeTiletteCard from './AssigneeTiletteCard';

type AssigneeColumnProps = {
	assignee: Assignee;
	clusterId: string;
};

/** One assignee lane: a name/avatar header over that person's tilette cards. */
const AssigneeColumn: React.FC<AssigneeColumnProps> = ({ assignee, clusterId }) => (
	<Column>
		<Header>
			<HeaderName>{assignee.name}</HeaderName>
			<Count>{assignee.tilettes.length}</Count>
			<AvatarCluster users={[assignee.avatar]} size={28} />
		</Header>
		<Cards>
			{assignee.tilettes.map((tilette) => (
				<AssigneeTiletteCard
					key={tilette.id}
					tilette={tilette}
					clusterId={clusterId}
					assigneeId={assignee.id}
				/>
			))}
		</Cards>
	</Column>
);

const Column = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 12px;
	background: ${({ theme }) => theme.colors.background.card2};
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	padding: 0.5rem 0.5rem 0.5rem 0.75rem;
	border-radius: ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large} 0 0;
`;

const HeaderName = styled.span`
	flex: 1;
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
	gap: 10px;
	padding: 0 8px 8px;
	border-radius: 0 0 ${({ theme }) => theme.borderRadius.large}
		${({ theme }) => theme.borderRadius.large};
`;
const Count = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;

export default AssigneeColumn;
