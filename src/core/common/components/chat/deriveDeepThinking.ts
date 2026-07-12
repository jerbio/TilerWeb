import type { PromptWithActions } from '@/core/common/types/chat';

/**
 * Derive the DeepThinking toggle state from a
 * loaded chat session. The backend stamps each VibePrompt with the
 * `thinkingMode` of its originating VibeRequest, so re-opening a session
 * should restore the toggle to whatever the user last sent under.
 *
 * Order of precedence:
 *   1. Most recent message in `messages` whose `thinkingMode` is non-empty.
 *   2. The supplied `fallback` (typically the value cached in localStorage).
 *
 * `messages` is assumed to be in chronological order (oldest first), matching
 * the post-`sortMessagesChronologically` shape used by chat.tsx.
 */
export const deriveDeepThinkingFromMessages = (
	messages: ReadonlyArray<Pick<PromptWithActions, 'thinkingMode'>>,
	fallback: boolean
): boolean => {
	for (let i = messages.length - 1; i >= 0; i--) {
		const mode = messages[i]?.thinkingMode;
		if (mode && mode.length > 0) {
			return mode.toLowerCase() === 'deep';
		}
	}
	return fallback;
};
