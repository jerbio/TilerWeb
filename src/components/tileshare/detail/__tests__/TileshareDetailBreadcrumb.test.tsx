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

	it('renders shimmer placeholders instead of text while loading', () => {
		render(
			<TileshareDetailBreadcrumb
				current="Design Sprint"
				parent={{ label: 'Q1 projects 2026', href: '/tileshare/clu-1' }}
				loading
			/>
		);

		// Root stays; dynamic crumbs are replaced by placeholders (no text yet).
		expect(
			screen.getByRole('link', { name: 'tilesharedemo.detail.breadcrumbRoot' })
		).toBeInTheDocument();
		expect(screen.queryByText('Design Sprint')).not.toBeInTheDocument();
		expect(screen.queryByText('Q1 projects 2026')).not.toBeInTheDocument();
	});

	it('renders a linked parent crumb when provided', () => {
		render(
			<TileshareDetailBreadcrumb
				current="Design Sprint"
				parent={{ label: 'Q1 projects 2026', href: '/tileshare/clu-1' }}
			/>
		);

		const parent = screen.getByRole('link', { name: 'Q1 projects 2026' });
		expect(parent).toHaveAttribute('href', '/tileshare/clu-1');
		// current is still the active (non-link) crumb
		expect(screen.getByText('Design Sprint')).toHaveAttribute('aria-current', 'page');
	});
});
