import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import type { Assignee } from '@/core/util/tileshareAssignees';
import AssigneeView from '../AssigneeView';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
}));

const assignees: Assignee[] = [
	{ id: 'u1', name: 'Alice X.', avatar: { name: 'Alice X.' }, tilettes: [] },
	{ id: 'u2', name: 'Bob X.', avatar: { name: 'Bob X.' }, tilettes: [] },
];

describe('AssigneeView', () => {
	it('renders a column per visible assignee', () => {
		render(
			<AssigneeView
				assignees={assignees}
				columns={2}
				showFooter={false}
				hasPrev={false}
				hasNext={false}
				onPrev={vi.fn()}
				onNext={vi.fn()}
			/>
		);
		expect(screen.getByText('Alice X.')).toBeInTheDocument();
		expect(screen.getByText('Bob X.')).toBeInTheDocument();
	});

	it('hides the footer when showFooter is false', () => {
		render(
			<AssigneeView
				assignees={assignees}
				columns={2}
				showFooter={false}
				hasPrev={false}
				hasNext={false}
				onPrev={vi.fn()}
				onNext={vi.fn()}
			/>
		);
		expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
	});

	it('fires onNext / onPrev and disables at the ends', async () => {
		const onNext = vi.fn();
		const onPrev = vi.fn();
		const u = setupUser();
		render(
			<AssigneeView
				assignees={assignees}
				columns={2}
				showFooter
				hasPrev={false}
				hasNext
				onPrev={onPrev}
				onNext={onNext}
			/>
		);

		const prev = screen.getByRole('button', { name: /prev/i });
		const next = screen.getByRole('button', { name: /next/i });
		expect(prev).toBeDisabled();

		await u.click(next);
		expect(onNext).toHaveBeenCalledOnce();
	});
});
