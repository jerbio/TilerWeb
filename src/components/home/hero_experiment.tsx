/**
 * Entry point for the hero experiment.
 *
 * `Home` renders this instead of a fixed hero. The arm is already resolved by the
 * time this mounts — `useHeroExperiment` reads a module-scope value — so the first
 * paint is the final arm and there is no swap.
 */

import React from 'react';
import { useHeroExperiment } from '@/core/experiments';
import HeroSection from './hero_section';
import HeroBoundary from './heroes/hero_boundary';
import { getHeroComponent } from './heroes';

const HeroExperiment: React.FC = () => {
	const { assignment, ref } = useHeroExperiment();
	const Variant = getHeroComponent(assignment.variant);

	return (
		<div ref={ref} data-hero-variant={assignment.variant}>
			<HeroBoundary variant={assignment.variant} fallback={<HeroSection />}>
				<Variant />
			</HeroBoundary>
		</div>
	);
};

export default HeroExperiment;
