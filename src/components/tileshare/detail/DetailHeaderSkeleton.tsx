import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '@/core/theme/ThemeProvider';

/** Loading placeholder mirroring the detail header card layout. */
const DetailHeaderSkeleton: React.FC = () => {
	const { isDarkMode } = useTheme();
	return (
		<Card $darkmode={isDarkMode}>
			<TopRow>
				<Circle />
				<Lines>
					<Line $width="240px" $height="20px" />
					<Line $width="120px" $height="14px" />
				</Lines>
			</TopRow>
			<Divider />
			<Line $width="80%" $height="14px" />
			<Line $width="60%" $height="14px" style={{ marginTop: '0.5rem' }} />
		</Card>
	);
};

const shimmer = keyframes`
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
`;

const Base = styled.div`
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.skeleton.base} 25%,
		${({ theme }) => theme.colors.skeleton.highlight} 50%,
		${({ theme }) => theme.colors.skeleton.base} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 2.4s ease-in-out infinite;
	border-radius: ${({ theme }) => theme.borderRadius.small};
`;

const Card = styled.div<{ $darkmode: boolean }>`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	padding: 1.25rem 1.5rem;
	background-color: ${({ $darkmode, theme }) =>
		$darkmode ? 'transparent' : theme.colors.background.card};
`;

const TopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const Circle = styled(Base)`
	width: 48px;
	height: 48px;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	flex-shrink: 0;
`;

const Lines = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Line = styled(Base)<{ $width: string; $height: string }>`
	width: ${({ $width }) => $width};
	height: ${({ $height }) => $height};
`;

const Divider = styled.hr`
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	margin: 1rem 0;
`;

export default DetailHeaderSkeleton;
