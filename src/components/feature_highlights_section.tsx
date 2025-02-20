import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';
import { Highlight } from '../util/interface';
import MountainBackground from '../util/image_assets/mountain.jpg';
import FitnessBackground from '../util/image_assets/fitness.jpg';
import TilesBackground from '../util/image_assets/tiles.jpg';
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

const HighlightCardWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	width: 846px;
	margin: 0 auto;
	// border: 1px solid red;
`;

const HighlightCard = styled.div<{ backgroundImage: string }>`
	background-image: url(${(props) => props.backgroundImage});
	background-size: cover;
	background-position: center;
	padding: 20px;
	margin: 10px;
	color: white;
	width: 250px;
	height: 262px;
	border-radius: 16px;
	border: 1px solid ${styles.colors.borderRed};
`;

const FeatureHighlightsSection: React.FC = () => {
	return (
		<>
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
						<h2>{highlight.header}</h2>
						<p>{highlight.body}</p>
					</HighlightCard>
				))}
			</HighlightCardWrapper>
		</>
	);
};

export default FeatureHighlightsSection;
