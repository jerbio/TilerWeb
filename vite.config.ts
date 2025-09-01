import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	plugins: [react(), basicSsl(), tsconfigPaths()],
	server: {
		https: false,
		host: true,
	},
	resolve: {
		alias: [{ find: "@", replacement: resolve(__dirname, "./src") }]
	},
});
