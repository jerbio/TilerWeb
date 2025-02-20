import './App.css';
import Navigation from './components/navigation';
import TileCardSection from './components/tile_card_section';
import FeatureHighlightsSection from './components/feature_highlights_section';

function App() {
	return (
		<>
			<Navigation />
			<FeatureHighlightsSection />
			<TileCardSection />
		</>
	);
}

export default App;
