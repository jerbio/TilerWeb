import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { darkTheme } from './dark';
import { lightTheme } from './light';

export type ThemeMode = 'light' | 'dark' | 'system';
export const ThemeMode = {
	Light: 'light' as const,
	Dark: 'dark' as const,
	System: 'system' as const,
};

const THEME_STORAGE_KEY = 'tiler-theme-mode';

const VALID_MODES: readonly ThemeMode[] = [ThemeMode.Light, ThemeMode.Dark, ThemeMode.System];

function readStoredTheme(): ThemeMode | null {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored && (VALID_MODES as string[]).includes(stored)) {
			return stored as ThemeMode;
		}
	} catch {
		// localStorage unavailable (private browsing, SSR, etc.)
	}
	return null;
}

function writeStoredTheme(mode: ThemeMode): void {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, mode);
	} catch {
		// ignore write errors
	}
}

type ThemeContextType = {
	isDarkMode: boolean;
	themeMode: ThemeMode;
	toggleTheme: () => void;
	setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: ThemeMode;
};

function getSystemIsDark(): boolean {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
	children,
	defaultTheme = ThemeMode.System,
}) => {
	const [themeMode, setThemeModeState] = useState<ThemeMode>(
		() => readStoredTheme() ?? defaultTheme
	);
	const [systemIsDark, setSystemIsDark] = useState<boolean>(getSystemIsDark);

	// Track OS-level theme changes when mode is 'system'
	useEffect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, []);

	const isDarkMode =
		themeMode === ThemeMode.Dark || (themeMode === ThemeMode.System && systemIsDark);

	const setThemeMode = (mode: ThemeMode) => {
		writeStoredTheme(mode);
		setThemeModeState(mode);
	};

	// toggleTheme cycles between light and dark (ignores system)
	const toggleTheme = () => {
		setThemeModeState((prev) => {
			const next = prev === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
			writeStoredTheme(next);
			return next;
		});
	};

	const themeObject = isDarkMode ? darkTheme : lightTheme;

	useEffect(() => {
		document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
	}, [isDarkMode]);

	return (
		<ThemeContext.Provider value={{ isDarkMode, themeMode, toggleTheme, setThemeMode }}>
			<StyledThemeProvider theme={themeObject}>{children}</StyledThemeProvider>
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
