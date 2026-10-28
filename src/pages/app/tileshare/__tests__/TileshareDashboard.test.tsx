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
		hasNext,
	}: {
		page: number;
		onChange: (page: number) => void;
		disabled: boolean;
		hasNext: boolean;
	}) => (
		<button disabled={disabled || !hasNext} onClick={() => onChange(page + 1)}>
			Next
		</button>
	),
}));
function open(entry = '/tileshare/projects') {
	return render(
		<ThemeProvider theme={darkTheme}>
			<MemoryRouter initialEntries={[entry]}>
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
		...Array.from({ length: 18 }, (_, i) => ({ id: `extra-${i}`, name: `Project ${i}` })),
	]);
	mocks.activity.mockResolvedValue({ items: [], nextCursor: null });
});
describe('TileShare dashboard', () => {
	it.each([1, 5, 19])(
		'omits pagination when all %i results fit on the first page',
		async (count) => {
			mocks.clusters.mockResolvedValue(
				Array.from({ length: count }, (_, i) => ({
					id: `only-${i}`,
					name: `Only share ${i}`,
				}))
			);
			open();
			await screen.findByText('Only share 0');
			expect(screen.queryByText('Next')).not.toBeInTheDocument();
		}
	);
	it('disables Next on a short final page while keeping page navigation available', async () => {
		mocks.clusters
			.mockResolvedValueOnce(
				Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `First page ${i}` }))
			)
			.mockResolvedValueOnce([{ id: 'last', name: 'Last share' }]);
		open();
		await screen.findByText('First page 0');
		fireEvent.click(screen.getByText('Next'));
		await screen.findByText('Last share');
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
	});

	it('combines debounced name search with deadline filters and resets pagination', async () => {
		open();
		await screen.findByText('Received project');
		fireEvent.click(screen.getByText('Next'));
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
		);
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search by name' }), {
			target: { value: '  Launch  ' },
		});
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({ page: 1, search: 'Launch' })
			)
		);
		fireEvent.click(screen.getByRole('button', { name: 'Deadline' }));
		fireEvent.mouseDown(screen.getByRole('option', { name: 'No deadline' }));
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({ page: 1, search: 'Launch', deadlineFilter: 'NoDeadline' })
			)
		);
		fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({ page: 1, search: undefined })
			)
		);
		expect(screen.getByRole('button', { name: 'Deadline' })).toHaveTextContent('Any deadline');
	});
	it('restores filters from the URL and does not fetch an invalid custom range', async () => {
		open(
			'/tileshare/projects?search=Launch&deadline=custom&from=2026-10-25&to=2026-10-24&createdByMe=1&sort=deadlineAsc'
		);
		expect(screen.getByRole('searchbox')).toHaveValue('Launch');
		expect(screen.getByRole('status')).toHaveTextContent('Choose at least one date');
		expect(mocks.clusters).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText('Through'), { target: { value: '2026-10-25' } });
		await waitFor(() =>
			expect(mocks.clusters).toHaveBeenLastCalledWith(
				expect.objectContaining({
					page: 1,
					search: 'Launch',
					createdByMe: true,
					sortBy: 'Deadline',
					deadlineFilter: 'Range',
					deadlineFrom: new Date(2026, 9, 25).getTime(),
					deadlineBefore: new Date(2026, 9, 26).getTime(),
				})
			)
		);
	});

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
		fireEvent.click(screen.getByRole('button', { name: 'Sort by' }));
		fireEvent.mouseDown(screen.getByRole('option', { name: 'Soonest deadline' }));
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
