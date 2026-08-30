/**
 * Pure helpers powering the persona-creation progress simulation in
 * `persona_card_expanded.tsx`. Kept in its own module so the distribution
 * logic can be unit-tested without pulling in the component surface.
 */

/**
 * Break-a-stick: distribute `totalMs` across `numSections` slots, each
 * guaranteed at least `minMs`, with the remainder spread randomly. Produces
 * reasonably even durations without one section eating the whole budget.
 *
 * Invariants (when `numSections >= 1` and `totalMs >= numSections * minMs`):
 *   - `result.length === numSections`
 *   - every entry is `>= minMs`
 *   - `sum(result) === totalMs` (within floating-point tolerance)
 *
 * When `totalMs < numSections * minMs`, the function falls back to an equal
 * split at `max(minMs, totalMs / numSections)` so callers can rely on the
 * min-per-section floor even under a misconfigured budget.
 */
export function generateSectionDurations(
	numSections: number,
	totalMs: number,
	minMs: number,
	rng: () => number = Math.random
): number[] {
	if (numSections <= 0) return [];
	const flex = totalMs - numSections * minMs;
	if (flex <= 0) {
		return Array(numSections).fill(Math.max(minMs, totalMs / numSections));
	}
	const cuts = Array.from({ length: numSections - 1 }, () => rng() * flex).sort((a, b) => a - b);
	const durations: number[] = [];
	let prev = 0;
	for (const c of cuts) {
		durations.push(minMs + (c - prev));
		prev = c;
	}
	durations.push(minMs + (flex - prev));
	return durations;
}
