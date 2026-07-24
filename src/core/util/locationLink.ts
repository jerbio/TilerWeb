/**
 * Utilities for turning a free-form location address into a clickable link.
 *
 * A location's `address` is a plain string that usually represents a physical
 * place, but it can also be a URL — most commonly a video/meeting link
 * (Zoom, Google Meet, Teams, etc.). In that case we must link directly to the
 * URL instead of sending the user to a Google Maps search for the raw string.
 *
 * URLs are further classified heuristically: when we can deduce the link is a
 * video/meeting link we surface it as `'video'`, otherwise it falls back to a
 * generic `'link'`.
 */

export type LocationLinkKind = 'map' | 'video' | 'link';

export type ResolvedLocationLink = {
	href: string;
	kind: LocationLinkKind;
};

/**
 * Hosts that are known to be video/conferencing providers. Matching any of
 * these (with or without an explicit scheme) classifies a URL as a video link.
 */
const VIDEO_LINK_HOSTS = [
	'zoom.us',
	'zoom.com',
	'meet.google.com',
	'teams.microsoft.com',
	'teams.live.com',
	'webex.com',
	'gotomeeting.com',
	'gotomeet.me',
	'whereby.com',
	'meet.jit.si',
	'jit.si',
	'skype.com',
	'discord.gg',
	'discord.com',
	'youtube.com',
	'youtu.be',
	'vimeo.com',
	'twitch.tv',
	'bluejeans.com',
	'ringcentral.com',
	'8x8.vc',
	'around.co',
	'gather.town',
	'chime.aws',
];

/**
 * Hosts that are known to be links rather than physical places, but are not
 * video providers. Combined with {@link VIDEO_LINK_HOSTS}, these determine
 * whether a schemeless address should be treated as a URL at all.
 */
const NON_VIDEO_LINK_HOSTS = ['maps.google.com', 'goo.gl', 'maps.app.goo.gl'];

const KNOWN_LINK_HOSTS = [...VIDEO_LINK_HOSTS, ...NON_VIDEO_LINK_HOSTS];

/** Matches a string that starts with an explicit http(s):// scheme. */
const HTTP_SCHEME_REGEX = /^https?:\/\//i;

/**
 * Heuristic patterns that strongly imply a generic URL is a video/meeting link
 * even when the host is not in {@link VIDEO_LINK_HOSTS}.
 */
const VIDEO_HOST_HINT_REGEX = /(^|[.-])(meet|video|webinar|conference|conf|vc)([.-]|$)/i;
const VIDEO_PATH_HINT_REGEX =
	/\/(meet|video|webinar|conference|conf|call|live|join|j|watch)(\/|\?|#|$)/i;

const matchesHost = (host: string, knownHost: string): boolean =>
	host === knownHost || host.endsWith(`.${knownHost}`);

/** Splits an address (with or without scheme) into its host portion. */
const getHost = (address: string): string =>
	address.trim().toLowerCase().replace(HTTP_SCHEME_REGEX, '').split(/[/?#]/)[0];

/**
 * Determines whether a location address string is actually a URL/link rather
 * than a physical address.
 */
export const isLocationUrl = (address: string): boolean => {
	const trimmed = address.trim();
	if (!trimmed) return false;

	// Whitespace is never part of a URL but is common in physical addresses.
	if (/\s/.test(trimmed)) return false;

	if (HTTP_SCHEME_REGEX.test(trimmed)) return true;

	const host = getHost(trimmed);
	return KNOWN_LINK_HOSTS.some((knownHost) => matchesHost(host, knownHost));
};

/**
 * Heuristically determines whether a URL address is a video/meeting link.
 * Returns false for physical addresses and non-video URLs.
 */
export const isVideoLink = (address: string): boolean => {
	const trimmed = address.trim();
	if (!isLocationUrl(trimmed)) return false;

	const host = getHost(trimmed);
	if (VIDEO_LINK_HOSTS.some((knownHost) => matchesHost(host, knownHost))) {
		return true;
	}

	// Fall back to keyword hints in the host or path (e.g. meet.acme.com,
	// conference.example.org, https://example.com/video/123).
	if (VIDEO_HOST_HINT_REGEX.test(host)) return true;

	const withoutScheme = trimmed.toLowerCase().replace(HTTP_SCHEME_REGEX, '');
	const path = withoutScheme.slice(host.length);
	return VIDEO_PATH_HINT_REGEX.test(path);
};

/**
 * Resolves a location address into a clickable href and the kind of link it
 * represents. Physical addresses resolve to a Google Maps search; URLs resolve
 * to the URL itself, classified as a video link when deducible.
 */
export const resolveLocationLink = (address: string): ResolvedLocationLink => {
	const trimmed = address.trim();

	if (isLocationUrl(trimmed)) {
		const href = HTTP_SCHEME_REGEX.test(trimmed) ? trimmed : `https://${trimmed}`;
		const kind: LocationLinkKind = isVideoLink(trimmed) ? 'video' : 'link';
		return { href, kind };
	}

	return {
		href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`,
		kind: 'map',
	};
};
