import { useEffect, useRef, useState } from 'react';

export interface UseResponsiveColumnsResult<T extends HTMLElement> {
	ref: React.RefObject<T | null>;
	columns: number;
}

/**
 * Tracks how many columns of at least `minColumnWidth` px fit in the referenced
 * element, updating on resize. Always at least 1. Used to size the assignee
 * board's page (columns per page) responsively.
 */
export function useResponsiveColumns<T extends HTMLElement = HTMLDivElement>(
	minColumnWidth: number
): UseResponsiveColumnsResult<T> {
	const ref = useRef<T>(null);
	const [columns, setColumns] = useState(1);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const update = () => {
			const width = el.clientWidth;
			setColumns(Math.max(1, Math.floor(width / minColumnWidth)));
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, [minColumnWidth]);

	return { ref, columns };
}

export default useResponsiveColumns;
