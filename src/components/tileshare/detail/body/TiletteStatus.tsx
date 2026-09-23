import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Check, Hourglass } from 'lucide-react';
import { TileletteStatus as Status } from '@/core/common/types/tileshare';

type TiletteStatusProps = {
	status: Status;
	/** When false, only the icon renders (assignee cards); true adds the label (list rows). */
	showLabel?: boolean;
};

/** Status indicator: hourglass + "In progress" (amber) or check + "Completed" (green). */
const TiletteStatus: React.FC<TiletteStatusProps> = ({ status, showLabel = true }) => {
	const { t } = useTranslation();
	const completed = status === Status.Completed;

	return (
		<Wrap $completed={completed}>
			{completed ? <Check size={16} /> : <Hourglass size={16} />}
			{showLabel && (
				<Label>
					{t(
						completed
							? 'tilesharedemo.detail.status.completed'
							: 'tilesharedemo.detail.status.inProgress'
					)}
				</Label>
			)}
		</Wrap>
	);
};

const Wrap = styled.span<{ $completed: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	color: ${({ $completed, theme }) =>
		$completed ? theme.colors.success[400] : theme.colors.warning[400]};
`;

const Label = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

export default TiletteStatus;
