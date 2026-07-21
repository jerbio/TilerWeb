import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Routes } from '@/core/constants/routes';
import TileshareDetailBreadcrumb from '../TileshareDetailBreadcrumb';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return {
		...actual,
		Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
			<a href={to}>{children}</a>
		),
	};
});

describe('TileshareDetailBreadcrumb', () => {
	it('renders the root crumb as a link to the tileshare root', () => {
		render(<TileshareDetailBreadcrumb current="Q1 projects 2026" />);

		const root = screen.getByRole('link', { name: 'tilesharedemo.detail.breadcrumbRoot' });
		expect(root).toHaveAttribute('href', Routes.Tileshare.root);
	});

	it('renders the current name as the active crumb', () => {
		render(<TileshareDetailBreadcrumb current="Q1 projects 2026" />);

		const current = screen.getByText('Q1 projects 2026');
		expect(current).toHaveAttribute('aria-current', 'page');
	});
});
