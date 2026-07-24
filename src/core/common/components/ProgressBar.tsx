import React from 'react';
import styled from 'styled-components';

type ProgressBarProps = {
	label?: string;
	percentage: number;
	className?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ label = 'Progress', percentage, className }) => {
	const clamped = Math.min(100, Math.max(0, percentage));

	return (
		<Container className={className}>
			<Header>
				<Label>{label}</Label>
				<Percent>{clamped}%</Percent>
			</Header>
			<Track>
				<Fill $percentage={clamped} />
			</Track>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Label = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Percent = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Track = styled.div`
	width: 100%;
	height: 12px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background-color: ${({ theme }) => theme.colors.background.card2};
	overflow: hidden;
`;

const Fill = styled.div<{ $percentage: number }>`
	height: 100%;
	width: ${({ $percentage }) => $percentage}%;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: linear-gradient(
		to right,
		${({ theme }) => theme.colors.brand[500]},
		${({ theme }) => theme.colors.purple[400]}
	);
	transition: width 0.3s ease;
`;

export default ProgressBar;
