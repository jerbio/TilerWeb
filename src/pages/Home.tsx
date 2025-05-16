import PersonaCarousel from '../components/home/persona_carousel_section';
import FeatureHighlightsSection from '../components/home/feature_highlights_section';
import TileCardSection from '../components/home/tile_card_section';
import CalendarIntegrationSection from '../components/home/integration_section';
import HeroSection from '../components/home/hero_section';
import VideoIframeSection from '../components/home/video_iframe_section';
import Waitlist from '../components/home/waitlist_input';
import styled from 'styled-components';
import styles from '../util/styles';

const Main = styled.main`
	display: grid;
	place-items: center;
	position: relative;
	width: 100%;
	min-height: 100vh;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;

	max-width: ${styles.container.sizes.xLarge};
	margin: 0 auto;
	padding: 0 ${styles.container.padding.default};

	@media (min-width: ${styles.screens.lg}) {
		padding: 0 ${styles.container.padding.lg};
	}
`;

function Home() {
	return (
		<Main>
			<Container>
				<PersonaCarousel />
				<VideoIframeSection
					src="https://www.youtube.com/embed/N3L49xMBZ60?si=BmQ0wHBvThDCh5Zc"
					title="YouTube video player"
					width="1024"
					allowFullScreen={true}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				/>
				<Waitlist />
				<FeatureHighlightsSection />
				<TileCardSection />
				<CalendarIntegrationSection />
				<HeroSection />
			</Container>
		</Main>
	);
}

export default Home;

