// src/config/env.ts

const rawEnv = {
    BASE_URL: import.meta.env.VITE_BASE_URL,
    API_KEY: import.meta.env.VITE_API_KEY,
    ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
    // Add more here without needing to update types
  } as const;
  
  type EnvKey = keyof typeof rawEnv;
  
  class EnvGetter {
    private readonly envMap = rawEnv;
  
    public get(key: EnvKey): string {
      const value = this.envMap[key];
      if (!value) {
        throw new Error(`[Env] ${key} is not defined in ${import.meta.env.MODE}`);
      }
      return value;
    }
  
    public getCurrentEnv(): string {
      return import.meta.env.MODE;
    }
  
    public isProduction(): boolean {
      return import.meta.env.MODE === 'production';
    }
  
    public isDevelopment(): boolean {
      return import.meta.env.MODE === 'development';
    }
  }
  
  export const Env = new EnvGetter();
  