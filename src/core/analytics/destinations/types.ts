import type { DestinationId } from '../conversionEvents';
import type { ConversionEvent, SendStatus } from '../types';

/**
 * Contract every ad destination implements.
 *
 * Adapters read consent only through the snapshot handed to the registry, never
 * from the consent manager directly, so the `bypass` -> `enforce` flip needs no
 * adapter changes.
 */
export interface ConversionDestination {
	id: DestinationId;
	consentCategory: 'analytics' | 'marketing';
	isConfigured(): boolean;
	/** Injects the vendor script. Called at most once, and only when consented. */
	load(): void;
	/**
	 * The platform's base page event, fired once immediately after `load()`.
	 *
	 * This is what exchanges a click id (`fbclid`, `rdt_cid`) for the vendor's
	 * first-party cookie. Without it a later conversion has nothing to match on.
	 * Omit where the vendor's init call already counts as a page view.
	 */
	trackPageVisit?(): void;
	/** `eventName` is the value resolved from DESTINATION_EVENTS for this stage. */
	send(event: ConversionEvent, eventName: string): SendStatus;
}

export type Windowish = Window & Record<string, unknown>;

export const getWindow = (): Windowish => window as unknown as Windowish;

export const injectScript = (src: string, marker: string): void => {
	if (typeof document === 'undefined') return;
	if (document.querySelector(`script[src*="${marker}"]`)) return;

	const script = document.createElement('script');
	script.async = true;
	script.src = src;
	document.head.appendChild(script);
};
