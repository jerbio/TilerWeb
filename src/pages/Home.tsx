import React from 'react';
import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import VideoIframeSection from '../components/home/video_iframe_section';
import Waitlist from '../components/home/waitlist_input';
import AppDownloadSection from '../components/home/app_download_section';
import FAQ from '../components/home/faq_section';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
	const { t } = useTranslation();
	const params = new URLSearchParams(window.location.search);
	const waitlistSignUp = params.get('waitlistSignUp') === 'true';

	return (
		<>
			<PersonaCarousel />
			<VideoIframeSection
				src="https://www.youtube.com/embed/N3L49xMBZ60?si=BmQ0wHBvThDCh5Zc"
				title={t('home.video.title')}
				width={1024}
				allowFullScreen={true}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				waitlistSignUp={waitlistSignUp}
			/>
			<Waitlist />
			<AppDownloadSection />
			<FeatureHighlightsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<HeroSection />
      <FAQ />
		</>
	);
};

export default Home;

