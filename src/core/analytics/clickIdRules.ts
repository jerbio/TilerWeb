import { normalizeChannel } from './channels';
import type { Channel } from './types';

/**
 * Per-network click id handling.
 *
 * Each ad network issues its own click id under its own query param, with its own
 * shape. Keeping the rules here — rather than a single hard-coded list — means adding
 * a network, or correcting a threshold once a real click id has been observed, is a
 * config change rather than a code change.
 */
export type ClickIdRule = {
	/** The URL query parameter the network appends. */
	param: string;
	channel: Channel;
	/**
	 * Shortest value that could be genuine. Real click ids are long opaque tokens
	 * (msclkid is 32 hex, gclid ~50-90, fbclid 100+), and forwarding a fabricated one
	 * is worse than forwarding none: Reddit reports it as an invalid match key against
	 * the whole account.
	 */
	minLength: number;
};

export const DEFAULT_MIN_CLICK_ID_LENGTH = 16;

export const DEFAULT_CLICK_ID_RULES: ReadonlyArray<ClickIdRule> = [
	{ param: 'gclid', channel: 'google', minLength: 16 },
	{ param: 'gbraid', channel: 'google', minLength: 16 },
	{ param: 'wbraid', channel: 'google', minLength: 16 },
	{ param: 'fbclid', channel: 'facebook', minLength: 16 },
	{ param: 'rdt_cid', channel: 'reddit', minLength: 16 },
	{ param: 'twclid', channel: 'twitter', minLength: 16 },
	{ param: 'msclkid', channel: 'bing', minLength: 16 },
];

/**
 * Parses `param:channel[:minLength]` entries, comma separated, and merges them over
 * `base`. A rule for an existing param replaces it; anything malformed is skipped so a
 * typo disables one network rather than breaking attribution outright.
 */
export const parseClickIdRules = (
	spec: string | undefined,
	base: ReadonlyArray<ClickIdRule>
): ClickIdRule[] => {
	const merged: ClickIdRule[] = base.map((rule) => ({ ...rule }));

	for (const entry of (spec ?? '').split(',')) {
		const parts = entry.trim().split(':');
		if (parts.length < 2) continue;

		const param = parts[0]?.trim();
		const channelRaw = parts[1]?.trim();
		if (!param || !channelRaw) continue;

		let minLength = DEFAULT_MIN_CLICK_ID_LENGTH;
		if (parts.length > 2) {
			const parsed = Number(parts[2]?.trim());
			if (!Number.isFinite(parsed)) continue;
			minLength = Math.max(1, Math.trunc(parsed));
		}

		const channel = normalizeChannel(channelRaw);
		const rule: ClickIdRule = {
			param,
			channel: channel === 'none' ? 'other' : channel,
			minLength,
		};

		const existing = merged.findIndex((r) => r.param === param);
		if (existing >= 0) merged[existing] = rule;
		else merged.push(rule);
	}

	return merged;
};

const read = (key: string): string | undefined => {
	const value = (import.meta.env as Record<string, string | undefined>)[key];
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

export const getClickIdRules = (): ClickIdRule[] =>
	parseClickIdRules(read('VITE_CLICK_ID_RULES'), DEFAULT_CLICK_ID_RULES);
