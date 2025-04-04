import FeatureCard from '../components/features/FeatureCard';
import DottedLine from '/assets/dotted-line.svg';

const featureList = [
	{
		title: 'Share the load with TileShare!',
		description:
			'Effortlessly assign, share, and track tasks with TileShare—where teamwork meets smart scheduling.',
		image: '/assets/features/collab.png',
	},
	{
		title: 'Find your route with Transit',
		description:
			"Navigate like a pro! Get real-time routes, travel estimates, and transit options to keep you on track. Whether you're commuting by car, bike, or public transport",
		image: '/assets/features/transit.png',
	},
	{
		title: 'Stop searching for time, Forecast!',
		description:
			"Find free time in your day for activities you love and easily slot them in. Whether it's a quick workout, a coffee break, or time to unwind.",
		image: '/assets/features/timely.png',
	},
	{
		title: 'Auto Location in 2 secs',
		description:
			'Need to assign location-based tasks or coordinate with your team geographically? Auto Location provides your precise location in an instant.',
		image: '/assets/features/auto-loc.png',
	},
];

function Features() {
	return (
		<main className="grid place-items-center relative">
			<div className="container relative isolate">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 hidden lg:block">
					<img src={DottedLine} alt="null" />
				</div>
				<div className="grid gap-16 py-8 lg:py-12 place-items-center">
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
				</div>
			</div>
		</main>
	);
}

export default Features;

