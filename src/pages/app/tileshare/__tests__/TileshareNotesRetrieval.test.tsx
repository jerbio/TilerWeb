import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import TileshareDetailPage from '../TileshareDetailPage';

vi.mock('react-i18next', async (importOriginal) => ({
	...(await importOriginal<typeof import('react-i18next')>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/core/theme/ThemeProvider', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('react-router', async (importOriginal) => ({
	...(await importOriginal<typeof import('react-router')>()),
	useParams: () => ({ id: 'Cluster+one' }),
	useNavigate: () => vi.fn(),
}));
vi.mock('@/components/tileshare/detail/TileshareDetailBreadcrumb', () => ({ default: () => null }));
vi.mock('@/hooks/useClusterDetail', () => ({
	useClusterDetail: () => ({
		data: {
			cluster: {
				id: 'Cluster+one',
				name: 'Share with notes',
				notes: null,
				mode: null,
				creator: null,
				end: 1792454340000,
			},
			tilettes: [],
		},
		loading: false,
		error: null,
		refresh: vi.fn(),
	}),
}));
vi.mock('@/components/tileshare/TileShareDetailLayout', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/tileshare/detail/body/TiletteBody', () => ({ default: () => null }));

describe('share detail note retrieval', () => {
	it('fetches and renders share notes even when the cluster detail omits notes and mode', async () => {
		const requests: string[] = [];
		server.use(
			http.get('http://localhost/api/TileShareCluster/Notes', ({ request }) => {
				requests.push(new URL(request.url).searchParams.get('Id') ?? '');
				return HttpResponse.json({
					Error: { Code: '0' },
					Content: {
						Id: 'Cluster+one',
						UserNote: '## Retrieved share note\n\n**Saved Markdown**',
						Etag: 'server-token',
					},
				});
			})
		);
		render(<TileshareDetailPage />);
		expect(
			await screen.findByRole('heading', { level: 2, name: 'Retrieved share note' })
		).toBeInTheDocument();
		expect(screen.getByText('Saved Markdown').tagName).toBe('STRONG');
		expect(requests).toEqual(['Cluster+one']);
		expect(screen.queryByText('tilesharedemo.detail.noDescription')).not.toBeInTheDocument();
	});
	it('shows a retrieval error instead of claiming there is no description', async () => {
		server.use(
			http.get('http://localhost/api/TileShareCluster/Notes', () =>
				HttpResponse.json(
					{ Error: { Code: 'not_found', Message: 'Missing route' } },
					{ status: 404 }
				)
			)
		);
		render(<TileshareDetailPage />);
		expect(await screen.findByRole('alert')).toHaveTextContent('tileShareNotes.loadError');
		expect(screen.queryByText('tilesharedemo.detail.noDescription')).not.toBeInTheDocument();
	});
});
