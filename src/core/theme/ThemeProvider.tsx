import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { darkTheme } from './dark';
import { lightTheme } from './light';

export enum ThemeMode {
	Light = 'light',
	Dark = 'dark',
	System = 'system',
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
	defaultTheme = ThemeMode.Dark,
}) => {
	const [themeMode, setThemeMode] = useState<ThemeMode>(defaultTheme);
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

	// toggleTheme cycles between light and dark (ignores system)
	const toggleTheme = () => {
		setThemeMode((prev) => (prev === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light));
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
