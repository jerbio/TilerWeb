import React from 'react';
import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import '../i18n/config';

import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
	const { t, i18n  } = useTranslation();

	const changeLanguage = (lng: string | undefined) => {
		i18n.changeLanguage(lng);
	  };
	return (
		<>
			<div>{t('welcome')}</div>
			<button type="button" onClick={() => changeLanguage('es')}>
          es
        </button>
		<button type="button" onClick={() => changeLanguage('en')}>
          en
        </button>
			<PersonaCarousel />
			<FeatureHighlightsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<HeroSection />
		</>
	);
}

export default Home;

