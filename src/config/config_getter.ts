// src/config/env.ts

const rawEnv = {
	BASE_URL: import.meta.env.VITE_BASE_URL,
	// Add more here without needing to update types
} as const;

type EnvKey = keyof typeof rawEnv;

class EnvGetter {
	private readonly envMap = rawEnv;

	public get(key: EnvKey): string {
		const value = this.envMap[key];
		if (!value) {
			throw new Error(`[Env] ${key} is not defined in ${import.meta.env.VITE_NODE_ENV}`);
		}
		return value;
	}

	public getCurrentEnv(): string {
		return import.meta.env.VITE_NODE_ENV;
	}

	public isProduction(): boolean {
		return import.meta.env.VITE_NODE_ENV === 'production';
	}

	public isDevelopment(): boolean {
		return import.meta.env.VITE_NODE_ENV === 'development';
	}
}

export const Env = new EnvGetter();
