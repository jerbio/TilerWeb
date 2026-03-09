import React from 'react';
import styled, { keyframes } from 'styled-components';
import Section from '../layout/section';
import palette from '@/core/theme/palette';
import { useNavigate } from 'react-router';

const float = keyframes`
	0%, 100% { transform: translateY(0px); }
	50% { transform: translateY(-5px); }
`;

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
	padding: 28px 32px;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[700]};
	border-left: 3px solid ${palette.colors.brand[500]};
	border-radius: ${palette.borderRadius.large};
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at 75% 50%,
			${palette.colors.brand[500]}0d 0%,
			transparent 60%
		);
		pointer-events: none;
	}

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: flex-start;
		padding: 22px 20px;
		gap: 1.25rem;
	}
`;

const TextBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	flex: 1;
	min-width: 0;
`;

const Overline = styled.span`
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.brand[400]};
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-family: ${palette.typography.fontFamily.inter};
`;

const Heading = styled.h2`
	font-size: ${palette.typography.fontSize.xl};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-family: ${palette.typography.fontFamily.urban};
	color: ${palette.colors.gray[100]};
	margin: 0;
	line-height: 1.25;
`;

const SubCopy = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	margin: 0;
	line-height: 1.6;
`;

const IconGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 7px;
	flex-shrink: 0;
	animation: ${float} 4.5s ease-in-out infinite;

	@media (max-width: 640px) {
		display: none;
	}
`;

const IconCell = styled.div<{ $bg: string }>`
	width: 36px;
	height: 36px;
	border-radius: 9px;
	background: ${({ $bg }) => $bg};
	border: 1px solid ${palette.colors.gray[700]};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
`;

const CtaButton = styled.button`
	padding: 10px 22px;
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.brand[500]};
	color: #fff;
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-family: ${palette.typography.fontFamily.inter};
	border: none;
	cursor: pointer;
	white-space: nowrap;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: background 0.2s, transform 0.15s;

	&:hover {
		background: ${palette.colors.brand[400]};
		transform: translateY(-1px);
	}
`;

const ICONS = [
	{ emoji: '🧩', bg: '#1A2E3A' },
	{ emoji: '🤖', bg: '#3D1C2A' },
	{ emoji: '🚗', bg: '#1A3320' },
	{ emoji: '📅', bg: '#1A2040' },
	{ emoji: '🔄', bg: '#2A1A3A' },
	{ emoji: '🔔', bg: '#1A2E3A' },
];

const DiscoverTeaserSection: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Section paddingBlock={8}>
			<Wrapper>
				<TextBlock>
					<Overline>Discover Tiler</Overline>
					<Heading>There&apos;s a lot more under the hood.</Heading>
					<SubCopy>
						Adaptive scheduling, AI assistance, smart travel buffers, and 10+ more
						features — all designed to keep your day on track.
					</SubCopy>
				</TextBlock>

				<IconGrid>
					{ICONS.map((item, i) => (
						<IconCell key={i} $bg={item.bg}>
							{item.emoji}
						</IconCell>
					))}
				</IconGrid>

				<CtaButton onClick={() => navigate('/newsletter')}>
					Explore Features <span aria-hidden="true">→</span>
				</CtaButton>
			</Wrapper>
		</Section>
	);
};

export default DiscoverTeaserSection;
