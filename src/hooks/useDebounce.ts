import { useEffect, useRef, useState } from 'react';

function useDebounce<T>(value: T, delayMs: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setDebouncedValue(value), delayMs);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [value, delayMs]);

	return debouncedValue;
}

export default useDebounce;
