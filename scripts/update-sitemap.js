import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = 'https://tiler.app';
const sitemapPath = join(__dirname, '../public/sitemap.xml');
const articlesConfigPath = join(__dirname, '../src/articles/articles.config.ts');

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

/**
 * Derive article slugs from articles.config.ts so new articles are picked up
 * automatically without editing this script.
 */
function getArticleRoutes() {
	try {
		const config = readFileSync(articlesConfigPath, 'utf8');
		const slugs = [...config.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
		return slugs.map((slug) => ({
			path: `/articles/${slug}`,
			changefreq: 'monthly',
			priority: '0.7',
		}));
	} catch (error) {
		console.warn(`⚠️  Could not read article slugs: ${error.message}`);
		return [];
	}
}

function buildUrlEntry({ path, changefreq, priority }) {
	return [
		'\t<url>',
		`\t\t<loc>${SITE_URL}${path}</loc>`,
		`\t\t<lastmod>${today}</lastmod>`,
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

	console.log(`✅ Sitemap generated with ${routes.length} URLs (date: ${today})`);
} catch (error) {
	console.error('❌ Error generating sitemap:', error.message);
	process.exit(1);
}
