/**
 * Exposure reporting.
 *
 * Exposure is not mount. Mount fires for prefetch, for crawlers that run
 * JavaScript, and for tabs that never reach the fold. The viewport and dwell
 * gate lives in `useExperiment`; this module owns the once-per-session guard,
 * the payload, and the beacon.
 */

import TimeUtil from '@/core/util/time';
import { getFirstTouch } from '@/core/analytics/attribution';
import { postBeacon, type BeaconResult } from '@/core/analytics/beacon';
import { analyticsConfig } from '@/core/analytics/config';
import { getAnonymousId, getSessionId } from '@/core/analytics/identity';
import type { Attribution } from '@/core/analytics/types';
import { shouldRecordExposure } from './assignment';
import {
	EXPOSED_KEY_PREFIX,
	hasExposed,
	markExposed,
	readLandingPath,
	readLocale,
	writePin,
} from './environment';
import type { Assignment, ExposurePayload } from './types';

export type ExposureDeps = {
	post: (url: string, payload: unknown) => Promise<BeaconResult>;
	endpoint: string;
	anonymousId: () => string;
	sessionId: () => string;
	firstTouch: () => Attribution | null;
	locale: () => string;
	landingPath: () => string;
	newEventId: () => string;
	exposed: (key: string) => boolean;
	markSeen: (key: string, at: string) => void;
	pin: (experimentKey: string, variant: Assignment['variant']) => void;
};

const newEventId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createExposureTracker = (deps: Partial<ExposureDeps> = {}) => {
	const {
		post = postBeacon,
		endpoint = analyticsConfig.experimentExposureEndpoint,
		anonymousId = getAnonymousId,
		sessionId = getSessionId,
		firstTouch = getFirstTouch,
		locale = readLocale,
		landingPath = readLandingPath,
		newEventId: makeEventId = newEventId,
		exposed = hasExposed,
		markSeen = markExposed,
		pin = writePin,
	} = deps;

	// Mirrors the persisted guard so a StrictMode double-invoke in one tick cannot
	// slip between two storage reads.
	const firedThisSession = new Set<string>();

	const track = (assignment: Assignment): ExposurePayload | null => {
		if (!shouldRecordExposure(assignment)) return null;

		const session = sessionId();
		const guardKey = `${EXPOSED_KEY_PREFIX}${assignment.experimentKey}:${session}`;

		if (firedThisSession.has(guardKey) || exposed(guardKey)) return null;
		firedThisSession.add(guardKey);

		const occurredAt = TimeUtil.nowISO();

		// Persistence is best-effort. `firedThisSession` already holds the guard for
		// this page, so a storage failure costs a duplicate across reloads at worst —
		// never a hero that fails to render.
		try {
			markSeen(guardKey, occurredAt);

			// Written now rather than at resolve time: a visitor who never saw the hero
			// has no assignment worth preserving across a roster change.
			pin(assignment.experimentKey, assignment.variant);
		} catch {
			// Degrades to per-page. The server's unique index is the real guard.
		}

		const payload: ExposurePayload = {
			eventId: makeEventId(),
			experimentKey: assignment.experimentKey,
			variantKey: assignment.variant,
			anonymousId: anonymousId(),
			sessionId: session,
			occurredAt,
			source: assignment.source === 'pin' ? 'pin' : 'hash',
			forced: assignment.forced,
			locale: locale(),
			landingPath: landingPath(),
			firstTouch: firstTouch(),
		};

		try {
			void post(endpoint, payload).catch(() => undefined);
		} catch {
			// Reporting only. A lost exposure must never surface to the visitor.
		}

		return payload;
	};

	return { track };
};

export const exposureTracker = createExposureTracker();

export const trackExposure = (assignment: Assignment): ExposurePayload | null =>
	exposureTracker.track(assignment);
