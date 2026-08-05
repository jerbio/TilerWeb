import { describe, it, expect } from 'vitest';
import { classifyContact, isValidRecipient, normalizePhoneNumber } from '../contact';

describe('classifyContact', () => {
	it('classifies an email address as email', () => {
		expect(classifyContact('jane@example.com')).toBe('email');
	});

	it('classifies a bare number as phone', () => {
		expect(classifyContact('3035551212')).toBe('phone');
	});

	it('classifies a number with a leading + as phone', () => {
		expect(classifyContact('+13035551212')).toBe('phone');
	});

	it('classifies a formatted number as phone', () => {
		expect(classifyContact('+1 (303) 555-1212')).toBe('phone');
	});

	it('classifies an alphanumeric value as email', () => {
		expect(classifyContact('303-abc')).toBe('email');
	});
});

describe('isValidRecipient', () => {
	it('validates emails through the email path', () => {
		expect(isValidRecipient('jane@example.com')).toBe(true);
		expect(isValidRecipient('nope')).toBe(false);
	});

	it('validates phone numbers through the phone path', () => {
		expect(isValidRecipient('3035551212')).toBe(true);
		expect(isValidRecipient('12345')).toBe(false);
	});
});

describe('normalizePhoneNumber', () => {
	it('prepends the default calling code when there is no +', () => {
		expect(normalizePhoneNumber('3035551212', '1')).toBe('+13035551212');
	});

	it('preserves an existing + area code', () => {
		expect(normalizePhoneNumber('+443035551212', '1')).toBe('+443035551212');
	});

	it('strips formatting characters', () => {
		expect(normalizePhoneNumber('(303) 555-1212', '1')).toBe('+13035551212');
	});

	it('uses a non-US default calling code', () => {
		expect(normalizePhoneNumber('8031234567', '234')).toBe('+2348031234567');
	});

	it('falls back to the default country code when given a blank code', () => {
		expect(normalizePhoneNumber('3035551212', '')).toBe('+13035551212');
	});
});
