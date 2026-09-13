import { getDebugLevel, type DebugLevel } from './config';
import type { ConversionEvent, DestinationLogLine } from './types';

/**
 * Structured, greppable conversion logging.
 *
 * The console records intent (what the tracker decided to send); an exported HAR
 * records truth (what actually left the browser). Reconciling the two is the
 * primary verification technique — see CONVERSION_TRACKING_DESIGN.md §7.
 */

const PREFIX = '[CVN]';

/** Belt and braces: console logs get pasted into tickets, so no raw address ever ships. */
const redact = (event: ConversionEvent): Record<string, unknown> => {
	const safe: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(event)) {
		if (key === 'emailSha256') {
			safe[key] = value;
			continue;
		}
		if (/e-?mail/i.test(key)) continue;
		safe[key] = value;
	}
	return safe;
};

export const logConversion = (
	event: ConversionEvent,
	lines: DestinationLogLine[],
	level: DebugLevel = getDebugLevel()
): void => {
	if (level === 'off') return;

	try {
		console.groupCollapsed(`${PREFIX} ${event.stage}  eventId=${event.eventId}`);

		if (level === 'verbose') {
			console.log(`${PREFIX} envelope  eventId=${event.eventId}`, redact(event));
		}

		for (const line of lines) {
			console.log(
				`${PREFIX}   -> ${line.destination}  ${line.event}  status=${line.status}` +
					`${line.detail ? `  ${line.detail}` : ''}  eventId=${event.eventId}`
			);
		}
	} catch {
		// Logging must never be able to break a conversion.
	} finally {
		try {
			console.groupEnd();
		} catch {
			// ignore
		}
	}
};

/**
 * Pixel initialisation emits its own network traffic (Reddit `PageVisit`, the X
 * tag, Google's config beacon). Logging it keeps every request in an exported HAR
 * traceable back to a console line rather than looking like an orphan.
 */
export const logInit = (lines: DestinationLogLine[], level: DebugLevel = getDebugLevel()): void => {
	if (level === 'off' || lines.length === 0) return;

	try {
		console.groupCollapsed(`${PREFIX} init  destinations=${lines.length}`);
		for (const line of lines) {
			console.log(`${PREFIX}   -> ${line.destination}  init  status=${line.status}`);
		}
	} catch {
		// Logging must never be able to break initialisation.
	} finally {
		try {
			console.groupEnd();
		} catch {
			// ignore
		}
	}
};
