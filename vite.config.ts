import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// https://vitejs.dev/config/
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
