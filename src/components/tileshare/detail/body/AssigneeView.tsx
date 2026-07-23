import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Assignee } from '@/core/util/tileshareAssignees';
import AssigneeColumn from './AssigneeColumn';

type AssigneeViewProps = {
	/** The assignees visible on the current page. */
	assignees: Assignee[];
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
	columns,
	showFooter,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}) => {
	const { t } = useTranslation();

	return (
		<Wrap>
			<Board $columns={columns}>
				{assignees.map((assignee) => (
					<AssigneeColumn key={assignee.id} assignee={assignee} />
				))}
			</Board>
			{showFooter && (
				<Footer>
					<PageButton type="button" onClick={onPrev} disabled={!hasPrev}>
						<ChevronLeft size={18} />
						{t('tilesharedemo.detail.prev')}
					</PageButton>
					<PageButton type="button" onClick={onNext} disabled={!hasNext}>
						{t('tilesharedemo.detail.next')}
						<ChevronRight size={18} />
					</PageButton>
				</Footer>
			)}
		</Wrap>
	);
};

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

const Footer = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 1.5rem;
`;

const PageButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	background: transparent;
	border: none;
	padding: 0.25rem 0.25rem;
	cursor: pointer;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	transition: opacity 0.15s ease;

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;

export default AssigneeView;
