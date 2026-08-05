import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import { render, screen, setupUser } from '@/test/test-utils';
import MultiTileshareHeader from '../MultiTileshareHeader';

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

describe('MultiTileshareHeader', () => {
	it('renders the name, subtitle key, progress and date', () => {
		render(
			<MultiTileshareHeader
				name="Q1 projects 2026"
				description="Align the team."
				progress={20}
				date={DATE}
			/>
		);

		expect(screen.getByText('Q1 projects 2026')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.multiTileshare')).toBeInTheDocument();
		expect(screen.getByText('Align the team.')).toBeInTheDocument();
		expect(screen.getByText('20%')).toBeInTheDocument();
		expect(screen.getByText('Sun, 27th July, 2025')).toBeInTheDocument();
	});

	it('fires onEdit and onAdd when the action buttons are clicked', async () => {
		const onEdit = vi.fn();
		const onAdd = vi.fn();
		const user = setupUser();

		render(
			<MultiTileshareHeader
				name="Q1"
				description={null}
				progress={0}
				date={DATE}
				onEdit={onEdit}
				onAdd={onAdd}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'tilesharedemo.detail.editAria' }));
		await user.click(screen.getByRole('button', { name: 'tilesharedemo.detail.addAria' }));

		expect(onEdit).toHaveBeenCalledOnce();
		expect(onAdd).toHaveBeenCalledOnce();
	});

	it('fires onDelete when the delete button is clicked, and hides it when omitted', async () => {
		const onDelete = vi.fn();
		const user = setupUser();

		const { unmount } = render(
			<MultiTileshareHeader
				name="Q1"
				description={null}
				progress={0}
				date={DATE}
				onDelete={onDelete}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'tilesharedemo.detail.deleteAria' }));
		expect(onDelete).toHaveBeenCalledOnce();

		unmount();
		render(<MultiTileshareHeader name="Q1" description={null} progress={0} date={DATE} />);
		expect(
			screen.queryByRole('button', { name: 'tilesharedemo.detail.deleteAria' })
		).not.toBeInTheDocument();
	});

	// Assignees get a read-only header: no edit, delete or add.
	it('renders no action buttons for a read-only viewer', () => {
		render(<MultiTileshareHeader name="Q1" description={null} progress={0} date={DATE} />);
		expect(screen.queryAllByRole('button')).toHaveLength(0);
	});

	it('falls back to an em dash title when name is null', () => {
		render(<MultiTileshareHeader name={null} description={null} progress={0} date={DATE} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('—');
	});
});
