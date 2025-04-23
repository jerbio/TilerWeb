import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import VideoIframeSection from '../components/home/video_iframe_section';

function Home() {
	return (
		<>
			<PersonaCarousel />
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
		</>
	);
}

export default Home;
