import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '@/core/common/components/button';
import { TileletteStatus as Stage, TileShareTemplate } from '@/core/common/types/tileshare';

export type BoardActions = {
	canDrop: (task: TileShareTemplate, target: Stage) => boolean;
	choose: (task: TileShareTemplate, target: Stage) => void;
	busy: boolean;
};
export const ProjectBoardActionContext = createContext<BoardActions | null>(null);

export function ProjectBoardActionButtons({ task }: { task: TileShareTemplate }) {
	const actions = useContext(ProjectBoardActionContext);
	const { t } = useTranslation();
	if (!actions) return null;
	return (
		<Actions>
			{actions.canDrop(task, Stage.Delegated) && (
				<Button variant="ghost" onClick={() => actions.choose(task, Stage.Delegated)}>
					{t('tileShareBoard.assign', 'Assign participants')}
				</Button>
			)}
			{actions.canDrop(task, Stage.Unassigned) && (
				<Button variant="ghost" onClick={() => actions.choose(task, Stage.Unassigned)}>
					{t('tileShareBoard.removeAssignments', 'Remove assignments')}
				</Button>
			)}
			{actions.canDrop(task, Stage.InProgress) && (
				<Button variant="ghost" onClick={() => actions.choose(task, Stage.InProgress)}>
					{t('tileShareBoard.accept', 'Accept invitation')}
				</Button>
			)}
		</Actions>
	);
}
const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 4px 10px 10px;
	> button {
		font-size: 12px;
		padding: 5px 8px;
		min-height: 32px;
	}
`;
