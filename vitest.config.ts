import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
	plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.app.json'] })],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		environmentOptions: {
			jsdom: {
				url: 'http://localhost/',
			},
		},
		// Node.js 26 exposes a native `localStorage` global (undefined without
		// --localstorage-file) that shadows jsdom's implementation. Disable
		// the experimental Web Storage API so jsdom owns the global.
		execArgv: ['--no-experimental-webstorage'],
		include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.mjs'],
		setupFiles: ['./src/test/setup.ts'],
		env: {
			VITE_BASE_URL: 'http://localhost',
			VITE_NODE_ENV: 'test',
		},
		coverage: {
			provider: 'v8',
			include: ['src/core/**/*.ts', 'src/components/**/*.tsx', 'src/pages/**/*.tsx'],
			exclude: ['**/*.d.ts', '**/test/**', '**/*.test.*', '**/*.spec.*', '**/index.ts'],
		},
	},
});
