import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import { render, screen, setupUser } from '@/test/test-utils';
import SingleTileshareHeader from '../SingleTileshareHeader';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) =>
			opts?.date ? `${key} ${opts.date}` : key,
	}),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
}));

const DATE = dayjs('2025-07-27').valueOf();

describe('SingleTileshareHeader', () => {
	it('renders the name, subtitle key, description and due date', () => {
		render(
			<SingleTileshareHeader
				name="Design Sprint for Tiler"
				description="Align the team."
				dueDate={DATE}
			/>
		);

		expect(screen.getByText('Design Sprint for Tiler')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.singleTileshare')).toBeInTheDocument();
		expect(screen.getByText('Align the team.')).toBeInTheDocument();
		// due is interpolated with the formatted date
		expect(
			screen.getByText('tilesharedemo.detail.due Sun, 27th July, 2025')
		).toBeInTheDocument();
	});

	it('shows a fallback when no description is provided', () => {
		render(<SingleTileshareHeader name="Design Sprint" description={null} dueDate={DATE} />);
		expect(screen.getByText('tilesharedemo.detail.noDescription')).toBeInTheDocument();
	});

	it('fires onEdit when the edit button is clicked', async () => {
		const onEdit = vi.fn();
		const user = setupUser();

		render(
			<SingleTileshareHeader
				name="Design Sprint"
				description={null}
				dueDate={DATE}
				onEdit={onEdit}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'tilesharedemo.detail.editAria' }));
		expect(onEdit).toHaveBeenCalledOnce();
	});
});
