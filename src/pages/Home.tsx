import React from 'react';
import PersonaCarousel from '../components/home/persona_carousel/persona_carousel';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import VideoIframeSection from '../components/home/video_iframe_section';
import Waitlist from '../components/home/waitlist_input';
import AppDownloadSection from '../components/home/app_download_section';
import FAQ from '../components/home/faq_section';
import DemoExplainerSection from '../components/home/demo_explainer_section';
import TestimonialsSection from '../components/home/testimonials_section';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';

const Home: React.FC = () => {
	const { t } = useTranslation();
	const params = new URLSearchParams(window.location.search);
	const waitlistSignUp = params.get('waitlistSignUp') === 'true';

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: 'Tiler - Smart Calendar & Task Management',
		description:
			'Tiler is your intelligent calendar assistant that helps you schedule tasks, manage time, and boost productivity.',
		url: 'https://tiler.app/',
		mainEntity: {
			'@type': 'SoftwareApplication',
			name: 'Tiler',
			applicationCategory: 'ProductivityApplication',
			operatingSystem: 'iOS, Android, Web',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD',
			},
		},
	};

	return (
		<>
			<SEO
				title="Tiler - Smart Calendar & Task Management App"
				description="Tiler is your intelligent calendar assistant that helps you schedule tasks, manage time, and boost productivity. Integrate with Google Calendar, track locations, and never miss a deadline."
				keywords="calendar app, task management, scheduling, productivity, time management, google calendar integration, smart scheduling, task organizer"
				canonicalUrl="/"
				structuredData={structuredData}
			/>
			<HeroSection />
			<VideoIframeSection
				src="https://www.youtube.com/embed/N3L49xMBZ60?si=BmQ0wHBvThDCh5Zc"
				title={t('home.video.title')}
				width={1024}
				allowFullScreen={true}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				waitlistSignUp={waitlistSignUp}
			/>
			<DemoExplainerSection />
			<PersonaCarousel />
			<FeatureHighlightsSection />
			<TestimonialsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<FAQ />
			<Waitlist />
			<AppDownloadSection />
		</>
	);
};

export default Home;
