import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import TileShareClusterCard from '../TileShareClusterCard';
import { TileShareCluster } from '@/core/common/types/tileshare';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { count?: number }) => {
			const translations: Record<string, string> = {
				'tilesharedemo.card.tileshare': 'Tileshare',
				'tilesharedemo.card.multiTileshare': 'Multi-Tileshare',
				'tilesharedemo.card.dueOn': 'Due On',
				'tilesharedemo.card.dueBy': 'Due By',
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
	id: 'cluster-1',
	name: 'Design Sprint',
	start: 1750755360000,
	end: 1751263140000,
	isCompleted: false,
	isDeleted: false,
	isDismissed: false,
	isMultiTilette: false,
	creator: mockCreator,
	tileShareTemplates: [],
	truncatedUser: 'bob@example.com, carol@example.com',
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

	it('renders tileshare subtitle when isMultiTilette is false', () => {
		renderCard(mockCluster);
		expect(screen.getByText('Tileshare')).toBeInTheDocument();
	});

	it('renders multi-tileshare subtitle when isMultiTilette is true', () => {
		renderCard({ ...mockCluster, isMultiTilette: true });
		expect(screen.getByText('Multi-Tileshare')).toBeInTheDocument();
	});

	it('renders the view button', () => {
		renderCard(mockCluster);
		expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
	});

	it('renders due date labels', () => {
		renderCard(mockCluster);
		expect(screen.getByText('Due On')).toBeInTheDocument();
		expect(screen.getByText('Due By')).toBeInTheDocument();
	});

	it('shows fallback dashes when name is null', () => {
		renderCard({ ...mockCluster, name: null });
		expect(screen.getByText('—')).toBeInTheDocument();
	});

	it('shows fallback dashes for due date when end is null', () => {
		renderCard({ ...mockCluster, end: null });
		expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
	});

	it('renders avatar count from truncatedUser', () => {
		renderCard(mockCluster);
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('renders zero link count when truncatedUser is null', () => {
		renderCard({ ...mockCluster, truncatedUser: null });
		expect(screen.getByText('0')).toBeInTheDocument();
	});
});
