/**
 * The React surface of the experiment: the exposure gate.
 *
 * Resolution itself lives in `current.ts` and runs in module scope, before React
 * mounts. Resolving in an effect would let the first paint render one arm and
 * swap to another — a flash plus a layout shift on the most important element of
 * the page.
 */

import { useEffect, useRef, useState } from 'react';
import { getHeroAssignment, resetHeroAssignment } from './current';
import { readLandingPath, readLocale } from './environment';
import { trackExposure } from './exposure';
import type { Assignment } from './types';

/** Fraction of the hero that must be on screen for it to count as seen. */
export const EXPOSURE_VISIBILITY_RATIO = 0.5;
/** How long it must stay that visible. Filters scroll-past and prefetch. */
export const EXPOSURE_DWELL_MS = 1000;

export type UseHeroExperiment = {
	assignment: Assignment;
	/** Attach to the hero root to arm the exposure gate. */
	ref: (node: Element | null) => void;
};

export const useHeroExperiment = (): UseHeroExperiment => {
	const [assignment] = useState(getHeroAssignment);
	const [node, setNode] = useState<Element | null>(null);
	const firedRef = useRef(false);

	useEffect(() => {
		if (!node || firedRef.current) return;
		if (typeof IntersectionObserver === 'undefined') return;

		let timer: ReturnType<typeof setTimeout> | undefined;

		const clear = () => {
			if (timer === undefined) return;
			clearTimeout(timer);
			timer = undefined;
		};

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.some(
					(entry) =>
						entry.isIntersecting && entry.intersectionRatio >= EXPOSURE_VISIBILITY_RATIO
				);

				if (!visible) {
					clear();
					return;
				}
				if (timer !== undefined) return;

				timer = setTimeout(() => {
					timer = undefined;
					if (firedRef.current) return;
					firedRef.current = true;
					observer.disconnect();
					trackExposure(assignment);
				}, EXPOSURE_DWELL_MS);
			},
			{ threshold: [EXPOSURE_VISIBILITY_RATIO] }
		);

		observer.observe(node);

		return () => {
			clear();
			observer.disconnect();
		};
	}, [assignment, node]);

	return { assignment, ref: setNode };
};

export { getHeroAssignment, resetHeroAssignment, readLandingPath, readLocale };
