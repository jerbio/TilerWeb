import { defineConfig, loadEnv, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tsconfigPaths from 'vite-tsconfig-paths';

// Base configuration shared across all environments
const baseConfig: UserConfig = {
	plugins: [react(), basicSsl(), tsconfigPaths()],
};

// Development configuration
const developmentConfig = (baseUrl: string): UserConfig => ({
	...baseConfig,
	server: {
		host: true,
		https: false,
		// Proxy API requests to backend in development
		// This enables same-origin cookie handling
		proxy: {
			'/assets': {
				target: baseUrl,
				changeOrigin: true,
				secure: false,
				cookieDomainRewrite: 'localhost',
			},
			'/api': {
				target: baseUrl,
				changeOrigin: true,
				secure: false,
				cookieDomainRewrite: 'localhost',
			},
			'/account': {
				target: baseUrl,
				changeOrigin: true,
				secure: false,
				cookieDomainRewrite: 'localhost',
			},
		},
	},
});

// Production configuration
const productionConfig: UserConfig = {
	...baseConfig,
	build: {
		outDir: 'dist',
		sourcemap: false,
		minify: true,
	},
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isDevelopment = env.VITE_NODE_ENV === 'development';
	const baseUrl = env.VITE_BASE_URL;

	if (!baseUrl) {
		throw new Error('VITE_BASE_URL is not defined in environment variables');
	}

	if (isDevelopment) {
		return developmentConfig(baseUrl);
	}

	return productionConfig;
});
