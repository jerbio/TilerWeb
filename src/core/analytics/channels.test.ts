import { describe, expect, it } from 'vitest';
import { deriveChannelFromReferrer, normalizeChannel } from './channels';

describe('normalizeChannel', () => {
	it('returns "none" when nothing was supplied', () => {
		expect(normalizeChannel(undefined)).toBe('none');
		expect(normalizeChannel('')).toBe('none');
		expect(normalizeChannel('   ')).toBe('none');
	});

	it('matches the backend ReferralOptions vocabulary exactly', () => {
		expect(normalizeChannel('google')).toBe('google');
		expect(normalizeChannel('bing')).toBe('bing');
		expect(normalizeChannel('yahoo')).toBe('yahoo');
		expect(normalizeChannel('facebook')).toBe('facebook');
		expect(normalizeChannel('linkedin')).toBe('linkedin');
		expect(normalizeChannel('instagram')).toBe('instagram');
		expect(normalizeChannel('pinterest')).toBe('pinterest');
		expect(normalizeChannel('reddit')).toBe('reddit');
		expect(normalizeChannel('youtube')).toBe('youtube');
		expect(normalizeChannel('tiktok')).toBe('tiktok');
	});

	it('is case and whitespace insensitive', () => {
		expect(normalizeChannel('  ReDDiT ')).toBe('reddit');
		expect(normalizeChannel('GOOGLE')).toBe('google');
	});

	it('collapses X and Twitter onto the single "twitter" channel', () => {
		expect(normalizeChannel('x')).toBe('twitter');
		expect(normalizeChannel('X')).toBe('twitter');
		expect(normalizeChannel('twitter')).toBe('twitter');
		expect(normalizeChannel('twitter-ads')).toBe('twitter');
	});

	it('applies the same fuzzy prefixes the backend uses', () => {
		expect(normalizeChannel('goo')).toBe('google');
		expect(normalizeChannel('googleads')).toBe('google');
		expect(normalizeChannel('fb')).toBe('facebook');
		expect(normalizeChannel('fbads')).toBe('facebook');
		expect(normalizeChannel('meta')).toBe('facebook');
		expect(normalizeChannel('tiktok-ads')).toBe('tiktok');
		expect(normalizeChannel('linkedin-paid')).toBe('linkedin');
	});

	it('falls back to "other" for anything unrecognised', () => {
		expect(normalizeChannel('newsletter')).toBe('other');
		expect(normalizeChannel('hackernews')).toBe('other');
	});
});

describe('deriveChannelFromReferrer', () => {
	it('returns "none" for an empty or same-origin referrer', () => {
		expect(deriveChannelFromReferrer('', 'localhost')).toBe('none');
		expect(deriveChannelFromReferrer('https://localhost/discover', 'localhost')).toBe('none');
	});

	it('maps well known referrer hosts onto channels', () => {
		expect(
			deriveChannelFromReferrer('https://www.google.com/search?q=tiler', 'localhost')
		).toBe('google');
		expect(deriveChannelFromReferrer('https://www.reddit.com/r/productivity', 'x')).toBe(
			'reddit'
		);
		expect(deriveChannelFromReferrer('https://t.co/abcdef', 'x')).toBe('twitter');
		expect(deriveChannelFromReferrer('https://x.com/someone/status/1', 'x')).toBe('twitter');
		expect(deriveChannelFromReferrer('https://l.facebook.com/', 'x')).toBe('facebook');
		expect(deriveChannelFromReferrer('https://out.reddit.com/', 'x')).toBe('reddit');
	});

	it('returns "other" for an unknown external referrer', () => {
		expect(deriveChannelFromReferrer('https://news.ycombinator.com/item?id=1', 'x')).toBe(
			'other'
		);
	});

	it('does not throw on a malformed referrer', () => {
		expect(deriveChannelFromReferrer('not a url', 'x')).toBe('none');
	});
});
