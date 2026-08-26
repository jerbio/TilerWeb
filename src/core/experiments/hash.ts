/**
 * FNV-1a, 32-bit.
 *
 * Chosen because bucketing must be reproducible outside this file: the server
 * re-derives a visitor's arm from the same inputs during analysis to audit for
 * skew. That rules out anything seeded, salted per-process, or platform-defined.
 *
 * Operates on UTF-16 code units rather than UTF-8 bytes. Inputs here are a UUID
 * and an ASCII experiment key, so the two are identical in practice; a non-ASCII
 * input would still hash consistently, just not to canonical FNV-1a.
 */
export const fnv1a32 = (input: string): number => {
	let hash = 0x811c9dc5;

	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		// Math.imul keeps the multiply in 32-bit space; `*` would lose precision.
		hash = Math.imul(hash, 0x01000193);
	}

	return hash >>> 0;
};

/**
 * Salting with the experiment key means a later experiment reshuffles cohorts
 * instead of re-testing the same visitors in the same buckets.
 */
export const bucketOf = (anonymousId: string, experimentKey: string, buckets: number): number => {
	if (buckets <= 0) return 0;
	return fnv1a32(`${anonymousId}:${experimentKey}`) % buckets;
};
