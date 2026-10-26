import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
`;

const Placeholder = styled.div<{ $width: string; $height?: string; $round?: boolean }>`
	width: ${({ $width }) => $width};
	height: ${({ $height }) => $height ?? '12px'};
	flex-shrink: 0;
	border-radius: ${({ $round }) => ($round ? '50%' : '6px')};
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.skeleton.base} 25%,
		${({ theme }) => theme.colors.skeleton.highlight} 50%,
		${({ theme }) => theme.colors.skeleton.base} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 2.4s ease-in-out infinite;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

export default function TileShareClusterCardSkeleton() {
	return (
		<Card aria-hidden="true">
			<Identity>
				<Placeholder $width="40px" $height="40px" />
				<Title>
					<Placeholder $width="58%" $height="16px" />
					<Placeholder $width="38%" />
				</Title>
			</Identity>
			<Details>
				<Avatars>
					{[0, 1, 2].map((i) => (
						<Placeholder key={i} $width="28px" $height="28px" $round />
					))}
				</Avatars>
				<Deadline>
					<Placeholder $width="80px" />
					<Placeholder $width="140px" />
				</Deadline>
			</Details>
			<Arrow>
				<Placeholder $width="20px" $height="20px" />
			</Arrow>
		</Card>
	);
}

const Card = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto 24px;
	align-items: center;
	gap: 20px;
	padding: 16px 20px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	background: ${({ theme }) => theme.colors.background.card};
	@media (max-width: 760px) {
		grid-template-columns: minmax(0, 1fr) 24px;
		gap: 12px;
		padding: 16px;
	}
`;
const Identity = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
`;
const Title = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	flex: 1;
	min-width: 0;
`;
const Details = styled.div`
	display: grid;
	grid-template-columns: 6.5rem 12rem;
	align-items: center;
	gap: 24px;
	@media (max-width: 760px) {
		grid-row: 2;
		grid-column: 1 / -1;
		grid-template-columns: 6.5rem minmax(0, 12rem);
		justify-content: space-between;
		gap: 12px;
	}
	@media (max-width: 360px) {
		grid-template-columns: minmax(0, 1fr);
	}
`;
const Avatars = styled.div`
	display: flex;
	& > div + div {
		margin-left: -9px;
	}
`;
const Deadline = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;
const Arrow = styled.div`
	grid-column: 3;
	grid-row: 1;
	@media (max-width: 760px) {
		grid-column: 2;
	}
`;
