/**
 * Validation utility functions
 */

/**
 * Validates if a string is a valid email address
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Validates a phone number by its digit count (E.164 allows up to 15 digits).
 * The area/country code is optional, so a bare national number also passes.
 * @param phone - The phone string to validate (may contain +, spaces, dashes)
 * @returns true if the number has a plausible number of digits
 */
export const validatePhone = (phone: string): boolean => {
	const digits = phone.replace(/\D/g, '');
	return digits.length >= 7 && digits.length <= 15;
};
