import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';
import { Highlight } from '../../util/interface';
import MountainBackground from '../../util/image_assets/mountain.jpg';
import FitnessBackground from '../../util/image_assets/fitness.jpg';
import TilesBackground from '../../util/image_assets/tiles.jpg';
import SectionHeaders from './section_headers';

const highlights: Highlight[] = [
	{
		subHeader: 'OPTIMIZE YOUR DAY',
		header: 'Travel & Business Hours',
		body: 'Automatically calculate optimal business hours and travel times',
		backgroundImage: MountainBackground,
	},
	{
		subHeader: 'ANTICIPATE THE FUTURE',
		header: 'Forecast & Predictions',
		body: 'Make strategic choices based on data-driven insights.',
		backgroundImage: FitnessBackground,
	},
	{
		subHeader: 'PERSONALIZED RECCOMENDATIONS',
		header: 'Tile Suggestions',
		body: 'Let Tiler handle the complex scheduling tasks, Prioritize tasks and allocate time effectively.',
		backgroundImage: TilesBackground,
	},
];

const HighlightRootWrapper = styled.div`
	margin: 50px 0;
`;

const HighlightCardWrapper = styled.div`
	display: flex;
	justify-content: center;
	gap: 2rem;
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
	color: ${styles.colors.textRed};
	font-size: ${styles.typography.fontSize.xs};
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
