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
	Tileshare: {
		root: '/tileshare',
		active: '/tileshare/inbox',
		sent: '/tileshare/outbox',
		// Pattern routes - call() for navigation, use .pattern for <Route path=...>
		detail: Object.assign((id: string) => `/tileshare/${id}`, {
			pattern: '/tileshare/:id',
		} as const),
		tilette: Object.assign(
			(id: string, tiletteId: string) => `/tileshare/${id}/tilette/${tiletteId}`,
			{ pattern: '/tileshare/:id/tilette/:tiletteId' } as const
		),
		invite: Object.assign(
			(designatedTemplateId: string) => `/tileshare/invite/${designatedTemplateId}`,
			{ pattern: '/tileshare/invite/:designatedTemplateId' } as const
		),
	},

	// Settings (protected)
	Settings: '/settings',
	SettingsAccount: '/settings/account',
	SettingsPreferences: '/settings/preferences',
	SettingsNotifications: '/settings/notifications',

	// Admin (protected + admin role)
	Admin: {
		root: '/admin',
		featureFlags: '/admin/feature-flags',
	},
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];
