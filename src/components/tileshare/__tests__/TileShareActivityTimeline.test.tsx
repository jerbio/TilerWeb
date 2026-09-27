import { ThemeProvider } from 'styled-components';
import { darkTheme } from '@/core/theme/dark';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render as renderWithoutTheme, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import TileShareActivityTimeline from '../TileShareActivityTimeline';
import ServerError from '@/core/error/server';

const render = (ui: ReactNode) =>
	renderWithoutTheme(ui, {
		wrapper: ({ children }) => <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>,
	});

const mocks = vi.hoisted(() => ({
	getActivity: vi.fn(),
	setActivityDismissed: vi.fn(),
	user: { id: 'viewer' } as { id: string } | null,
}));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getActivity = mocks.getActivity;
		setActivityDismissed = mocks.setActivityDismissed;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_key: string, fallback: string) => fallback,
		i18n: { language: 'en' },
	}),
}));
const event = (id: string) => ({
	eventId: id,
	schemaVersion: 1,
	eventType: 'assignment_accepted',
	clusterId: 'cluster',
	tiletteId: 'tilette',
	occurredAt: 1760000000000,
	targetAvailable: true,
});

beforeEach(() => {
	mocks.getActivity.mockReset();
	mocks.setActivityDismissed.mockReset();
	mocks.user = { id: 'viewer' };
});

