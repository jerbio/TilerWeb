import { Toaster } from 'sonner';
import { ThemeMode, useTheme } from '@/core/theme/ThemeProvider';

export default function AppToaster() {
	const { isDarkMode } = useTheme();
	return <Toaster position="bottom-left" theme={isDarkMode ? ThemeMode.Dark : ThemeMode.Light} />;
}
