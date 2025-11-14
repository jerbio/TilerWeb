import React from 'react';
import styled from 'styled-components';
import SectionHeaders from '../layout/section_headers';
import Button from '@/core/common/components/button';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import { Check } from 'lucide-react';
import HeroAnimatedBackground from './hero_animated_background';

const HeroWrapper = styled.div`
	position: relative;
	overflow: hidden;
	min-height: 600px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;

	@media (max-width: ${palette.screens.lg}) {
		min-height: 500px;
		padding: 3rem 1.5rem;
	}

	@media (max-width: ${palette.screens.md}) {
		min-height: 400px;
		padding: 2rem 1rem;
	}
`;

const ContentWrapper = styled.div`
	position: relative;
	z-index: 10;
	max-width: 800px;
	margin: 0 auto;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(10px);
	padding: 3rem 2rem;
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid ${palette.colors.gray[700]}50;

	@media (max-width: ${palette.screens.lg}) {
		padding: 2.5rem 1.5rem;
		background: rgba(0, 0, 0, 0.5);
	}

	@media (max-width: ${palette.screens.md}) {
		padding: 2rem 1rem;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 10px;
	margin-top: 20px;
`;

const FeaturesList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 1.5rem auto 0;
	max-width: 600px;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 1rem;
`;

const FeatureItem = styled.li`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${palette.colors.gray[300]};
	font-size: ${palette.typography.fontSize.sm};
	font-family: ${palette.typography.fontFamily.inter};
`;

const CheckIcon = styled(Check)`
	color: ${palette.colors.brand[400]};
	flex-shrink: 0;
`;

const HeroSection: React.FC = () => {
	const { t } = useTranslation();

	const handleExploreClick = () => {
		const personaCarousel = document.getElementById('persona-carousel');
		if (personaCarousel) {
			personaCarousel.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	return (
		<Section>
			<HeroWrapper>
				{/* Left side: Lunch meeting scenario */}
				<HeroAnimatedBackground position="left" scenarioIndex={0} />
				{/* Right side: Client meeting scenario */}
				<HeroAnimatedBackground position="right" scenarioIndex={2} />
				<ContentWrapper>
					<SectionHeaders
						headerText={t('home.hero.title')}
						subHeaderText={t('home.hero.subtitle')}
						align="center"
						size="large"
					/>
					<FeaturesList>
						<FeatureItem>
							<CheckIcon size={18} />
							{t('home.hero.features.natural')}
						</FeatureItem>
						<FeatureItem>
							<CheckIcon size={18} />
							{t('home.hero.features.adaptive')}
						</FeatureItem>
						<FeatureItem>
							<CheckIcon size={18} />
							{t('home.hero.features.travel')}
						</FeatureItem>
					</FeaturesList>
					<ButtonContainer>
						<Button variant="brand" onClick={handleExploreClick}>{t('common.buttons.explore')}</Button>
					</ButtonContainer>
				</ContentWrapper>
			</HeroWrapper>
		</Section>
	);
};

export default HeroSection;
