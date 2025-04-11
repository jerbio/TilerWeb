import styled from 'styled-components';
import styles from '../../util/styles';

const Article = styled.article<{ $reversed: boolean }>`
	display: flex;
	color: ${styles.colors.gray[400]};
	flex-direction: column-reverse;
	justify-center: center;
	max-width: 400px;
	background-color: ${styles.colors.gray[900]};
	border-radius: ${styles.borderRadius.large};
	position: relative;
	border: 1px solid ${styles.colors.gray[800]};

	@media (min-width: ${styles.screens.lg}) {
		flex-direction: ${props => props.$reversed ? 'row-reverse' : 'row'};
		max-width: none;
		background-color: transparent;
		border-radius: 0;
		border: none;
		gap: 4rem;
	}
`;

const ContentWrapper = styled.div`
	max-width: 450px;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	justify-content: center;
	padding: 1rem;

	@media (min-width: ${styles.screens.lg}) {
		padding: 0;
	}
`;

const Title = styled.h2`
	font-family: ${styles.typography.fontFamily.urban};
	font-size: ${styles.typography.fontSize.displayXs};
	font-weight: bold;
	background: linear-gradient(to bottom, white, ${styles.colors.gray[400]});
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
	line-height: 1.1;

	@media (min-width: ${styles.screens.lg}) {
		font-size: ${styles.typography.fontSize.displaySm};
	}
`;

const Description = styled.p`
	font-size: ${styles.typography.fontSize.base};

	@media (min-width: ${styles.screens.lg}) {
		font-size: ${styles.typography.fontSize.lg};
	}
`;

const ImageContainer = styled.div`
	overflow: hidden;
	border: 1px solid ${styles.colors.gray[800]};
	border-radius: ${styles.borderRadius.large};
	width: 100%;

	@media (min-width: ${styles.screens.lg}) {
		width: 450px;
	}
`;

const RedDot = styled.div`
	width: 12px;
	height: 12px;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: none;
	border-radius: 50%;
  box-shadow: 0 0 0 2px ${styles.colors.brand[500]} inset;
  background-color: ${styles.colors.brand[500]}50;

	@media (min-width: ${styles.screens.lg}) {
		display: block;
	}
`;

interface FeatureCardProps {
	title: string;
	image: string;
	children: React.ReactNode;
	reversed: boolean;
}

export default function FeatureCard({
	title,
	image,
	children,
	reversed,
}: FeatureCardProps) {
	return (
		<Article $reversed={reversed}>
			<ContentWrapper>
				<Title>{title}</Title>
				<Description>{children}</Description>
			</ContentWrapper>
			<ImageContainer>
				<img src={image} alt={`${title} image`} />
			</ImageContainer>
			<RedDot />
		</Article>
	);
}

