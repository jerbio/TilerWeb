/**
 * Contact channel utilities — decide whether a raw share-to value is an email
 * or a phone number, validate it, and normalize phone numbers for the API.
 */
import { DEFAULT_COUNTRY_CODE } from '@/core/constants/countryCodes';
import { validateEmail, validatePhone } from './validation';

export type ContactChannel = 'email' | 'phone';

/** All digits with optional grouping/formatting and an optional leading '+'. */
const PHONE_LIKE = /^\+?[\d\s().-]+$/;

/**
 * A value made up of digits (optionally a leading '+' for the area code) is a
 * phone number; anything else is treated as an email.
 */
export const classifyContact = (value: string): ContactChannel =>
	PHONE_LIKE.test(value.trim()) ? 'phone' : 'email';

/** Validates a recipient against the rules for its detected channel. */
export const isValidRecipient = (value: string): boolean =>
	classifyContact(value) === 'phone' ? validatePhone(value) : validateEmail(value.trim());

/**
 * Returns the phone number in `+<callingCode><digits>` form. A value that
 * already carries a '+' area code keeps it; one without gets `defaultCallingCode`
 * (a bare dial code like "1") prepended.
 */
export const normalizePhoneNumber = (value: string, defaultCallingCode: string): string => {
	const digits = value.replace(/\D/g, '');
	if (value.trim().startsWith('+')) return `+${digits}`;
	const cc = defaultCallingCode.replace(/\D/g, '') || String(DEFAULT_COUNTRY_CODE.code);
	return `+${cc}${digits}`;
};
