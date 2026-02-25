import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/core/**/*.ts', 'src/components/**/*.tsx', 'src/pages/**/*.tsx'],
			exclude: ['**/*.d.ts', '**/test/**', '**/*.test.*', '**/*.spec.*', '**/index.ts'],
		},
	},
});