describe('TileShareActivityTimeline', () => {
	it('renders an actor, activity sentence, title and accessible target in one row', async () => {
		mocks.getActivity.mockResolvedValue({
			items: [
				{
					...event('one'),
					actorId: 'actor',
					actorName: 'Murphy M',
					tiletteTitle: 'UX Tiler',
					occurredAt: Date.now(),
				},
			],
			nextCursor: null,
		});
		render(
			<MemoryRouter>
				<TileShareActivityTimeline ClusterId="cluster" />
			</MemoryRouter>
		);
		const link = await screen.findByRole('link', {
			name: 'Open TileShare: Murphy M \u00b7 Assignment accepted \u00b7 UX Tiler',
		});
		expect(link).toHaveTextContent('Murphy M accepted \u2018UX Tiler\u2019');
		expect(link).toHaveAttribute('href', '/tileshare/cluster/tilette/tilette');
		expect(link.querySelector('time')).toHaveAttribute('dateTime');
		expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
	});

	it('dismisses in a scoped view and restores through the dismissed filter', async () => {
		mocks.getActivity
			.mockResolvedValueOnce({ items: [event('one')], nextCursor: null })
			.mockResolvedValueOnce({ items: [], nextCursor: null })
			.mockResolvedValueOnce({ items: [event('one')], nextCursor: null })
			.mockResolvedValue({ items: [], nextCursor: null });
		mocks.setActivityDismissed.mockResolvedValue('');
		render(
			<MemoryRouter>
				<TileShareActivityTimeline ClusterId="cluster" TiletteId="tilette" />
			</MemoryRouter>
		);
		await screen.findByText('Assignment accepted');
		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		await screen.findByText('No activity yet.');
		expect(mocks.setActivityDismissed).toHaveBeenCalledWith('one', true);
		await userEvent.click(screen.getByLabelText('Activity options'));
		await userEvent.click(screen.getByRole('checkbox', { name: 'Show dismissed' }));
		await screen.findByText('Assignment accepted');
		expect(mocks.getActivity.mock.calls[2][0].DismissedOnly).toBe(true);
		await userEvent.click(screen.getByRole('button', { name: 'Show in activities' }));
		await screen.findByText('No activity yet.');
		expect(mocks.setActivityDismissed).toHaveBeenLastCalledWith('one', false);
	});
	it('keeps the activity visible when saving dismissal fails', async () => {
		mocks.getActivity.mockResolvedValue({ items: [event('one')], nextCursor: null });
		mocks.setActivityDismissed.mockRejectedValue(new Error('offline'));
		render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Assignment accepted');
		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		await screen.findByRole('alert');
		expect(screen.getByText('Assignment accepted')).toBeInTheDocument();
	});
	it('renders completion and reopening as occurrence events', async () => {
		mocks.getActivity.mockResolvedValue({
			items: [
				{ ...event('complete'), eventType: 'assignment_completed' },
				{ ...event('reopen'), eventType: 'assignment_reopened' },
			],
			nextCursor: null,
		});
		render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Occurrence completed');
		expect(screen.getByText('Occurrence reopened')).toBeInTheDocument();
	});
	it('shows safe channel and explicit-resend wording for an unknown send outcome', async () => {
		mocks.getActivity.mockResolvedValue({
			items: [
				{
					...event('unknown'),
					eventType: 'invitation_send_unknown',
					metadata: { channel: 'email' },
				},
				{
					...event('unsafe'),
					eventType: 'invitation_sent',
					metadata: { channel: 'private@example.test' },
				},
			],
			nextCursor: null,
		});
		render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Invitation send outcome unknown');
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(
			screen.getByText('The invitation may have been sent. Resend explicitly if needed.')
		).toBeInTheDocument();
		expect(screen.queryByText('private@example.test')).not.toBeInTheDocument();
	});
	it('clears attribution on account change and ignores the previous account response', async () => {
		let resolveOld: (value: unknown) => void = () => {};
		mocks.getActivity
			.mockResolvedValueOnce({
				items: [
					{ ...event('old'), actorId: 'old-user', actorName: 'Previous account actor' },
				],
				nextCursor: 'older',
			})
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve;
					})
			)
			.mockResolvedValueOnce({ items: [], nextCursor: null });
		const view = render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Previous account actor');
		await userEvent.click(screen.getByText('Load more'));
		mocks.user = { id: 'next-viewer' };
		view.rerender(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		expect(screen.queryByText('Previous account actor')).not.toBeInTheDocument();
		await screen.findByText('No activity yet.');
		await act(async () =>
			resolveOld({
				items: [{ ...event('late'), actorId: 'old-user', actorName: 'Late private actor' }],
				nextCursor: null,
			})
		);
		expect(screen.queryByText('Late private actor')).not.toBeInTheDocument();
		expect(mocks.getActivity.mock.calls[1][1].aborted).toBe(true);
	});

	it('refresh replaces old identity attribution instead of merging it back', async () => {
		mocks.getActivity
			.mockResolvedValueOnce({
				items: [{ ...event('one'), actorId: 'removed', actorName: 'Former actor' }],
				nextCursor: null,
			})
			.mockResolvedValueOnce({ items: [event('one')], nextCursor: null });
		render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Former actor');
		await userEvent.click(screen.getByText('Refresh'));
		await screen.findByText('Assignment accepted');
		expect(screen.queryByText('Former actor')).not.toBeInTheDocument();
	});

	it('clears hidden activity and reloads only when the tab returns', async () => {
		const visibility = vi.spyOn(document, 'visibilityState', 'get');
		visibility.mockReturnValue('visible');
		let resolveOld: (value: unknown) => void = () => {};
		mocks.getActivity
			.mockResolvedValueOnce({ items: [event('visible')], nextCursor: 'older' })
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve;
					})
			)
			.mockResolvedValueOnce({ items: [], nextCursor: null });
		try {
			render(
				<MemoryRouter>
					<TileShareActivityTimeline />
				</MemoryRouter>
			);
			await screen.findByText('Assignment accepted');
			await userEvent.click(screen.getByText('Load more'));
			visibility.mockReturnValue('hidden');
			act(() => document.dispatchEvent(new Event('visibilitychange')));
			expect(screen.queryByText('Assignment accepted')).not.toBeInTheDocument();
			act(() => window.dispatchEvent(new Event('tileshare-changed')));
			expect(mocks.getActivity).toHaveBeenCalledTimes(2);
			await act(async () => resolveOld({ items: [event('late')], nextCursor: null }));
			expect(screen.queryByText('Assignment accepted')).not.toBeInTheDocument();
			visibility.mockReturnValue('visible');
			act(() => document.dispatchEvent(new Event('visibilitychange')));
			await screen.findByText('No activity yet.');
			expect(mocks.getActivity).toHaveBeenCalledTimes(3);
			expect(mocks.getActivity.mock.calls[2][0].Cursor).toBeUndefined();
		} finally {
			visibility.mockRestore();
		}
	});

	it('passes tilette scope, deduplicates pages, and clears history on revoked access', async () => {
		mocks.getActivity
			.mockResolvedValueOnce({ items: [event('one')], nextCursor: 'cursor' })
			.mockResolvedValueOnce({ items: [event('one'), event('two')], nextCursor: null })
			.mockRejectedValueOnce(new ServerError('denied', '', undefined, 404));
		render(
			<MemoryRouter>
				<TileShareActivityTimeline ClusterId="cluster" TiletteId="tilette" />
			</MemoryRouter>
		);
		await screen.findByText('Assignment accepted');
		expect(mocks.getActivity.mock.calls[0][0]).toMatchObject({
			ClusterId: 'cluster',
			TiletteId: 'tilette',
		});
		await userEvent.click(screen.getByText('Load more'));
		await waitFor(() => expect(screen.getAllByText('Assignment accepted')).toHaveLength(2));
		await userEvent.click(screen.getByText('Refresh'));
		await screen.findByText('This activity is no longer available to you.');
		expect(screen.queryByText('Assignment accepted')).not.toBeInTheDocument();
	});

	it('uses a neutral fallback for unknown versions and disables unavailable targets', async () => {
		mocks.getActivity.mockResolvedValue({
			items: [
				{
					...event('one'),
					schemaVersion: 99,
					targetAvailable: false,
					metadata: { title: 'unsafe future metadata' },
				},
			],
			nextCursor: null,
		});
		render(
			<MemoryRouter>
				<TileShareActivityTimeline />
			</MemoryRouter>
		);
		await screen.findByText('Activity updated');
		expect(screen.queryByText('unsafe future metadata')).not.toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('ignores a stale response after scope changes', async () => {
		let resolveOld: (value: unknown) => void = () => {};
		mocks.getActivity
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve;
					})
			)
			.mockResolvedValueOnce({ items: [], nextCursor: null });
		const view = render(
			<MemoryRouter>
				<TileShareActivityTimeline ClusterId="old" />
			</MemoryRouter>
		);
		view.rerender(
			<MemoryRouter>
				<TileShareActivityTimeline ClusterId="new" />
			</MemoryRouter>
		);
		await screen.findByText('No activity yet.');
		resolveOld({ items: [event('old')], nextCursor: null });
		await waitFor(() =>
			expect(screen.queryByText('Assignment accepted')).not.toBeInTheDocument()
		);
	});
});
