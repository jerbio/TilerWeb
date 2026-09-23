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

	it('renders a custom subtitle when provided', () => {
		render(
			<SingleTileshareHeader
				name="Design Sprint"
				description={null}
				dueDate={DATE}
				subtitle="In: Q1 projects 2026"
			/>
		);
		expect(screen.getByText('In: Q1 projects 2026')).toBeInTheDocument();
		expect(screen.queryByText('tilesharedemo.detail.singleTileshare')).not.toBeInTheDocument();
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

	it('fires onDelete when the delete button is clicked', async () => {
		const onDelete = vi.fn();
		const user = setupUser();

		render(
			<SingleTileshareHeader
				name="Design Sprint"
				description={null}
				dueDate={DATE}
				onDelete={onDelete}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'tilesharedemo.detail.deleteAria' }));
		expect(onDelete).toHaveBeenCalledOnce();
	});

	it('hides the delete button when onDelete is omitted', () => {
		render(<SingleTileshareHeader name="Design Sprint" description={null} dueDate={DATE} />);

		expect(
			screen.queryByRole('button', { name: 'tilesharedemo.detail.deleteAria' })
		).not.toBeInTheDocument();
	});

	// Assignees get the due pill on its own — no divider, no action buttons.
	it('renders no actions and no divider for a read-only viewer', () => {
		render(<SingleTileshareHeader name="Design Sprint" description={null} dueDate={DATE} />);

		const due = screen.getByText('tilesharedemo.detail.due Sun, 27th July, 2025');
		expect(screen.queryAllByRole('button')).toHaveLength(0);
		// The pill is the sole occupant of the header's action slot.
		const slot = due.closest('div')?.parentElement;
		expect(slot?.children).toHaveLength(1);
	});

	it('keeps the divider when an action is present', () => {
		render(
			<SingleTileshareHeader
				name="Design Sprint"
				description={null}
				dueDate={DATE}
				onEdit={vi.fn()}
			/>
		);

		const due = screen.getByText('tilesharedemo.detail.due Sun, 27th July, 2025');
		const slot = due.closest('div')?.parentElement;
		// pill + divider + edit button
		expect(slot?.children).toHaveLength(3);
	});
});
