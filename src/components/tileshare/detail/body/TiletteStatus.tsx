import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Check, Hourglass, Inbox } from 'lucide-react';
import { TileletteStatus as Status } from '@/core/common/types/tileshare';

type TiletteStatusProps = {
	status: Status;
	/** When false, only the icon renders (assignee cards); true adds the label (list rows). */
	showLabel?: boolean;
};

const icons: Record<Status, React.ElementType> = {
	[Status.Todo]: Inbox,
	[Status.InProgress]: Hourglass,
	[Status.Completed]: Check,
};

const labelKeys: Record<Status, string> = {
	[Status.Todo]: 'tilesharedemo.detail.status.todo',
	[Status.InProgress]: 'tilesharedemo.detail.status.inProgress',
	[Status.Completed]: 'tilesharedemo.detail.status.completed',
};

/** Status indicator: inbox + "Todo" (amber), hourglass + "In progress" (amber) or check + "Completed" (green). */
const TiletteStatus: React.FC<TiletteStatusProps> = ({ status, showLabel = true }) => {
	const { t } = useTranslation();
	const completed = status === Status.Completed;
	const Icon = icons[status];

	return (
		<Wrap $completed={completed}>
			<Icon size={16} />
			{showLabel && <Label>{t(labelKeys[status])}</Label>}
		</Wrap>
	);
};

const Wrap = styled.span<{ $completed: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	color: ${({ $completed, theme }) =>
		$completed ? theme.colors.text.success : theme.colors.text.warning};
`;

const Label = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

export default TiletteStatus;
