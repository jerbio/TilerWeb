import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { shareAssignment, shareTilette } from '@/test/tileshare-fixtures';
import { TiletteView } from '@/core/common/types/tileshare';
import { TileShareViewerContext } from '../../../TiletteRsvpStatus';
import TiletteBody from '../TiletteBody';

vi.mock('@/api/tileshareApi', () => ({ TileshareApi: class {} }));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/core/theme/ThemeProvider', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string | Record<string, unknown>) =>
			typeof fallback === 'string'
				? fallback
				: fallback && 'shown' in fallback
					? `${fallback.shown}/${fallback.total}`
					: key,
	}),
}));
vi.mock('@/hooks/useResponsiveColumns', () => ({
	default: () => ({ ref: { current: null }, columns: 2 }),
}));

describe('shared tilette collection', () => {
	it('paginates tilettes independently of people', async () => {
		render(
			<TiletteBody
				clusterId="share"
				tilettes={Array.from({ length: 12 }, (_, i) => shareTilette(`task-${i}`))}
			/>
		);
		expect(screen.getAllByRole('listitem')).toHaveLength(10);
		await setupUser().click(screen.getByRole('button', { name: /next/i }));
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});
	it('shows only the viewer’s assignments in My scope', () => {
		render(
			<TileShareViewerContext.Provider value={{ isOwner: false, viewerId: 'viewer' }}>
				<TiletteBody
					clusterId="share"
					scope="mine"
					tilettes={[
						shareTilette('mine', [shareAssignment('viewer')]),
						shareTilette('other', [shareAssignment('other')]),
						shareTilette('unassigned'),
					]}
				/>
			</TileShareViewerContext.Provider>
		);
		expect(screen.getByText('mine')).toBeInTheDocument();
		expect(screen.queryByText('other')).not.toBeInTheDocument();
		expect(screen.queryByText('unassigned')).not.toBeInTheDocument();
	});
	it('renders the requested people view without a share-type toggle', () => {
		render(
			<TiletteBody
				clusterId="share"
				view={TiletteView.Assignee}
				tilettes={[
					shareTilette('task', [
						shareAssignment('alice'),
						shareAssignment('bob'),
						shareAssignment('cara'),
					]),
				]}
			/>
		);
		expect(screen.getByText('alice@example.com')).toBeInTheDocument();
		expect(screen.queryByText('cara@example.com')).not.toBeInTheDocument();
		expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
	});
});
