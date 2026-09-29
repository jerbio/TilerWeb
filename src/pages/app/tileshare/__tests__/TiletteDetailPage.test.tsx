import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import TiletteDetailPage from '../TiletteDetailPage';
import type { CommentView } from '@/core/common/types/comment';
import type { TileShareCluster, TileShareTemplate } from '@/core/common/types/tileshare';
import type { UserInfo } from '@/global_state';

// ---------------------------------------------------------------------------
// Page-level regression test: the tilette detail page must mount the
// CommentThread with the correct target once a tilette has loaded.
//
// The data hooks, auth and the presentational leaf components (breadcrumb,
// header, skeleton, edit modal) are mocked so the test isolates the mounting
// decision. The real CommentThread renders (its comments API is mocked below),
// so the correct targetType/targetId are verified end-to-end.
// ---------------------------------------------------------------------------

vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return {
		...actual,
		useTranslation: () => ({
			t: (key: string, opts?: { count?: number; name?: string }) => {
				if (key === 'comments.count') return `${opts?.count ?? 0} comments`;
				if (key === 'tilesharedemo.detail.inCluster') return `In: ${opts?.name ?? ''}`;
				return key;
			},
		}),
	};
});

const useParamsMock = vi.hoisted(() => ({
	current: { id: 'cluster-1', tiletteId: 'tilette-1' } as Record<string, string | undefined>,
}));
vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return {
		...actual,
		useParams: () => useParamsMock.current,
	};
});

const tiletteDetailMock = vi.hoisted(() => ({
	current: {
		data: null as TileShareTemplate | null,
		loading: false,
		error: null as Error | null,
		refresh: vi.fn(),
	},
}));
vi.mock('@/hooks/useTiletteDetail', () => ({
	useTiletteDetail: () => tiletteDetailMock.current,
}));

const clusterHeaderMock = vi.hoisted(() => ({
	current: {
		data: null as TileShareCluster | null,
		loading: false,
		error: null as Error | null,
		refresh: vi.fn(),
	},
}));
vi.mock('@/hooks/useClusterHeader', () => ({
	useClusterHeader: () => clusterHeaderMock.current,
}));

vi.mock('@/core/auth/useAuth', () => ({
	useAuth: () => ({
		isAuthenticated: true,
		isAuthLoading: false,
		user: {
			id: 'user-1',
			username: 'tester',
			timeZoneDifference: 0,
			timeZone: 'UTC',
			email: 'tester@example.com',
			endOfDay: null,
			phoneNumber: null,
			fullName: 'Tester',
			firstName: 'Tester',
			lastName: '',
			countryCode: '1',
			dateOfBirth: null,
		} as UserInfo,
		checkAuth: vi.fn(),
		logout: vi.fn(),
		setAuthenticated: vi.fn(),
	}),
}));

// Presentational leaves: stub them out so the test asserts mounting, not layout.
vi.mock('@/components/tileshare/detail/TileshareDetailBreadcrumb', () => ({
	__esModule: true,
	default: () => <div data-testid="breadcrumb-stub" />,
}));
vi.mock('@/components/tileshare/detail/SingleTileshareHeader', () => ({
	__esModule: true,
	default: () => <div data-testid="header-stub" />,
}));
vi.mock('@/components/tileshare/detail/DetailHeaderSkeleton', () => ({
	__esModule: true,
	default: () => <div data-testid="skeleton-stub" />,
}));
vi.mock('@/components/tileshare/detail/EditTileshareModal', () => ({
	__esModule: true,
	default: () => <div data-testid="edit-modal-stub" />,
}));

