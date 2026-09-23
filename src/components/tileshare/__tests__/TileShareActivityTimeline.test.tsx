import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import TileShareActivityTimeline from '../TileShareActivityTimeline';
import ServerError from '@/core/error/server';

const mocks = vi.hoisted(() => ({ getActivity: vi.fn() }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getActivity = mocks.getActivity;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
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

beforeEach(() => mocks.getActivity.mockReset());

describe('TileShareActivityTimeline', () => {
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
