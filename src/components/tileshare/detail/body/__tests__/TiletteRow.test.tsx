import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Routes } from '@/core/constants/routes';
import type { TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteRow from '../TiletteRow';

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

const tilette: TileShareTemplate = {
	id: 'tpl-1',
	name: 'Backend integration',
	creator: null,
	designatedUsers: [
		{
			displayedIdentifier: 'a@x.com',
			userId: 'u1',
			designatedTileTemplateId: null,
			userProfile: null,
			rsvpStatus: null,
			completionPct: null,
		},
	],
	clusterId: 'clu-1',
	duration: null,
	start: null,
	end: null,
	miscData: null,
};

describe('TiletteRow', () => {
	it('renders the tilette name and stubbed in-progress status', () => {
		render(<TiletteRow tilette={tilette} clusterId="clu-1" />);
		expect(screen.getByText('Backend integration')).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.status.inProgress')).toBeInTheDocument();
	});

	it('links the arrow to the tilette detail route', () => {
		render(<TiletteRow tilette={tilette} clusterId="clu-1" />);
		const link = screen.getByRole('link', { name: 'tilesharedemo.detail.openTiletteAria' });
		expect(link).toHaveAttribute('href', Routes.Tileshare.tilette('clu-1', 'tpl-1'));
	});
});
