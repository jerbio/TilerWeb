import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';

function Home() {
	return (
		<>
			<PersonaCarousel />
			<FeatureHighlightsSection />
			<TileCardSection />
			<CalendarIntegrationSection />
			<HeroSection />
		</>
	);
}

export default Home;
