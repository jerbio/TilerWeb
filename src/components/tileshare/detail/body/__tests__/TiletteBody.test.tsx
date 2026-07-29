import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import type { DesignatedUser, TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteBody from '../TiletteBody';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => {
			if (opts && 'count' in opts) return `${key} ${opts.count}`;
			if (opts && 'shown' in opts) return `${key} ${opts.shown}/${opts.total}`;
			return key;
		},
	}),
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
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

// Force a fixed 2 columns per page so assignee pagination is deterministic.
vi.mock('@/hooks/useResponsiveColumns', () => ({
	default: () => ({ ref: { current: null }, columns: 2 }),
	useResponsiveColumns: () => ({ ref: { current: null }, columns: 2 }),
}));

function user(id: string, first: string): DesignatedUser {
	return {
		displayedIdentifier: `${id}@x.com`,
		userId: id,
		designatedTileTemplateId: null,
		userProfile: {
			id,
			username: null,
			timeZoneDifference: null,
			timeZone: null,
			email: null,
			endfOfDay: null,
			endOfDay: null,
			phoneNumber: null,
			fullName: null,
			firstName: first,
			lastName: 'X',
			countryCode: null,
		},
		rsvpStatus: null,
		completionPct: null,
	};
}

function tilette(id: string, users: DesignatedUser[]): TileShareTemplate {
	return {
		id,
		name: id,
		creator: null,
		designatedUsers: users,
		clusterId: 'c',
		duration: null,
		start: null,
		end: null,
		miscData: null,
	};
}

const tilettes = [
	tilette('t1', [user('u1', 'Alice'), user('u2', 'Bob')]),
	tilette('t2', [user('u3', 'Cara')]),
];

describe('TiletteBody', () => {
	it('starts in list view showing the tilette count', () => {
		render(<TiletteBody clusterId="c" tilettes={tilettes} />);
		expect(screen.getByText('tilesharedemo.detail.showingTilettes 2/2')).toBeInTheDocument();
	});

	it('does not paginate the list when everything fits on one page', () => {
		render(<TiletteBody clusterId="c" tilettes={tilettes} />);
		expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
	});

	it('paginates the list view when there are more tilettes than fit a page', async () => {
		const u = setupUser();
		const many = Array.from({ length: 12 }, (_, i) => tilette(`t${i + 1}`, [user('u1', 'A')]));
		render(<TiletteBody clusterId="c" tilettes={many} />);

		// 10 per page, 12 tilettes -> first page shows 10 of 12
		expect(screen.getByText('tilesharedemo.detail.showingTilettes 10/12')).toBeInTheDocument();
		expect(screen.getByText('t1')).toBeInTheDocument();
		expect(screen.queryByText('t11')).not.toBeInTheDocument();

		await u.click(screen.getByRole('button', { name: /next/i }));

		expect(screen.getByText('tilesharedemo.detail.showingTilettes 2/12')).toBeInTheDocument();
		expect(screen.getByText('t11')).toBeInTheDocument();
		expect(screen.queryByText('t1')).not.toBeInTheDocument();
	});

	it('switches to assignee view and paginates', async () => {
		const u = setupUser();
		render(<TiletteBody clusterId="c" tilettes={tilettes} />);

		await u.click(screen.getByRole('tab', { name: 'tilesharedemo.detail.view.assignee' }));

		// 2 columns per page, 3 assignees -> first page shows 2 of 3
		expect(screen.getByText('tilesharedemo.detail.showingAssignees 2/3')).toBeInTheDocument();
		expect(screen.getByText('Alice X.')).toBeInTheDocument();
		expect(screen.queryByText('Cara X.')).not.toBeInTheDocument();

		await u.click(screen.getByRole('button', { name: /next/i }));

		expect(screen.getByText('tilesharedemo.detail.showingAssignees 1/3')).toBeInTheDocument();
		expect(screen.getByText('Cara X.')).toBeInTheDocument();
	});
});
