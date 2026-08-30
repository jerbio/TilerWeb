import { analyticsConfig } from '../config';
import { createGa4Destination } from './ga4';
import { createGoogleAdsDestination } from './googleAds';
import { createMetaDestination } from './meta';
import { createRedditDestination } from './reddit';
import { createXDestination } from './x';
import type { ConversionDestination } from './types';

export { createGa4Destination } from './ga4';
export { createGoogleAdsDestination } from './googleAds';
export { createMetaDestination } from './meta';
export { createRedditDestination } from './reddit';
export { createXDestination } from './x';
export { createDestinationRegistry } from './registry';
export type { ConversionDestination } from './types';

/**
 * Every destination is always registered; an unconfigured one reports
 * `skipped:not-configured` rather than vanishing, so a missing pixel id is
 * visible in the console instead of being a silent no-op.
 */
export const defaultDestinations = (): ConversionDestination[] => [
	createGa4Destination(() => analyticsConfig.ga4MeasurementId),
	createGoogleAdsDestination({
		getId: () => analyticsConfig.googleAdsId,
		getLabels: () => analyticsConfig.googleAdsLabels,
	}),
	createMetaDestination(() => analyticsConfig.metaPixelId),
	createRedditDestination(() => analyticsConfig.redditPixelId),
	createXDestination({
		getId: () => analyticsConfig.xPixelId,
		getEventIds: () => analyticsConfig.xEventIds,
	}),
];
