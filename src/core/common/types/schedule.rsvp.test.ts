import { describe, it, expect } from 'vitest';
import { RsvpStatus, normalizeRsvpStatus, isActionableRsvp } from './schedule';

describe('normalizeRsvpStatus', () => {
	it('returns undefined for null/undefined/empty', () => {
		expect(normalizeRsvpStatus(undefined)).toBeUndefined();
		expect(normalizeRsvpStatus(null)).toBeUndefined();
		expect(normalizeRsvpStatus('')).toBeUndefined();
	});

	it('maps known statuses case-insensitively', () => {
		expect(normalizeRsvpStatus('Accepted')).toBe(RsvpStatus.Accepted);
		expect(normalizeRsvpStatus('declined')).toBe(RsvpStatus.Declined);
		expect(normalizeRsvpStatus('TENTATIVE')).toBe(RsvpStatus.Tentative);
		expect(normalizeRsvpStatus('NeedsAction')).toBe(RsvpStatus.NeedsAction);
		expect(normalizeRsvpStatus('needs_action')).toBe(RsvpStatus.NeedsAction);
		expect(normalizeRsvpStatus('NotApplicable')).toBe(RsvpStatus.NotApplicable);
		expect(normalizeRsvpStatus('not_applicable')).toBe(RsvpStatus.NotApplicable);
		expect(normalizeRsvpStatus('none')).toBe(RsvpStatus.NotApplicable);
	});

	it('falls back to NotApplicable for unknown values', () => {
		expect(normalizeRsvpStatus('whatever')).toBe(RsvpStatus.NotApplicable);
	});
});

describe('isActionableRsvp', () => {
	it('is true for statuses that allow accept/decline', () => {
		expect(isActionableRsvp(RsvpStatus.NeedsAction)).toBe(true);
		expect(isActionableRsvp(RsvpStatus.Tentative)).toBe(true);
		expect(isActionableRsvp(RsvpStatus.Accepted)).toBe(true);
		expect(isActionableRsvp(RsvpStatus.Declined)).toBe(true);
	});

	it('is false for NotApplicable and undefined', () => {
		expect(isActionableRsvp(RsvpStatus.NotApplicable)).toBe(false);
		expect(isActionableRsvp(undefined)).toBe(false);
	});
});
