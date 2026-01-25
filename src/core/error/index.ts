import { parseServerError, ChatLimitError, ERROR_CODES } from '@/core/common/types/errors';

export function normalizeError(error: unknown) {
	// Check if it's a server error with error code
	const serverError = parseServerError(error);
	if (serverError) {
		// If it's a chat limit error, throw the specific ChatLimitError
		if (serverError.code === ERROR_CODES.CHAT_LIMIT_REACHED) {
			throw new ChatLimitError(serverError);
		}
		// Otherwise, throw a regular Error with the localized message
		throw new Error(typeof serverError.message === 'string' ? serverError.message : String(serverError.message));
	}

	// Handle existing Error instances
	if (error instanceof Error) {
		return error;
	}
	
	// Fall back to generic error
	throw new Error(String(error));
}
