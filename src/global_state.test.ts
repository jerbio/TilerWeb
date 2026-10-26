import { act } from 'react';
import type { UserInfo } from '@/global_state';
import useAppStore from '@/global_state';

/**
 * Regression test: on a hard refresh / direct navigation to a feature-flagged
 * route (e.g. /tileshare/:id), checkAuth previously cleared isAuthLoading
 * *before* the feature flags finished loading (fire-and-forget). FlaggedRoute
 * gates on isAuthLoading, so during that window it read the flag as off and
 * bounced the user to its redirectTo (/timeline) even though the flag was on.
 *
 * These tests assert the invariant that fixes the bug: isAuthLoading stays true
 * until the feature flags have been stored (or the fetch fails), so guards keep
 * showing a Loader instead of redirecting on a not-yet-ready flag map.
 */

const mocks = vi.hoisted(() => ({
	authCheckAuth: vi.fn(),
	userGetCurrentUser: vi.fn(),
	flagGetFlags: vi.fn(),
}));

vi.mock('@/services', () => ({
	authService: {
		checkAuth: (...args: unknown[]) => mocks.authCheckAuth(...args),
		logout: vi.fn(),
	},
	userService: {
		getCurrentUser: (...args: unknown[]) => mocks.userGetCurrentUser(...args),
	},
}));

vi.mock('@/api/featureFlagApi', () => ({
	featureFlagApi: {
		getFlags: (...args: unknown[]) => mocks.flagGetFlags(...args),
		selfToggle: vi.fn(),
	},
}));

const TEST_USER = { id: 'TilerUser@@1', username: 'tester' } as UserInfo;

beforeEach(() => {
	vi.clearAllMocks();
	// Start from a fresh, still-loading, unauthenticated session (as on page load).
	act(() => {
		useAppStore.setState({
			isAuthenticated: false,
			isAuthLoading: true,
			authenticatedUser: null,
			featureFlags: {},
		});
	});
});

describe('checkAuth feature-flag loading order', () => {
	it('keeps isAuthLoading true until the feature flags are loaded', async () => {
		mocks.authCheckAuth.mockResolvedValue({ isAuthenticated: true });
		mocks.userGetCurrentUser.mockResolvedValue(TEST_USER);

		// Feature flags resolve later than auth/user — hold them with a deferred promise.
		let resolveFlags!: (value: unknown) => void;
		mocks.flagGetFlags.mockReturnValue(
			new Promise((resolve) => {
				resolveFlags = resolve;
			})
		);

		const checkPromise = useAppStore.getState().checkAuth();

		// Wait until auth + user fetch have completed and the flag fetch has started
		// (i.e. setAuthenticated has already run) but the flag promise is still pending.
		await vi.waitFor(() => {
			expect(mocks.flagGetFlags).toHaveBeenCalled();
		});

		// Auth is done, but the loader must still be up because flags haven't arrived.
		expect(useAppStore.getState().isAuthenticated).toBe(true);
		expect(useAppStore.getState().isAuthLoading).toBe(true);

		// Now deliver the flags and let checkAuth finish.
		await act(async () => {
			resolveFlags({ Content: { flags: { 'tile-share-tab': true } }, Error: null });
			await checkPromise;
		});

		expect(useAppStore.getState().isAuthLoading).toBe(false);
		expect(useAppStore.getState().isAuthenticated).toBe(true);
		expect(useAppStore.getState().featureFlags).toEqual({ 'tile-share-tab': true });
	});

	it('still clears isAuthLoading if the flag fetch fails (flags stay at defaults)', async () => {
		mocks.authCheckAuth.mockResolvedValue({ isAuthenticated: true });
		mocks.userGetCurrentUser.mockResolvedValue(TEST_USER);
		mocks.flagGetFlags.mockRejectedValue(new Error('network down'));

		await act(async () => {
			await useAppStore.getState().checkAuth();
		});

		expect(useAppStore.getState().isAuthLoading).toBe(false);
		expect(useAppStore.getState().isAuthenticated).toBe(true);
		expect(useAppStore.getState().featureFlags).toEqual({});
	});

	it('clears isAuthLoading without fetching flags when unauthenticated', async () => {
		mocks.authCheckAuth.mockResolvedValue({ isAuthenticated: false });

		await act(async () => {
			await useAppStore.getState().checkAuth();
		});

		expect(useAppStore.getState().isAuthLoading).toBe(false);
		expect(useAppStore.getState().isAuthenticated).toBe(false);
		expect(mocks.flagGetFlags).not.toHaveBeenCalled();
	});
});
