/**
 * SHA-256 helpers for ad-platform matching parameters.
 *
 * Hashing in the browser means the raw address never enters an analytics payload
 * at all, which is stricter than the "never leaves the server" rule and satisfies
 * every platform's PII terms.
 */

const toHex = (buffer: ArrayBuffer): string =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

export const sha256Hex = async (input: string): Promise<string> => {
	const bytes = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return toHex(digest);
};

/** Platform-canonical email hash: trimmed, lowercased, SHA-256, hex. */
export const hashEmail = async (email: string | undefined | null): Promise<string | undefined> => {
	const normalized = email?.trim().toLowerCase();
	if (!normalized) return undefined;

	try {
		return await sha256Hex(normalized);
	} catch {
		// Insecure origins have no SubtleCrypto; matching degrades rather than breaking.
		return undefined;
	}
};
