/**
 * Static prerender (SSG snapshot) for public, indexable marketing routes.
 *
 * Why: TilerWeb ships as a client-rendered SPA. Search engines that execute
 * JavaScript can index it, but social/link-preview crawlers (Facebook,
 * LinkedIn, Slack, WhatsApp, Discord, ...) and many others do NOT run JS —
 * they only see the raw `index.html`, which has no per-page content or meta.
 *
 * This script boots the freshly built `dist/` in a headless browser, lets the
 * app render + let react-helmet-async inject the per-page <title>/meta/OG/JSON-LD,
 * then writes the fully-rendered HTML to `dist/<route>/index.html`. The client
 * bundle still loads and takes over on real visits; crawlers get real HTML.
 *
 * Design goals:
 *  - Non-invasive: no source/SSR refactor, runs against the real built app.
 *  - Non-fatal: any failure logs a warning and exits 0 so `npm run build`
 *    still succeeds (the app just falls back to plain CSR for those routes).
 *  - Single source of truth: routes are read from public/sitemap.xml.
 */

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');
const sitemapPath = join(__dirname, '../public/sitemap.xml');

const HOST = '127.0.0.1';
const PORT = 4180;
const NAV_TIMEOUT_MS = 20000;

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.map': 'application/json; charset=utf-8',
};

/** Paths that must NOT fall back to index.html (so app fetches fail fast, not with HTML). */
const NON_SPA_PREFIXES = ['/api', '/account', '/signalr', '/Scripts'];

/** Read indexable route paths from the generated sitemap. */
function getRoutesFromSitemap() {
	try {
		const xml = readFileSync(sitemapPath, 'utf8');
		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		const paths = locs
			.map((loc) => {
				try {
					return new URL(loc).pathname;
				} catch {
					return null;
				}
			})
			.filter(Boolean);
		return [...new Set(paths)];
	} catch (error) {
		console.warn(`⚠️  prerender: could not read sitemap (${error.message}). Using "/" only.`);
		return ['/'];
	}
}

/** Minimal static file server for dist/ with SPA fallback to index.html. */
function startStaticServer() {
	const indexHtml = join(distDir, 'index.html');

	const server = createServer(async (req, res) => {
		try {
			const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
			if (process.env.PRERENDER_DEBUG) console.log(`   [server] ${req.method} ${urlPath}`);

			if (NON_SPA_PREFIXES.some((p) => urlPath.startsWith(p))) {
				res.writeHead(404).end('Not found');
				return;
			}

			// Serve a real file if it exists (assets, robots, sitemap, etc.).
			const filePath = join(distDir, urlPath);
			if (extname(urlPath) && existsSync(filePath)) {
				const body = await readFile(filePath);
				res.writeHead(200, { 'Content-Type': MIME[extname(urlPath)] || 'application/octet-stream' });
				res.end(body);
				return;
			}

			// SPA fallback: any non-asset path returns index.html.
			const html = await readFile(indexHtml);
			res.writeHead(200, { 'Content-Type': MIME['.html'] });
			res.end(html);
		} catch (error) {
			res.writeHead(500).end(String(error));
		}
	});

	return new Promise((resolve, reject) => {
		server.on('error', reject);
		server.listen(PORT, HOST, () => resolve(server));
	});
}

/** Convert a route path to its output file: "/" -> dist/index.html, "/x" -> dist/x/index.html. */
function outputPathFor(routePath) {
	if (routePath === '/' || routePath === '') return join(distDir, 'index.html');
	const clean = routePath.replace(/^\/+|\/+$/g, '');
	return join(distDir, clean, 'index.html');
}

