import { ReactNode, useEffect, useState } from 'react';
import { TILESHARE_EXIT_MS } from './tileshareMotion';

/** Retain a closing dialog's content until its exit finishes. Reopening cancels removal. */
export default function TileSharePresence<T>({
	value,
	children,
}: {
	value: T | null;
	children: (value: T, closing: boolean) => ReactNode;
}) {
	const [retained, setRetained] = useState<T | null>(() => value);
	if (value !== null && value !== retained) setRetained(() => value);
	const closing = value === null;
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	useEffect(() => {
		if (!closing || retained === null || reducedMotion) return;
		const timer = window.setTimeout(() => setRetained(null), TILESHARE_EXIT_MS);
		return () => window.clearTimeout(timer);
	}, [closing, retained, reducedMotion]);
	const current = value ?? retained;
	return current === null || (closing && reducedMotion) ? null : children(current, closing);
}
