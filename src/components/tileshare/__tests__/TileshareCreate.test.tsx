import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { setupUser } from '@/test/test-utils';
import TileshareCreate, { TileshareMode } from '../TileshareCreate';

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TileshareCreate', () => {
	it('renders the single-mode copy, shared fields and the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

		expect(screen.getByText('tilesharedemo.dashboard.create.single.title')).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.single.description')
		).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.single.submit')
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).toBeInTheDocument();
	});

	it('renders the multi-mode copy and omits the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Multi} onBack={vi.fn()} />);

		expect(screen.getByText('tilesharedemo.dashboard.create.multi.title')).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.multi.description')
		).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.dashboard.create.multi.submit')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).not.toBeInTheDocument();
	});

	it('calls onBack from both the back button and the cancel button', async () => {
		const user = setupUser();
		const onBack = vi.fn();
		render(<TileshareCreate mode={TileshareMode.Single} onBack={onBack} />);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.back'));
		await user.click(screen.getByText('tilesharedemo.dashboard.create.buttons.cancel'));

		expect(onBack).toHaveBeenCalledTimes(2);
	});
});
