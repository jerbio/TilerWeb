import type { SubCalendarEvent, VideoLinkSource } from '@/core/common/types/schedule';
import { resolveLocationLink } from './locationLink';

/**
 * A single attached video/meeting link, resolved from `otherData.videoUrls`
 * and ready to be rendered as an action card.
 */
export type VideoLink = {
	href: string;
	source: VideoLinkSource;
};

/**
 * Render priority for the supported video sources. The first hit wins when
 * the same URL is attached under multiple sources.
 */
const SOURCE_PRIORITY: readonly VideoLinkSource[] = ['zoom', 'google', 'outlook', 'other'];

/**
 * Collects all renderable video/meeting links attached to a SubCalendarEvent.
 *
 * Behaviour:
 *  - Iterates sources in {@link SOURCE_PRIORITY} order so output is stable.
 *  - Source keys are matched case-insensitively, so legacy PascalCase
 *    payloads (e.g. `"Google"`) still resolve to the canonical lowercase
 *    source. Entries from multiple key casings of the same source are merged.
 *  - Skips empty/whitespace URLs and unknown source keys (forward-compat).
 *  - Dedupes by exact href (case-insensitive) across sources — first wins.
 *  - Drops any URL that already matches the event's `location.address` when
 *    that address itself resolves to a video link (the existing location
 *    section will already render it; we avoid showing it twice).
 *
 * Returns an empty array when nothing renders — callers should use that
 * signal to skip the dedicated "Video calls" section entirely.
 */
export function collectVideoLinks(event: SubCalendarEvent): VideoLink[] {
	const videoUrls = event.otherData?.videoUrls;
	if (!videoUrls) return [];

	// Normalise the incoming key casing so legacy payloads (PascalCase
	// "Google", "Zoom", etc.) flow through the same priority path as the
	// canonical lowercase contract. Multiple casings for the same source
	// are concatenated in iteration order.
	const normalised: Partial<Record<VideoLinkSource, string[]>> = {};
	const knownSources = new Set<string>(SOURCE_PRIORITY);
	for (const rawKey of Object.keys(videoUrls)) {
		const key = rawKey.toLowerCase();
		if (!knownSources.has(key)) continue;
		const source = key as VideoLinkSource;
		const urls = (videoUrls as Record<string, string[] | undefined>)[rawKey];
		if (!urls?.length) continue;
		const bucket = normalised[source];
		if (bucket) {
			bucket.push(...urls);
		} else {
			normalised[source] = [...urls];
		}
	}

	const addressHref = (() => {
		const address = event.location?.address;
		if (!address) return null;
		const resolved = resolveLocationLink(address);
		return resolved.kind === 'video' ? resolved.href.toLowerCase() : null;
	})();

	const seen = new Set<string>();
	if (addressHref) seen.add(addressHref);

	const result: VideoLink[] = [];
	for (const source of SOURCE_PRIORITY) {
		const urls = normalised[source];
		if (!urls?.length) continue;
		for (const raw of urls) {
			const href = typeof raw === 'string' ? raw.trim() : '';
			if (!href) continue;
			const key = href.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			result.push({ href, source });
		}
	}
	return result;
}
