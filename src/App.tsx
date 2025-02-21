import './App.css';
import Navigation from './components/navigation';
import FeatureHighlightsSection from './components/feature_highlights_section';
import TileCardSection from './components/tile_card_section';
import HeroSection from './components/hero_section';

function App() {
	return (
		<>
			<Navigation />
			<FeatureHighlightsSection />
			<TileCardSection />
      <HeroSection />
		</>
	);
}

export default App;
