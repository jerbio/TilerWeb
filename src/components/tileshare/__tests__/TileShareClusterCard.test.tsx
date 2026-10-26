import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
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
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import TileShareClusterCard from '../TileShareClusterCard';
import { TILESHARE_ACCENT } from '../accents';
import { iconSurface } from '@/core/util/colorSurface';
import { TileShareCluster, TileshareMode } from '@/core/common/types/tileshare';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { count?: number }) => {
			const translations: Record<string, string> = {
				'tileShareModes.broadcast.label': 'Broadcast',
				'tileShareModes.project.label': 'Project',
				'tileShareModes.class.label': 'Class',
				'tilesharedemo.card.tileshare': 'Tileshare',
				'tilesharedemo.card.multiTileshare': 'Multi-Tileshare',
				'tilesharedemo.card.due': 'Due:',
				'tilesharedemo.card.progress': 'Progress',
			};
			if (opts?.count !== undefined) return `${translations[key] ?? key} (${opts.count})`;
			return translations[key] ?? key;
		},
	}),
}));

const mockCreator = {
	id: 'user-1',
	username: 'alice',
	timeZoneDifference: 0,
	timeZone: 'UTC',
	email: 'alice@example.com',
	endfOfDay: null,
	endOfDay: null,
	phoneNumber: null,
	fullName: 'Alice Smith',
	firstName: 'Alice',
	lastName: 'Smith',
	countryCode: '1',
};

const mockCluster: TileShareCluster = {
	mode: TileshareMode.Broadcast,
	id: 'cluster-1',
	name: 'Design Sprint',
	notes: null,
	start: 1750755360000,
	end: 1751263140000,
	isCompleted: false,
	isDeleted: false,
	isDismissed: false,
	creator: mockCreator,
	tileShareTemplates: [],
	truncatedUser: 'bob@example.com, carol@example.com',
};

/** jsdom reports colours as `rgb(r, g, b)`, so compare against that form. */
const hexToRgbString = (hex: string) => {
	const h = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
	return `rgb(${r}, ${g}, ${b})`;
};

const renderCard = (cluster: TileShareCluster) =>
	render(
		<ThemeProvider theme={lightTheme}>
			<TileShareClusterCard cluster={cluster} />
		</ThemeProvider>
	);

describe('TileShareClusterCard', () => {
	it('renders the cluster name', () => {
		renderCard(mockCluster);
		expect(screen.getByText('Design Sprint')).toBeInTheDocument();
	});

	it('renders Broadcast from mode', () => {
		renderCard(mockCluster);
		expect(screen.getByText('Broadcast')).toBeInTheDocument();
	});

	it('uses Project mode even when the legacy flag is false', () => {
		renderCard({ ...mockCluster, mode: TileshareMode.Project });
		expect(screen.getByText('Project')).toBeInTheDocument();
	});
	it('distinguishes Class from Project', () => {
		renderCard({ ...mockCluster, mode: TileshareMode.Class });
		expect(screen.getByText('Class')).toBeInTheDocument();
	});

	it('opens the share through one link without a nested button', () => {
		renderCard(mockCluster);
		expect(screen.getByRole('link')).toHaveAttribute('href', '/tileshare/cluster-1');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders a single merged due label', () => {
		renderCard(mockCluster);
		expect(screen.getByText('Due:')).toBeInTheDocument();
	});

	it('shows fallback dashes when name is null', () => {
		renderCard({ ...mockCluster, name: null });
		expect(screen.getByText('—')).toBeInTheDocument();
	});

	it('shows fallback dashes for due date when end is null', () => {
		renderCard({ ...mockCluster, end: null });
		expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
	});

	it('renders initials for each user in truncatedUser', () => {
		renderCard(mockCluster);
		expect(screen.getByText('B')).toBeInTheDocument();
		expect(screen.getByText('C')).toBeInTheDocument();
	});

	it('derives the icon box colours from the shared tileshare accent', () => {
		const { container } = renderCard(mockCluster);
		const iconBox = container.querySelector('svg')?.parentElement as HTMLElement;
		const surface = iconSurface(TILESHARE_ACCENT, false);
		const styles = getComputedStyle(iconBox);
		expect(styles.backgroundColor).toBe(hexToRgbString(surface.background));
		expect(styles.color).toBe(hexToRgbString(surface.foreground));
	});

	it('renders no avatars when truncatedUser is null', () => {
		renderCard({ ...mockCluster, truncatedUser: null });
		expect(screen.queryByText('B')).not.toBeInTheDocument();
		expect(screen.queryByText('C')).not.toBeInTheDocument();
	});
});
