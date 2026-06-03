export function throttle<T extends (...args: never[]) => unknown>(
	fn: T,
	wait: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= wait) {
			lastCall = now;
			fn(...args);
		}
	};
}
