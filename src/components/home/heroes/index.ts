/**
 * Registry binding an arm key to its component.
 *
 * The only place that mapping exists. Adding an arm is one entry here plus one in
 * the experiment roster; nothing else in the app knows the arms by name.
 */

import React from 'react';
import type { HeroVariantKey } from '@/core/experiments';
import HeroSection from '../hero_section';
import HeroCapacityCheck from './hero_capacity_check';
import HeroNlScheduling from './hero_nl_scheduling';
import HeroSelfHealing from './hero_self_healing';
import HeroStopDeciding from './hero_stop_deciding';
import HeroTaskSplitting from './hero_task_splitting';

/**
 * `control` is the live hero, untouched. Extracting it would risk changing the
 * baseline the other four are measured against.
 */
export const HERO_COMPONENTS: Record<HeroVariantKey, React.ComponentType> = {
	control: HeroSection,
	nl_scheduling: HeroNlScheduling,
	stop_deciding: HeroStopDeciding,
	self_healing: HeroSelfHealing,
	task_splitting: HeroTaskSplitting,
	capacity_check: HeroCapacityCheck,
};

export const getHeroComponent = (variant: HeroVariantKey): React.ComponentType =>
	HERO_COMPONENTS[variant] ?? HeroSection;
