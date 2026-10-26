import { describe, it, expect } from 'vitest';
import { validateEmail, validatePhone } from '../validation';

describe('validateEmail', () => {
	it('accepts a well-formed address', () => {
		expect(validateEmail('jane@example.com')).toBe(true);
	});

	it('rejects a malformed address', () => {
		expect(validateEmail('not-an-email')).toBe(false);
		expect(validateEmail('jane@')).toBe(false);
	});
});

describe('validatePhone', () => {
	it('rejects numbers with too few digits', () => {
		expect(validatePhone('12345')).toBe(false);
	});

	it('accepts a bare national number (area code optional)', () => {
		expect(validatePhone('3035551212')).toBe(true);
	});

	it('accepts a number with a country code', () => {
		expect(validatePhone('+13035551212')).toBe(true);
	});

	it('ignores formatting characters when counting digits', () => {
		expect(validatePhone('+1 (303) 555-1212')).toBe(true);
	});

	it('rejects numbers with more than 15 digits', () => {
		expect(validatePhone('1234567890123456')).toBe(false);
	});
});
