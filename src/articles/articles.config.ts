/**
 * Central registry of all articles published on tiler.app/articles.
 *
 * Each article entry powers:
 *  - The /articles index card grid (title, excerpt, hero, readMinutes)
 *  - The individual /articles/:slug page SEO metadata
 *  - JSON-LD Article + BreadcrumbList structured data
 *  - sitemap generation (future)
 *
 * Adding a new article:
 *  1. Add an entry below with a unique `slug`.
 *  2. Create the page component under src/pages/articles/ that imports
 *     `getArticle('<slug>')` and renders <ArticleLayout article={...}>...</ArticleLayout>.
 *  3. Add a route in App.tsx under the /articles parent.
 *  4. Add the i18n keys under `articles.posts.<i18nKey>` in en.json.
 */

import heroPng from '@/assets/articles/hero.png';

export interface ArticleMeta {
	/** URL slug — appears in /articles/:slug. Use kebab-case. */
	slug: string;
	/** i18n key under `articles.posts` for the localized strings. */
	i18nKey: string;
	/** Hero image (imported asset URL). */
	heroImage: string;
	/** Open Graph image (defaults to heroImage). */
	ogImage?: string;
	/** ISO 8601 publish date — drives article:published_time + JSON-LD datePublished. */
	publishedAt: string;
	/** ISO 8601 last-modified date — drives JSON-LD dateModified. */
	updatedAt: string;
	/** Estimated reading time in minutes. */
	readMinutes: number;
	/** schema.org @type — most articles will be "Article" or "HowTo". */
	schemaType: 'Article' | 'HowTo' | 'BlogPosting';
	/** Author name shown in metadata. */
	author: string;
	/** Optional category for grouping/filtering on the index page. */
	category: 'Getting Started' | 'Product' | 'Productivity' | 'AI & Scheduling';
	/**
	 * Optional extra JSON-LD schema graph nodes (e.g., HowTo steps,
	 * FAQPage) layered alongside the auto-built Article + BreadcrumbList.
	 */
	extraSchema?: object[];
}

export const ARTICLES: ArticleMeta[] = [
	{
		slug: 'getting-started-with-tiler',
		i18nKey: 'gettingStarted',
		heroImage: heroPng,
		publishedAt: '2026-05-01T00:00:00Z',
		updatedAt: '2026-05-26T00:00:00Z',
		readMinutes: 6,
		schemaType: 'HowTo',
		author: 'Tiler Team',
		category: 'Getting Started',
		extraSchema: [
			{
				'@type': 'HowTo',
				name: 'How to Get Started with Tiler — AI Scheduling in 6 Steps',
				description:
					"Tiler is an agentic calendar that automatically builds your daily schedule using AI. Follow these six steps to set up Tiler's adaptive scheduling engine in five minutes.",
				totalTime: 'PT5M',
				step: [
					{
						'@type': 'HowToStep',
						position: 1,
						name: 'Sign In & Create Your Profile',
						text: 'Sign in and the app immediately begins building your profile memory — the contextual layer the AI scheduler uses to understand how you work.',
					},
					{
						'@type': 'HowToStep',
						position: 2,
						name: 'Set Your Wake-Up Time',
						text: 'Tell Tiler when your day begins. This boundary anchors every constraint the engine schedules around.',
					},
					{
						'@type': 'HowToStep',
						position: 3,
						name: 'Pin Your Location',
						text: 'Tiler integrates with Google Maps so travel time between tasks is real — driving, transit, or walking — not guessed.',
					},
					{
						'@type': 'HowToStep',
						position: 4,
						name: 'Define Your Work Hours',
						text: 'Set work hours per day of the week. The engine treats these as soft constraints that shape your default schedule.',
					},
					{
						'@type': 'HowToStep',
						position: 5,
						name: 'Seed Your Tiles',
						text: 'The AI suggests recurring activity tiles based on your professional profile. You curate; the engine schedules.',
					},
					{
						'@type': 'HowToStep',
						position: 6,
						name: 'Your Timeline, Built',
						text: 'The solver runs and produces an optimized timeline — color-coded tiles, travel time accounted for, work hours respected.',
					},
				],
			},
			{
				'@type': 'SoftwareApplication',
				name: 'Tiler',
				applicationCategory: 'ProductivityApplication',
				operatingSystem: ['iOS', 'Android'],
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				description:
					'Tiler is an AI-powered smart calendar and agentic scheduling app. It automatically builds your daily timeline based on your goals, appointments, and location — then adapts the schedule in real time when things change.',
				aggregateRating: {
					'@type': 'AggregateRating',
					ratingValue: '4.8',
					ratingCount: '1200',
				},
				url: 'https://tiler.app',
				featureList: [
					'AI scheduling',
					'Adaptive scheduling',
					'Agentic calendar',
					'Google Calendar integration',
					'Outlook integration',
					'Location-aware scheduling',
					'Travel time calculation',
					'Smart task prioritization',
				],
			},
		],
	},
];

export const getArticle = (slug: string): ArticleMeta | undefined =>
	ARTICLES.find((a) => a.slug === slug);
