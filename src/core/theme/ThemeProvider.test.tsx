import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme, ThemeMode } from './ThemeProvider';

// ---------------------------------------------------------------------------
// Helper: a component that reads every value from ThemeContext
// ---------------------------------------------------------------------------
const ThemeConsumer: React.FC = () => {
	const { isDarkMode, themeMode, setThemeMode, toggleTheme } = useTheme();
	return (
		<div>
			<span data-testid="isDarkMode">{String(isDarkMode)}</span>
			<span data-testid="themeMode">{themeMode}</span>
			<button onClick={() => setThemeMode(ThemeMode.Light)}>set-light</button>
			<button onClick={() => setThemeMode(ThemeMode.Dark)}>set-dark</button>
			<button onClick={() => setThemeMode(ThemeMode.System)}>set-system</button>
			<button onClick={toggleTheme}>toggle</button>
		</div>
	);
};

// ---------------------------------------------------------------------------
// Helper: set up a controllable matchMedia mock
// Returns a function that triggers the stored 'change' listeners.
// ---------------------------------------------------------------------------
type ChangeListener = (e: Pick<MediaQueryListEvent, 'matches'>) => void;

const setupMatchMedia = (initialMatches: boolean) => {
	const listeners: ChangeListener[] = [];

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: initialMatches,
			media: query,
			onchange: null,
			addEventListener: vi.fn((_event: string, cb: ChangeListener) => listeners.push(cb)),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	const triggerChange = (matches: boolean) => {
		act(() => {
			listeners.forEach((l) => l({ matches }));
		});
	};

	return { triggerChange };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ThemeProvider', () => {
	beforeEach(() => {
		setupMatchMedia(false); // default: OS is light
	});

	// -- defaultTheme prop ---------------------------------------------------
	describe('defaultTheme initialisation', () => {
		it('defaults to dark mode when no defaultTheme is supplied', () => {
			render(
				<ThemeProvider>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});

		it('initialises to light when defaultTheme=Light', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Light}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('themeMode').textContent).toBe('light');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});

		it('initialises to dark when defaultTheme=Dark', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Dark}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});

		it('resolves system mode as light when OS prefers light', () => {
			setupMatchMedia(false);
			render(
				<ThemeProvider defaultTheme={ThemeMode.System}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('themeMode').textContent).toBe('system');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});

		it('resolves system mode as dark when OS prefers dark', () => {
			setupMatchMedia(true);
			render(
				<ThemeProvider defaultTheme={ThemeMode.System}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('themeMode').textContent).toBe('system');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});
	});

	// -- setThemeMode --------------------------------------------------------
	describe('setThemeMode', () => {
		it('switches from dark to light', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Dark}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('set-light'));
			expect(screen.getByTestId('themeMode').textContent).toBe('light');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});

		it('switches from light to dark', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Light}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('set-dark'));
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});

		it('switches to system mode and resolves from matchMedia', () => {
			setupMatchMedia(true); // OS is dark
			render(
				<ThemeProvider defaultTheme={ThemeMode.Light}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('set-system'));
			expect(screen.getByTestId('themeMode').textContent).toBe('system');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});
	});

	// -- toggleTheme ---------------------------------------------------------
	describe('toggleTheme', () => {
		it('toggles from dark to light', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Dark}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('toggle'));
			expect(screen.getByTestId('themeMode').textContent).toBe('light');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});

		it('toggles from light to dark', () => {
			render(
				<ThemeProvider defaultTheme={ThemeMode.Light}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('toggle'));
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});

		it('toggles from system to light (ignores system, treats as dark → light)', () => {
			setupMatchMedia(true); // OS is dark → isDarkMode true
			render(
				<ThemeProvider defaultTheme={ThemeMode.System}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			// toggle cycles prev === 'light' ? 'dark' : 'light'
			// prev is 'system' so result is 'light'
			fireEvent.click(screen.getByText('toggle'));
			expect(screen.getByTestId('themeMode').textContent).toBe('light');
		});
	});

	// -- OS-level change listener -------------------------------------------
	describe('system mode OS changes', () => {
		it('updates isDarkMode when OS switches to dark while in system mode', () => {
			const { triggerChange } = setupMatchMedia(false);
			render(
				<ThemeProvider defaultTheme={ThemeMode.System}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');

			triggerChange(true);
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');
		});

		it('updates isDarkMode when OS switches to light while in system mode', () => {
			const { triggerChange } = setupMatchMedia(true);
			render(
				<ThemeProvider defaultTheme={ThemeMode.System}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			expect(screen.getByTestId('isDarkMode').textContent).toBe('true');

			triggerChange(false);
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});

		it('does not change isDarkMode when OS changes but mode is light', () => {
			const { triggerChange } = setupMatchMedia(false);
			render(
				<ThemeProvider defaultTheme={ThemeMode.Light}>
					<ThemeConsumer />
				</ThemeProvider>
			);
			triggerChange(true); // OS switches to dark, but we are pinned to light
			expect(screen.getByTestId('isDarkMode').textContent).toBe('false');
		});
	});

	// -- useTheme guard ------------------------------------------------------
	describe('useTheme hook', () => {
		it('throws when consumed outside a ThemeProvider', () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
			expect(() => render(<ThemeConsumer />)).toThrow(
				'useTheme must be used within a ThemeProvider'
			);
			consoleError.mockRestore();
		});
	});
});
