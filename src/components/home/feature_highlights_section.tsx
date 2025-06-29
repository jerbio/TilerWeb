import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';
import { Highlight } from '../../util/interface';
import MountainBackground from '../../assets/image_assets/highlights/mountain.jpg';
import FitnessBackground from '../../assets/image_assets/highlights/fitness.jpg';
import TilesBackground from '../../assets/image_assets/highlights/tiles.jpg';
import LocationBackground from '../../assets/image_assets/highlights/location.jpg';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';

const HighlightCardWrapper = styled.div`
	display: grid;
  place-items: center;
  gap: 1.5rem;
  width: fit-content;
  margin: 0 auto;

  @media (min-width: ${styles.screens.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${styles.screens.xl}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const HighlightCard = styled.div<{ backgroundimage: string }>`
	background-image: url(${(props) => props.backgroundimage});
	background-size: cover;
	background-position: center;
	padding: 1rem;
	color: white;
	width: 262px;
	min-height: 250px;
	border-radius: 16px;
	border: 1px solid ${styles.colors.borderRed};
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const MiniTitle = styled.p`
	color: ${styles.colors.brand['300']};
  font-weight: ${styles.typography.fontWeight.semibold};
	font-size: ${styles.typography.fontSize.xxs};
	margin: 0;
`;

const Title = styled.h2`
	font-size: ${styles.typography.fontSize.displayXs};
	line-height: ${styles.typography.lineHeight.lg};
	font-family: ${styles.typography.fontFamily.urban};
	font-weight: 700;
	margin-bottom: 0.75rem;
`;

const Body = styled.p`
	font-size: ${styles.typography.fontSize.sm};
	color: #ffffffbf;
`;

const FeatureHighlightsSection: React.FC = () => {
	const { t } = useTranslation();
	
	const highlights: Highlight[] = [
		{
			subHeader: t('home.features.transit.subtitle'),
			header: t('home.features.transit.title'),
			body: t('home.features.transit.description'),
			backgroundImage: MountainBackground,
		},
		{
			subHeader: t('home.features.forecast.subtitle'),
			header: t('home.features.forecast.title'),
			body: t('home.features.forecast.description'),
			backgroundImage: FitnessBackground,
		},
		{
			subHeader: t('home.features.suggestions.subtitle'),
			header: t('home.features.suggestions.title'),
			body: t('home.features.suggestions.description'),
			backgroundImage: TilesBackground,
		},
		{
			subHeader: t('home.features.location.subtitle'),
			header: t('home.features.location.title'),
			body: t('home.features.location.description'),
			backgroundImage: LocationBackground,
		},
	];

	return (
		<Section>
			<SectionHeaders
				headerText="Feature Highlights"
				subHeaderText="Simplify your life with Tiler, Here's what we can do to help you."
				align="center"
			/>
			<HighlightCardWrapper>
				{highlights.map((highlight, index) => (
					<HighlightCard
						key={index}
						backgroundimage={highlight.backgroundImage}
					>
						<MiniTitle>{highlight.subHeader}</MiniTitle>
						<div>
							<Title>{highlight.header}</Title>
							<Body>{highlight.body}</Body>
						</div>
					</HighlightCard>
				))}
			</HighlightCardWrapper>
		</Section>
	);
};

export default FeatureHighlightsSection;
