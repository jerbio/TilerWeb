import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { setupUser } from '@/test/test-utils';
import TileshareToolbar from '../TileshareToolbar';

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TileshareToolbar', () => {
	it('renders the avatar cluster and greeting for the given user', () => {
		render(
			<TileshareToolbar
				user={{ name: 'Alice Adams', email: 'alice@example.com' }}
				onSelectMode={vi.fn()}
			/>
		);
		expect(screen.getByText('AA')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.dashboard.toolbar.welcome')).toBeInTheDocument();
		expect(screen.getByText('Alice Adams')).toBeInTheDocument();
	});

	it('opens the create selection dropdown and triggers the chosen option', async () => {
		const user = setupUser();
		const onSelectMode = vi.fn();
		render(
			<TileshareToolbar
				user={{ name: 'Alice Adams', email: null }}
				onSelectMode={onSelectMode}
			/>
		);

		expect(screen.queryByText('tileShareModes.broadcast.label')).not.toBeInTheDocument();

		await user.click(
			screen.getByRole('button', { name: 'tilesharedemo.dashboard.toolbar.create' })
		);

		expect(screen.getByText('tileShareModes.broadcast.label')).toBeInTheDocument();
		expect(screen.getByText('tileShareModes.project.label')).toBeInTheDocument();

		await user.click(screen.getByText('tileShareModes.project.label'));

		expect(onSelectMode).toHaveBeenCalledExactlyOnceWith('project');
		expect(screen.queryByText('tileShareModes.broadcast.label')).not.toBeInTheDocument();
	});
});
