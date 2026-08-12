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
				onSelectSingle={vi.fn()}
				onSelectMulti={vi.fn()}
			/>
		);
		expect(screen.getByText('AA')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.dashboard.toolbar.welcome')).toBeInTheDocument();
		expect(screen.getByText('Alice Adams')).toBeInTheDocument();
	});

	it('opens the create selection dropdown and triggers the chosen option', async () => {
		const user = setupUser();
		const onSelectSingle = vi.fn();
		const onSelectMulti = vi.fn();
		render(
			<TileshareToolbar
				user={{ name: 'Alice Adams', email: null }}
				onSelectSingle={onSelectSingle}
				onSelectMulti={onSelectMulti}
			/>
		);

		expect(
			screen.queryByText('tilesharedemo.dashboard.createSelection.single.label')
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole('button', { name: 'tilesharedemo.dashboard.toolbar.create' })
		);

		expect(
			screen.getByText('tilesharedemo.dashboard.createSelection.single.label')
		).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.createSelection.multi.label')
		).toBeInTheDocument();

		await user.click(screen.getByText('tilesharedemo.dashboard.createSelection.multi.label'));

		expect(onSelectMulti).toHaveBeenCalledTimes(1);
		expect(onSelectSingle).not.toHaveBeenCalled();
		expect(
			screen.queryByText('tilesharedemo.dashboard.createSelection.single.label')
		).not.toBeInTheDocument();
	});
});
