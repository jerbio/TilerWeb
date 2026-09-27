import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import TileShareInvitations from '../TileShareInvitations';

const mocks = vi.hoisted(() => ({
	getInvitations: vi.fn(),
	respondToInvitation: vi.fn(),
	user: { id: 'recipient' },
}));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getInvitations = mocks.getInvitations;
		respondToInvitation = mocks.respondToInvitation;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_key: string, fallback: string) => fallback,
		i18n: { language: 'en' },
	}),
}));
const invitation = {
	assignmentId: 'a',
	clusterId: 'c',
	tiletteId: 't',
	name: 'Build API',
	clusterName: 'Backend',
	inviterName: 'Manager',
	deadline: null,
};
const tree = (cluster?: string) => (
	<MemoryRouter>
		<ThemeProvider theme={lightTheme}>
			<TileShareInvitations ClusterId={cluster} />
		</ThemeProvider>
	</MemoryRouter>
);
beforeEach(() => {
	vi.clearAllMocks();
	mocks.user = { id: 'recipient' };
});

describe('TileShareInvitations', () => {
	it('shows project groups without loading every child and replaces the page', async () => {
		mocks.getInvitations
			.mockResolvedValueOnce({
				projects: [{ clusterId: 'c', name: 'Backend', pendingCount: 20 }],
				nextCursor: 'c',
			})
			.mockResolvedValueOnce({
				projects: [{ clusterId: 'd', name: 'Frontend', pendingCount: 3 }],
				nextCursor: null,
			});
		render(tree());
		await screen.findByText('Backend');
		expect(mocks.getInvitations).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('link', { name: 'Review invitations' })).toHaveAttribute(
			'href',
			'/tileshare/invitations?clusterId=c'
		);
		await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
		await screen.findByText('Frontend');
		expect(screen.queryByText('Backend')).not.toBeInTheDocument();
		expect(mocks.getInvitations.mock.calls[1][0].AfterId).toBe('c');
	});
	it('accepts only the selected assignment and refreshes pending state after success', async () => {
		mocks.getInvitations
			.mockResolvedValueOnce({ invitations: [invitation], nextCursor: null })
			.mockResolvedValue({ invitations: [], nextCursor: null });
		mocks.respondToInvitation.mockResolvedValue({ Error: { Code: '0' } });
		render(tree('c'));
		await screen.findByText('Build API');
		await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
		await screen.findByText('Accepted. Your tile has been created.');
		await screen.findByText('No pending invitations.');
		expect(mocks.respondToInvitation).toHaveBeenCalledExactlyOnceWith('a', 'accepted');
	});
	it('does not automatically retry an uncertain response or leave acceptance enabled', async () => {
		mocks.getInvitations.mockResolvedValue({ invitations: [invitation], nextCursor: null });
		mocks.respondToInvitation.mockRejectedValue(new Error('network'));
		render(tree('c'));
		await screen.findByText('Build API');
		await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
		await screen.findByText(/response could not be confirmed/);
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
		expect(mocks.respondToInvitation).toHaveBeenCalledTimes(1);
	});
	it('discards an old account response', async () => {
		let complete!: (value: unknown) => void;
		mocks.getInvitations
			.mockReturnValueOnce(
				new Promise((resolve) => {
					complete = resolve;
				})
			)
			.mockResolvedValue({ invitations: [], nextCursor: null });
		const view = render(tree('c'));
		mocks.user = { id: 'other' };
		view.rerender(tree('c'));
		await screen.findByText('No pending invitations.');
		await act(async () => {
			complete({ invitations: [invitation], nextCursor: null });
		});
		await waitFor(() => expect(screen.queryByText('Build API')).not.toBeInTheDocument());
	});
});
