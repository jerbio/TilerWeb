/**
 * Single source of truth for the conversion funnel.
 *
 * Call sites reference these constants only — never free-form strings — so a typo
 * is a compile error rather than a junk dimension in a vendor dashboard.
 */

export const CONVERSION_STAGES = [
	'landing',
	'demo_started',
	'demo_engaged',
	'cta_clicked',
	'signup_started',
	'signup_verified',
	'activated',
	'waitlist_joined',
	'store_click',
] as const;

export type ConversionStage = (typeof CONVERSION_STAGES)[number];

export type DestinationId = 'ga4' | 'google_ads' | 'meta' | 'reddit' | 'x';

/**
 * `ga4`, `meta` and `reddit` values are the literal platform event names.
 * `google_ads` and `x` values are logical label keys that the adapter resolves
 * against configuration, because both platforms address conversions by an
 * account-specific id rather than a name.
 */
export type DestinationEventMap = Partial<Record<DestinationId, string>>;

export const DESTINATION_EVENTS: Record<ConversionStage, DestinationEventMap> = {
	landing: { ga4: 'landing' },
	demo_started: { ga4: 'demo_start' },
	demo_engaged: { ga4: 'demo_engage' },
	cta_clicked: { ga4: 'select_content' },
	signup_started: {
		ga4: 'begin_signup',
		google_ads: 'signup_start',
		meta: 'Lead',
		reddit: 'Lead',
		x: 'signup_start',
	},
	signup_verified: {
		ga4: 'sign_up',
		google_ads: 'signup',
		meta: 'CompleteRegistration',
		reddit: 'SignUp',
		x: 'signup',
	},
	// Reddit intentionally omitted pending decision D4 — it has no standard
	// activation event and the Purchase stand-in would pollute revenue reporting.
	activated: {
		ga4: 'activation',
		google_ads: 'activate',
		meta: 'StartTrial',
		x: 'activate',
	},
	waitlist_joined: {
		ga4: 'generate_lead',
		google_ads: 'lead',
		meta: 'Lead',
		reddit: 'Lead',
		x: 'lead',
	},
	store_click: {
		ga4: 'select_content',
		meta: 'ViewContent',
		reddit: 'ViewContent',
	},
};

export const stageIndex = (stage: ConversionStage): number => CONVERSION_STAGES.indexOf(stage);

export const isConversionStage = (value: string): value is ConversionStage =>
	(CONVERSION_STAGES as readonly string[]).includes(value);
