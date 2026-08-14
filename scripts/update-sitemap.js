import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = 'https://tiler.app';
const sitemapPath = join(__dirname, '../public/sitemap.xml');
// Runtime source of truth for articles (getArticles()). Slugs + dates are
// parsed from here so newly-published articles are picked up automatically.
const articlesDataPath = join(__dirname, '../src/core/common/data/articles.ts');
// Optional mirror: the ASP.NET TilerFront project serves its own copy of the
// sitemap at the same domain root. Keep it in sync when present so both stay
// identical and neither can drift.
const mirrorSitemapPath = join(__dirname, '../../TilerFront/sitemap.xml');

// Current date in YYYY-MM-DD format.
const today = new Date().toISOString().split('T')[0];

/**
 * Canonical list of public, indexable routes. Keep in sync with
 * `Routes` in src/core/constants/routes.ts. Private/authenticated routes
 * (timeline, tileshare, settings, admin, signin, signup) are intentionally
 * excluded — they carry no SEO value and are disallowed in robots.txt.
 */
const staticRoutes = [
	{ path: '/', changefreq: 'weekly', priority: '1.0' },
	{ path: '/discover', changefreq: 'monthly', priority: '0.9' },
	{ path: '/articles', changefreq: 'weekly', priority: '0.8' },
	{ path: '/waitlist', changefreq: 'monthly', priority: '0.7' },
];

/** Convert a human date like "May 1, 2026" to ISO "2026-05-01" (no TZ shift). */
function toIsoDate(human) {
	const d = new Date(human);
	if (Number.isNaN(d.getTime())) return today;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * Derive article routes from the runtime source of truth
 * (getArticles in src/core/common/data/articles.ts). Each article's slug
 * becomes the URL and its published date becomes <lastmod>, so new articles
 * are indexed automatically without ever editing this script.
 *
 * Within each article object `slug` appears before its single-line
 * `date: tr(t, '...', 'Month Day, Year')`, so we walk the matches in order and
 * pair each slug with the date that follows it.
 */
function getArticleRoutes() {
	try {
		const source = readFileSync(articlesDataPath, 'utf8');
		const tokens = [
			...source.matchAll(
				/slug:\s*['"]([^'"]+)['"]|date:\s*tr\([^,]+,[^,]+,\s*['"]([^'"]+)['"]\s*\)/g
			),
		];
		const routes = [];
		let pendingSlug = null;
		for (const m of tokens) {
			if (m[1]) {
				pendingSlug = m[1];
			} else if (m[2] && pendingSlug) {
				routes.push({
					path: `/articles/${pendingSlug}`,
					changefreq: 'monthly',
					priority: '0.7',
					lastmod: toIsoDate(m[2]),
				});
				pendingSlug = null;
			}
		}
		if (routes.length === 0) {
			console.warn(
				'⚠️  No article routes parsed from articles.ts — sitemap will omit articles.'
			);
		}
		return routes;
	} catch (error) {
		console.warn(`⚠️  Could not read article routes: ${error.message}`);
		return [];
	}
}

function buildUrlEntry({ path, changefreq, priority, lastmod }) {
	return [
		'\t<url>',
		`\t\t<loc>${SITE_URL}${path}</loc>`,
		`\t\t<lastmod>${lastmod || today}</lastmod>`,
		`\t\t<changefreq>${changefreq}</changefreq>`,
		`\t\t<priority>${priority}</priority>`,
		'\t</url>',
	].join('\n');
}

try {
	const routes = [...staticRoutes, ...getArticleRoutes()];

	const sitemap = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...routes.map(buildUrlEntry),
		'</urlset>',
		'',
	].join('\n');

	writeFileSync(sitemapPath, sitemap, 'utf8');
	console.log(`✅ Sitemap generated with ${routes.length} URLs → public/sitemap.xml`);

	// Mirror to the TilerFront (ASP.NET) copy when present so both roots stay
	// identical. Non-fatal if the sibling project isn't checked out.
	if (existsSync(mirrorSitemapPath)) {
		writeFileSync(mirrorSitemapPath, sitemap, 'utf8');
		console.log('✅ Mirrored sitemap → ../TilerFront/sitemap.xml');
	}
} catch (error) {
	console.error('❌ Error generating sitemap:', error.message);
	process.exit(1);
}
