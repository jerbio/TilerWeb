import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';
import {
	PageWrapper,
	Hero,
	Badge,
	HeroTitle,
	HeroSubtitle,
	BackgroundBlur,
} from '../components/discover/shared';
import WhatIsTilerSection from '../components/discover/WhatIsTilerSection';
import SetUpTilerSection from '../components/discover/SetUpTilerSection';
import HowToUseTilerSection from '../components/discover/HowToUseTilerSection';
import FeaturesSection from '../components/discover/FeaturesSection';

const Discover: React.FC = () => {
	const { t } = useTranslation();

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: t('discover.seo.title'),
		description: t('discover.seo.description'),
		url: 'https://tiler.app/discover',
	};

	return (
		<>
			<SEO
				title={t('discover.seo.title')}
				description={t('discover.seo.description')}
				canonicalUrl="/discover"
				structuredData={structuredData}
			/>
			<Section>
				<BackgroundBlur />
				<PageWrapper>
					<Hero>
						<Badge>{t('discover.hero.badge')}</Badge>
						<HeroTitle>{t('discover.hero.title')}</HeroTitle>
						<HeroSubtitle>{t('discover.hero.subtitle')}</HeroSubtitle>
					</Hero>

					<WhatIsTilerSection />
					<SetUpTilerSection />
					<HowToUseTilerSection />
					<FeaturesSection />
				</PageWrapper>
			</Section>
		</>
	);
};

export default Discover;
