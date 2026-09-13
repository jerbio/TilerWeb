import TimeUtil from '@/core/util/time';
import { postBeacon } from './beacon';
import { analyticsConfig } from './config';
import { trackConversion } from './conversionTracker';
import { getAnonymousId } from './identity';

/**
 * Funnel call sites, kept out of the UI components.
 *
 * The rules that decide whether a stage counts — anonymous vs authenticated, and
 * what the once-guard is scoped to — live here so they are unit tested, and each
 * component is left with a single unambiguous call.
 */

export type DemoStartedInput = {
	personaId: string;
	personaName?: string;
	/** Persona demos only count while the visitor is unauthenticated. */
	isAnonymous: boolean;
};

export const trackDemoStarted = ({
	personaId,
	personaName,
	isAnonymous,
}: DemoStartedInput): void => {
	if (!isAnonymous) return;

	trackConversion('demo_started', {
		once: true,
		// Per persona: trying a second persona is a distinct engagement.
		dedupeKey: `persona:${personaId}`,
		properties: { personaId, personaName },
	});
};

export type DemoEngagedInput = {
	personaId?: string;
	messageLength: number;
	isAnonymous: boolean;
};

export const trackDemoEngaged = ({
	personaId,
	messageLength,
	isAnonymous,
}: DemoEngagedInput): void => {
	if (!isAnonymous || messageLength <= 0) return;

	trackConversion('demo_engaged', {
		once: true,
		dedupeKey: `persona:${personaId ?? 'unknown'}`,
		properties: { personaId, messageLength },
	});
};

export type CtaClickedInput = {
	label: string;
	location: string;
	destination: string;
	/** Distinguishes the hero's primary, secondary, and in-demo nudge. */
	ctaRole?: string;
	/** Experiment arm, for call sites the envelope stamp cannot infer. */
	variant?: string;
};

export const trackCtaClicked = ({
	label,
	location,
	destination,
	ctaRole,
	variant,
}: CtaClickedInput): void => {
	trackConversion('cta_clicked', {
		once: false,
		properties: { label, location, destination, ctaRole, variant },
	});
};

export type ActivatedInput = {
	userId?: string;
	isAuthenticated: boolean;
};

export const trackActivated = ({ userId, isAuthenticated }: ActivatedInput): void => {
	if (!isAuthenticated || !userId) return;

	trackConversion('activated', { once: true, dedupeKey: userId, userId });
};

export const LINKED_KEY_PREFIX = 'tiler_cvn_linked:';

// Only consulted when localStorage is unavailable, e.g. private browsing.
const linkedThisSession = new Set<string>();

const alreadyLinked = (key: string): boolean => {
	try {
		return localStorage.getItem(key) !== null;
	} catch {
		return linkedThisSession.has(key);
	}
};

/**
 * Ties the anonymous visitor to the account they signed into.
 *
 * Runs on sign-in as well as sign-up: signing in is not a conversion, but it is the
 * only moment both identities are known, and without the link every pre-auth event
 * stays orphaned. Never throws — a failed link must not break authentication.
 */
export const linkConversionIdentity = async (userId: string | undefined): Promise<void> => {
	if (!userId) return;

	// Persisted, not just in-memory: otherwise every page reload re-posts the alias.
	const guardKey = `${LINKED_KEY_PREFIX}${userId}`;
	if (alreadyLinked(guardKey)) return;

	linkedThisSession.add(guardKey);
	try {
		localStorage.setItem(guardKey, TimeUtil.nowISO());
	} catch {
		// Guard degrades to in-memory; the server also dedupes the alias pair.
	}

	try {
		await postBeacon(analyticsConfig.aliasEndpoint, {
			anonymousId: getAnonymousId(),
			userId,
		});
	} catch {
		// Reporting only; the server also links from any conversion carrying a userId.
	}
};