async function run() {
	if (!existsSync(distDir) || !existsSync(join(distDir, 'index.html'))) {
		console.warn('⚠️  prerender: dist/index.html not found — run "vite build" first. Skipping.');
		return;
	}

	// Import puppeteer lazily so a missing/failed install never breaks the build.
	let puppeteer;
	try {
		puppeteer = (await import('puppeteer')).default;
	} catch (error) {
		console.warn(
			`⚠️  prerender: puppeteer not available (${error.message}). ` +
				'Skipping static prerender — app will render client-side only.'
		);
		return;
	}

	const routes = getRoutesFromSitemap();
	let server;
	let browser;

	try {
		server = await startStaticServer();
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		let ok = 0;
		for (const route of routes) {
			const page = await browser.newPage();
			try {
				await page.setViewport({ width: 1280, height: 800 });
				if (process.env.PRERENDER_DEBUG) {
					page.on('console', (m) => console.log(`   [page] ${m.type()}: ${m.text()}`));
					page.on('pageerror', (e) => console.log(`   [pageerror] ${e.message}`));
					page.on('requestfailed', (r) =>
						console.log(`   [reqfailed] ${r.url()} ${r.failure()?.errorText}`)
					);
				}

				// Neutralize requests that aren't needed for crawlable content
				// (analytics, realtime sockets, external fonts). Respond with an
				// empty 200 rather than aborting — aborting a render-blocking
				// stylesheet stalls the navigation lifecycle in Chromium.
				await page.setRequestInterception(true);
				page.on('request', (r) => {
					const url = r.url();
					const blocked =
						url.includes('googletagmanager.com') ||
						url.includes('google-analytics.com') ||
						url.includes('/gtag/') ||
						url.includes('fonts.googleapis.com') ||
						url.includes('fonts.gstatic.com') ||
						url.includes('signalr') ||
						url.includes('jquery');
					if (blocked) {
						r.respond({ status: 200, contentType: 'text/plain', body: '' }).catch(
							() => {}
						);
					} else {
						r.continue().catch(() => {});
					}
				});

				// readiness is driven by waiting for React to mount below.
				await page.goto(`http://${HOST}:${PORT}${route}`, {
					waitUntil: 'domcontentloaded',
					timeout: NAV_TIMEOUT_MS,
				});

				// Wait until React has mounted and react-helmet-async injected meta.
				await page.waitForSelector('#root *', { timeout: NAV_TIMEOUT_MS });
				await page
					.waitForSelector('meta[data-rh="true"], link[data-rh="true"]', { timeout: 8000 })
					.catch(() => {});
				// Small settle delay so Helmet finishes flushing all tags.
				await new Promise((r) => setTimeout(r, 400));

				// styled-components (and other CSS-in-JS) inject rules via CSSOM
				// insertRule in production ("speedy" mode), which leaves the
				// <style> tags EMPTY when the DOM is serialized. That makes the
				// prerendered HTML paint as unstyled text until the JS bundle loads
				// and re-injects the CSS — a flash of unformatted content. Serialize
				// every stylesheet's rules back into its <style> textContent so the
				// snapshot paints fully styled on first render.
				await page.evaluate(() => {
					for (const styleEl of document.querySelectorAll('style')) {
						try {
							const sheet = styleEl.sheet;
							if (
								sheet &&
								sheet.cssRules &&
								sheet.cssRules.length > 0 &&
								styleEl.textContent.trim() === ''
							) {
								let css = '';
								for (const rule of sheet.cssRules) css += rule.cssText;
								styleEl.textContent = css;
							}
						} catch {
							// Cross-origin stylesheet — cssRules access throws; skip it.
						}
					}
				});

				const html = await page.content();
				const outFile = outputPathFor(route);
				await mkdir(dirname(outFile), { recursive: true });
				await writeFile(outFile, html, 'utf8');
				ok += 1;
				console.log(`✅ prerendered ${route} -> ${outFile.replace(distDir, 'dist')}`);
			} catch (error) {
				console.warn(`⚠️  prerender: failed for ${route} (${error.message}). Left as CSR.`);
			} finally {
				await page.close().catch(() => {});
			}
		}

		console.log(`✅ prerender complete: ${ok}/${routes.length} routes.`);
	} catch (error) {
		console.warn(`⚠️  prerender: aborted (${error.message}). Build continues with CSR.`);
	} finally {
		if (browser) await browser.close().catch(() => {});
		if (server) server.close();
	}
}

run().catch((error) => {
	// Never fail the build because of prerendering.
	console.warn(`⚠️  prerender: unexpected error (${error.message}). Build continues.`);
	process.exit(0);
});
