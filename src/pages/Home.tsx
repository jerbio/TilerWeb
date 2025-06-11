import React from 'react';
import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import VideoIframeSection from '../components/home/video_iframe_section';
import Waitlist from '../components/home/waitlist_input';
import iosIcon from '../assets/image_assets/features/ios.png';
import androidIcon from '../assets/image_assets/features/android.png';
import UpdatesSection from '../components/home/updates_section';

// Simple i18n object for demonstration
const i18n = {
	en: {
		downloadIOS: 'Download on iOS',
		downloadAndroid: 'Download on Android',
	},
	// Add more languages as needed
};
const lang = 'en'; // This could be dynamic

// interface HomeProps {}
const Home: React.FC = () => {
	const params = new URLSearchParams(window.location.search);
	const waitlistSignUp = params.get('waitlistSignUp') === 'true';

	const openUrl = (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<>
			<PersonaCarousel />
			<VideoIframeSection
				src="https://www.youtube.com/embed/N3L49xMBZ60?si=BmQ0wHBvThDCh5Zc"
				title="YouTube video player"
				width={1024}
				allowFullScreen={true}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				waitlistSignUp={waitlistSignUp}
			/>
			<Waitlist />
			{/* App Download Section */}
			<div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', margin: '2rem 0' }}>
				<button
					style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
					onClick={() => openUrl('https://apps.apple.com/us/app/tiler-assistant/id1663594789')}
					title={i18n[lang].downloadIOS}
				>
					<img src={iosIcon} alt="iOS" style={{ width: 56, height: 56 }} />
					<span style={{ color: '#fff', marginTop: 8 }}>{i18n[lang].downloadIOS}</span>
				</button>
				<button
					style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
					onClick={() => openUrl('https://play.google.com/store/apps/details?id=app.tiler.app')}
					title={i18n[lang].downloadAndroid}
				>
					<img src={androidIcon} alt="Android" style={{ width: 56, height: 56 }} />
					<span style={{ color: '#fff', marginTop: 8 }}>{i18n[lang].downloadAndroid}</span>
				</button>
			</div>
			<FeatureHighlightsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<HeroSection />
      
		</>
	);
};

export default Home;

