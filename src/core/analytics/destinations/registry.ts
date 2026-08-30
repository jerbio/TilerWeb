import { DESTINATION_EVENTS, type DestinationId } from '../conversionEvents';
import type { ConsentSnapshot, ConversionEvent, DestinationLogLine } from '../types';
import type { ConversionDestination } from './types';

/**
 * Fans a conversion out to every configured, consented destination.
 *
 * One destination throwing must never stop the others: a broken pixel is a
 * reporting problem, a broken chain is a data-loss problem.
 */
export const createDestinationRegistry = (destinations: ConversionDestination[]) => {
	const loaded = new Set<DestinationId>();

	const ensureLoaded = (destination: ConversionDestination): void => {
		if (loaded.has(destination.id)) return;
		destination.load();
		loaded.add(destination.id);
		destination.trackPageVisit?.();
	};

	return {
		/**
		 * Installs every configured, consented pixel on entry.
		 *
		 * Loading lazily on first matching conversion is too late: the vendor cookie
		 * that a conversion matches on is only minted while the click id is still in
		 * the URL, so the pixels have to be up from the landing page.
		 */
		initAll(consent: ConsentSnapshot): DestinationLogLine[] {
			return destinations.map((destination) => {
				let status: DestinationLogLine['status'];
				try {
					if (!destination.isConfigured()) {
						status = 'skipped:not-configured';
					} else if (!consent[destination.consentCategory]) {
						status = 'skipped:no-consent';
					} else {
						ensureLoaded(destination);
						status = 'sent';
					}
				} catch {
					status = 'error';
				}

				return { destination: destination.id, event: 'init', status };
			});
		},

		dispatch(event: ConversionEvent, consent: ConsentSnapshot): DestinationLogLine[] {
			const mapping = DESTINATION_EVENTS[event.stage] ?? {};
			const lines: DestinationLogLine[] = [];

			for (const destination of destinations) {
				const eventName = mapping[destination.id];
				if (!eventName) continue;

				let status: DestinationLogLine['status'];
				try {
					if (!destination.isConfigured()) {
						status = 'skipped:not-configured';
					} else if (!consent[destination.consentCategory]) {
						status = 'skipped:no-consent';
					} else {
						ensureLoaded(destination);
						status = destination.send(event, eventName);
					}
				} catch {
					status = 'error';
				}

				lines.push({ destination: destination.id, event: eventName, status });
			}

			return lines;
		},
	};
};

export type DestinationRegistry = ReturnType<typeof createDestinationRegistry>;
