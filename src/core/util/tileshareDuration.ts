export const DEFAULT_TILETTE_DURATION_MINUTES = 60;

/** Empty input keeps the one-hour default; explicit input must be whole positive minutes. */
export function tiletteDurationInMs(value?: string): number | null {
	const minutes = value?.trim() ? Number(value) : DEFAULT_TILETTE_DURATION_MINUTES;
	const milliseconds = minutes * 60000;
	return Number.isSafeInteger(minutes) && minutes > 0 && Number.isSafeInteger(milliseconds)
		? milliseconds
		: null;
}
