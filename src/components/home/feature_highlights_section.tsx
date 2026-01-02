import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { Highlight } from '@/core/common/types/tile';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';
import MountainBackground from '@/assets/highlights/mountain.jpg';
import FitnessBackground from '@/assets/highlights/fitness.jpg';
import TilesBackground from '@/assets/highlights/tiles.jpg';
import LocationBackground from '@/assets/highlights/location.jpg';

const HighlightCardWrapper = styled.div`
	display: grid;
	place-items: center;
	gap: 1.5rem;
	width: fit-content;
	margin: 0 auto;

	@media (min-width: ${palette.screens.sm}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: ${palette.screens.xl}) {
		grid-template-columns: repeat(4, 1fr);
	}
`;

const HighlightCard = styled.div<{ $backgroundimage: string }>`
	background-image: url(${(props) => props.$backgroundimage});
	background-size: cover;
	background-position: center;
	padding: 1rem;
	color: white;
	width: 262px;
	min-height: 250px;
	border-radius: 16px;
	border: 1px solid ${palette.colors.borderRed};
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const MiniTitle = styled.p`
	color: ${palette.colors.brand['300']};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-size: ${palette.typography.fontSize.xxs};
	margin: 0;
`;

const Title = styled.h2`
	font-size: ${palette.typography.fontSize.displayXs};
	line-height: ${palette.typography.lineHeight.lg};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: 700;
	margin-bottom: 0.75rem;
`;

const Body = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: #ffffffbf;
`;

const FeatureHighlightsSection: React.FC = () => {
	const { t } = useTranslation();

	const highlights: Highlight[] = [
		{
			subHeader: t('home.features.conversation.subtitle'),
			header: t('home.features.conversation.title'),
			body: t('home.features.conversation.description'),
			backgroundImage: TilesBackground,
		},
		{
			subHeader: t('home.features.transit.subtitle'),
			header: t('home.features.transit.title'),
			body: t('home.features.transit.description'),
			backgroundImage: MountainBackground,
		},
		{
			subHeader: t('home.features.adaptive.subtitle'),
			header: t('home.features.adaptive.title'),
			body: t('home.features.adaptive.description'),
			backgroundImage: FitnessBackground,
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
				headerText={t('home.featureHighlights.title')}
				subHeaderText={t('home.featureHighlights.subtitle')}
				align="center"
			/>
			<HighlightCardWrapper>
				{highlights.map((highlight, index) => (
					<HighlightCard key={index} $backgroundimage={highlight.backgroundImage}>
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
