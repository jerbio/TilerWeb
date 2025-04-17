import React from 'react';
import './App.css';
import FeatureHighlightsSection from './components/feature_highlights_section';
import TileCardSection from './components/tile_card_section';
import CalendarIntegrationSection from './components/integration_section';
import HeroSection from './components/hero_section';
import FooterSection from './components/footer_section';
import Chat from './components/Chat';
import Navigation from './components/navigation';
import PersonaCarousel from './components/persona_carousel_section';
import VideoIframeSection from './components/video_iframe_section';

const App: React.FC = () => {
	return (
		<>
			<Navigation />
			<PersonaCarousel />
			<Chat />
			<VideoIframeSection
				src="https://www.youtube.com/embed/N3L49xMBZ60?si=BmQ0wHBvThDCh5Zc"
				title="YouTube video player"
				width="1200"
				height="808"
				allowFullScreen={true}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			/>			
			<FeatureHighlightsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<HeroSection />
			<FooterSection />
		</>
	);
};

export default App;
