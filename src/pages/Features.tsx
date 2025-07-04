import styled from 'styled-components';
import styles from '../util/styles';
import FeatureCard from '../components/features/FeatureCard';
import DottedLine from '../assets/image_assets/dotted-line.svg';

// Image imports
import FeatureCollab from '../assets/image_assets/features/collab.png';
import FeatureTransit from '../assets/image_assets/features/transit.png';
import FeatureTimely from '../assets/image_assets/features/timely.png';
import FeatureAutoLoc from '../assets/image_assets/features/auto-loc.png';
import Section from '../components/layout/section';
import UpdatesSection from '../components/home/updates_section';

const BackgroundBlur = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: -10;
	width: 1200px;
	height: 1200px;
	background: linear-gradient(
		135deg,
		${styles.colors.brand[500]}20,
		${styles.colors.brand[500]}10,
		${styles.colors.brand[500]}20
	);
	border-radius: 50%;
	filter: blur(120px);
`;

const GridContainer = styled.div`
	display: grid;
	gap: 4rem;
	padding: 2rem 0;
	place-items: center;

	@media (min-width: ${styles.screens.lg}) {
		padding: 3rem 0;
	}
`;

const DottedLineImage = styled.img`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: none;

	@media (min-width: ${styles.screens.lg}) {
		display: block;
	}
`;

const featureList = [
	{
		title: 'Share the load with TileShare!',
		description:
			'Effortlessly assign, share, and track tasks with TileShare—where teamwork meets smart scheduling.',
		image: FeatureCollab,
	},
	{
		title: 'Find your route with Transit',
		description:
			"Navigate like a pro! Get real-time routes, travel estimates, and transit options to keep you on track. Whether you're commuting by car, bike, or public transport",
		image: FeatureTransit,
	},
	{
		title: 'Stop searching for time, Forecast!',
		description:
			"Find free time in your day for activities you love and easily slot them in. Whether it's a quick workout, a coffee break, or time to unwind.",
		image: FeatureTimely,
	},
	{
		title: 'Auto Location in 2 secs',
		description:
			'Need to assign location-based tasks or coordinate with your team geographically? Auto Location provides your precise location in an instant.',
		image: FeatureAutoLoc,
	},
];

export default function Features() {
	return (
		<>
			<Section>
				<BackgroundBlur />
				<DottedLineImage src={DottedLine} alt="null" />
				<GridContainer>
					{featureList.map((item, itemIndex) => (
						<FeatureCard
							key={item.title}
							title={item.title}
							image={item.image}
							reversed={itemIndex % 2 !== 0}
						>
							{item.description}
						</FeatureCard>
					))}
				</GridContainer>
			</Section>
			<UpdatesSection />
		</>
	);
}

