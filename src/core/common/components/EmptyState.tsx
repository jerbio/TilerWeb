import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
	icon?: LucideIcon;
	text?: string;
	className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Inbox, text, className }) => {
	const { t } = useTranslation();

	return (
		<Container className={className}>
			<IconWrapper>
				<Icon size={48} strokeWidth={1.5} />
			</IconWrapper>
			<Text>{text ?? t('common.emptyState.defaultText')}</Text>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 4rem 1rem;
	width: 100%;
`;

const IconWrapper = styled.div`
	color: ${({ theme }) => theme.colors.emptyState.icon};
`;

const Text = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.emptyState.text};
	text-align: center;
`;

export default EmptyState;
