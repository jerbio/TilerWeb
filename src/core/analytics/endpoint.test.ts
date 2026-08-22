import { describe, expect, it, vi, afterEach } from 'vitest';
import { analyticsConfig } from './config';

afterEach(() => {
	vi.unstubAllEnvs();
});

/**
 * The endpoint is resolved by the browser against the *current page*, so a
 * path-relative value silently retargets on nested routes: from /tileshare/inbox
 * `api/Conversion` becomes /tileshare/api/Conversion, which no route serves. The
 * beacon still reports success, so the loss is invisible.
 */
describe('conversion endpoint resolution', () => {
	const resolveFrom = (path: string) =>
		new URL(analyticsConfig.conversionEndpoint, 'https://tiler.app' + path).pathname;

	it.each([
		['/'],
		['/signin'],
		['/timeline'],
		['/tileshare/inbox'],
		['/settings/preferences'],
		['/tileshare/abc/tilette/def'],
	])('resolves to /api/Conversion from %s', (path) => {
		expect(resolveFrom(path)).toBe('/api/Conversion');
	});

	it('keeps an explicitly configured absolute endpoint intact', () => {
		vi.stubEnv('VITE_CONVERSION_ENDPOINT', 'https://api.tiler.app/api/Conversion');
		expect(analyticsConfig.conversionEndpoint).toBe('https://api.tiler.app/api/Conversion');
	});

	it('normalises a configured path-relative endpoint to root-relative', () => {
		vi.stubEnv('VITE_CONVERSION_ENDPOINT', 'api/Conversion');
		expect(analyticsConfig.conversionEndpoint).toBe('/api/Conversion');
	});

	it('exposes the alias endpoint alongside it', () => {
		expect(
			new URL(analyticsConfig.aliasEndpoint, 'https://tiler.app/settings/x').pathname
		).toBe('/api/Conversion/alias');
	});
});
