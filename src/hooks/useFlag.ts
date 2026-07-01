import useAppStore from '@/global_state';

/**
 * Returns the resolved value of a feature flag for the current user.
 * Defaults to false if the flag is unknown or flags haven't loaded yet.
 *
 * Usage:
 *   const isEnabled = useFlag('chat-suggestions');
 */
export function useFlag(flagName: string): boolean {
	return useAppStore((state) => state.featureFlags[flagName] ?? false);
}
