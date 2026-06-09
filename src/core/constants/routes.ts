/**
 * Central registry of all client-side route paths.
 *
 * Use these constants instead of string literals so that renaming or moving
 * a route only requires a change here — every consumer automatically picks
 * up the new path.
 */
export const Routes = {
	// Public
	Home: '/',
	Discover: '/discover',
	Articles: '/articles',
	ArticlesGettingStarted: '/articles/getting-started-with-tiler',
	Waitlist: '/waitlist',
	SignIn: '/signin',
	SignUp: '/signup',

	// Protected
	Timeline: '/timeline',

	// Settings (protected)
	Settings: '/settings',
	SettingsAccount: '/settings/account',
	SettingsPreferences: '/settings/preferences',
	SettingsNotifications: '/settings/notifications',
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];
