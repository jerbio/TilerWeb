import React from 'react';
import PersonaCarousel from '../components/home/persona_carousel/persona_carousel';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroExperiment from '../components/home/hero_experiment';
import VideoIframeSection from '../components/home/video_iframe_section';
import Waitlist from '../components/home/waitlist_input';
import AppDownloadSection from '../components/home/app_download_section';
import FAQ from '../components/home/faq_section';
import DemoExplainerSection from '../components/home/demo_explainer_section';
import TestimonialsSection from '../components/home/testimonials_section';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';

const SITE_URL = 'https://tiler.app';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const Home: React.FC = () => {
	const { t } = useTranslation();
	const params = new URLSearchParams(window.location.search);
	const waitlistSignUp = params.get('waitlistSignUp') === 'true';

	// Keys mirror the FAQ actually rendered by faq_section.tsx so the FAQPage
	// structured data always matches the visible on-page Q&As (localized via i18n).
	const faqKeys = [
		'whatIsTiler',
		'calendarIntegration',
		'multipleCalendars',
		'tileVsBlock',
		'tileShare',
		'missedTask',
		'habitTracking',
		'transitFeature',
	] as const;

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': `${SITE_URL}/#webpage`,
				name: 'Tiler - AI Scheduling Assistant & Smart Calendar',
				description:
					'Tiler is an AI scheduling assistant that turns plain-English requests into a smart, travel-aware schedule that adapts as your day changes.',
				url: `${SITE_URL}/`,
				inLanguage: 'en',
				isPartOf: { '@id': `${SITE_URL}/#website` },
				about: { '@id': `${SITE_URL}/#software` },
				primaryImageOfPage: OG_IMAGE,
			},
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				name: 'Tiler',
				url: `${SITE_URL}/`,
				publisher: { '@id': `${SITE_URL}/#organization` },
			},
			{
				'@type': 'Organization',
				'@id': `${SITE_URL}/#organization`,
				name: 'Tiler',
				url: `${SITE_URL}/`,
				logo: OG_IMAGE,
				sameAs: [
					'https://www.facebook.com/profile.php?id=100094419297775',
					'https://www.linkedin.com/company/tilerapp',
					'https://www.instagram.com/tiler.app/',
					'https://x.com/Tiler_app',
				],
			},
			{
				'@type': 'SoftwareApplication',
				'@id': `${SITE_URL}/#software`,
				name: 'Tiler',
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web, iOS, Android',
				url: `${SITE_URL}/`,
				image: OG_IMAGE,
				description:
					'AI scheduling assistant that builds a smart, location-aware, self-adapting daily schedule from natural language — with automatic travel time, navigation, and team/family task sharing.',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD',
				},
				featureList: [
					'Natural-language AI scheduling',
					'Automatic travel-time calculation',
					'Turn-by-turn navigation between tasks',
					'Location-based scheduling with Google Places',
					'Real-time transit and time-to-leave alerts',
					'TileShare task assignment for teams and family',
					'Adaptive rescheduling with flexible Tiles and fixed Blocks',
					'Google, Outlook and Apple Calendar integration',
					'Confirmation-first AI you approve before changes apply',
					'Cross-platform: Web, iOS and Android',
				],
			},
			{
				'@type': 'FAQPage',
				'@id': `${SITE_URL}/#faq`,
				mainEntity: faqKeys.map((key) => ({
					'@type': 'Question',
					name: t(`home.faq.items.${key}.question`),
					acceptedAnswer: {
						'@type': 'Answer',
						text: t(`home.faq.items.${key}.answer`),
					},
				})),
			},
		],
	};

	return (
		<>
			<SEO
				title="Tiler - AI Scheduling Assistant & Smart Calendar"
				description="Stop managing your calendar—talk to it. Tiler's AI builds a smart, travel-aware schedule from plain English and adapts as your day changes. Try free."
				keywords="AI scheduling assistant, AI calendar app, smart calendar app, AI schedule planner, natural language calendar, automatic scheduling app, time blocking app, calendar with travel time, adaptive schedule, voice calendar assistant, AI task management"
				canonicalUrl="/"
				structuredData={structuredData}
			/>
			<HeroExperiment />
			<AppDownloadSection />
			<VideoIframeSection
				src="https://www.youtube.com/embed/87RGNntLBRY"
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
			<div style={{ paddingBottom: '4rem' }}>
				<Waitlist />
			</div>
		</>
	);
};

export default Home;
