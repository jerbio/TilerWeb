import { describe, expect, it } from 'vitest';
import {
	CONVERSION_STAGES,
	ConversionStage,
	DESTINATION_EVENTS,
	isConversionStage,
	stageIndex,
} from './conversionEvents';

const ALL_DESTINATIONS = ['ga4', 'google_ads', 'meta', 'reddit', 'x'] as const;

describe('conversion stage registry', () => {
	it('declares the nine funnel stages in funnel order', () => {
		expect(CONVERSION_STAGES).toEqual([
			'landing',
			'demo_started',
			'demo_engaged',
			'cta_clicked',
			'signup_started',
			'signup_verified',
			'activated',
			'waitlist_joined',
			'store_click',
		]);
	});

	it('exposes a stable ordinal for each stage', () => {
		expect(stageIndex('landing')).toBe(0);
		expect(stageIndex('signup_verified')).toBe(5);
		expect(stageIndex('store_click')).toBe(8);
	});

	it('narrows unknown strings', () => {
		expect(isConversionStage('signup_verified')).toBe(true);
		expect(isConversionStage('not_a_stage')).toBe(false);
	});
});

describe('destination event mapping', () => {
	it('has an entry for every declared stage', () => {
		for (const stage of CONVERSION_STAGES) {
			expect(DESTINATION_EVENTS[stage]).toBeDefined();
		}
	});

	it('does not map stages that were never declared', () => {
		const mapped = Object.keys(DESTINATION_EVENTS) as ConversionStage[];
		expect(mapped.sort()).toEqual([...CONVERSION_STAGES].sort());
	});

	it('only ever references known destinations', () => {
		for (const stage of CONVERSION_STAGES) {
			for (const destination of Object.keys(DESTINATION_EVENTS[stage])) {
				expect(ALL_DESTINATIONS).toContain(destination);
			}
		}
	});

	it('maps the primary conversion onto every destination', () => {
		const mapping = DESTINATION_EVENTS.signup_verified;
		expect(mapping.ga4).toBe('sign_up');
		expect(mapping.meta).toBe('CompleteRegistration');
		expect(mapping.reddit).toBe('SignUp');
		expect(mapping.google_ads).toBe('signup');
		expect(mapping.x).toBe('signup');
	});

	it('maps the waitlist onto the lead events', () => {
		const mapping = DESTINATION_EVENTS.waitlist_joined;
		expect(mapping.ga4).toBe('generate_lead');
		expect(mapping.meta).toBe('Lead');
		expect(mapping.reddit).toBe('Lead');
	});

	it('sends upper-funnel stages to GA4 only, never to the ad platforms', () => {
		for (const stage of ['demo_started', 'demo_engaged', 'cta_clicked'] as const) {
			const mapping = DESTINATION_EVENTS[stage];
			expect(mapping.ga4).toBeDefined();
			expect(mapping.meta).toBeUndefined();
			expect(mapping.reddit).toBeUndefined();
			expect(mapping.x).toBeUndefined();
			expect(mapping.google_ads).toBeUndefined();
		}
	});
});
