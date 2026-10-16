import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import Dashboard from '../TileShareDashboard';
import List from '../TileshareList';
const mocks = vi.hoisted(() => ({ clusters: vi.fn(), activity: vi.fn() }));
vi.mock('@/services', () => ({ tileshareService: { getClusters: mocks.clusters } }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getActivity = mocks.activity;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: 'en' },
	}),
}));
vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
	CalendarUIProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/tileshare/TileshareToolbar', () => ({ default: () => null }));
vi.mock('@/components/tileshare/TileshareCreate', () => ({
	default: () => null,
	TileshareMode: { Single: 'single', Multi: 'multi' },
}));
vi.mock('@/components/tileshare/TileShareClusterCard', () => ({
	default: ({ cluster }: { cluster: { name: string } }) => <article>{cluster.name}</article>,
}));
vi.mock('@/core/common/components/Pagination', () => ({
	default: ({
		page,
		onChange,
		disabled,
	}: {
		page: number;
		onChange: (page: number) => void;
		disabled: boolean;
	}) => (
		<button disabled={disabled} onClick={() => onChange(page + 1)}>
			Next
		</button>
	),
}));
function open() {
	return render(
		<ThemeProvider theme={darkTheme}>
			<MemoryRouter initialEntries={['/tileshare/projects']}>
				<Routes>
					<Route path="/tileshare" element={<Dashboard />}>
						<Route path="projects" element={<List />} />
					</Route>
				</Routes>
			</MemoryRouter>
		</ThemeProvider>
	);
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.clusters.mockResolvedValue([
		{ id: 'mine', name: 'Created project' },
		{ id: 'shared', name: 'Received project' },
	]);
	mocks.activity.mockResolvedValue({ items: [], nextCursor: null });
});
describe('TileShare dashboard', () => {
	it('combines projects and only requests activities while expanded', async () => {
		open();
		await screen.findByText('Received project');
		expect(screen.getByText('Created project')).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'Activities' })).not.toBeInTheDocument();
		expect(mocks.activity).not.toHaveBeenCalled();
		const toggle = screen.getByRole('button', { name: 'Activities' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		fireEvent.click(toggle);
		await waitFor(() => expect(mocks.activity).toHaveBeenCalledTimes(1));
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		fireEvent.click(toggle);
		expect(screen.queryByRole('complementary', { name: 'Activities' })).not.toBeInTheDocument();
		fireEvent(window, new Event('tileshare-changed'));
		expect(mocks.activity).toHaveBeenCalledTimes(1);
	});
	it('resets pagination and sends the selected owner filter and ordering to the server', async () => {
		open();
		await screen.findByText('Received project');
		fireEvent.click(screen.getByText('Next'));
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
		);
		fireEvent.click(screen.getByRole('checkbox', { name: 'Created by me' }));
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({ page: 1, createdByMe: true })
			)
		);
		fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
			target: { value: 'deadlineAsc' },
		});
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({
					page: 1,
					createdByMe: true,
					sortBy: 'Deadline',
					sortOrder: 'asc',
				})
			)
		);
		expect(mocks.activity).not.toHaveBeenCalled();
	});
});
