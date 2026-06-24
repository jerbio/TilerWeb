import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import ThemeInitializer from './ThemeInitializer';
import { UserSettings } from '@/api/userApi';

// ---------------------------------------------------------------------------
// Mock @/services
// ---------------------------------------------------------------------------
vi.mock('@/services', () => ({
	userService: {
		getSettings: vi.fn(),
	},
}));

import { userService } from '@/services';

// ---------------------------------------------------------------------------
// Mock @/global_state — mutable so individual tests control isAuthenticated
// ---------------------------------------------------------------------------
let mockIsAuthenticated = false;

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = { isAuthenticated: mockIsAuthenticated };
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({ isAuthenticated: mockIsAuthenticated }),
		}
	),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockSettings = (themeMode: string): UserSettings => ({
	userPreference: {
		id: 'p1',
		notifcationEnabled: true,
		notifcationEnabledMs: 0,
		emailNotificationEnabled: true,
		textNotificationEnabled: false,
		pushNotificationEnabled: false,
		tileNotificationEnabled: true,
	},
	marketingPreference: {
		id: 'm1',
		disableAll: false,
		disableEmail: false,
		disableTextMsg: false,
	},
	scheduleProfile: {
		travelMedium: 'driving',
		pinPreference: 'start',
		sleepDuration: 0,
		endTimeOfDay: '',
	},
	mobileUiScheme: {
		id: 'mob1',
		scheduleProfileId: '',
		name: '',
		mainColor: '',
		accentColor: '',
		fontFamily: '',
		fontSize: 14,
		fontWeight: '',
		isDefault: true,
		themeMode: 'dark',
	},
	desktopUiScheme: {
		id: 'desk1',
		scheduleProfileId: '',
		name: '',
		mainColor: '',
		accentColor: '',
		fontFamily: '',
		fontSize: 14,
		fontWeight: '',
		isDefault: true,
		themeMode,
	},
});

/** Renders ThemeInitializer alongside a consumer that shows the current themeMode. */
const ThemeModeDisplay: React.FC = () => {
	const { themeMode } = useTheme();
	return <span data-testid="themeMode">{themeMode}</span>;
};

const renderWithTheme = () =>
	render(
		<ThemeProvider defaultTheme="dark">
			<ThemeInitializer />
			<ThemeModeDisplay />
		</ThemeProvider>
	);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ThemeInitializer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsAuthenticated = false;
	});

	it('does not fetch settings when not authenticated', async () => {
		mockIsAuthenticated = false;
		renderWithTheme();

		// Wait a tick to be sure no async calls fire
		await new Promise((r) => setTimeout(r, 50));
		expect(userService.getSettings).not.toHaveBeenCalled();
	});

	it('fetches settings immediately when mounted as authenticated', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockResolvedValue(mockSettings('dark'));

		renderWithTheme();

		await waitFor(() => {
			expect(userService.getSettings).toHaveBeenCalledTimes(1);
		});
	});

	it('applies light theme from desktopUiScheme.themeMode', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockResolvedValue(mockSettings('light'));

		renderWithTheme();

		await waitFor(() => {
			expect(screen.getByTestId('themeMode').textContent).toBe('light');
		});
	});

	it('applies dark theme from desktopUiScheme.themeMode', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockResolvedValue(mockSettings('dark'));

		renderWithTheme();

		// ThemeProvider already defaults to 'dark', but the initializer re-confirms it
		await waitFor(() => {
			expect(userService.getSettings).toHaveBeenCalled();
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
		});
	});

	it('applies system theme from desktopUiScheme.themeMode', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockResolvedValue(mockSettings('system'));

		renderWithTheme();

		await waitFor(() => {
			expect(screen.getByTestId('themeMode').textContent).toBe('system');
		});
	});

	it('falls back to dark when desktopUiScheme.themeMode is invalid', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockResolvedValue(mockSettings('invalid-value'));

		renderWithTheme();

		await waitFor(() => {
			expect(userService.getSettings).toHaveBeenCalled();
			expect(screen.getByTestId('themeMode').textContent).toBe('dark');
		});
	});

	it('does not throw when getSettings rejects', async () => {
		mockIsAuthenticated = true;
		(userService.getSettings as Mock).mockRejectedValue(new Error('network error'));

		// Should not throw; theme stays at default
		expect(() => renderWithTheme()).not.toThrow();
		await waitFor(() => {
			expect(userService.getSettings).toHaveBeenCalled();
		});
		// Theme unchanged
		expect(screen.getByTestId('themeMode').textContent).toBe('dark');
	});
});