// The real CommentThread builds a default service wrapping CommentsApi. Mock the
// API layer so no network call is made while the thread still runs for real.
const commentsApiMock = vi.hoisted(() => ({
	getComments: vi.fn(),
	getReplies: vi.fn(),
	createComment: vi.fn(),
	updateComment: vi.fn(),
	deleteComment: vi.fn(),
}));
vi.mock('@/api/commentsApi', () => ({
	__esModule: true,
	CommentsApi: class {
		getComments = commentsApiMock.getComments;
		getReplies = commentsApiMock.getReplies;
		createComment = commentsApiMock.createComment;
		updateComment = commentsApiMock.updateComment;
		deleteComment = commentsApiMock.deleteComment;
	},
}));
// The real CommentsService unwraps the ApiResponse envelope (reads res.Content,
// throws on a non-zero Error.Code), so the mock resolves the full envelope.
const emptyCommentsContent = { comments: [] as CommentView[], nextCursor: null, total: 0 };
const emptyCommentsEnvelope = {
	Error: { Code: '0', Message: '' },
	Content: emptyCommentsContent,
	ServerStatus: null,
};

const makeCluster = (overrides: Partial<TileShareCluster> = {}): TileShareCluster => ({
	id: 'cluster-1',
	name: 'My Cluster',
	notes: null,
	start: 1750000000000,
	end: 1750100000000,
	isCompleted: null,
	isDeleted: null,
	isDismissed: null,
	isMultiTilette: true,
	creator: null,
	tileShareTemplates: null,
	truncatedUser: null,
	...overrides,
});

const makeTilette = (overrides: Partial<TileShareTemplate> = {}): TileShareTemplate => ({
	id: 'tilette-1',
	name: 'My Tilette',
	creator: null,
	designatedUsers: null,
	clusterId: 'cluster-1',
	duration: null,
	start: 1750000000000,
	end: 1750100000000,
	miscData: { id: null, userNote: null },
	...overrides,
});

describe('TiletteDetailPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useParamsMock.current = { id: 'cluster-1', tiletteId: 'tilette-1' };
		tiletteDetailMock.current = { data: null, loading: false, error: null, refresh: vi.fn() };
		clusterHeaderMock.current = { data: null, loading: false, error: null, refresh: vi.fn() };
		commentsApiMock.getComments.mockResolvedValue(emptyCommentsEnvelope);
	});

	it('mounts the CommentThread targeted at the loaded tilette', async () => {
		tiletteDetailMock.current = {
			data: makeTilette(),
			loading: false,
			error: null,
			refresh: vi.fn(),
		};
		clusterHeaderMock.current = {
			data: makeCluster(),
			loading: false,
			error: null,
			refresh: vi.fn(),
		};

		render(<TiletteDetailPage />);

		// The real thread renders and fetches for exactly this tilette target.
		expect(await screen.findByTestId('comment-thread')).toBeInTheDocument();
		expect(commentsApiMock.getComments).toHaveBeenCalledWith(
			expect.objectContaining({
				targetType: 'tileshare_tilette',
				targetId: 'tilette-1',
				limit: 50,
			})
		);
	});

	it('does not render the CommentThread when the tilette has no id', async () => {
		tiletteDetailMock.current = {
			data: makeTilette({ id: null }),
			loading: false,
			error: null,
			refresh: vi.fn(),
		};
		clusterHeaderMock.current = {
			data: makeCluster(),
			loading: false,
			error: null,
			refresh: vi.fn(),
		};

		render(<TiletteDetailPage />);

		// The header (stub) confirms the page reached its loaded state.
		expect(screen.getByTestId('header-stub')).toBeInTheDocument();
		// But the guarded comment thread is absent and never fetched.
		expect(screen.queryByTestId('comment-thread')).not.toBeInTheDocument();
		expect(commentsApiMock.getComments).not.toHaveBeenCalled();
	});

	it('shows the load error and no CommentThread when the tilette fails to load', async () => {
		tiletteDetailMock.current = {
			data: null,
			loading: false,
			error: new Error('boom'),
			refresh: vi.fn(),
		};
		clusterHeaderMock.current = {
			data: makeCluster(),
			loading: false,
			error: null,
			refresh: vi.fn(),
		};

		render(<TiletteDetailPage />);

		expect(await screen.findByText('tilesharedemo.detail.loadError')).toBeInTheDocument();
		expect(screen.queryByTestId('comment-thread')).not.toBeInTheDocument();
		expect(commentsApiMock.getComments).not.toHaveBeenCalled();
	});
});
