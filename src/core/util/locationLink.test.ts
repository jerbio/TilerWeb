import { describe, it, expect } from 'vitest';
import { isLocationUrl, isVideoLink, resolveLocationLink } from './locationLink';

describe('isLocationUrl', () => {
	it('returns false for an empty or whitespace string', () => {
		expect(isLocationUrl('')).toBe(false);
		expect(isLocationUrl('   ')).toBe(false);
	});

	it('returns false for a physical address', () => {
		expect(isLocationUrl('1600 Amphitheatre Parkway, Mountain View, CA')).toBe(false);
		expect(isLocationUrl('221B Baker Street')).toBe(false);
	});

	it('returns true for an explicit http(s) URL', () => {
		expect(isLocationUrl('https://example.com/meeting/123')).toBe(true);
		expect(isLocationUrl('http://example.com')).toBe(true);
	});

	it('returns true for known meeting/video hosts without a scheme', () => {
		expect(isLocationUrl('zoom.us/j/123456789')).toBe(true);
		expect(isLocationUrl('meet.google.com/abc-defg-hij')).toBe(true);
		expect(isLocationUrl('teams.microsoft.com/l/meetup-join/xyz')).toBe(true);
		expect(isLocationUrl('youtu.be/dQw4w9WgXcQ')).toBe(true);
	});

	it('matches known hosts as a subdomain path', () => {
		expect(isLocationUrl('us02web.zoom.us/j/123')).toBe(true);
	});

	it('returns false for a plain place name that contains spaces', () => {
		expect(isLocationUrl('Central Park New York')).toBe(false);
	});
});

describe('isVideoLink', () => {
	it('returns false for physical addresses', () => {
		expect(isVideoLink('221B Baker Street')).toBe(false);
	});

	it('detects well-known video providers', () => {
		expect(isVideoLink('https://zoom.us/j/123456789')).toBe(true);
		expect(isVideoLink('meet.google.com/abc-defg-hij')).toBe(true);
		expect(isVideoLink('https://teams.microsoft.com/l/meetup-join/xyz')).toBe(true);
		expect(isVideoLink('youtu.be/dQw4w9WgXcQ')).toBe(true);
		expect(isVideoLink('https://us02web.zoom.us/j/123')).toBe(true);
	});

	it('detects video links via host keyword hints', () => {
		expect(isVideoLink('https://meet.acme.com/room/1')).toBe(true);
		expect(isVideoLink('https://conference.example.org/standup')).toBe(true);
	});

	it('detects video links via path keyword hints', () => {
		expect(isVideoLink('https://example.com/video/123')).toBe(true);
		expect(isVideoLink('https://example.com/join/abc')).toBe(true);
	});

	it('returns false for generic non-video URLs', () => {
		expect(isVideoLink('https://example.com/docs/page')).toBe(false);
		expect(isVideoLink('https://github.com/org/repo')).toBe(false);
	});
});

describe('resolveLocationLink', () => {
	it('resolves a physical address to a Google Maps search', () => {
		const result = resolveLocationLink('221B Baker Street');
		expect(result.kind).toBe('map');
		expect(result.href).toBe(
			'https://www.google.com/maps/search/?api=1&query=221B%20Baker%20Street'
		);
	});

	it('resolves an explicit URL to the URL itself', () => {
		const result = resolveLocationLink('https://zoom.us/j/123456789');
		expect(result.kind).toBe('video');
		expect(result.href).toBe('https://zoom.us/j/123456789');
	});

	it('prepends https:// to a schemeless known link host', () => {
		const result = resolveLocationLink('meet.google.com/abc-defg-hij');
		expect(result.kind).toBe('video');
		expect(result.href).toBe('https://meet.google.com/abc-defg-hij');
	});

	it('classifies a generic non-video URL as a link', () => {
		const result = resolveLocationLink('https://example.com/docs/page');
		expect(result.kind).toBe('link');
		expect(result.href).toBe('https://example.com/docs/page');
	});

	it('trims surrounding whitespace before resolving', () => {
		const result = resolveLocationLink('  https://example.com/call  ');
		expect(result.kind).toBe('video');
		expect(result.href).toBe('https://example.com/call');
	});
});
