import TimeUtil from '@/core/util/time';
import { getFirstTouch, getLastTouch } from './attribution';
import { postBeacon, type BeaconResult } from './beacon';
import { analyticsConfig, isAutomatedRender } from './config';
import { resolveConsent } from './consentMode';
import type { ConversionStage } from './conversionEvents';
import { logConversion, logInit } from './debugLog';
import { defaultDestinations } from './destinations';
import { createDestinationRegistry, type DestinationRegistry } from './destinations/registry';
import { getAnonymousId, getSessionId } from './identity';
import { getConversionExperiments } from '@/core/experiments/current';
import type {
	ConsentSnapshot,
	ConversionEvent,
	ConversionExperiment,
	ConversionProperties,
	DestinationLogLine,
} from './types';

export const FIRED_KEY_PREFIX = 'tiler_cvn_fired:';

/** Stages that must never be counted twice for the same subject. */
const ONCE_PER_SUBJECT: ReadonlySet<ConversionStage> = new Set<ConversionStage>([
	'signup_verified',
	'activated',
	'waitlist_joined',
]);

export type TrackOptions = {
	userId?: string;
	emailSha256?: string;
	value?: number;
	currency?: string;
	/** Stage-specific detail merged into the envelope. */
	properties?: ConversionProperties;
	/** Overrides the default once-per-subject behaviour for the stage. */
	once?: boolean;
	/** Identity the guard is scoped to. Defaults to userId, then anonymousId. */
	dedupeKey?: string;
};

export type TrackerDeps = {
	registry: Pick<DestinationRegistry, 'dispatch' | 'initAll'>;
	post: (url: string, payload: unknown) => Promise<BeaconResult>;
	log: typeof logConversion;
	resolveConsentFn: () => ConsentSnapshot;
	isAutomated: () => boolean;
	endpoint: string;
	experiments: () => ConversionExperiment[] | undefined;
};

const newEventId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const alreadyFired = (key: string): boolean => {
	try {
		return localStorage.getItem(key) !== null;
	} catch {
		return false;
	}
};

const markFired = (key: string): void => {
	try {
		localStorage.setItem(key, TimeUtil.nowISO());
	} catch {
		// Guard degrades to in-memory; the server dedup is the second line of defence.
	}
};

export const createConversionTracker = (deps: Partial<TrackerDeps> = {}) => {
	const {
		registry = createDestinationRegistry(defaultDestinations()),
		post = postBeacon,
		log = logConversion,
		resolveConsentFn = resolveConsent,
		isAutomated = isAutomatedRender,
		endpoint = analyticsConfig.conversionEndpoint,
		experiments = getConversionExperiments,
	} = deps;

	// In-memory mirror of the persisted guard so a StrictMode double-invocation in
	// the same tick cannot slip through between two localStorage reads.
	const firedThisSession = new Set<string>();

	/**
	 * Brings every configured, consented pixel up before any conversion fires, so a
	 * click id in the entry URL is exchanged for the vendor cookie while it is still
	 * there. Safe to call repeatedly; the registry only loads each destination once.
	 */
	const init = (): DestinationLogLine[] => {
		if (isAutomated()) return [];

		try {
			const lines = registry.initAll(resolveConsentFn());
			logInit(lines);
			return lines;
		} catch {
			return [];
		}
	};

	const track = (stage: ConversionStage, options: TrackOptions = {}): ConversionEvent | null => {
		if (isAutomated()) return null;

		const anonymousId = getAnonymousId();
		const once = options.once ?? ONCE_PER_SUBJECT.has(stage);
		const guardKey = `${FIRED_KEY_PREFIX}${stage}:${options.dedupeKey ?? options.userId ?? anonymousId}`;

		if (once && (firedThisSession.has(guardKey) || alreadyFired(guardKey))) {
			return null;
		}
		if (once) {
			firedThisSession.add(guardKey);
			markFired(guardKey);
		}

		const consent = resolveConsentFn();

		let arms: ConversionExperiment[] | undefined;
		try {
			arms = experiments();
		} catch {
			// A broken experiment must never cost a conversion.
			arms = undefined;
		}

		const event: ConversionEvent = {
			eventId: newEventId(),
			stage,
			occurredAt: TimeUtil.nowISO(),
			anonymousId,
			sessionId: getSessionId(),
			userId: options.userId,
			emailSha256: options.emailSha256,
			value: options.value,
			currency: options.currency,
			properties: options.properties,
			firstTouch: getFirstTouch(),
			lastTouch: getLastTouch(),
			page: {
				path: window.location.pathname,
				referrer: document.referrer,
				title: document.title,
			},
			experiments: arms,
			consent,
		};

		let lines: DestinationLogLine[] = [];
		try {
			lines = registry.dispatch(event, consent);
		} catch {
			lines = [{ destination: 'ga4', event: stage, status: 'error' }];
		}

		const serverLine: DestinationLogLine = {
			destination: 'server',
			event: 'POST',
			status: 'queued',
		};
		try {
			void post(endpoint, event).catch(() => undefined);
		} catch {
			serverLine.status = 'error';
		}

		log(event, [...lines, serverLine]);

		return event;
	};

	return { track, init };
};

export const conversionTracker = createConversionTracker();

export const trackConversion = (
	stage: ConversionStage,
	options?: TrackOptions
): ConversionEvent | null => conversionTracker.track(stage, options);

export const initConversionDestinations = (): DestinationLogLine[] => conversionTracker.init();
