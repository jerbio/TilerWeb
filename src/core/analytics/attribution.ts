import TimeUtil from '@/core/util/time';
import { deriveChannelFromReferrer, normalizeChannel } from './channels';
import { DEFAULT_MIN_CLICK_ID_LENGTH, getClickIdRules, type ClickIdRule } from './clickIdRules';
import type { Attribution, Channel, ClickIds } from './types';

export const FIRST_TOUCH_KEY = 'tiler_analytics_first_touch';
export const LAST_TOUCH_KEY = 'tiler_analytics_last_touch';

const value = (params: URLSearchParams, key: string): string | undefined => {
	const raw = params.get(key)?.trim();
	return raw ? raw : undefined;
};

/**
 * Guards against forwarding a fabricated click id as an ad-platform match key.
 *
 * Reddit reports an unrecognised `click_id` as "Invalid match key" against the whole
 * account, and anyone can put `?rdt_cid=junk` in a URL — a crawler, a QA run, a
 * truncated shared link. Sending nothing is strictly better than sending a bad key.
 * Thresholds are per network and configurable; see clickIdRules.ts.
 */
const CLICK_ID_SHAPE = /^[A-Za-z0-9._~-]+$/;

export const isPlausibleClickId = (
	value: string | undefined,
	minLength: number = DEFAULT_MIN_CLICK_ID_LENGTH
): boolean => {
	const candidate = value?.trim();
	if (!candidate || candidate.length < minLength) return false;
	return CLICK_ID_SHAPE.test(candidate);
};

const deriveChannel = (
	source: string | undefined,
	ref: string | undefined,
	clickIds: ClickIds,
	referrer: string,
	currentHost: string,
	rules: ReadonlyArray<ClickIdRule>
): Channel => {
	const fromSource = normalizeChannel(source);
	if (fromSource !== 'none') return fromSource;

	const fromRef = normalizeChannel(ref);
	if (fromRef !== 'none') return fromRef;

	for (const rule of rules) {
		if (clickIds[rule.param]) return rule.channel;
	}
	return deriveChannelFromReferrer(referrer, currentHost);
};

/**
 * Removes implausible click ids from the address bar.
 *
 * The vendor pixels read `location.search` themselves, so filtering our own payload
 * is not enough — the bad value has to be gone before any pixel is injected.
 * Returns whether anything was removed. Only touches click id params.
 */
export const scrubInvalidClickIds = (): boolean => {
	if (typeof window === 'undefined' || !window.history?.replaceState) return false;

	const url = new URL(window.location.href);
	let removed = false;
	for (const rule of getClickIdRules()) {
		const found = url.searchParams.get(rule.param);
		if (found !== null && !isPlausibleClickId(found, rule.minLength)) {
			url.searchParams.delete(rule.param);
			removed = true;
		}
	}

	if (removed) {
		window.history.replaceState(window.history.state, '', url.toString());
	}
	return removed;
};

export const parseAttribution = (url: string, referrer: string): Attribution => {
	const parsed = new URL(url);
	const params = parsed.searchParams;
	const rules = getClickIdRules();

	const clickIds: ClickIds = {};
	// A dropped click id still tells us which platform sent the visit, so channel
	// derivation reads presence while only plausible values are kept as match keys.
	const presentClickIds: ClickIds = {};
	for (const rule of rules) {
		const found = value(params, rule.param);
		if (!found) continue;
		presentClickIds[rule.param] = found;
		if (isPlausibleClickId(found, rule.minLength)) clickIds[rule.param] = found;
	}

	const source = value(params, 'utm_source');
	const ref = value(params, 'ref');

	return {
		source,
		medium: value(params, 'utm_medium'),
		campaign: value(params, 'utm_campaign'),
		content: value(params, 'utm_content'),
		term: value(params, 'utm_term'),
		ref,
		isAd: Boolean(value(params, 'ad')),
		channel: deriveChannel(source, ref, presentClickIds, referrer, parsed.hostname, rules),
		clickIds,
		landingPath: parsed.pathname,
		referrer: referrer || undefined,
		capturedAt: TimeUtil.nowISO(),
	};
};

/**
 * Whether this entry carries anything worth overwriting last touch with. An
 * in-app navigation with no params must never clobber a real campaign.
 */
export const hasCampaignSignal = (attribution: Attribution): boolean => {
	if (attribution.source || attribution.medium || attribution.campaign || attribution.ref) {
		return true;
	}
	if (Object.keys(attribution.clickIds).length > 0) return true;
	return Boolean(attribution.referrer) && attribution.channel !== 'none';
};

const readTouch = (key: string): Attribution | null => {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Attribution;
		return typeof parsed?.channel === 'string' ? parsed : null;
	} catch {
		return null;
	}
};

const writeTouch = (key: string, attribution: Attribution): void => {
	try {
		localStorage.setItem(key, JSON.stringify(attribution));
	} catch {
		// Non-fatal: attribution degrades to in-memory for this page view.
	}
};

export const getFirstTouch = (): Attribution | null => readTouch(FIRST_TOUCH_KEY);
export const getLastTouch = (): Attribution | null => readTouch(LAST_TOUCH_KEY);

/**
 * Record a page entry. First touch is written once and never overwritten; last
 * touch only moves when the entry actually carries a campaign signal.
 */
export const recordTouch = (
	url: string,
	referrer: string
): { firstTouch: Attribution; lastTouch: Attribution } => {
	const attribution = parseAttribution(url, referrer);

	let firstTouch = getFirstTouch();
	if (!firstTouch) {
		firstTouch = attribution;
		writeTouch(FIRST_TOUCH_KEY, attribution);
	}

	let lastTouch = getLastTouch();
	if (!lastTouch || hasCampaignSignal(attribution)) {
		lastTouch = attribution;
		writeTouch(LAST_TOUCH_KEY, attribution);
	}

	return { firstTouch, lastTouch };
};
