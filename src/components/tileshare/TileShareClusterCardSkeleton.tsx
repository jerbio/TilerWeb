import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
`;

const SkeletonEl = styled.div`
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

const SkeletonLine = styled(SkeletonEl)<{ $width: string; $height: string }>`
	width: ${({ $width }) => $width};
	height: ${({ $height }) => $height};
`;

const SkeletonCircle = styled(SkeletonEl)<{ $size: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: 50%;
	flex-shrink: 0;
`;

const SkeletonBox = styled(SkeletonEl)<{ $size: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	flex-shrink: 0;
`;

const TileShareClusterCardSkeleton: React.FC = () => (
	<CardGrid>
		<Left>
			<SkeletonBox $size={40} />
			<TitleBlock>
				<SkeletonLine $width="58%" $height="1rem" />
				<SkeletonLine $width="38%" $height="0.75rem" style={{ marginTop: '0.3rem' }} />
			</TitleBlock>
			<SkeletonBox $size={40} style={{ borderRadius: '50%' }} />
		</Left>

		<Right>
			<DueWrapper>
				<DueItem>
					<SkeletonCircle $size={16} style={{ marginTop: '2px' }} />
					<DueContent>
						<SkeletonLine $width="3.5rem" $height="0.7rem" />
						<SkeletonLine
							$width="5.5rem"
							$height="0.7rem"
							style={{ marginTop: '2px' }}
						/>
					</DueContent>
				</DueItem>
				<DueDivider />
				<DueItem>
					<SkeletonCircle $size={16} style={{ marginTop: '2px' }} />
					<DueContent>
						<SkeletonLine $width="3rem" $height="0.7rem" />
						<SkeletonLine
							$width="4.5rem"
							$height="0.7rem"
							style={{ marginTop: '2px' }}
						/>
					</DueContent>
				</DueItem>
			</DueWrapper>

			<AvatarRow>
				<AvatarGroup>
					<SkeletonCircle $size={32} />
					<SkeletonCircle $size={32} style={{ marginLeft: '-10px' }} />
					<SkeletonCircle $size={32} style={{ marginLeft: '-10px' }} />
				</AvatarGroup>
			</AvatarRow>
		</Right>
	</CardGrid>
);

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: 7fr 1px 5fr;
	background-color: ${({ theme }) => theme.colors.border.default};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	overflow: hidden;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1px auto;
	}
`;

const Left = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	padding: 1rem 1.25rem;
	grid-column: 1;
	grid-row: 1;
	display: flex;
	align-items: center;
	gap: 0.75rem;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 1;
	}
`;

const Right = styled.div`
	background-color: ${({ theme }) => theme.colors.background.card};
	padding: 1rem 1.25rem;
	grid-column: 3;
	grid-row: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.75rem;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
`;

const TitleBlock = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
`;

const DueWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	width: 100%;
	height: 70px;
`;

const DueDivider = styled.div`
	width: 1px;
	align-self: stretch;
	background-color: ${({ theme }) => theme.colors.border.default};
	flex-shrink: 0;
`;

const DueItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	flex: 1;
`;

const DueContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const AvatarRow = styled.div`
	display: flex;
	align-items: center;
`;

const AvatarGroup = styled.div`
	display: flex;
	align-items: center;
`;

export default TileShareClusterCardSkeleton;
