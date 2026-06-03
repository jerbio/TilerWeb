const ROUTES = {
	timeline: '/timeline',
	tileshare: {
		root: '/tileshare',
		active: '/tileshare/active',
		sent: '/tileshare/sent',
		// Builder functions — use for navigate() and Link to=
		detail: (id: string) => `/tileshare/${id}`,
		tilette: (id: string, tiletteId: string) => `/tileshare/${id}/tilette/${tiletteId}`,
		invite: (designatedTemplateId: string) => `/tileshare/invite/${designatedTemplateId}`,
		// Patterns — use for <Route path=...> definitions only
		patterns: {
			detail: '/tileshare/:id',
			tilette: '/tileshare/:id/tilette/:tiletteId',
			invite: '/tileshare/invite/:designatedTemplateId',
		},
	},
};

export default ROUTES;
