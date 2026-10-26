import { describe, it, expect } from 'vitest';
import { collectVideoLinks, type VideoLink } from './videoLink';
import type { SubCalendarEvent } from '@/core/common/types/schedule';

/**
 * Tests for `collectVideoLinks`, the helper that surfaces video/meeting URLs
 * attached to a SubCalendarEvent's `otherData.videoUrls` map. The helper is
 * the single source of truth used by `CalendarEventInfo` to render the
 * dedicated "Video calls" section, including de-duplication against any
 * video URL that already lives in the event's `location.address`.
 */

const baseEvent: SubCalendarEvent = {
	id: 'sub_1',
	start: 0,
	end: 0,
};

const withVideoUrls = (
	videoUrls: Record<string, string[] | undefined> | undefined,
	overrides: Partial<SubCalendarEvent> = {}
): SubCalendarEvent => ({
	...baseEvent,
	...overrides,
	otherData: videoUrls === undefined ? undefined : { videoUrls },
});

describe('collectVideoLinks', () => {
	it('returns an empty array when otherData is missing', () => {
		expect(collectVideoLinks(baseEvent)).toEqual([]);
	});

	it('returns an empty array when videoUrls is missing or empty', () => {
		expect(collectVideoLinks(withVideoUrls(undefined))).toEqual([]);
		expect(collectVideoLinks(withVideoUrls({}))).toEqual([]);
		expect(collectVideoLinks(withVideoUrls({ google: [] }))).toEqual([]);
	});

	it('returns the URL with its lowercase source key', () => {
		const event = withVideoUrls({ google: ['https://meet.google.com/abc-defg-hij'] });
		expect(collectVideoLinks(event)).toEqual<VideoLink[]>([
			{ href: 'https://meet.google.com/abc-defg-hij', source: 'google' },
		]);
	});

	it('returns multiple URLs in order zoom → google → outlook → other', () => {
		const event = withVideoUrls({
			other: ['https://example.com/standup'],
			outlook: ['https://teams.microsoft.com/l/meetup-join/xyz'],
			google: ['https://meet.google.com/abc-defg-hij'],
			zoom: ['https://zoom.us/j/123'],
		});

		expect(collectVideoLinks(event).map((v) => v.source)).toEqual([
			'zoom',
			'google',
			'outlook',
			'other',
		]);
	});

	it('flattens multiple URLs per source, preserving array order', () => {
		const event = withVideoUrls({
			google: [
				'https://meet.google.com/aaa-bbbb-ccc',
				'https://meet.google.com/ddd-eeee-fff',
			],
		});
		const result = collectVideoLinks(event);
		expect(result).toHaveLength(2);
		expect(result[0].href).toBe('https://meet.google.com/aaa-bbbb-ccc');
		expect(result[1].href).toBe('https://meet.google.com/ddd-eeee-fff');
	});

	it('drops duplicate URLs across sources (first-source-wins)', () => {
		const url = 'https://example.com/standup';
		const event = withVideoUrls({
			zoom: [url],
			google: [url],
		});
		const result = collectVideoLinks(event);
		expect(result).toEqual<VideoLink[]>([{ href: url, source: 'zoom' }]);
	});

	it('drops a URL when the same URL is already the event location address (case-insensitive)', () => {
		const url = 'https://meet.google.com/abc-defg-hij';
		const event = withVideoUrls(
			{ google: [url.toUpperCase()] },
			{
				location: {
					id: 'loc',
					description: '',
					address: url,
					longitude: 0,
					latitude: 0,
					isVerified: false,
					isDefault: false,
					isNull: false,
					thirdPartyId: null,
					userId: null,
					source: '',
					nickname: '',
				},
			}
		);
		expect(collectVideoLinks(event)).toEqual([]);
	});

	it('keeps otherData URLs when the address is a physical location', () => {
		const event = withVideoUrls(
			{ google: ['https://meet.google.com/abc-defg-hij'] },
			{
				location: {
					id: 'loc',
					description: '',
					address: '221B Baker Street',
					longitude: 0,
					latitude: 0,
					isVerified: false,
					isDefault: false,
					isNull: false,
					thirdPartyId: null,
					userId: null,
					source: '',
					nickname: '',
				},
			}
		);
		expect(collectVideoLinks(event)).toHaveLength(1);
	});

	it('skips empty or whitespace URL entries', () => {
		const event = withVideoUrls({
			google: ['', '   ', 'https://meet.google.com/abc-defg-hij'],
		});
		expect(collectVideoLinks(event)).toHaveLength(1);
	});

	it('ignores unknown source keys', () => {
		// e.g. a future backend source name we don't render yet
		const event = withVideoUrls({ webex: ['https://example.webex.com/meet/1'] } as Record<
			string,
			string[]
		>);
		expect(collectVideoLinks(event)).toEqual([]);
	});

	it('accepts PascalCase / mixed-case source keys', () => {
		// Legacy payloads (and any non-conforming server) may serialise the
		// source key in PascalCase, e.g. "Google". The helper must normalise
		// the key so the URL still renders.
		const event = withVideoUrls({
			Google: ['https://meet.google.com/zep-wmfo-ruy'],
			ZOOM: ['https://zoom.us/j/999'],
		});
		expect(collectVideoLinks(event)).toEqual<VideoLink[]>([
			{ href: 'https://zoom.us/j/999', source: 'zoom' },
			{ href: 'https://meet.google.com/zep-wmfo-ruy', source: 'google' },
		]);
	});

	it('handles the legacy wire payload shape (PascalCase Google key)', () => {
		// Anchored to the real on-wire shape we have seen for events authored
		// before the lowercase-key contract was rolled out everywhere.
		const event: SubCalendarEvent = {
			...baseEvent,
			otherData: {
				videoUrls: {
					Google: ['https://meet.google.com/zep-wmfo-ruy'],
				},
			} as unknown as SubCalendarEvent['otherData'],
		};
		expect(collectVideoLinks(event)).toEqual<VideoLink[]>([
			{ href: 'https://meet.google.com/zep-wmfo-ruy', source: 'google' },
		]);
	});

	it('merges entries when the same source appears under multiple key casings', () => {
		const event = withVideoUrls({
			google: ['https://meet.google.com/aaa-bbbb-ccc'],
			Google: ['https://meet.google.com/ddd-eeee-fff'],
		});
		const result = collectVideoLinks(event);
		expect(result).toHaveLength(2);
		expect(result.every((v) => v.source === 'google')).toBe(true);
	});
});
