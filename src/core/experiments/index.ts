export { resolveVariant, isCountedAssignment, shouldRecordExposure } from './assignment';
export type { ResolveInput } from './assignment';
export { fnv1a32, bucketOf } from './hash';
export { HERO_ROSTER } from './roster';
export { getHeroAssignment, resetHeroAssignment, getConversionExperiments } from './current';
export { createExposureTracker, exposureTracker, trackExposure } from './exposure';
export type { ExposureDeps } from './exposure';
export { useHeroExperiment, EXPOSURE_DWELL_MS, EXPOSURE_VISIBILITY_RATIO } from './useExperiment';
export type { UseHeroExperiment } from './useExperiment';
export {
	HERO_EXPERIMENT_KEY,
	HERO_VARIANT_KEYS,
	CONTROL_VARIANT,
	type Assignment,
	type AssignmentSource,
	type ExperimentAssignmentSnapshot,
	type ExposurePayload,
	type HeroVariantDefinition,
	type HeroVariantKey,
} from './types';
