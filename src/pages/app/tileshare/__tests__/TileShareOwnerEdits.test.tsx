import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import { TileShareCluster, TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteDetailPage from '../TiletteDetailPage';
import TileshareDetailPage from '../TileshareDetailPage';

const data = vi.hoisted(() => ({
	task: null as TileShareTemplate | null,
	share: null as TileShareCluster | null,
	tasks: [] as TileShareTemplate[],
	owner: true,
}));
const api = vi.hoisted(() => ({
	updateTilette: vi.fn(),
	updateCluster: vi.fn(),
	refresh: vi.fn(),
	refreshShare: vi.fn(),
}));
vi.mock('@/services', () => ({ tileshareService: api }));
vi.mock('@/hooks/useTiletteDetail', () => ({
	useTiletteDetail: () => ({
		data: data.task,
		loading: false,
		error: null,
		refresh: api.refresh,
	}),
}));
vi.mock('@/hooks/useClusterHeader', () => ({
	useClusterHeader: () => ({
		data: data.share,
		loading: false,
		error: null,
		refresh: api.refreshShare,
	}),
}));
vi.mock('@/hooks/useClusterDetail', () => ({
	useClusterDetail: () => ({
		data: { cluster: data.share, tilettes: data.tasks },
		loading: false,
		error: null,
		refresh: api.refresh,
	}),
}));
vi.mock('@/core/auth/useAuth', () => ({
	useAuth: () => ({ user: { id: data.owner ? 'owner' : 'participant' } }),
}));
vi.mock('react-router', async (original) => ({
	...(await original<typeof import('react-router')>()),
	useParams: () => ({ id: 'share', tiletteId: 'task' }),
	useNavigate: () => vi.fn(),
}));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({
		t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
	}),
}));
vi.mock('@/components/tileshare/TileShareDetailLayout', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/comments/CommentThread', () => ({ default: () => null }));
vi.mock('@/components/tileshare/detail/TileshareDetailBreadcrumb', () => ({ default: () => null }));
vi.mock('@/components/tileshare/TiletteNotes', () => ({ default: () => null }));
vi.mock('@/components/tileshare/detail/TiletteManagement', () => ({ default: () => null }));
vi.mock('@/components/tileshare/detail/body/TiletteBody', () => ({ default: () => null }));
vi.mock('@/components/tileshare/detail/SingleTileshareHeader', () => ({
	default: ({ onEdit }: { onEdit?: () => void }) =>
		onEdit ? <button onClick={onEdit}>Edit details</button> : null,
}));
vi.mock('@/components/tileshare/detail/MultiTileshareHeader', () => ({
	default: ({ onEdit }: { onEdit?: () => void }) =>
		onEdit ? <button onClick={onEdit}>Edit details</button> : null,
}));

const shareEnd = new Date(2026, 9, 20, 17, 30).getTime();
const lateEnd = new Date(2026, 9, 22, 17, 30).getTime();
const name = () => screen.getByLabelText('tilesharedemo.detail.edit.fields.name.label');
const save = () => screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' });
beforeEach(() => {
	vi.clearAllMocks();
	api.updateTilette.mockResolvedValue({});
	api.updateCluster.mockResolvedValue({});
	api.refresh.mockResolvedValue(undefined);
	api.refreshShare.mockResolvedValue(undefined);
	data.owner = true;
	data.task = {
		id: 'task',
		name: 'Write brief',
		end: lateEnd,
		start: 0,
		duration: 3600000,
		designatedUsers: [],
		miscData: null,
	} as unknown as TileShareTemplate;
	data.share = {
		id: 'share',
		name: 'Product launch',
		end: shareEnd,
		start: 0,
		creator: { id: 'owner' },
		mode: 'project',
	} as unknown as TileShareCluster;
	data.tasks = [data.task];
});
describe('owner edits through the desktop pages', () => {
	it('renames a tilette without changing its timeline and refreshes both records', async () => {
		render(<TiletteDetailPage />);
		fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
		fireEvent.change(name(), { target: { value: 'Revise brief' } });
		fireEvent.click(save());
		await waitFor(() =>
			expect(api.updateTilette).toHaveBeenCalledExactlyOnceWith({
				Id: 'task',
				Name: 'Revise brief',
			})
		);
		await waitFor(() => expect(api.refreshShare).toHaveBeenCalled());
		expect(api.updateCluster).not.toHaveBeenCalled();
	});
	it('keeps a partial save in the dialog and retries only the share deadline', async () => {
		api.updateCluster.mockRejectedValueOnce(new Error('offline'));
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
		render(<TiletteDetailPage />);
		fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
		fireEvent.change(name(), { target: { value: 'Revise brief' } });
		fireEvent.click(screen.getByRole('checkbox'));
		fireEvent.click(save());
		expect(await screen.findByRole('alert')).toHaveTextContent('The tilette was saved');
		expect(name()).toHaveValue('Revise brief');
		fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
		await waitFor(() => expect(api.updateCluster).toHaveBeenCalledTimes(2));
		expect(api.updateTilette).toHaveBeenCalledTimes(1);
		expect(api.updateCluster).toHaveBeenLastCalledWith({
			Id: 'share',
			StartTime: 0,
			EndTime: lateEnd,
		});
		errorLog.mockRestore();
	});
	it('renames a share without sending timeline fields', async () => {
		render(<TileshareDetailPage />);
		fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
		fireEvent.change(name(), { target: { value: 'New product launch' } });
		fireEvent.click(save());
		await waitFor(() =>
			expect(api.updateCluster).toHaveBeenCalledExactlyOnceWith({
				Id: 'share',
				Name: 'New product launch',
			})
		);
	});
	it('hides editing from a participant', () => {
		data.owner = false;
		render(<TiletteDetailPage />);
		expect(screen.queryByRole('button', { name: 'Edit details' })).not.toBeInTheDocument();
		expect(api.updateTilette).not.toHaveBeenCalled();
	});
});
