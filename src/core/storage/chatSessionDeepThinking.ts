/**
 * The toggle is scoped to a chat session (not a persona), so switching chat
 * sessions resets/loads the toggle independently. Empty sessionIds are not
 * persisted; the caller should keep an in-memory value until the first
 * sessionId is assigned, then call set to persist.
 */
const KEY_PREFIX = 'chat_session_deep_thinking:';

const buildKey = (sessionId: string): string => `${KEY_PREFIX}${sessionId}`;

export const getDeepThinkingForSession = (sessionId: string): boolean => {
	if (!sessionId) return false;
	try {
		return localStorage.getItem(buildKey(sessionId)) === '1';
	} catch {
		return false;
	}
};

export const setDeepThinkingForSession = (sessionId: string, enabled: boolean): void => {
	if (!sessionId) return;
	try {
		if (enabled) {
			localStorage.setItem(buildKey(sessionId), '1');
		} else {
			localStorage.removeItem(buildKey(sessionId));
		}
	} catch {
		/* ignore storage errors */
	}
};

export const clearDeepThinkingForSession = (sessionId: string): void => {
	if (!sessionId) return;
	try {
		localStorage.removeItem(buildKey(sessionId));
	} catch {
		/* ignore storage errors */
	}
};
