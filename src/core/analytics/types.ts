/**
 * Shared types for the conversion tracker.
 *
 * See CONVERSION_TRACKING_DESIGN.md §3.2 for the event envelope contract.
 */

import type { ConversionStage, DestinationId } from './conversionEvents';

export type Channel =
	| 'none'
	| 'google'
	| 'bing'
	| 'yahoo'
	| 'facebook'
	| 'twitter'
	| 'linkedin'
	| 'instagram'
	| 'pinterest'
	| 'reddit'
	| 'youtube'
	| 'tiktok'
	| 'other';

export type ClickIds = {
	gclid?: string;
	gbraid?: string;
	wbraid?: string;
	fbclid?: string;
	rdt_cid?: string;
	twclid?: string;
	msclkid?: string;
	/** Networks added through VITE_CLICK_ID_RULES. */
	[param: string]: string | undefined;
};

export type Attribution = {
	source?: string;
	medium?: string;
	campaign?: string;
	content?: string;
	term?: string;
	/** The `?ref=` param already understood by TilerFront's ReferralController. */
	ref?: string;
	/** The `?ad=` flag already understood by TilerFront's ReferralController. */
	isAd: boolean;
	channel: Channel;
	clickIds: ClickIds;
	landingPath: string;
	referrer?: string;
	capturedAt: string;
};

export type ConsentMode = 'bypass' | 'enforce';

export type ConsentSnapshot = {
	mode: ConsentMode;
	grantedBy: 'config' | 'user' | 'none';
	analytics: boolean;
	marketing: boolean;
};

/** Stage-specific detail. Scalars only, so every destination can serialise it. */
export type ConversionProperties = Record<string, string | number | boolean | undefined>;

export type ConversionEventPage = {
	path: string;
	referrer: string;
	title: string;
};

export type ConversionEvent = {
	/** Identical on the browser pixel and the server CAPI call. Powers deduplication. */
	eventId: string;
	stage: ConversionStage;
	occurredAt: string;
	anonymousId: string;
	sessionId: string;
	userId?: string;
	/** SHA-256 of the lowercased, trimmed email. Raw email never leaves the server. */
	emailSha256?: string;
	value?: number;
	currency?: string;
	properties?: ConversionProperties;
	firstTouch: Attribution | null;
	lastTouch: Attribution | null;
	page: ConversionEventPage;
	consent: ConsentSnapshot;
};

/**
 * A silent no-op is the most common tracking failure, so every outcome is named.
 */
export type SendStatus =
	| 'sent'
	| 'queued'
	| 'skipped:not-configured'
	| 'skipped:no-consent'
	| 'error';

export type DestinationLogLine = {
	destination: DestinationId | 'server';
	event: string;
	status: SendStatus;
	detail?: string;
};
