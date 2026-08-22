import type { Channel } from './types';

const EXACT_CHANNELS: readonly Channel[] = [
	'google',
	'bing',
	'yahoo',
	'facebook',
	'twitter',
	'linkedin',
	'instagram',
	'pinterest',
	'reddit',
	'youtube',
	'tiktok',
];

// Ordered fuzzy rules. Mirrors the heuristics in TilerFront's
// ReferralController.UpdateReferralTable so client and server reports join cleanly.
const FUZZY_RULES: ReadonlyArray<[test: (value: string) => boolean, channel: Channel]> = [
	[(v) => v === 'x' || v.includes('twitter'), 'twitter'],
	[(v) => v.includes('goo'), 'google'],
	[(v) => v.includes('facebook') || v.includes('fb') || v.includes('meta'), 'facebook'],
	[(v) => v.includes('tiktok'), 'tiktok'],
	[(v) => v.includes('linkedin'), 'linkedin'],
	[(v) => v.includes('reddit'), 'reddit'],
	[(v) => v.includes('insta'), 'instagram'],
	[(v) => v.includes('pinterest'), 'pinterest'],
	[(v) => v.includes('youtube'), 'youtube'],
	[(v) => v.includes('bing'), 'bing'],
	[(v) => v.includes('yahoo'), 'yahoo'],
];

const REFERRER_HOSTS: ReadonlyArray<[domain: string, channel: Channel]> = [
	['google.com', 'google'],
	['google.co.uk', 'google'],
	['reddit.com', 'reddit'],
	['redd.it', 'reddit'],
	['twitter.com', 'twitter'],
	['x.com', 'twitter'],
	['t.co', 'twitter'],
	['facebook.com', 'facebook'],
	['fb.com', 'facebook'],
	['fb.me', 'facebook'],
	['instagram.com', 'instagram'],
	['linkedin.com', 'linkedin'],
	['lnkd.in', 'linkedin'],
	['youtube.com', 'youtube'],
	['youtu.be', 'youtube'],
	['bing.com', 'bing'],
	['yahoo.com', 'yahoo'],
	['duckduckgo.com', 'other'],
	['pinterest.com', 'pinterest'],
	['tiktok.com', 'tiktok'],
];

const hostMatches = (host: string, domain: string): boolean =>
	host === domain || host.endsWith(`.${domain}`);

/**
 * Normalise a marketing source string onto the shared channel vocabulary.
 */
export const normalizeChannel = (raw: string | null | undefined): Channel => {
	const value = (raw ?? '').trim().toLowerCase();
	if (!value) return 'none';

	if ((EXACT_CHANNELS as readonly string[]).includes(value)) return value as Channel;

	for (const [test, channel] of FUZZY_RULES) {
		if (test(value)) return channel;
	}

	return 'other';
};

/**
 * Derive a channel from the document referrer, ignoring same-site navigation.
 */
export const deriveChannelFromReferrer = (referrer: string, currentHost: string): Channel => {
	if (!referrer) return 'none';

	let host: string;
	try {
		host = new URL(referrer).hostname.toLowerCase();
	} catch {
		return 'none';
	}

	const current = currentHost.toLowerCase();
	if (host === current || host.endsWith(`.${current}`)) return 'none';

	for (const [domain, channel] of REFERRER_HOSTS) {
		if (hostMatches(host, domain)) return channel;
	}

	return 'other';
};
