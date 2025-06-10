import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';
import { Highlight } from '../../util/interface';
import MountainBackground from '../../assets/image_assets/highlights/mountain.jpg';
import FitnessBackground from '../../assets/image_assets/highlights/fitness.jpg';
import TilesBackground from '../../assets/image_assets/highlights/tiles.jpg';
import LocationBackground from '../../assets/image_assets/highlights/location.jpg';
import SectionHeaders from './section_headers';

const highlights: Highlight[] = [
	{
		subHeader: 'OPTIMIZE YOUR DAY',
		header: 'Transit',
		body: 'Plan your day efficiently with detailed transit routes on a map, showing tiles and stops to make between activities.',
		backgroundImage: MountainBackground,
	},
	{
		subHeader: 'ANTICIPATE THE FUTURE',
		header: 'Forecast & Predictions',
		body: 'Make strategic choices based on data-driven insights.',
		backgroundImage: FitnessBackground,
	},
	{
		subHeader: 'PERSONALIZED RECOMMENDATIONS',
		header: 'Tile Suggestions',
		body: 'Let Tiler handle the complex scheduling tasks, Prioritize tasks and allocate time effectively.',
		backgroundImage: TilesBackground,
	},
	{
		subHeader: 'SMART LOCATION',
		header: 'Auto Location',
		body: 'Tiler intelligently detects and automatically adds relevant locations to your tiles.',
		backgroundImage: LocationBackground,
	},
];

const HighlightRootWrapper = styled.div`
	margin: 50px 0;
  padding: 0 ${styles.container.padding.default};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HighlightCardWrapper = styled.div`
	display: grid;
  place-items: center;
  gap: 1.5rem;

  @media (min-width: ${styles.screens.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${styles.screens.xl}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const HighlightCard = styled.div<{ backgroundImage: string }>`
	background-image: url(${(props) => props.backgroundImage});
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
  font-weight: ${styles.typography.fontWeight.medium};
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
	return (
		<HighlightRootWrapper>
			<SectionHeaders
				headerText="Feature Highlights"
				subHeaderText="Simplify your life with Tiler, Here's what we can do to help you."
				align="center"
			/>
			<HighlightCardWrapper>
				{highlights.map((highlight, index) => (
					<HighlightCard
						key={index}
						backgroundImage={highlight.backgroundImage}
					>
						<MiniTitle>{highlight.subHeader}</MiniTitle>
						<div>
							<Title>{highlight.header}</Title>
							<Body>{highlight.body}</Body>
						</div>
					</HighlightCard>
				))}
			</HighlightCardWrapper>
		</HighlightRootWrapper>
	);
};

export default FeatureHighlightsSection;
