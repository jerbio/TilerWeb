import React from 'react';
import styled from 'styled-components';
import { Assignee } from '@/core/util/tileshareAssignees';
import AssigneeColumn from './AssigneeColumn';
import PaginationFooter from './PaginationFooter';

type AssigneeViewProps = {
	/** The assignees visible on the current page. */
	assignees: Assignee[];
	/** Parent cluster id, for linking each tilette card to its detail page. */
	clusterId: string;
	/** Number of columns to lay the board out in. */
	columns: number;
	showFooter: boolean;
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
};

/** Presentational assignee board: a grid of lanes with a Prev/Next footer. */
const AssigneeView: React.FC<AssigneeViewProps> = ({
	assignees,
	clusterId,
	columns,
	showFooter,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}) => (
	<Wrap>
		<Board $columns={columns}>
			{assignees.map((assignee) => (
				<AssigneeColumn key={assignee.id} assignee={assignee} clusterId={clusterId} />
			))}
		</Board>
		{showFooter && (
			<PaginationFooter hasPrev={hasPrev} hasNext={hasNext} onPrev={onPrev} onNext={onNext} />
		)}
	</Wrap>
);

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const Board = styled.div<{ $columns: number }>`
	display: grid;
	grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
	align-items: start;
`;

export default AssigneeView;
