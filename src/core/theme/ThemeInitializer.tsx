import { useEffect, useRef } from 'react';
import useAppStore from '@/global_state';
import { userService } from '@/services';
import { useTheme, ThemeMode } from './ThemeProvider';

/**
 * Bridges auth state → ThemeProvider.
 * Place this inside both <ThemeProvider> and <AuthProvider>.
 * On first authenticated session it fetches the user's desktopUiScheme
 * and applies the stored themeMode. On logout it resets to 'dark'.
 */
const ThemeInitializer: React.FC = () => {
	const isAuthenticated = useAppStore((state) => state.isAuthenticated);
	const { setThemeMode } = useTheme();
	const initialized = useRef(false);

	useEffect(() => {
		if (!isAuthenticated) {
			// Reset to default on logout
			initialized.current = false;
			setThemeMode(ThemeMode.Dark);
			return;
		}

		if (initialized.current) return;
		initialized.current = true;

		userService
			.getSettings()
			.then((settings) => {
				const raw = settings.desktopUiScheme?.themeMode;
				const validModes = Object.values(ThemeMode) as string[];
				const mode: ThemeMode = validModes.includes(raw ?? '')
					? (raw as ThemeMode)
					: ThemeMode.Dark;
				setThemeMode(mode);
			})
			.catch(() => {
				// Non-fatal – keep whatever theme is already active
			});
	}, [isAuthenticated, setThemeMode]);

	return null;
};

export default ThemeInitializer;
