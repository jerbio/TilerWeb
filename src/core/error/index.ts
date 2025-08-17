export function normalizeError(error: unknown) {
	if (error instanceof Error) {
		return error;
	} else {
		throw new Error(String(error));
	}
}
