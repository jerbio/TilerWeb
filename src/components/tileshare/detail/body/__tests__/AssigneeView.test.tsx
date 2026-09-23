import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { Routes } from '@/core/constants/routes';
import type { Assignee } from '@/core/util/tileshareAssignees';
import type { TileShareTemplate } from '@/core/common/types/tileshare';
import AssigneeView from '../AssigneeView';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
}));

vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return {
		...actual,
		Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
			<a href={to} {...rest}>
				{children}
			</a>
		),
	};
});

const assignees: Assignee[] = [
	{ id: 'u1', name: 'Alice X.', avatar: { name: 'Alice X.' }, tilettes: [] },
	{ id: 'u2', name: 'Bob X.', avatar: { name: 'Bob X.' }, tilettes: [] },
];

describe('AssigneeView', () => {
	it('renders a column per visible assignee', () => {
		render(
			<AssigneeView
				assignees={assignees}
				clusterId="c"
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
				clusterId="c"
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

	it('links each tilette card to its detail page', () => {
		const tilette = {
			id: 'tpl-1',
			name: 'Backend integration',
			creator: null,
			designatedUsers: [],
			clusterId: 'c',
			duration: null,
			start: null,
			end: null,
			miscData: null,
		} satisfies TileShareTemplate;
		const withCard: Assignee[] = [
			{ id: 'u1', name: 'Alice X.', avatar: { name: 'Alice X.' }, tilettes: [tilette] },
		];

		render(
			<AssigneeView
				assignees={withCard}
				clusterId="c"
				columns={1}
				showFooter={false}
				hasPrev={false}
				hasNext={false}
				onPrev={vi.fn()}
				onNext={vi.fn()}
			/>
		);

		const link = screen.getByRole('link', { name: 'tilesharedemo.detail.openTiletteAria' });
		expect(link).toHaveAttribute('href', Routes.Tileshare.tilette('c', 'tpl-1'));
	});

	it('fires onNext / onPrev and disables at the ends', async () => {
		const onNext = vi.fn();
		const onPrev = vi.fn();
		const u = setupUser();
		render(
			<AssigneeView
				assignees={assignees}
				clusterId="c"
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
