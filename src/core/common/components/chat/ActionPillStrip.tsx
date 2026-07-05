import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import ActionPill from './ActionPill';
import {
	SimulationActionDto,
	SimulationDto,
	VibeAction,
	VibeRequest,
} from '@/core/common/types/chat';

// ---------------------------------------------------------------------------
// ActionPillStrip — collapsible strip of ActionPill chips for a chat message.
//
// Default behaviour: show the first PILL_STRIP_INITIAL_COUNT visible actions.
// When there are more, a "+N more" button expands the strip. A "Show less"
// button collapses it back. `conversational_and_not_supported` actions are
// filtered out before the limit is applied.
// ---------------------------------------------------------------------------

export const PILL_STRIP_INITIAL_COUNT = 3;

const CONVERSATIONAL_TYPE = 'conversational_and_not_supported';

interface ActionPillStripProps {
	actions: VibeAction[];
	simulation?: SimulationDto | null;
	request?: VibeRequest | null;
	/** Pre-resolved map from actionId → SimulationActionDto, produced by caller. */
	simulationActionById?: Record<string, SimulationActionDto>;
	onSelect?: (action: VibeAction, simulationAction?: SimulationActionDto) => void;
}

const MoreButton = styled.button`
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 999px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	background: transparent;
	font-size: 12px;
	cursor: pointer;
	margin: 2px 4px 2px 0;
	color: ${({ theme }) => theme.colors.text.secondary};
	opacity: 0.7;
	transition: opacity 0.12s ease;

	&:hover {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid rgba(99, 102, 241, 0.6);
		outline-offset: 2px;
	}
`;

const ActionPillStrip: React.FC<ActionPillStripProps> = ({
	actions,
	simulation,
	request,
	simulationActionById,
	onSelect,
}) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	const visibleActions = actions.filter((a) => a.type !== CONVERSATIONAL_TYPE);

	if (visibleActions.length === 0) return null;

	const overflowCount = visibleActions.length - PILL_STRIP_INITIAL_COUNT;
	const hasOverflow = overflowCount > 0;
	const pillsToShow =
		!expanded && hasOverflow
			? visibleActions.slice(0, PILL_STRIP_INITIAL_COUNT)
			: visibleActions;

	return (
		<>
			{pillsToShow.map((action) => (
				<ActionPill
					key={action.id}
					action={action}
					simulation={simulation}
					request={request}
					simulationAction={simulationActionById?.[action.id]}
					onSelect={onSelect}
				/>
			))}
			{hasOverflow && !expanded && (
				<MoreButton
					type="button"
					onClick={() => setExpanded(true)}
					aria-label={`+${overflowCount} ${t('home.expanded.chat.pillStrip.more', 'more')}`}
				>
					{`+${overflowCount} ${t('home.expanded.chat.pillStrip.more', 'more')}`}
				</MoreButton>
			)}
			{hasOverflow && expanded && (
				<MoreButton
					type="button"
					onClick={() => setExpanded(false)}
					aria-label={t('home.expanded.chat.pillStrip.showLess', 'Show less')}
				>
					{t('home.expanded.chat.pillStrip.showLess', 'Show less')}
				</MoreButton>
			)}
		</>
	);
};

export default ActionPillStrip;
